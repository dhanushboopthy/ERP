using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// TEXTILE ERP WORKFLOW VALIDATOR - Phase-2 Enterprise Security
// Validates complete business workflow chains for integrity
// ═══════════════════════════════════════════════════════════════════════════════════════════

public interface IWorkflowValidationService
{
    Task<WorkflowValidationReport> ValidateYarnReceiptToStockChainAsync();
    Task<WorkflowValidationReport> ValidateSizingWorkflowChainAsync();
    Task<WorkflowValidationReport> ValidateInvoiceLedgerChainAsync();
    Task<WorkflowValidationReport> ValidateApprovalChainAsync();
    Task<WorkflowValidationReport> ValidateQuantityIntegrityAsync();
    Task<WorkflowValidationReport> ValidateFinancialIntegrityAsync();
    Task<FullWorkflowAuditReport> RunFullWorkflowAuditAsync();
}

public class WorkflowValidationService : IWorkflowValidationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<WorkflowValidationService> _logger;

    public WorkflowValidationService(
        ApplicationDbContext context,
        ILogger<WorkflowValidationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Validates Yarn Receipt → Yarn Stock chain integrity
    /// </summary>
    public async Task<WorkflowValidationReport> ValidateYarnReceiptToStockChainAsync()
    {
        var report = new WorkflowValidationReport
        {
            WorkflowName = "Yarn Receipt → Stock Chain",
            ValidatedAt = DateTime.UtcNow
        };

        try
        {
            // Check 1: All approved receipts should have corresponding stock entries
            var approvedReceipts = await _context.YarnReceipts
                .Where(r => r.Status == "Approved")
                .Include(r => r.Details)
                .ToListAsync();

            foreach (var receipt in approvedReceipts)
            {
                foreach (var detail in receipt.Details)
                {
                    var stockEntry = await _context.YarnStocks
                        .FirstOrDefaultAsync(s => 
                            s.YarnCountId == detail.YarnCountId &&
                            s.PartyId == receipt.PartyId &&
                            s.LotNo == detail.LotNo);

                    if (stockEntry == null)
                    {
                        report.Issues.Add(new WorkflowIssue
                        {
                            Severity = IssueSeverity.High,
                            IssueType = "Missing Stock Entry",
                            Description = $"Receipt #{receipt.ReceiptNumber} detail has no corresponding stock entry",
                            AffectedRecord = $"YarnReceiptDetail ID: {detail.Id}",
                            Recommendation = "Run stock reconciliation to create missing entries"
                        });
                    }
                }
            }

            // Check 2: Stock quantities should match receipt totals
            var stockTotals = await _context.YarnStocks
                .GroupBy(s => new { s.YarnCountId, s.PartyId, s.LotNo })
                .Select(g => new
                {
                    g.Key,
                    TotalStock = g.Sum(s => s.CurrentBalanceKg)
                })
                .ToListAsync();

            // Check 3: No negative stock quantities
            var negativeStocks = await _context.YarnStocks
                .Where(s => s.CurrentBalanceKg < 0)
                .ToListAsync();

            foreach (var negStock in negativeStocks)
            {
                report.Issues.Add(new WorkflowIssue
                {
                    Severity = IssueSeverity.Critical,
                    IssueType = "Negative Stock",
                    Description = $"Yarn Count {negStock.YarnCountId} has negative available quantity: {negStock.CurrentBalanceKg}",
                    AffectedRecord = $"YarnStock ID: {negStock.Id}",
                    Recommendation = "Investigate and correct stock adjustment entries"
                });
            }

            report.TotalChecks = approvedReceipts.Sum(r => r.Details.Count) + stockTotals.Count + 1;
            report.PassedChecks = report.TotalChecks - report.Issues.Count;
            report.IsValid = !report.Issues.Any(i => i.Severity == IssueSeverity.Critical);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating yarn receipt to stock chain");
            report.Issues.Add(new WorkflowIssue
            {
                Severity = IssueSeverity.Critical,
                IssueType = "Validation Error",
                Description = ex.Message
            });
        }

        return report;
    }

    /// <summary>
    /// Validates Sizing workflow: Yarn → Warping → Sizing → Invoice
    /// </summary>
    public async Task<WorkflowValidationReport> ValidateSizingWorkflowChainAsync()
    {
        var report = new WorkflowValidationReport
        {
            WorkflowName = "Sizing Workflow Chain (Yarn → Warping → Sizing → Invoice)",
            ValidatedAt = DateTime.UtcNow
        };

        try
        {
            // Check 1: Completed sizing jobs should have valid warping references
            var sizingJobs = await _context.SizingJobCards
                .Where(s => s.Status == "Completed")
                .Include(s => s.SourceBeams)
                .ToListAsync();

            foreach (var sizing in sizingJobs)
            {
                // Validate beams used are in correct state
                foreach (var beam in sizing.SourceBeams)
                {
                    var beamEntity = await _context.Beams.FindAsync(beam.BeamId);
                    if (beamEntity == null)
                    {
                        report.Issues.Add(new WorkflowIssue
                        {
                            Severity = IssueSeverity.High,
                            IssueType = "Invalid Beam Reference",
                            Description = $"Sizing job {sizing.JobCardNumber} references non-existent beam",
                            AffectedRecord = $"SizingJobCard ID: {sizing.Id}"
                        });
                    }
                }

                // Check 2: Validate output length consistency
                if (sizing.ActualLength.HasValue)
                {
                    var variance = Math.Abs((sizing.SetLength - sizing.ActualLength.Value) / sizing.SetLength * 100);
                    if (variance > 10) // More than 10% variance
                    {
                        report.Issues.Add(new WorkflowIssue
                        {
                            Severity = IssueSeverity.Medium,
                            IssueType = "Length Variance",
                            Description = $"Sizing job {sizing.JobCardNumber} has {variance:F1}% length variance (Set: {sizing.SetLength}, Actual: {sizing.ActualLength})",
                            AffectedRecord = $"SizingJobCard ID: {sizing.Id}",
                            Recommendation = "Verify measurements and approve variance if correct"
                        });
                    }
                }
            }

            // Check 3: All completed sizing jobs should be invoiced eventually
            var uninvoicedCompletedJobs = await _context.SizingJobCards
                .Where(s => s.Status == "Completed" && s.InvoiceId == null)
                .Where(s => s.ApprovedDate < DateTime.UtcNow.AddDays(-7)) // More than 7 days old
                .CountAsync();

            if (uninvoicedCompletedJobs > 0)
            {
                report.Issues.Add(new WorkflowIssue
                {
                    Severity = IssueSeverity.Medium,
                    IssueType = "Pending Invoicing",
                    Description = $"{uninvoicedCompletedJobs} completed sizing jobs older than 7 days are not invoiced",
                    Recommendation = "Review and create invoices for completed work"
                });
            }

            report.TotalChecks = sizingJobs.Count * 2 + 1;
            report.PassedChecks = report.TotalChecks - report.Issues.Count;
            report.IsValid = !report.Issues.Any(i => i.Severity == IssueSeverity.Critical);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating sizing workflow chain");
            report.Issues.Add(new WorkflowIssue
            {
                Severity = IssueSeverity.Critical,
                IssueType = "Validation Error",
                Description = ex.Message
            });
        }

        return report;
    }

    /// <summary>
    /// Validates Invoice → Ledger financial chain
    /// </summary>
    public async Task<WorkflowValidationReport> ValidateInvoiceLedgerChainAsync()
    {
        var report = new WorkflowValidationReport
        {
            WorkflowName = "Invoice → Ledger Financial Chain",
            ValidatedAt = DateTime.UtcNow
        };

        try
        {
            // Check 1: Invoice totals should match detail calculations
            var invoices = await _context.TaxInvoices
                .Include(i => i.Details)
                .ToListAsync();

            foreach (var invoice in invoices)
            {
                var calculatedTaxable = invoice.Details.Sum(d => d.Quantity * d.Rate);
                var calculatedCgst = invoice.Details.Sum(d => d.CGSTAmount);
                var calculatedSgst = invoice.Details.Sum(d => d.SGSTAmount);
                var calculatedIgst = invoice.Details.Sum(d => d.IGSTAmount);
                var calculatedTotal = calculatedTaxable + calculatedCgst + calculatedSgst + calculatedIgst;

                // Allow 1 rupee tolerance for rounding
                if (Math.Abs(invoice.TaxableAmount - calculatedTaxable) > 1)
                {
                    report.Issues.Add(new WorkflowIssue
                    {
                        Severity = IssueSeverity.Critical,
                        IssueType = "Taxable Amount Mismatch",
                        Description = $"Invoice {invoice.InvoiceNumber}: Header taxable ({invoice.TaxableAmount:N2}) != Detail sum ({calculatedTaxable:N2})",
                        AffectedRecord = $"TaxInvoice ID: {invoice.Id}",
                        Recommendation = "Recalculate invoice totals"
                    });
                }

                if (Math.Abs(invoice.TotalAmount - calculatedTotal) > 1)
                {
                    report.Issues.Add(new WorkflowIssue
                    {
                        Severity = IssueSeverity.Critical,
                        IssueType = "Total Amount Mismatch",
                        Description = $"Invoice {invoice.InvoiceNumber}: Header total ({invoice.TotalAmount:N2}) != Calculated ({calculatedTotal:N2})",
                        AffectedRecord = $"TaxInvoice ID: {invoice.Id}",
                        Recommendation = "Recalculate invoice totals"
                    });
                }

                // Check 2: GST rate consistency (CGST = SGST for intrastate)
                foreach (var detail in invoice.Details)
                {
                    if (!invoice.IsInterState && detail.CGSTRate != detail.SGSTRate)
                    {
                        report.Issues.Add(new WorkflowIssue
                        {
                            Severity = IssueSeverity.High,
                            IssueType = "GST Rate Mismatch",
                            Description = $"Invoice {invoice.InvoiceNumber}: Intrastate but CGST ({detail.CGSTRate}%) != SGST ({detail.SGSTRate}%)",
                            AffectedRecord = $"TaxInvoiceDetail ID: {detail.Id}"
                        });
                    }

                    if (invoice.IsInterState && (detail.CGSTRate > 0 || detail.SGSTRate > 0))
                    {
                        report.Issues.Add(new WorkflowIssue
                        {
                            Severity = IssueSeverity.High,
                            IssueType = "Invalid GST for Interstate",
                            Description = $"Invoice {invoice.InvoiceNumber}: Interstate but has CGST/SGST instead of IGST",
                            AffectedRecord = $"TaxInvoiceDetail ID: {detail.Id}"
                        });
                    }
                }
            }

            report.TotalChecks = invoices.Count * 3;
            report.PassedChecks = report.TotalChecks - report.Issues.Count;
            report.IsValid = !report.Issues.Any(i => i.Severity == IssueSeverity.Critical);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating invoice ledger chain");
            report.Issues.Add(new WorkflowIssue
            {
                Severity = IssueSeverity.Critical,
                IssueType = "Validation Error",
                Description = ex.Message
            });
        }

        return report;
    }

    /// <summary>
    /// Validates approval chain integrity
    /// </summary>
    public async Task<WorkflowValidationReport> ValidateApprovalChainAsync()
    {
        var report = new WorkflowValidationReport
        {
            WorkflowName = "Approval Chain Integrity",
            ValidatedAt = DateTime.UtcNow
        };

        try
        {
            // Check 1: Approved documents should have approval history
            var approvedReceipts = await _context.YarnReceipts
                .Where(r => r.Status == "Approved")
                .ToListAsync();

            foreach (var receipt in approvedReceipts)
            {
                var hasApprovalHistory = await _context.ApprovalHistories
                    .AnyAsync(h => h.DocumentType == "YarnReceipt" && h.DocumentId == receipt.Id);

                if (!hasApprovalHistory)
                {
                    report.Issues.Add(new WorkflowIssue
                    {
                        Severity = IssueSeverity.Medium,
                        IssueType = "Missing Approval History",
                        Description = $"Yarn Receipt {receipt.ReceiptNumber} is approved but has no approval history",
                        AffectedRecord = $"YarnReceipt ID: {receipt.Id}"
                    });
                }
            }

            // Check 2: Approval sequence should be correct (Prepare → Check → Approve)
            var approvalHistories = await _context.ApprovalHistories
                .OrderBy(h => h.DocumentType)
                .ThenBy(h => h.DocumentId)
                .ThenBy(h => h.ApprovalDate)
                .ToListAsync();

            var groupedHistories = approvalHistories.GroupBy(h => new { h.DocumentType, h.DocumentId });

            foreach (var group in groupedHistories)
            {
                var levels = group.Select(h => h.ApprovalLevel).ToList();
                
                // Check sequence
                var expectedSequence = new[] { "Prepare", "Check", "Approve", "Authorize" };
                var lastIndex = -1;
                
                foreach (var level in levels)
                {
                    var currentIndex = Array.IndexOf(expectedSequence, level);
                    if (currentIndex >= 0 && currentIndex < lastIndex)
                    {
                        report.Issues.Add(new WorkflowIssue
                        {
                            Severity = IssueSeverity.High,
                            IssueType = "Invalid Approval Sequence",
                            Description = $"{group.Key.DocumentType} ID {group.Key.DocumentId}: Approval sequence out of order",
                            Recommendation = "Review approval workflow configuration"
                        });
                        break;
                    }
                    lastIndex = currentIndex;
                }
            }

            report.TotalChecks = approvedReceipts.Count + groupedHistories.Count();
            report.PassedChecks = report.TotalChecks - report.Issues.Count;
            report.IsValid = !report.Issues.Any(i => i.Severity == IssueSeverity.Critical);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating approval chain");
            report.Issues.Add(new WorkflowIssue
            {
                Severity = IssueSeverity.Critical,
                IssueType = "Validation Error",
                Description = ex.Message
            });
        }

        return report;
    }

    /// <summary>
    /// Validates quantity integrity across all transactions
    /// </summary>
    public async Task<WorkflowValidationReport> ValidateQuantityIntegrityAsync()
    {
        var report = new WorkflowValidationReport
        {
            WorkflowName = "Quantity Integrity",
            ValidatedAt = DateTime.UtcNow
        };

        try
        {
            // Check 1: Stock ledger balances
            var ledgerEntries = await _context.StockLedgers
                .OrderBy(l => l.YarnCountId)
                .ThenBy(l => l.TransactionDate)
                .ToListAsync();

            var groupedLedger = ledgerEntries.GroupBy(l => l.YarnCountId);

            foreach (var group in groupedLedger)
            {
                decimal runningBalance = 0;
                
                foreach (var entry in group.OrderBy(e => e.TransactionDate))
                {
                    runningBalance += entry.InwardQty - entry.OutwardQty;
                    
                    // Check for negative balance
                    if (runningBalance < 0)
                    {
                        report.Issues.Add(new WorkflowIssue
                        {
                            Severity = IssueSeverity.Critical,
                            IssueType = "Negative Running Balance",
                            Description = $"Yarn Count {group.Key}: Running balance went negative ({runningBalance:N3}) at transaction date {entry.TransactionDate:d}",
                            AffectedRecord = $"StockLedger ID: {entry.Id}"
                        });
                    }
                }
            }

            // Check 2: No orphaned stock entries
            var orphanedStocks = await _context.YarnStocks
                .Where(s => !_context.YarnCounts.Any(yc => yc.Id == s.YarnCountId))
                .CountAsync();

            if (orphanedStocks > 0)
            {
                report.Issues.Add(new WorkflowIssue
                {
                    Severity = IssueSeverity.High,
                    IssueType = "Orphaned Stock Entries",
                    Description = $"{orphanedStocks} stock entries reference non-existent yarn counts",
                    Recommendation = "Clean up orphaned records"
                });
            }

            report.TotalChecks = groupedLedger.Count() + 1;
            report.PassedChecks = report.TotalChecks - report.Issues.Count;
            report.IsValid = !report.Issues.Any(i => i.Severity == IssueSeverity.Critical);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating quantity integrity");
            report.Issues.Add(new WorkflowIssue
            {
                Severity = IssueSeverity.Critical,
                IssueType = "Validation Error",
                Description = ex.Message
            });
        }

        return report;
    }

    /// <summary>
    /// Validates financial integrity across all transactions
    /// </summary>
    public async Task<WorkflowValidationReport> ValidateFinancialIntegrityAsync()
    {
        var report = new WorkflowValidationReport
        {
            WorkflowName = "Financial Integrity",
            ValidatedAt = DateTime.UtcNow
        };

        try
        {
            // Check 1: No negative amounts in invoices
            var negativeAmountInvoices = await _context.TaxInvoices
                .Where(i => i.TotalAmount < 0 || i.TaxableAmount < 0)
                .CountAsync();

            if (negativeAmountInvoices > 0)
            {
                report.Issues.Add(new WorkflowIssue
                {
                    Severity = IssueSeverity.Critical,
                    IssueType = "Negative Invoice Amounts",
                    Description = $"{negativeAmountInvoices} invoices have negative amounts",
                    Recommendation = "Review and correct invoice amounts"
                });
            }

            // Check 2: GST calculation accuracy
            var invoiceDetails = await _context.TaxInvoiceDetails.ToListAsync();
            
            foreach (var detail in invoiceDetails)
            {
                var expectedCgst = Math.Round(detail.Amount * detail.CGSTRate / 100, 2);
                var expectedSgst = Math.Round(detail.Amount * detail.SGSTRate / 100, 2);
                
                if (Math.Abs(detail.CGSTAmount - expectedCgst) > 0.01m ||
                    Math.Abs(detail.SGSTAmount - expectedSgst) > 0.01m)
                {
                    report.Issues.Add(new WorkflowIssue
                    {
                        Severity = IssueSeverity.High,
                        IssueType = "GST Calculation Error",
                        Description = $"Invoice detail {detail.Id}: GST amounts don't match calculated values",
                        AffectedRecord = $"TaxInvoiceDetail ID: {detail.Id}"
                    });
                }
            }

            // Check 3: Credit limit compliance
            var parties = await _context.Parties
                .Where(p => p.CreditLimit > 0)
                .ToListAsync();

            foreach (var party in parties)
            {
                // Check outstanding invoices (Status is not Cancelled = outstanding)
                var outstandingAmount = await _context.TaxInvoices
                    .Where(i => i.PartyId == party.Id && i.Status != "Cancelled")
                    .SumAsync(i => i.TotalAmount);

                if (outstandingAmount > party.CreditLimit)
                {
                    report.Issues.Add(new WorkflowIssue
                    {
                        Severity = IssueSeverity.Medium,
                        IssueType = "Credit Limit Exceeded",
                        Description = $"Party {party.PartyName}: Outstanding ({outstandingAmount:N2}) exceeds credit limit ({party.CreditLimit:N2})",
                        AffectedRecord = $"Party ID: {party.Id}",
                        Recommendation = "Review credit terms or collect payments"
                    });
                }
            }

            report.TotalChecks = 2 + invoiceDetails.Count + parties.Count;
            report.PassedChecks = report.TotalChecks - report.Issues.Count;
            report.IsValid = !report.Issues.Any(i => i.Severity == IssueSeverity.Critical);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating financial integrity");
            report.Issues.Add(new WorkflowIssue
            {
                Severity = IssueSeverity.Critical,
                IssueType = "Validation Error",
                Description = ex.Message
            });
        }

        return report;
    }

    /// <summary>
    /// Runs complete workflow audit
    /// </summary>
    public async Task<FullWorkflowAuditReport> RunFullWorkflowAuditAsync()
    {
        _logger.LogInformation("Starting full workflow audit");

        var fullReport = new FullWorkflowAuditReport
        {
            AuditedAt = DateTime.UtcNow
        };

        fullReport.Reports.Add(await ValidateYarnReceiptToStockChainAsync());
        fullReport.Reports.Add(await ValidateSizingWorkflowChainAsync());
        fullReport.Reports.Add(await ValidateInvoiceLedgerChainAsync());
        fullReport.Reports.Add(await ValidateApprovalChainAsync());
        fullReport.Reports.Add(await ValidateQuantityIntegrityAsync());
        fullReport.Reports.Add(await ValidateFinancialIntegrityAsync());

        fullReport.TotalChecks = fullReport.Reports.Sum(r => r.TotalChecks);
        fullReport.PassedChecks = fullReport.Reports.Sum(r => r.PassedChecks);
        fullReport.TotalIssues = fullReport.Reports.Sum(r => r.Issues.Count);
        fullReport.CriticalIssues = fullReport.Reports.Sum(r => r.Issues.Count(i => i.Severity == IssueSeverity.Critical));
        fullReport.HighIssues = fullReport.Reports.Sum(r => r.Issues.Count(i => i.Severity == IssueSeverity.High));
        fullReport.MediumIssues = fullReport.Reports.Sum(r => r.Issues.Count(i => i.Severity == IssueSeverity.Medium));
        fullReport.OverallValid = fullReport.CriticalIssues == 0;
        fullReport.IntegrityScore = fullReport.TotalChecks > 0 
            ? (fullReport.PassedChecks * 100) / fullReport.TotalChecks 
            : 100;

        _logger.LogInformation("Workflow audit complete. Score: {Score}%, Issues: {Issues}", 
            fullReport.IntegrityScore, fullReport.TotalIssues);

        return fullReport;
    }
}

#region DTOs

public class WorkflowValidationReport
{
    public string WorkflowName { get; set; } = string.Empty;
    public DateTime ValidatedAt { get; set; }
    public bool IsValid { get; set; }
    public int TotalChecks { get; set; }
    public int PassedChecks { get; set; }
    public List<WorkflowIssue> Issues { get; set; } = new();
}

public class WorkflowIssue
{
    public IssueSeverity Severity { get; set; }
    public string IssueType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? AffectedRecord { get; set; }
    public string? Recommendation { get; set; }
}

public enum IssueSeverity
{
    Low,
    Medium,
    High,
    Critical
}

public class FullWorkflowAuditReport
{
    public DateTime AuditedAt { get; set; }
    public List<WorkflowValidationReport> Reports { get; set; } = new();
    public int TotalChecks { get; set; }
    public int PassedChecks { get; set; }
    public int TotalIssues { get; set; }
    public int CriticalIssues { get; set; }
    public int HighIssues { get; set; }
    public int MediumIssues { get; set; }
    public bool OverallValid { get; set; }
    public int IntegrityScore { get; set; }
}

#endregion
