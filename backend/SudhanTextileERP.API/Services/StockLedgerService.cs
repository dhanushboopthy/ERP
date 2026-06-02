using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

/// <summary>
/// Stock Ledger Service - Single source of truth for all stock operations
/// All stock changes MUST go through this service
/// </summary>
public interface IStockLedgerService
{
    /// <summary>
    /// Record an inward stock transaction (on approval only)
    /// </summary>
    Task<StockLedger> RecordInwardAsync(StockLedgerEntry entry, string createdBy);
    
    /// <summary>
    /// Record an outward stock transaction (on approval only)
    /// </summary>
    Task<StockLedger> RecordOutwardAsync(StockLedgerEntry entry, string createdBy);
    
    /// <summary>
    /// Reverse a stock transaction (for cancellation/correction)
    /// </summary>
    Task<StockLedger?> ReverseTransactionAsync(string module, int referenceId, string reversedBy);
    
    /// <summary>
    /// Get current stock balance for a yarn count/party/lot combination
    /// </summary>
    Task<decimal> GetCurrentBalanceAsync(int yarnCountId, int? partyId = null, string? lotNo = null);
    
    /// <summary>
    /// Get stock ledger entries for a period
    /// </summary>
    Task<List<StockLedger>> GetLedgerEntriesAsync(DateTime fromDate, DateTime toDate, int? yarnCountId = null, int? partyId = null);
    
    /// <summary>
    /// Get stock summary grouped by yarn count
    /// </summary>
    Task<List<StockSummary>> GetStockSummaryAsync();
    
    /// <summary>
    /// Validate if sufficient stock exists for outward transaction
    /// </summary>
    Task<(bool IsValid, string Message)> ValidateStockAvailabilityAsync(int yarnCountId, int partyId, string? lotNo, decimal requiredQty);
}

public class StockLedgerEntry
{
    public DateTime TransactionDate { get; set; }
    public string Module { get; set; } = string.Empty;
    public string ReferenceNo { get; set; } = string.Empty;
    public int ReferenceId { get; set; }
    public int YarnCountId { get; set; }
    public int PartyId { get; set; }
    public string? LotNo { get; set; }
    public decimal Quantity { get; set; }
    public decimal RatePerUnit { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public string? Narration { get; set; }
    public int FinancialYearId { get; set; }
}

public class StockSummary
{
    public int YarnCountId { get; set; }
    public string YarnCountCode { get; set; } = string.Empty;
    public string YarnCountName { get; set; } = string.Empty;
    public int PartyId { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public decimal TotalInward { get; set; }
    public decimal TotalOutward { get; set; }
    public decimal CurrentBalance { get; set; }
    public decimal AverageRate { get; set; }
    public decimal StockValue { get; set; }
}

public class StockLedgerService : IStockLedgerService
{
    private readonly ApplicationDbContext _context;
    private readonly IDocumentNumberService _documentNumberService;

    public StockLedgerService(ApplicationDbContext context, IDocumentNumberService documentNumberService)
    {
        _context = context;
        _documentNumberService = documentNumberService;
    }

    public async Task<StockLedger> RecordInwardAsync(StockLedgerEntry entry, string createdBy)
    {
        // Get current balance
        var currentBalance = await GetCurrentBalanceAsync(entry.YarnCountId, entry.PartyId, entry.LotNo);
        var newBalance = currentBalance + entry.Quantity;

        var ledgerEntry = new StockLedger
        {
            TransactionDate = entry.TransactionDate,
            Module = entry.Module,
            ReferenceNo = entry.ReferenceNo,
            ReferenceId = entry.ReferenceId,
            YarnCountId = entry.YarnCountId,
            PartyId = entry.PartyId,
            LotNo = entry.LotNo,
            InwardQty = entry.Quantity,
            OutwardQty = 0,
            BalanceQty = newBalance,
            RatePerUnit = entry.RatePerUnit,
            TransactionValue = entry.Quantity * entry.RatePerUnit,
            TransactionType = entry.TransactionType,
            Narration = entry.Narration,
            FinancialYearId = entry.FinancialYearId,
            CreatedBy = createdBy
        };

        _context.StockLedgers.Add(ledgerEntry);
        await _context.SaveChangesAsync();

        return ledgerEntry;
    }

    public async Task<StockLedger> RecordOutwardAsync(StockLedgerEntry entry, string createdBy)
    {
        // Validate stock availability
        var validation = await ValidateStockAvailabilityAsync(
            entry.YarnCountId, entry.PartyId, entry.LotNo, entry.Quantity);
        
        if (!validation.IsValid)
        {
            throw new InvalidOperationException(validation.Message);
        }

        // Get current balance
        var currentBalance = await GetCurrentBalanceAsync(entry.YarnCountId, entry.PartyId, entry.LotNo);
        var newBalance = currentBalance - entry.Quantity;

        var ledgerEntry = new StockLedger
        {
            TransactionDate = entry.TransactionDate,
            Module = entry.Module,
            ReferenceNo = entry.ReferenceNo,
            ReferenceId = entry.ReferenceId,
            YarnCountId = entry.YarnCountId,
            PartyId = entry.PartyId,
            LotNo = entry.LotNo,
            InwardQty = 0,
            OutwardQty = entry.Quantity,
            BalanceQty = newBalance,
            RatePerUnit = entry.RatePerUnit,
            TransactionValue = entry.Quantity * entry.RatePerUnit,
            TransactionType = entry.TransactionType,
            Narration = entry.Narration,
            FinancialYearId = entry.FinancialYearId,
            CreatedBy = createdBy
        };

        _context.StockLedgers.Add(ledgerEntry);
        await _context.SaveChangesAsync();

        return ledgerEntry;
    }

