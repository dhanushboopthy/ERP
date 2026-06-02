using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IYarnReturnService
{
    Task<PagedResult<YarnReturnListDto>> GetAllAsync(PaginationParams paging, int? partyId = null, string? returnType = null, string? status = null);
    Task<YarnReturnDto?> GetByIdAsync(int id);
    Task<YarnReturnDto> CreateAsync(CreateYarnReturnRequest request, string createdBy);
    Task<YarnReturnDto?> UpdateAsync(int id, UpdateYarnReturnRequest request, string modifiedBy);
    Task<YarnReturnDto?> ApproveAsync(int id, string approvedBy);
    Task<bool> DeleteAsync(int id, string modifiedBy);
}

public class YarnReturnService : IYarnReturnService
{
    private readonly ApplicationDbContext _context;
    private readonly IDocumentNumberService _documentNumberService;
    private readonly IAuditLogService _auditLogService;

    public YarnReturnService(
        ApplicationDbContext context,
        IDocumentNumberService documentNumberService,
        IAuditLogService auditLogService)
    {
        _context = context;
        _documentNumberService = documentNumberService;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResult<YarnReturnListDto>> GetAllAsync(
        PaginationParams paging,
        int? partyId = null,
        string? returnType = null,
        string? status = null)
    {
        var query = _context.YarnReturns
            .Include(yr => yr.Party)
            .Include(yr => yr.Details)
            .Include(yr => yr.SizingJobCard)
            .Where(yr => yr.IsActive)
            .AsQueryable();

        if (partyId.HasValue)
            query = query.Where(yr => yr.PartyId == partyId);

        if (!string.IsNullOrEmpty(returnType))
            query = query.Where(yr => yr.ReturnType == returnType);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(yr => yr.Status == status);

        if (!string.IsNullOrEmpty(paging.Search))
        {
            var search = paging.Search.ToLower();
            query = query.Where(yr =>
                yr.DCNo.ToLower().Contains(search) ||
                yr.Party.PartyName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(yr => yr.DCDate)
            .ThenByDescending(yr => yr.Id)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(yr => new YarnReturnListDto
            {
                Id = yr.Id,
                DCNo = yr.DCNo,
                DCDate = yr.DCDate,
                PartyName = yr.Party.PartyName,
                ReturnType = yr.ReturnType,
                SizingJobCardNo = yr.SizingJobCard != null ? yr.SizingJobCard.JobCardNumber : null,
                TotalWeight = (decimal)yr.Details.Sum(d => (double)d.NetWeight),
                TotalBags = yr.Details.Sum(d => d.Bags),
                Status = yr.Status,
                IsNotForSale = yr.IsNotForSale
            })
            .ToListAsync();

        return new PagedResult<YarnReturnListDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        };
    }

    public async Task<YarnReturnDto?> GetByIdAsync(int id)
    {
        var yarnReturn = await _context.YarnReturns
            .Include(yr => yr.Party)
            .Include(yr => yr.Vehicle)
            .Include(yr => yr.SizingJobCard)
            .Include(yr => yr.Details)
                .ThenInclude(d => d.YarnCount)
            .FirstOrDefaultAsync(yr => yr.Id == id && yr.IsActive);

        return yarnReturn == null ? null : MapToDto(yarnReturn);
    }

    public async Task<YarnReturnDto> CreateAsync(CreateYarnReturnRequest request, string createdBy)
    {
        var financialYearId = await _documentNumberService.GetCurrentFinancialYearIdAsync();
        var dcNo = await _documentNumberService.GetNextDocumentNumberAsync("YarnReturnDC", financialYearId);

        var yarnReturn = new YarnReturn
        {
            DCNo = dcNo,
            DCDate = request.DCDate,
            FinancialYearId = financialYearId,
            PartyId = request.PartyId,
            ReturnType = request.ReturnType,
            SizingJobCardId = request.SizingJobCardId,
            VehicleId = request.VehicleId,
            DriverName = request.DriverName,
            TotalWeight = 0,
            IsNotForSale = request.ReturnType == "Jobwork",
            Status = "Draft",
            Remarks = request.Remarks,
            CreatedBy = createdBy
        };

        foreach (var detail in request.Details)
        {
            var netWeight = detail.GrossWeight - detail.TareWeight;
            yarnReturn.Details.Add(new YarnReturnDetail
            {
                YarnCountId = detail.YarnCountId,
                LotNo = detail.LotNo,
                Bags = detail.Bags,
                Cones = detail.Cones,
                GrossWeight = detail.GrossWeight,
                TareWeight = detail.TareWeight,
                NetWeight = netWeight,
                CreatedBy = createdBy
            });
            yarnReturn.TotalWeight += netWeight;
        }

        _context.YarnReturns.Add(yarnReturn);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("YarnReturns", yarnReturn.Id, "INSERT", null, yarnReturn, createdBy);

        return (await GetByIdAsync(yarnReturn.Id))!;
    }

    public async Task<YarnReturnDto?> UpdateAsync(int id, UpdateYarnReturnRequest request, string modifiedBy)
    {
        var yarnReturn = await _context.YarnReturns
            .Include(yr => yr.Details)
            .FirstOrDefaultAsync(yr => yr.Id == id && yr.IsActive);

        if (yarnReturn == null)
            return null;

        if (yarnReturn.Status != "Draft")
            throw new InvalidOperationException("Cannot modify yarn return that has been approved or dispatched");

        var oldValues = CloneForAudit(yarnReturn);

        yarnReturn.VehicleId = request.VehicleId;
        yarnReturn.DriverName = request.DriverName;
        yarnReturn.Remarks = request.Remarks;
        yarnReturn.ModifiedBy = modifiedBy;
        yarnReturn.ModifiedDate = DateTime.UtcNow;

        // Update details
        _context.YarnReturnDetails.RemoveRange(yarnReturn.Details);
        yarnReturn.TotalWeight = 0;

        foreach (var detail in request.Details)
        {
            var netWeight = detail.GrossWeight - detail.TareWeight;
            yarnReturn.Details.Add(new YarnReturnDetail
            {
                YarnCountId = detail.YarnCountId,
                LotNo = detail.LotNo,
                Bags = detail.Bags,
                Cones = detail.Cones,
                GrossWeight = detail.GrossWeight,
                TareWeight = detail.TareWeight,
                NetWeight = netWeight,
                CreatedBy = modifiedBy
            });
            yarnReturn.TotalWeight += netWeight;
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("YarnReturns", yarnReturn.Id, "UPDATE", oldValues, yarnReturn, modifiedBy);

        return await GetByIdAsync(id);
    }

    public async Task<YarnReturnDto?> ApproveAsync(int id, string approvedBy)
    {
        var yarnReturn = await _context.YarnReturns
            .Include(yr => yr.Details)
            .FirstOrDefaultAsync(yr => yr.Id == id && yr.IsActive);

        if (yarnReturn == null)
            return null;

        if (yarnReturn.Status != "Draft")
            throw new InvalidOperationException("Yarn return is already approved");

        var oldValues = CloneForAudit(yarnReturn);

        yarnReturn.Status = "Approved";
        yarnReturn.ApprovedBy = approvedBy;
        yarnReturn.ApprovedDate = DateTime.UtcNow;
        yarnReturn.ModifiedBy = approvedBy;
        yarnReturn.ModifiedDate = DateTime.UtcNow;

        var financialYearId = await _documentNumberService.GetCurrentFinancialYearIdAsync();

        // Create stock entries based on return type
        foreach (var detail in yarnReturn.Details)
        {
            var lastStock = await _context.YarnStocks
                .Where(s => s.YarnCountId == detail.YarnCountId &&
                           s.PartyId == yarnReturn.PartyId &&
                           s.LotNo == detail.LotNo)
                .OrderByDescending(s => s.Id)
                .FirstOrDefaultAsync();

            var previousBalance = lastStock?.CurrentBalanceKg ?? 0;

            YarnStock stock;
            if (yarnReturn.ReturnType == "Mill")
            {
                // Mill return - stock comes back IN
                stock = new YarnStock
                {
                    YarnCountId = detail.YarnCountId,
                    PartyId = yarnReturn.PartyId,
                    LotNo = detail.LotNo,
                    TransactionType = "YarnReturnMillIn",
                    TransactionId = yarnReturn.Id,
                    TransactionDate = yarnReturn.DCDate,
                    InwardQtyKg = detail.NetWeight,
                    OutwardQtyKg = 0,
                    CurrentBalanceKg = previousBalance + detail.NetWeight,
                    FinancialYearId = financialYearId,
                    CreatedBy = approvedBy
                };
            }
            else
            {
                // Jobwork return - stock goes OUT
                if (previousBalance < detail.NetWeight)
                    throw new InvalidOperationException($"Insufficient stock for yarn count {detail.YarnCountId}, lot {detail.LotNo}");

                stock = new YarnStock
                {
                    YarnCountId = detail.YarnCountId,
                    PartyId = yarnReturn.PartyId,
                    LotNo = detail.LotNo,
                    TransactionType = "YarnReturnJobworkOut",
                    TransactionId = yarnReturn.Id,
                    TransactionDate = yarnReturn.DCDate,
                    InwardQtyKg = 0,
                    OutwardQtyKg = detail.NetWeight,
                    CurrentBalanceKg = previousBalance - detail.NetWeight,
                    FinancialYearId = financialYearId,
                    CreatedBy = approvedBy
                };
            }

            _context.YarnStocks.Add(stock);
        }

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("YarnReturns", yarnReturn.Id, "UPDATE", oldValues, yarnReturn, approvedBy);

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id, string modifiedBy)
    {
        var yarnReturn = await _context.YarnReturns
            .FirstOrDefaultAsync(yr => yr.Id == id && yr.IsActive);

        if (yarnReturn == null)
            return false;

        if (yarnReturn.Status != "Draft")
            throw new InvalidOperationException("Cannot delete yarn return that has been approved");

        var oldValues = CloneForAudit(yarnReturn);

        yarnReturn.IsActive = false;
        yarnReturn.ModifiedBy = modifiedBy;
        yarnReturn.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("YarnReturns", yarnReturn.Id, "DELETE", oldValues, null, modifiedBy);

        return true;
    }

    private static YarnReturnDto MapToDto(YarnReturn yr)
    {
        return new YarnReturnDto
        {
            Id = yr.Id,
            DCNo = yr.DCNo,
            DCDate = yr.DCDate,
            PartyId = yr.PartyId,
            PartyCode = yr.Party?.PartyCode ?? "",
            PartyName = yr.Party?.PartyName ?? "",
            ReturnType = yr.ReturnType,
            SizingJobCardId = yr.SizingJobCardId,
            SizingJobCardNo = yr.SizingJobCard?.JobCardNumber,
            VehicleId = yr.VehicleId,
            VehicleNo = yr.Vehicle?.VehicleNo,
            DriverName = yr.DriverName,
            TotalWeight = yr.TotalWeight,
            IsNotForSale = yr.IsNotForSale,
            Status = yr.Status,
            ApprovedBy = yr.ApprovedBy,
            ApprovedDate = yr.ApprovedDate,
            Remarks = yr.Remarks,
            Details = yr.Details?.Select(d => new YarnReturnDetailDto
            {
                Id = d.Id,
                YarnCountId = d.YarnCountId,
                CountCode = d.YarnCount?.CountCode ?? "",
                LotNo = d.LotNo,
                Bags = d.Bags,
                Cones = d.Cones,
                GrossWeight = d.GrossWeight,
                TareWeight = d.TareWeight,
                NetWeight = d.NetWeight
            }).ToList() ?? new()
        };
    }

    private static object CloneForAudit(YarnReturn yr)
    {
        return new
        {
            yr.Id,
            yr.DCNo,
            yr.DCDate,
            yr.PartyId,
            yr.ReturnType,
            yr.VehicleId,
            yr.DriverName,
            yr.TotalWeight,
            yr.IsNotForSale,
            yr.Status
        };
    }
}
