using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IYarnDeliveryService
{
    Task<PagedResult<YarnDeliveryListDto>> GetAllAsync(PaginationParams paging, int? partyId = null, string? status = null);
    Task<YarnDeliveryDto?> GetByIdAsync(int id);
    Task<YarnDeliveryDto> CreateAsync(CreateYarnDeliveryRequest request, string createdBy);
    Task<YarnDeliveryDto?> UpdateAsync(int id, UpdateYarnDeliveryRequest request, string modifiedBy);
    Task<YarnDeliveryDto?> ApproveAsync(int id, string approvedBy);
    Task<YarnDeliveryDto?> DispatchAsync(int id, string dispatchedBy, string? receiverSignature);
    Task<bool> DeleteAsync(int id, string modifiedBy);
}

public class YarnDeliveryService : IYarnDeliveryService
{
    private readonly ApplicationDbContext _context;
    private readonly IDocumentNumberService _documentNumberService;
    private readonly IAuditLogService _auditLogService;

    public YarnDeliveryService(
        ApplicationDbContext context,
        IDocumentNumberService documentNumberService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _documentNumberService = documentNumberService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResult<YarnDeliveryListDto>> GetAllAsync(
        PaginationParams paging,
        int? partyId = null,
        string? status = null)
    {
        var query = _context.YarnDeliveries
            .Include(yd => yd.Party)
            .Include(yd => yd.Details)
            .Where(yd => yd.IsActive)
            .AsQueryable();

        if (partyId.HasValue)
            query = query.Where(yd => yd.PartyId == partyId);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(yd => yd.Status == status);

        if (!string.IsNullOrEmpty(paging.Search))
        {
            var search = paging.Search.ToLower();
            query = query.Where(yd =>
                yd.DCNo.ToLower().Contains(search) ||
                yd.Party.PartyName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(yd => yd.DCDate)
            .ThenByDescending(yd => yd.Id)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(yd => new YarnDeliveryListDto
            {
                Id = yd.Id,
                DCNo = yd.DCNo,
                DCDate = yd.DCDate,
                PartyName = yd.Party.PartyName,
                TotalWeight = (decimal)yd.Details.Sum(d => (double)d.NetWeight),
                TotalAmount = (decimal)yd.Details.Sum(d => (double)d.Amount),
                TotalBags = yd.Details.Sum(d => d.Bags),
                Status = yd.Status,
                DispatchedBy = yd.DispatchedBy,
                DispatchedDate = yd.DispatchedDate
            })
            .ToListAsync();

        return new PagedResult<YarnDeliveryListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        };
    }

    public async Task<YarnDeliveryDto?> GetByIdAsync(int id)
    {
        var yarnDelivery = await _context.YarnDeliveries
            .Include(yd => yd.Party)
            .Include(yd => yd.Vehicle)
            .Include(yd => yd.Details)
                .ThenInclude(d => d.YarnCount)
            .FirstOrDefaultAsync(yd => yd.Id == id && yd.IsActive);

        return yarnDelivery == null ? null : MapToDto(yarnDelivery);
    }

    public async Task<YarnDeliveryDto> CreateAsync(CreateYarnDeliveryRequest request, string createdBy)
    {
        // Validate stock availability for all items
        foreach (var detail in request.Details)
        {
            var lastStock = await _context.YarnStocks
                .Where(s => s.YarnCountId == detail.YarnCountId &&
                           s.PartyId == request.PartyId &&
                           s.LotNo == detail.LotNo)
                .OrderByDescending(s => s.Id)
                .FirstOrDefaultAsync();

            var availableStock = lastStock?.CurrentBalanceKg ?? 0;
            var requestedWeight = detail.GrossWeight - detail.TareWeight;

            if (requestedWeight > availableStock)
            {
                var yarnCount = await _context.YarnCounts.FindAsync(detail.YarnCountId);
                throw new InvalidOperationException(
                    $"Insufficient stock for {yarnCount?.CountCode ?? "yarn"}, Lot: {detail.LotNo}. " +
                    $"Available: {availableStock:F3} kg, Requested: {requestedWeight:F3} kg");
            }
        }

        var financialYearId = await _documentNumberService.GetCurrentFinancialYearIdAsync();
        var dcNo = await _documentNumberService.GetNextDocumentNumberAsync("YarnDeliveryDC", financialYearId);

        var yarnDelivery = new YarnDelivery
        {
            DCNo = dcNo,
            DCDate = request.DCDate,
            FinancialYearId = financialYearId,
            PartyId = request.PartyId,
            VehicleId = request.VehicleId,
            DriverName = request.DriverName,
            DriverPhone = request.DriverPhone,
            TotalWeight = 0,
            TotalAmount = 0,
            Status = "Draft",
            Remarks = request.Remarks,
            CreatedBy = createdBy
        };

        foreach (var detail in request.Details)
        {
            var netWeight = detail.GrossWeight - detail.TareWeight;
            var amount = netWeight * detail.RatePerKg;
            yarnDelivery.Details.Add(new YarnDeliveryDetail
            {
                YarnCountId = detail.YarnCountId,
                LotNo = detail.LotNo,
                Bags = detail.Bags,
                Cones = detail.Cones,
                GrossWeight = detail.GrossWeight,
                TareWeight = detail.TareWeight,
                NetWeight = netWeight,
                RatePerKg = detail.RatePerKg,
                Amount = amount,
                CreatedBy = createdBy
            });
            yarnDelivery.TotalWeight += netWeight;
            yarnDelivery.TotalAmount += amount;
        }

        _context.YarnDeliveries.Add(yarnDelivery);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("YarnDeliveries", yarnDelivery.Id, "INSERT", null, yarnDelivery, createdBy);

        return (await GetByIdAsync(yarnDelivery.Id))!;
    }

    public async Task<YarnDeliveryDto?> UpdateAsync(int id, UpdateYarnDeliveryRequest request, string modifiedBy)
    {
        var yarnDelivery = await _context.YarnDeliveries
            .Include(yd => yd.Details)
            .FirstOrDefaultAsync(yd => yd.Id == id && yd.IsActive);

        if (yarnDelivery == null)
            return null;

        if (yarnDelivery.Status != "Draft")
            throw new InvalidOperationException("Cannot modify yarn delivery that has been approved or dispatched");

        // Validate stock for new details
        foreach (var detail in request.Details)
        {
            var lastStock = await _context.YarnStocks
                .Where(s => s.YarnCountId == detail.YarnCountId &&
                           s.PartyId == yarnDelivery.PartyId &&
                           s.LotNo == detail.LotNo)
                .OrderByDescending(s => s.Id)
                .FirstOrDefaultAsync();

            var availableStock = lastStock?.CurrentBalanceKg ?? 0;
            var requestedWeight = detail.GrossWeight - detail.TareWeight;

            if (requestedWeight > availableStock)
            {
                var yarnCount = await _context.YarnCounts.FindAsync(detail.YarnCountId);
                throw new InvalidOperationException(
                    $"Insufficient stock for {yarnCount?.CountCode ?? "yarn"}, Lot: {detail.LotNo}. " +
                    $"Available: {availableStock:F3} kg, Requested: {requestedWeight:F3} kg");
            }
        }

        var oldValues = CloneForAudit(yarnDelivery);

        yarnDelivery.VehicleId = request.VehicleId;
        yarnDelivery.DriverName = request.DriverName;
        yarnDelivery.DriverPhone = request.DriverPhone;
        yarnDelivery.Remarks = request.Remarks;
        yarnDelivery.ModifiedBy = modifiedBy;
        yarnDelivery.ModifiedDate = DateTime.UtcNow;

        // Update details
        _context.YarnDeliveryDetails.RemoveRange(yarnDelivery.Details);
        yarnDelivery.TotalWeight = 0;
        yarnDelivery.TotalAmount = 0;

        foreach (var detail in request.Details)
        {
            var netWeight = detail.GrossWeight - detail.TareWeight;
            var amount = netWeight * detail.RatePerKg;
            yarnDelivery.Details.Add(new YarnDeliveryDetail
            {
                YarnCountId = detail.YarnCountId,
                LotNo = detail.LotNo,
                Bags = detail.Bags,
                Cones = detail.Cones,
                GrossWeight = detail.GrossWeight,
                TareWeight = detail.TareWeight,
                NetWeight = netWeight,
                RatePerKg = detail.RatePerKg,
                Amount = amount,
                CreatedBy = modifiedBy
            });
            yarnDelivery.TotalWeight += netWeight;
            yarnDelivery.TotalAmount += amount;
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("YarnDeliveries", yarnDelivery.Id, "UPDATE", oldValues, yarnDelivery, modifiedBy);

        return await GetByIdAsync(id);
    }

    public async Task<YarnDeliveryDto?> ApproveAsync(int id, string approvedBy)
    {
        var yarnDelivery = await _context.YarnDeliveries
            .Include(yd => yd.Details)
            .FirstOrDefaultAsync(yd => yd.Id == id && yd.IsActive);

        if (yarnDelivery == null)
            return null;

        if (yarnDelivery.Status != "Draft")
            throw new InvalidOperationException("Yarn delivery is already approved or dispatched");

        // Final stock validation before approval
        foreach (var detail in yarnDelivery.Details)
        {
            var lastStock = await _context.YarnStocks
                .Where(s => s.YarnCountId == detail.YarnCountId &&
                           s.PartyId == yarnDelivery.PartyId &&
                           s.LotNo == detail.LotNo)
                .OrderByDescending(s => s.Id)
                .FirstOrDefaultAsync();

            var availableStock = lastStock?.CurrentBalanceKg ?? 0;

            if (detail.NetWeight > availableStock)
            {
                var yarnCount = await _context.YarnCounts.FindAsync(detail.YarnCountId);
                throw new InvalidOperationException(
                    $"Insufficient stock for {yarnCount?.CountCode ?? "yarn"}, Lot: {detail.LotNo}. " +
                    $"Available: {availableStock:F3} kg, Requested: {detail.NetWeight:F3} kg");
            }
        }

        var oldValues = CloneForAudit(yarnDelivery);

        yarnDelivery.Status = "Approved";
        yarnDelivery.ApprovedBy = approvedBy;
        yarnDelivery.ApprovedDate = DateTime.UtcNow;
        yarnDelivery.ModifiedBy = approvedBy;
        yarnDelivery.ModifiedDate = DateTime.UtcNow;

        var financialYearId = await _documentNumberService.GetCurrentFinancialYearIdAsync();

        // Create stock OUT entries
        foreach (var detail in yarnDelivery.Details)
        {
            var lastStock = await _context.YarnStocks
                .Where(s => s.YarnCountId == detail.YarnCountId &&
                           s.PartyId == yarnDelivery.PartyId &&
                           s.LotNo == detail.LotNo)
                .OrderByDescending(s => s.Id)
                .FirstOrDefaultAsync();

            var previousBalance = lastStock?.CurrentBalanceKg ?? 0;

            var stock = new YarnStock
            {
                YarnCountId = detail.YarnCountId,
                PartyId = yarnDelivery.PartyId,
                LotNo = detail.LotNo,
                TransactionType = "YarnDeliveryOut",
                TransactionId = yarnDelivery.Id,
                TransactionDate = yarnDelivery.DCDate,
                InwardQtyKg = 0,
                OutwardQtyKg = detail.NetWeight,
                CurrentBalanceKg = previousBalance - detail.NetWeight,
                FinancialYearId = financialYearId,
                CreatedBy = approvedBy
            };

            _context.YarnStocks.Add(stock);
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("YarnDeliveries", yarnDelivery.Id, "UPDATE", oldValues, yarnDelivery, approvedBy);

        return await GetByIdAsync(id);
    }

    public async Task<YarnDeliveryDto?> DispatchAsync(int id, string dispatchedBy, string? receiverSignature)
    {
        var yarnDelivery = await _context.YarnDeliveries
            .FirstOrDefaultAsync(yd => yd.Id == id && yd.IsActive);

        if (yarnDelivery == null)
            return null;

        if (yarnDelivery.Status != "Approved")
            throw new InvalidOperationException("Yarn delivery must be approved before dispatch");

        var oldValues = CloneForAudit(yarnDelivery);

        yarnDelivery.Status = "Dispatched";
        yarnDelivery.DispatchedBy = dispatchedBy;
        yarnDelivery.DispatchedDate = DateTime.UtcNow;
        yarnDelivery.ReceiverSignature = receiverSignature;
        yarnDelivery.ModifiedBy = dispatchedBy;
        yarnDelivery.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("YarnDeliveries", yarnDelivery.Id, "UPDATE", oldValues, yarnDelivery, dispatchedBy);

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id, string modifiedBy)
    {
        var yarnDelivery = await _context.YarnDeliveries
            .FirstOrDefaultAsync(yd => yd.Id == id && yd.IsActive);

        if (yarnDelivery == null)
            return false;

        if (yarnDelivery.Status != "Draft")
            throw new InvalidOperationException("Cannot delete yarn delivery that has been approved or dispatched");

        var oldValues = CloneForAudit(yarnDelivery);

        yarnDelivery.IsActive = false;
        yarnDelivery.ModifiedBy = modifiedBy;
        yarnDelivery.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("YarnDeliveries", yarnDelivery.Id, "DELETE", oldValues, null, modifiedBy);

        return true;
    }

    private static YarnDeliveryDto MapToDto(YarnDelivery yd)
    {
        return new YarnDeliveryDto
        {
            Id = yd.Id,
            DCNo = yd.DCNo,
            DCDate = yd.DCDate,
            PartyId = yd.PartyId,
            PartyCode = yd.Party?.PartyCode ?? "",
            PartyName = yd.Party?.PartyName ?? "",
            VehicleId = yd.VehicleId,
            VehicleNo = yd.Vehicle?.VehicleNo,
            DriverName = yd.DriverName,
            DriverPhone = yd.DriverPhone,
            TotalWeight = yd.TotalWeight,
            TotalAmount = yd.TotalAmount,
            Status = yd.Status,
            ApprovedBy = yd.ApprovedBy,
            ApprovedDate = yd.ApprovedDate,
            DispatchedBy = yd.DispatchedBy,
            DispatchedDate = yd.DispatchedDate,
            Remarks = yd.Remarks,
            Details = yd.Details?.Select(d => new YarnDeliveryDetailDto
            {
                Id = d.Id,
                YarnCountId = d.YarnCountId,
                CountCode = d.YarnCount?.CountCode ?? "",
                LotNo = d.LotNo,
                Bags = d.Bags,
                Cones = d.Cones,
                GrossWeight = d.GrossWeight,
                TareWeight = d.TareWeight,
                NetWeight = d.NetWeight,
                RatePerKg = d.RatePerKg,
                Amount = d.Amount
            }).ToList() ?? new()
        };
    }

    private static object CloneForAudit(YarnDelivery yd)
    {
        return new
        {
            yd.Id,
            yd.DCNo,
            yd.DCDate,
            yd.PartyId,
            yd.VehicleId,
            yd.DriverName,
            yd.TotalWeight,
            yd.TotalAmount,
            yd.Status
        };
    }
}