    public async Task<StockLedger?> ReverseTransactionAsync(string module, int referenceId, string reversedBy)
    {
        // Find original entries
        var originalEntries = await _context.StockLedgers
            .Where(s => s.Module == module && s.ReferenceId == referenceId && s.IsActive)
            .ToListAsync();

        if (!originalEntries.Any())
            return null;

        StockLedger? lastReversal = null;

        foreach (var original in originalEntries)
        {
            // Get current balance for this yarn/party/lot
            var currentBalance = await GetCurrentBalanceAsync(
                original.YarnCountId, original.PartyId, original.LotNo);

            // Calculate reversal amounts
            var reversalInward = original.OutwardQty; // Outward becomes inward
            var reversalOutward = original.InwardQty; // Inward becomes outward
            var newBalance = currentBalance + reversalInward - reversalOutward;

            var reversalEntry = new StockLedger
            {
                TransactionDate = DateTime.UtcNow,
                Module = module,
                ReferenceNo = $"REV-{original.ReferenceNo}",
                ReferenceId = referenceId,
                YarnCountId = original.YarnCountId,
                PartyId = original.PartyId,
                LotNo = original.LotNo,
                InwardQty = reversalInward,
                OutwardQty = reversalOutward,
                BalanceQty = newBalance,
                RatePerUnit = original.RatePerUnit,
                TransactionValue = -(original.TransactionValue),
                TransactionType = "Reversal",
                Narration = $"Reversal of {original.ReferenceNo}",
                FinancialYearId = original.FinancialYearId,
                CreatedBy = reversedBy
            };

            _context.StockLedgers.Add(reversalEntry);
            
            // Mark original as inactive
            original.IsActive = false;
            original.ModifiedBy = reversedBy;
            original.ModifiedDate = DateTime.UtcNow;

            lastReversal = reversalEntry;
        }

        await _context.SaveChangesAsync();
        return lastReversal;
    }

    public async Task<decimal> GetCurrentBalanceAsync(int yarnCountId, int? partyId = null, string? lotNo = null)
    {
        var query = _context.StockLedgers
            .Where(s => s.YarnCountId == yarnCountId && s.IsActive);

        if (partyId.HasValue)
            query = query.Where(s => s.PartyId == partyId.Value);

        if (!string.IsNullOrEmpty(lotNo))
            query = query.Where(s => s.LotNo == lotNo);

        // Get the latest entry's balance
        var latestEntry = await query
            .OrderByDescending(s => s.TransactionDate)
            .ThenByDescending(s => s.Id)
            .FirstOrDefaultAsync();

        return latestEntry?.BalanceQty ?? 0;
    }

    public async Task<List<StockLedger>> GetLedgerEntriesAsync(
        DateTime fromDate, DateTime toDate, 
        int? yarnCountId = null, int? partyId = null)
    {
        var query = _context.StockLedgers
            .Include(s => s.YarnCount)
            .Include(s => s.Party)
            .Where(s => s.IsActive && 
                        s.TransactionDate >= fromDate && 
                        s.TransactionDate <= toDate);

        if (yarnCountId.HasValue)
            query = query.Where(s => s.YarnCountId == yarnCountId.Value);

        if (partyId.HasValue)
            query = query.Where(s => s.PartyId == partyId.Value);

        return await query
            .OrderBy(s => s.TransactionDate)
            .ThenBy(s => s.Id)
            .ToListAsync();
    }

    public async Task<List<StockSummary>> GetStockSummaryAsync()
    {
        // Get summary grouped by YarnCount, Party, LotNo
        var summary = await _context.StockLedgers
            .Include(s => s.YarnCount)
            .Include(s => s.Party)
            .Where(s => s.IsActive)
            .GroupBy(s => new { s.YarnCountId, s.PartyId, s.LotNo })
            .Select(g => new
            {
                g.Key.YarnCountId,
                g.Key.PartyId,
                g.Key.LotNo,
                TotalInward = g.Sum(x => x.InwardQty),
                TotalOutward = g.Sum(x => x.OutwardQty),
                TotalValue = g.Sum(x => x.TransactionValue)
            })
            .ToListAsync();

        var result = new List<StockSummary>();

        foreach (var item in summary)
        {
            var yarnCount = await _context.YarnCounts.FindAsync(item.YarnCountId);
            var party = await _context.Parties.FindAsync(item.PartyId);
            var balance = item.TotalInward - item.TotalOutward;
            var avgRate = balance > 0 ? item.TotalValue / balance : 0;

            result.Add(new StockSummary
            {
                YarnCountId = item.YarnCountId,
                YarnCountCode = yarnCount?.CountCode ?? "",
                YarnCountName = yarnCount?.CountDescription ?? yarnCount?.CountCode ?? "",
                PartyId = item.PartyId,
                PartyName = party?.PartyName ?? "",
                LotNo = item.LotNo,
                TotalInward = item.TotalInward,
                TotalOutward = item.TotalOutward,
                CurrentBalance = balance,
                AverageRate = avgRate,
                StockValue = balance * avgRate
            });
        }

        return result.Where(s => s.CurrentBalance > 0).ToList();
    }

    public async Task<(bool IsValid, string Message)> ValidateStockAvailabilityAsync(
        int yarnCountId, int partyId, string? lotNo, decimal requiredQty)
    {
        var availableQty = await GetCurrentBalanceAsync(yarnCountId, partyId, lotNo);

        if (availableQty < requiredQty)
        {
            var yarnCount = await _context.YarnCounts.FindAsync(yarnCountId);
            return (false, $"Insufficient stock for {yarnCount?.CountCode ?? "yarn"}. Available: {availableQty:N2} kg, Required: {requiredQty:N2} kg");
        }

        return (true, "Stock available");
    }
}
