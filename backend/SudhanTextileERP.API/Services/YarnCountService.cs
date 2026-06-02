using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IYarnCountService
{
    Task<List<YarnCountDto>> GetAllAsync();
    Task<YarnCountDto?> GetByIdAsync(int id);
    Task<YarnCountDto> CreateAsync(CreateYarnCountRequest request, string createdBy);
    Task<YarnCountDto?> UpdateAsync(int id, CreateYarnCountRequest request, string modifiedBy);
    Task<bool> DeleteAsync(int id, string modifiedBy);
}

public class YarnCountService : IYarnCountService
{
    private readonly ApplicationDbContext _context;

    public YarnCountService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<YarnCountDto>> GetAllAsync()
    {
        return await _context.YarnCounts
            .OrderBy(y => y.CountCode)
            .Select(y => new YarnCountDto
            {
                Id = y.Id,
                CountCode = y.CountCode,
                CountDescription = y.CountDescription,
                Ply = y.Ply,
                IsActive = y.IsActive
            })
            .ToListAsync();
    }

    public async Task<YarnCountDto?> GetByIdAsync(int id)
    {
        var yarnCount = await _context.YarnCounts.FindAsync(id);
        if (yarnCount == null) return null;

        return new YarnCountDto
        {
            Id = yarnCount.Id,
            CountCode = yarnCount.CountCode,
            CountDescription = yarnCount.CountDescription,
            Ply = yarnCount.Ply,
            IsActive = yarnCount.IsActive
        };
    }

    public async Task<YarnCountDto> CreateAsync(CreateYarnCountRequest request, string createdBy)
    {
        if (await _context.YarnCounts.AnyAsync(y => y.CountCode == request.CountCode))
            throw new InvalidOperationException($"Yarn count '{request.CountCode}' already exists");

        var yarnCount = new YarnCount
        {
            CountCode = request.CountCode,
            CountDescription = request.CountDescription,
            Ply = request.Ply,
            CreatedBy = createdBy
        };

        _context.YarnCounts.Add(yarnCount);
        await _context.SaveChangesAsync();

        return new YarnCountDto
        {
            Id = yarnCount.Id,
            CountCode = yarnCount.CountCode,
            CountDescription = yarnCount.CountDescription,
            Ply = yarnCount.Ply,
            IsActive = yarnCount.IsActive
        };
    }

    public async Task<YarnCountDto?> UpdateAsync(int id, CreateYarnCountRequest request, string modifiedBy)
    {
        var yarnCount = await _context.YarnCounts.FindAsync(id);
        if (yarnCount == null) return null;

        if (await _context.YarnCounts.AnyAsync(y => y.CountCode == request.CountCode && y.Id != id))
            throw new InvalidOperationException($"Yarn count '{request.CountCode}' already exists");

        yarnCount.CountCode = request.CountCode;
        yarnCount.CountDescription = request.CountDescription;
        yarnCount.Ply = request.Ply;
        yarnCount.IsActive = request.IsActive;
        yarnCount.ModifiedBy = modifiedBy;
        yarnCount.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new YarnCountDto
        {
            Id = yarnCount.Id,
            CountCode = yarnCount.CountCode,
            CountDescription = yarnCount.CountDescription,
            Ply = yarnCount.Ply,
            IsActive = yarnCount.IsActive
        };
    }

    public async Task<bool> DeleteAsync(int id, string modifiedBy)
    {
        var yarnCount = await _context.YarnCounts.FindAsync(id);
        if (yarnCount == null) return false;

        yarnCount.IsActive = false;
        yarnCount.ModifiedBy = modifiedBy;
        yarnCount.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }
}
