using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public class LoomTypeService
{
    private readonly ApplicationDbContext _context;
    private readonly AuditLogService _auditLogService;

    public LoomTypeService(ApplicationDbContext context, AuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<PagedResult<LoomTypeDto>> GetAllAsync(PaginationParams pagination)
    {
        var query = _context.LoomTypes.AsQueryable();

        if (!string.IsNullOrEmpty(pagination.Search))
        {
            var search = pagination.Search.ToLower();
            query = query.Where(l => l.LoomTypeCode.ToLower().Contains(search) ||
                                     l.LoomTypeName.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        query = pagination.SortBy?.ToLower() switch
        {
            "code" => pagination.SortDesc ? query.OrderByDescending(l => l.LoomTypeCode) : query.OrderBy(l => l.LoomTypeCode),
            "name" => pagination.SortDesc ? query.OrderByDescending(l => l.LoomTypeName) : query.OrderBy(l => l.LoomTypeName),
            _ => query.OrderBy(l => l.LoomTypeCode)
        };

        var items = await query
            .Skip((pagination.PageNumber - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(l => new LoomTypeDto
            {
                Id = l.Id,
                LoomTypeCode = l.LoomTypeCode,
                LoomTypeName = l.LoomTypeName,
                WidthInches = l.WidthInches,
                IsActive = l.IsActive
            })
            .ToListAsync();

        return new PagedResult<LoomTypeDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = pagination.PageNumber,
            PageSize = pagination.PageSize
        };
    }

    public async Task<LoomTypeDto?> GetByIdAsync(int id)
    {
        return await _context.LoomTypes
            .Where(l => l.Id == id)
            .Select(l => new LoomTypeDto
            {
                Id = l.Id,
                LoomTypeCode = l.LoomTypeCode,
                LoomTypeName = l.LoomTypeName,
                WidthInches = l.WidthInches,
                IsActive = l.IsActive
            })
            .FirstOrDefaultAsync();
    }

    public async Task<List<LoomTypeDto>> GetActiveAsync()
    {
        return await _context.LoomTypes
            .Where(l => l.IsActive)
            .OrderBy(l => l.LoomTypeCode)
            .Select(l => new LoomTypeDto
            {
                Id = l.Id,
                LoomTypeCode = l.LoomTypeCode,
                LoomTypeName = l.LoomTypeName,
                WidthInches = l.WidthInches,
                IsActive = l.IsActive
            })
            .ToListAsync();
    }

    public async Task<LoomTypeDto> CreateAsync(CreateLoomTypeRequest request, int userId)
    {
        // Check duplicate code
        if (await _context.LoomTypes.AnyAsync(l => l.LoomTypeCode == request.LoomTypeCode))
        {
            throw new InvalidOperationException($"Loom type with code '{request.LoomTypeCode}' already exists.");
        }

        var entity = new LoomType
        {
            LoomTypeCode = request.LoomTypeCode,
            LoomTypeName = request.LoomTypeName,
            WidthInches = request.WidthInches,
            IsActive = true,
            CreatedBy = userId.ToString(),
            CreatedDate = DateTime.UtcNow
        };

        _context.LoomTypes.Add(entity);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("LoomType", entity.Id, "Create", userId, null,
            System.Text.Json.JsonSerializer.Serialize(new { request.LoomTypeCode, request.LoomTypeName }));

        return new LoomTypeDto
        {
            Id = entity.Id,
            LoomTypeCode = entity.LoomTypeCode,
            LoomTypeName = entity.LoomTypeName,
            WidthInches = entity.WidthInches,
            IsActive = entity.IsActive
        };
    }

    public async Task<LoomTypeDto> UpdateAsync(int id, UpdateLoomTypeRequest request, int userId)
    {
        var entity = await _context.LoomTypes.FindAsync(id);
        if (entity == null)
        {
            throw new InvalidOperationException("Loom type not found.");
        }

        // Check duplicate code (excluding self)
        if (await _context.LoomTypes.AnyAsync(l => l.LoomTypeCode == request.LoomTypeCode && l.Id != id))
        {
            throw new InvalidOperationException($"Loom type with code '{request.LoomTypeCode}' already exists.");
        }

        var oldValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            entity.LoomTypeCode,
            entity.LoomTypeName,
            entity.WidthInches,
            entity.IsActive
        });

        entity.LoomTypeCode = request.LoomTypeCode;
        entity.LoomTypeName = request.LoomTypeName;
        entity.WidthInches = request.WidthInches;
        entity.IsActive = request.IsActive;
        entity.ModifiedBy = userId.ToString();
        entity.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("LoomType", entity.Id, "Update", userId, oldValues,
            System.Text.Json.JsonSerializer.Serialize(new { request.LoomTypeCode, request.LoomTypeName, request.WidthInches, request.IsActive }));

        return new LoomTypeDto
        {
            Id = entity.Id,
            LoomTypeCode = entity.LoomTypeCode,
            LoomTypeName = entity.LoomTypeName,
            WidthInches = entity.WidthInches,
            IsActive = entity.IsActive
        };
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var entity = await _context.LoomTypes.FindAsync(id);
        if (entity == null)
        {
            return false;
        }

        // Check if used in any sizing job cards
        var isUsed = await _context.SizingJobCards.AnyAsync(s => s.LoomTypeId == id);
        if (isUsed)
        {
            throw new InvalidOperationException("Cannot delete loom type as it is used in sizing job cards.");
        }

        // Soft delete
        entity.IsActive = false;
        entity.ModifiedBy = userId.ToString();
        entity.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("LoomType", entity.Id, "Delete", userId,
            System.Text.Json.JsonSerializer.Serialize(new { entity.LoomTypeCode }), null);

        return true;
    }
}
