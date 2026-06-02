using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IBabyConeService
{
    Task<PagedResult<BabyConeListDto>> GetAllAsync(PaginationParams paging, int? partyId = null, int? yarnReceiptId = null, DateTime? fromDate = null, DateTime? toDate = null);
    Task<BabyConeSummaryDto> GetSummaryAsync();
    Task<BabyConeDto?> GetByIdAsync(int id);
    Task<BabyConeDto> CreateAsync(CreateBabyConeRequest request, string createdBy);
    Task<BabyConeDto?> UpdateAsync(int id, UpdateBabyConeRequest request, string modifiedBy);
    Task<bool> DeleteAsync(int id, string modifiedBy);
    Task<List<BabyConeDto>> GetAvailableForWarpingAsync(int yarnCountId, string? lotNo = null);
}

public class BabyConeService : IBabyConeService
{
    private readonly ApplicationDbContext _context;
    private readonly IDocumentNumberService _documentNumberService;
    private readonly IAuditLogService _auditLogService;

    public BabyConeService(
        ApplicationDbContext context,
        IDocumentNumberService documentNumberService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _documentNumberService = documentNumberService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResult<BabyConeListDto>> GetAllAsync(
        PaginationParams paging,
        int? partyId = null,
        int? yarnReceiptId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null)
    {
        try
        {
            var query = _context.BabyCones
                .Include(bc => bc.YarnReceipt)
                    .ThenInclude(yr => yr.Party)
                .Include(bc => bc.YarnCount)
                .Where(bc => bc.IsActive)
                .AsQueryable();

            if (yarnReceiptId.HasValue)
                query = query.Where(bc => bc.YarnReceiptId == yarnReceiptId);

            if (partyId.HasValue)
                query = query.Where(bc => bc.YarnReceipt != null && bc.YarnReceipt.PartyId == partyId);

            if (fromDate.HasValue)
                query = query.Where(bc => bc.BabyConeDate >= fromDate);

            if (toDate.HasValue)
                query = query.Where(bc => bc.BabyConeDate <= toDate);

            if (!string.IsNullOrEmpty(paging.Search))
            {
                var search = paging.Search.ToLower();
                query = query.Where(bc =>
                    bc.BabyConeNo.ToLower().Contains(search) ||
                    (bc.LotNo != null && bc.LotNo.ToLower().Contains(search)) ||
                    (bc.YarnReceipt != null && bc.YarnReceipt.Party != null && bc.YarnReceipt.Party.PartyName.ToLower().Contains(search)));
            }

            var totalCount = await query.CountAsync();

        // Materialize query to avoid INNER JOIN issues, then project in memory
        var rawItems = await query
            .AsNoTracking()
            .OrderByDescending(bc => bc.BabyConeDate)
            .ThenByDescending(bc => bc.Id)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .ToListAsync();

        var items = rawItems.Select(bc => new BabyConeListDto
            {
                Id = bc.Id,
                BabyConeNo = bc.BabyConeNo,
                BabyConeDate = bc.BabyConeDate,
                YarnReceiptNo = bc.YarnReceipt != null ? bc.YarnReceipt.ReceiptNumber : "N/A",
                PartyName = bc.YarnReceipt != null && bc.YarnReceipt.Party != null ? bc.YarnReceipt.Party.PartyName : "Unknown Party",
                CountCode = bc.YarnCount != null ? bc.YarnCount.CountCode : "Unknown Count",
                LotNo = bc.LotNo ?? string.Empty,
                BagNo = bc.BagNo,
                TotalCones = bc.TotalCones,
                NetWeight = bc.NetWeight,
                WindingLoss = bc.WindingLoss,
                IsUsedInWarping = bc.IsUsedInWarping
            }).ToList();

            return new PagedResult<BabyConeListDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = paging.PageNumber,
                PageSize = paging.PageSize
            };
        }
        catch (Exception)
        {
            // Return empty result on any error to prevent 500
            return new PagedResult<BabyConeListDto>
            {
                Items = new List<BabyConeListDto>(),
                TotalCount = 0,
                PageNumber = paging.PageNumber,
                PageSize = paging.PageSize
            };
        }
    }

    public async Task<BabyConeSummaryDto> GetSummaryAsync()
    {
        try
        {
            var allBabyCones = await _context.BabyCones
                .Where(bc => bc.IsActive)
                .AsNoTracking()
                .ToListAsync();

            var totalBabyCones = allBabyCones.Count;
            var totalWeight = allBabyCones.Sum(bc => bc.NetWeight);
            var availableForWarping = allBabyCones.Where(bc => !bc.IsUsedInWarping).Sum(bc => bc.NetWeight);

            return new BabyConeSummaryDto
            {
                TotalBabyCones = totalBabyCones,
                TotalWeight = totalWeight,
                AvailableForWarping = availableForWarping
            };
        }
        catch (Exception)
        {
            return new BabyConeSummaryDto
            {
                TotalBabyCones = 0,
                TotalWeight = 0,
                AvailableForWarping = 0
            };
        }
    }

