using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;
using SudhanTextileERP.API.Middleware;

namespace SudhanTextileERP.API.Services;

public interface IYarnReceiptService
{
    Task<PagedResult<YarnReceiptListDto>> GetAllAsync(PaginationParams paging, int? partyId = null, DateTime? fromDate = null, DateTime? toDate = null);
    Task<YarnReceiptDto?> GetByIdAsync(int id);
    Task<YarnReceiptDto> CreateAsync(CreateYarnReceiptRequest request, string createdBy);
    Task<YarnReceiptDto?> UpdateAsync(int id, CreateYarnReceiptRequest request, string modifiedBy, bool allowApprovedEdit = false);
    Task<bool> DeleteAsync(int id, string modifiedBy);
    Task<YarnReceiptDto?> ApproveAsync(int id, string approvedBy);
    Task<CreateYarnReceiptRequest?> GenerateSampleDataAsync(string createdBy);
}

public class YarnReceiptService : IYarnReceiptService
{
    private readonly ApplicationDbContext _context;
    private readonly IDocumentNumberService _documentNumberService;
    private readonly IStockLedgerService _stockLedgerService;
    private readonly IAuditLogService _auditLogService;

    public YarnReceiptService(
        ApplicationDbContext context, 
        IDocumentNumberService documentNumberService,
        IStockLedgerService stockLedgerService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _documentNumberService = documentNumberService;
        _stockLedgerService = stockLedgerService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResult<YarnReceiptListDto>> GetAllAsync(PaginationParams paging, int? partyId = null, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var query = _context.YarnReceipts
            .Include(yr => yr.Party)
            .Include(yr => yr.Details)
                .ThenInclude(d => d.YarnCount)
            .Where(yr => yr.IsActive)
            .AsQueryable();

        if (partyId.HasValue)
            query = query.Where(yr => yr.PartyId == partyId);

        if (fromDate.HasValue)
            query = query.Where(yr => yr.ReceiptDate >= fromDate);

        if (toDate.HasValue)
            query = query.Where(yr => yr.ReceiptDate <= toDate);

        if (!string.IsNullOrEmpty(paging.Search))
        {
            var search = paging.Search.ToLower();
            query = query.Where(yr =>
                yr.ReceiptNumber.ToLower().Contains(search) ||
                yr.Party.PartyName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(yr => yr.ReceiptDate)
            .ThenByDescending(yr => yr.Id)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(yr => new YarnReceiptListDto
            {
                Id = yr.Id,
                ReceiptNo = yr.ReceiptNumber,
                ReceiptDate = yr.ReceiptDate,
                PartyId = yr.PartyId,
                PartyName = yr.Party != null ? yr.Party.PartyName : string.Empty,
                PdcNo = yr.PDCNo,
                PdcDate = yr.PDCDate,
                MillName = yr.MillName,
                VehicleNo = yr.VehicleNo,
                LotNo = yr.Details.FirstOrDefault() != null ? yr.Details.First().LotNo : null,
                YarnCount = yr.Details.FirstOrDefault() != null
                    ? (yr.Details.First().YarnCount != null ? yr.Details.First().YarnCount.CountCode : null)
                    : null,
                TotalBags = yr.Details.Count,
                TotalCones = yr.Details.Sum(d => d.ConeCount ?? 0),
                TotalNetWeight = (decimal)yr.Details.Sum(d => (double)d.NetWeight),
                Status = yr.Status,
                ApprovedBy = yr.ApprovedBy,
                ApprovedDate = yr.ApprovedDate,
                IsUsedInJobCard = yr.IsUsedInJobCard,
                IsLocked = yr.IsLocked
            })
            .ToListAsync();

        return new PagedResult<YarnReceiptListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        };
    }

    public async Task<YarnReceiptDto?> GetByIdAsync(int id)
    {
        var receipt = await _context.YarnReceipts
            .Include(yr => yr.Party)
            .Include(yr => yr.Details)
                .ThenInclude(d => d.YarnCount)
            .FirstOrDefaultAsync(yr => yr.Id == id);

        return receipt == null ? null : MapToDto(receipt);
    }

    public async Task<YarnReceiptDto> CreateAsync(CreateYarnReceiptRequest request, string createdBy)
    {
        // Validate request
        if (request.Details == null || !request.Details.Any())
            throw new ArgumentException("At least one detail line is required");

        if (request.PartyId <= 0)
            throw new ArgumentException("Party is required");

        // Validate party exists
        var party = await _context.Parties.FindAsync(request.PartyId);
        if (party == null)
            throw new EntityNotFoundException("Party", request.PartyId);

        // Validate all yarn counts exist
        foreach (var detail in request.Details)
        {
            var yarnCount = await _context.YarnCounts.FindAsync(detail.YarnCountId);
            if (yarnCount == null)
                throw new EntityNotFoundException("YarnCount", detail.YarnCountId);
        }

        // Use transaction for atomic operation
        await using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            var financialYearId = await _documentNumberService.GetCurrentFinancialYearIdAsync();
            var receiptNumber = await _documentNumberService.GetNextDocumentNumberAsync("YarnReceipt", financialYearId);

            var receipt = new YarnReceipt
            {
                ReceiptNumber = receiptNumber,
                ReceiptDate = request.ReceiptDate,
                PartyId = request.PartyId,
                VehicleId = request.VehicleId > 0 ? request.VehicleId : null,
                VehicleNo = request.VehicleNo,
                DriverName = request.DriverName,
                FinancialYearId = financialYearId,
                Status = "Draft", // Always starts as Draft
                Remarks = request.Remarks,
                CreatedBy = createdBy
            };

            foreach (var detail in request.Details)
            {
                receipt.Details.Add(new YarnReceiptDetail
                {
                    YarnCountId = detail.YarnCountId,
                    LotNo = detail.LotNo,
                    BagNo = detail.BagNo,
                    GrossWeight = detail.GrossWeight,
                    TareWeight = detail.TareWeight,
                    NetWeight = detail.GrossWeight - detail.TareWeight,
                    ConeCount = detail.ConeCount,
                    RatePerKg = detail.RatePerKg,
                    CreatedBy = createdBy
                });
            }

            _context.YarnReceipts.Add(receipt);
            await _context.SaveChangesAsync();

            // NOTE: Stock ledger entries are created ONLY when status = Approved
            // Draft records do NOT affect stock

            // Log audit
            await _auditLogService.LogAsync("YarnReceipt", receipt.Id, "CREATE", null, receipt, createdBy);

            await transaction.CommitAsync();

            // Reload with includes
            var result = await GetByIdAsync(receipt.Id);
            return result!;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<YarnReceiptDto?> ApproveAsync(int id, string approvedBy)
    {
        var receipt = await _context.YarnReceipts
            .Include(yr => yr.Details)
            .FirstOrDefaultAsync(yr => yr.Id == id);

        if (receipt == null)
            throw new EntityNotFoundException("YarnReceipt", id);

        if (receipt.Status == "Approved")
            throw new BusinessRuleException("Yarn receipt is already approved");

        if (receipt.IsLocked)
            throw new RecordLockedException("Yarn Receipt");

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var oldStatus = receipt.Status;

            // Update status
            receipt.Status = "Approved";
            receipt.ApprovedBy = approvedBy;
            receipt.ApprovedDate = DateTime.UtcNow;
            receipt.IsLocked = true;
            receipt.ModifiedBy = approvedBy;
            receipt.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // NOW update stock ledger (only on approval)
            foreach (var detail in receipt.Details)
            {
                await _stockLedgerService.RecordInwardAsync(new StockLedgerEntry
                {
                    TransactionDate = receipt.ReceiptDate,
                    Module = "YarnReceipt",
                    ReferenceNo = receipt.ReceiptNumber,
                    ReferenceId = receipt.Id,
                    YarnCountId = detail.YarnCountId,
                    PartyId = receipt.PartyId,
                    LotNo = detail.LotNo,
                    Quantity = detail.NetWeight,
                    RatePerUnit = detail.RatePerKg,
                    TransactionType = "Inward",
                    Narration = $"Yarn Receipt from {receipt.Party?.PartyName ?? "Party"}",
                    FinancialYearId = receipt.FinancialYearId
                }, approvedBy);

                // Also write to YarnStocks (used by delivery lot lookup & stock balance)
                var lastStock = await _context.YarnStocks
                    .Where(s => s.YarnCountId == detail.YarnCountId &&
                                s.PartyId == receipt.PartyId &&
                                s.LotNo == detail.LotNo)
                    .OrderByDescending(s => s.Id)
                    .FirstOrDefaultAsync();

                var previousBalance = lastStock?.CurrentBalanceKg ?? 0;

                _context.YarnStocks.Add(new YarnStock
                {
                    YarnCountId = detail.YarnCountId,
                    PartyId = receipt.PartyId,
                    LotNo = detail.LotNo,
                    TransactionType = "YarnReceiptInward",
                    TransactionId = receipt.Id,
                    TransactionDate = receipt.ReceiptDate,
                    InwardQtyKg = detail.NetWeight,
                    OutwardQtyKg = 0,
                    CurrentBalanceKg = previousBalance + detail.NetWeight,
                    FinancialYearId = receipt.FinancialYearId,
                    CreatedBy = approvedBy
                });
            }

            await _context.SaveChangesAsync();

            // Log audit
            await _auditLogService.LogAsync("YarnReceipt", receipt.Id, "APPROVE", 
                new { Status = oldStatus }, 
                new { Status = "Approved", ApprovedBy = approvedBy }, 
                approvedBy);

            await transaction.CommitAsync();

            return await GetByIdAsync(id);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<YarnReceiptDto?> UpdateAsync(int id, CreateYarnReceiptRequest request, string modifiedBy, bool allowApprovedEdit = false)
    {
        var receipt = await _context.YarnReceipts
            .Include(yr => yr.Details)
            .FirstOrDefaultAsync(yr => yr.Id == id);

        if (receipt == null)
            return null;

        // Locked records are never editable.
        if (receipt.IsLocked)
            throw new RecordLockedException("Yarn Receipt");

        // Approved records are editable only with explicit admin override.
        if (receipt.Status == "Approved" && !allowApprovedEdit)
            throw new RecordLockedException("Yarn Receipt");

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Capture old values for audit
            var oldValues = new { receipt.ReceiptDate, receipt.PartyId, receipt.VehicleNo, receipt.DriverName };

            var isApprovedRecord = receipt.Status == "Approved";

            receipt.ReceiptDate = request.ReceiptDate;
            receipt.VehicleId = request.VehicleId;
            receipt.VehicleNo = request.VehicleNo;
            receipt.DriverName = request.DriverName;
            receipt.Remarks = request.Remarks;
            receipt.ModifiedBy = modifiedBy;
            receipt.ModifiedDate = DateTime.UtcNow;

            if (isApprovedRecord)
            {
                // Approved receipts may be corrected by admin only for non-stock-impact fields.
                // Prevent changing party/details as these are already used for stock/accounting flows.
                if (request.PartyId != receipt.PartyId)
                    throw new BusinessRuleException("For approved receipts, party cannot be changed");

                if (request.Details.Count != receipt.Details.Count)
                    throw new BusinessRuleException("For approved receipts, detail rows cannot be added or removed");

                var existingDetails = receipt.Details.OrderBy(d => d.Id).ToList();
                for (var i = 0; i < request.Details.Count; i++)
                {
                    var incoming = request.Details[i];
                    var existing = existingDetails[i];

                    if (incoming.YarnCountId != existing.YarnCountId ||
                        incoming.LotNo != existing.LotNo ||
                        incoming.GrossWeight != existing.GrossWeight ||
                        incoming.TareWeight != existing.TareWeight ||
                        incoming.ConeCount != existing.ConeCount ||
                        incoming.RatePerKg != existing.RatePerKg)
                    {
                        throw new BusinessRuleException("For approved receipts, yarn detail values cannot be changed");
                    }
                }
            }
            else
            {
                receipt.PartyId = request.PartyId;

                // Draft/unapproved records: full detail replacement is allowed.
                _context.YarnReceiptDetails.RemoveRange(receipt.Details);

                foreach (var detail in request.Details)
                {
                    receipt.Details.Add(new YarnReceiptDetail
                    {
                        YarnCountId = detail.YarnCountId,
                        LotNo = detail.LotNo,
                        BagNo = detail.BagNo,
                        GrossWeight = detail.GrossWeight,
                        TareWeight = detail.TareWeight,
                        NetWeight = detail.GrossWeight - detail.TareWeight,
                        ConeCount = detail.ConeCount,
                        RatePerKg = detail.RatePerKg,
                        CreatedBy = modifiedBy
                    });
                }
            }

            await _context.SaveChangesAsync();

            // Log audit
            await _auditLogService.LogAsync("YarnReceipt", receipt.Id, "UPDATE", oldValues, request, modifiedBy);

            await transaction.CommitAsync();

            return await GetByIdAsync(id);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, string modifiedBy)
    {
        var receipt = await _context.YarnReceipts.FindAsync(id);
        if (receipt == null)
            return false;

        receipt.IsActive = false;
        receipt.ModifiedBy = modifiedBy;
        receipt.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<CreateYarnReceiptRequest?> GenerateSampleDataAsync(string createdBy)
    {
        try
        {
            // Fetch valid existing data from database
            var party = await _context.Parties
                .Where(p => p.IsActive)
                .OrderBy(p => p.Id)
                .FirstOrDefaultAsync();

            var yarnCount = await _context.YarnCounts
                .Where(yc => yc.IsActive)
                .OrderBy(yc => yc.Id)
                .FirstOrDefaultAsync();

            // If no master data exists, return null
            if (party == null || yarnCount == null)
                return null;

            // Generate valid sample data
            var random = new Random();
            var sampleData = new CreateYarnReceiptRequest
            {
                ReceiptDate = DateTime.Today,
                PartyId = party.Id,
                VehicleId = null, // Optional field
                VehicleNo = $"TN{random.Next(10, 99)}AB{random.Next(1000, 9999)}",
                DriverName = "Sample Driver",
                Remarks = "Sample yarn receipt entry for testing",
                Details = new List<CreateYarnReceiptDetailRequest>
                {
                    new CreateYarnReceiptDetailRequest
                    {
                        YarnCountId = yarnCount.Id,
                        LotNo = $"LOT-{DateTime.Now:yyyyMMdd}-{random.Next(100, 999)}",
                        BagNo = "BAG-001",
                        GrossWeight = 105.5m,
                        TareWeight = 5.5m,
                        ConeCount = 24,
                        RatePerKg = 250.00m
                    },
                    new CreateYarnReceiptDetailRequest
                    {
                        YarnCountId = yarnCount.Id,
                        LotNo = $"LOT-{DateTime.Now:yyyyMMdd}-{random.Next(100, 999)}",
                        BagNo = "BAG-002",
                        GrossWeight = 102.0m,
                        TareWeight = 2.0m,
                        ConeCount = 20,
                        RatePerKg = 250.00m
                    },
                    new CreateYarnReceiptDetailRequest
                    {
                        YarnCountId = yarnCount.Id,
                        LotNo = $"LOT-{DateTime.Now:yyyyMMdd}-{random.Next(100, 999)}",
                        BagNo = "BAG-003",
                        GrossWeight = 103.2m,
                        TareWeight = 3.2m,
                        ConeCount = 22,
                        RatePerKg = 250.00m
                    }
                }
            };

            return sampleData;
        }
        catch (Exception ex)
        {
            // Log exception if needed
            Console.WriteLine($"Error generating sample data: {ex.Message}");
            return null;
        }
    }

    private static YarnReceiptDto MapToDto(YarnReceipt yr)
    {
        return new YarnReceiptDto
        {
            Id = yr.Id,
            ReceiptNumber = yr.ReceiptNumber,
            ReceiptDate = yr.ReceiptDate,
            PartyId = yr.PartyId,
            PartyCode = yr.Party?.PartyCode ?? string.Empty,
            PartyName = yr.Party?.PartyName ?? string.Empty,
            VehicleId = yr.VehicleId,
            VehicleNo = yr.VehicleNo,
            DriverName = yr.DriverName,
            Remarks = yr.Remarks,
            Status = yr.Status,
            ApprovedBy = yr.ApprovedBy,
            ApprovedDate = yr.ApprovedDate,
            IsLocked = yr.IsLocked,
            TotalNetWeight = yr.Details.Sum(d => d.NetWeight),
            TotalBags = yr.Details.Count,
            Details = yr.Details.Select(d => new YarnReceiptDetailDto
            {
                Id = d.Id,
                YarnCountId = d.YarnCountId,
                CountCode = d.YarnCount?.CountCode ?? string.Empty,
                LotNo = d.LotNo,
                BagNo = d.BagNo,
                GrossWeight = d.GrossWeight,
                TareWeight = d.TareWeight,
                NetWeight = d.NetWeight,
                ConeCount = d.ConeCount,
                RatePerKg = d.RatePerKg
            }).ToList()
        };
    }
}