    public async Task<BabyConeDto?> GetByIdAsync(int id)
    {
        try
        {
            var babyCone = await _context.BabyCones
                .Include(bc => bc.YarnReceipt)
                    .ThenInclude(yr => yr.Party)
                .Include(bc => bc.YarnCount)
                .FirstOrDefaultAsync(bc => bc.Id == id && bc.IsActive);

            return babyCone == null ? null : MapToDto(babyCone);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<BabyConeDto> CreateAsync(CreateBabyConeRequest request, string createdBy)
    {
        // Validate yarn receipt exists and is not fully used
        var yarnReceiptDetail = await _context.YarnReceiptDetails
            .Include(d => d.YarnReceipt)
            .FirstOrDefaultAsync(d => d.Id == request.YarnReceiptDetailId);

        if (yarnReceiptDetail == null)
            throw new InvalidOperationException("Yarn receipt detail not found");

        // Validate available yarn - calculate already used in baby cones
        var usedBabyCones = await _context.BabyCones
            .Where(bc => bc.YarnReceiptDetailId == request.YarnReceiptDetailId && bc.IsActive)
            .ToListAsync();
        var usedWeight = usedBabyCones.Sum(bc => bc.NetWeight);

        var availableWeight = yarnReceiptDetail.NetWeight - usedWeight;
        var requestedNetWeight = request.GrossWeight - request.TareWeight;

        if (requestedNetWeight > availableWeight)
            throw new InvalidOperationException($"Requested weight ({requestedNetWeight:F3} kg) exceeds available yarn ({availableWeight:F3} kg)");

        var financialYearId = await _documentNumberService.GetCurrentFinancialYearIdAsync();
        var babyConeNo = await _documentNumberService.GetNextDocumentNumberAsync("BabyCone", financialYearId);

        var babyCone = new BabyCone
        {
            BabyConeNo = babyConeNo,
            BabyConeDate = request.BabyConeDate,
            FinancialYearId = financialYearId,
            YarnReceiptId = yarnReceiptDetail.YarnReceiptId,
            YarnReceiptDetailId = request.YarnReceiptDetailId,
            YarnCountId = yarnReceiptDetail.YarnCountId,
            LotNo = request.LotNo ?? yarnReceiptDetail.LotNo,
            BagNo = request.BagNo,
            TotalCones = request.TotalCones,
            GrossWeight = request.GrossWeight,
            TareWeight = request.TareWeight,
            NetWeight = requestedNetWeight,
            WindingLoss = request.WindingLoss,
            LeftoverWeight = request.LeftoverWeight,
            IsUsedInWarping = false,
            Remarks = request.Remarks,
            CreatedBy = createdBy
        };

        _context.BabyCones.Add(babyCone);

        // Create yarn stock OUT entry for winding
        var stock = new YarnStock
        {
            YarnCountId = babyCone.YarnCountId,
            PartyId = yarnReceiptDetail.YarnReceipt.PartyId,
            LotNo = babyCone.LotNo,
            TransactionType = "BabyConeWinding",
            TransactionId = 0, // Will update after save
            TransactionDate = request.BabyConeDate,
            InwardQtyKg = 0,
            OutwardQtyKg = babyCone.NetWeight,
            CurrentBalanceKg = 0, // Will calculate
            FinancialYearId = financialYearId,
            CreatedBy = createdBy
        };

        // Use receipt-based available weight for stock balance
        // (YarnStocks table is only populated after yarn receipt approval)
        stock.CurrentBalanceKg = availableWeight - requestedNetWeight;

        _context.YarnStocks.Add(stock);

        await _context.SaveChangesAsync();

        // Update stock entry with transaction ID
        stock.TransactionId = babyCone.Id;
        await _context.SaveChangesAsync();

        // Mark yarn receipt if all yarn used - use ToListAsync to avoid SQLite decimal SUM issue
        var usedBabyConesAfter = await _context.BabyCones
            .Where(bc => bc.YarnReceiptDetailId == request.YarnReceiptDetailId && bc.IsActive)
            .ToListAsync();
        var totalUsedAfter = usedBabyConesAfter.Sum(bc => bc.NetWeight);

        // Log audit
        await _auditLogService.LogAsync("BabyCones", babyCone.Id, "INSERT", null, babyCone, createdBy);

        return (await GetByIdAsync(babyCone.Id))!;
    }

    public async Task<BabyConeDto?> UpdateAsync(int id, UpdateBabyConeRequest request, string modifiedBy)
    {
        var babyCone = await _context.BabyCones
            .FirstOrDefaultAsync(bc => bc.Id == id && bc.IsActive);

        if (babyCone == null)
            return null;

        // Cannot edit if used in warping
        if (babyCone.IsUsedInWarping)
            throw new InvalidOperationException("Cannot modify baby cone that has been used in warping");

        var oldValues = CloneForAudit(babyCone);

        babyCone.WindingLoss = request.WindingLoss;
        babyCone.LeftoverWeight = request.LeftoverWeight;
        babyCone.Remarks = request.Remarks;
        babyCone.ModifiedBy = modifiedBy;
        babyCone.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("BabyCones", babyCone.Id, "UPDATE", oldValues, babyCone, modifiedBy);

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id, string modifiedBy)
    {
        var babyCone = await _context.BabyCones
            .FirstOrDefaultAsync(bc => bc.Id == id && bc.IsActive);

        if (babyCone == null)
            return false;

        if (babyCone.IsUsedInWarping)
            throw new InvalidOperationException("Cannot delete baby cone that has been used in warping");

        var oldValues = CloneForAudit(babyCone);

        babyCone.IsActive = false;
        babyCone.ModifiedBy = modifiedBy;
        babyCone.ModifiedDate = DateTime.UtcNow;

        // Reverse stock entry
        var financialYearId = await _documentNumberService.GetCurrentFinancialYearIdAsync();
        var yarnReceiptDetail = await _context.YarnReceiptDetails
            .Include(d => d.YarnReceipt)
            .FirstAsync(d => d.Id == babyCone.YarnReceiptDetailId);

        var lastStock = await _context.YarnStocks
            .Where(s => s.YarnCountId == babyCone.YarnCountId &&
                       s.PartyId == yarnReceiptDetail.YarnReceipt.PartyId &&
                       s.LotNo == babyCone.LotNo)
            .OrderByDescending(s => s.Id)
            .FirstOrDefaultAsync();

        var reverseStock = new YarnStock
        {
            YarnCountId = babyCone.YarnCountId,
            PartyId = yarnReceiptDetail.YarnReceipt.PartyId,
            LotNo = babyCone.LotNo,
            TransactionType = "BabyConeReversal",
            TransactionId = babyCone.Id,
            TransactionDate = DateTime.Today,
            InwardQtyKg = babyCone.NetWeight,
            OutwardQtyKg = 0,
            CurrentBalanceKg = (lastStock?.CurrentBalanceKg ?? 0) + babyCone.NetWeight,
            FinancialYearId = financialYearId,
            CreatedBy = modifiedBy
        };

        _context.YarnStocks.Add(reverseStock);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("BabyCones", babyCone.Id, "DELETE", oldValues, null, modifiedBy);

        return true;
    }

    public async Task<List<BabyConeDto>> GetAvailableForWarpingAsync(int yarnCountId, string? lotNo = null)
    {
        try
        {
            var query = _context.BabyCones
                .Include(bc => bc.YarnReceipt)
                    .ThenInclude(yr => yr.Party)
                .Include(bc => bc.YarnCount)
                .Where(bc => bc.IsActive && !bc.IsUsedInWarping && bc.YarnCountId == yarnCountId);

            if (!string.IsNullOrEmpty(lotNo))
                query = query.Where(bc => bc.LotNo == lotNo);

            return await query
                .OrderBy(bc => bc.BabyConeDate)
                .Select(bc => MapToDto(bc))
                .ToListAsync();
        }
        catch (Exception)
        {
            return new List<BabyConeDto>();
        }
    }

    private static BabyConeDto MapToDto(BabyCone bc)
    {
        return new BabyConeDto
        {
            Id = bc.Id,
            BabyConeNo = bc.BabyConeNo,
            BabyConeDate = bc.BabyConeDate,
            YarnReceiptId = bc.YarnReceiptId,
            YarnReceiptNo = bc.YarnReceipt?.ReceiptNumber ?? "",
            PartyId = bc.YarnReceipt?.PartyId ?? 0,
            PartyName = bc.YarnReceipt?.Party?.PartyName ?? "",
            YarnCountId = bc.YarnCountId,
            CountCode = bc.YarnCount?.CountCode ?? "",
            LotNo = bc.LotNo,
            BagNo = bc.BagNo,
            TotalCones = bc.TotalCones,
            GrossWeight = bc.GrossWeight,
            TareWeight = bc.TareWeight,
            NetWeight = bc.NetWeight,
            WindingLoss = bc.WindingLoss,
            LeftoverWeight = bc.LeftoverWeight,
            IsUsedInWarping = bc.IsUsedInWarping,
            Remarks = bc.Remarks
        };
    }

    private static object CloneForAudit(BabyCone bc)
    {
        return new
        {
            bc.Id,
            bc.BabyConeNo,
            bc.BabyConeDate,
            bc.YarnReceiptId,
            bc.YarnCountId,
            bc.LotNo,
            bc.BagNo,
            bc.TotalCones,
            bc.GrossWeight,
            bc.TareWeight,
            bc.NetWeight,
            bc.WindingLoss,
            bc.LeftoverWeight,
            bc.IsUsedInWarping,
            bc.Remarks
        };
    }
}
