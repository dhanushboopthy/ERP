using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IBeamService
{
    Task<PagedResult<BeamDto>> GetAllAsync(PaginationParams paging, string? beamType = null, string? status = null);
    Task<BeamDto?> GetByIdAsync(int id);
    Task<BeamDto> CreateAsync(CreateBeamRequest request, string createdBy);
    Task<BeamDto?> UpdateAsync(int id, CreateBeamRequest request, string modifiedBy);
    Task<bool> DeleteAsync(int id, string modifiedBy);
    Task<List<BeamDto>> GetAvailableBeamsAsync(string beamType);
    Task<bool> UpdateStatusAsync(int id, string status, int? jobCardId, string? jobCardType, string modifiedBy);
}

public class BeamService : IBeamService
{
    private readonly ApplicationDbContext _context;

    public BeamService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<BeamDto>> GetAllAsync(PaginationParams paging, string? beamType = null, string? status = null)
    {
        var query = _context.Beams.AsQueryable();

        if (!string.IsNullOrEmpty(beamType))
            query = query.Where(b => b.BeamType == beamType);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(b => b.Status == status);

        if (!string.IsNullOrEmpty(paging.Search))
        {
            var search = paging.Search.ToLower();
            query = query.Where(b => b.BeamNo.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderBy(b => b.BeamNo)
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(b => MapToDto(b))
            .ToListAsync();

        return new PagedResult<BeamDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        };
    }

    public async Task<BeamDto?> GetByIdAsync(int id)
    {
        var beam = await _context.Beams.FindAsync(id);
        return beam == null ? null : MapToDto(beam);
    }

    public async Task<BeamDto> CreateAsync(CreateBeamRequest request, string createdBy)
    {
        if (await _context.Beams.AnyAsync(b => b.BeamNo == request.BeamNo))
            throw new InvalidOperationException($"Beam number '{request.BeamNo}' already exists");

        var beam = new Beam
        {
            BeamNo = request.BeamNo,
            BeamType = request.BeamType,
            TareWeight = request.TareWeight,
            WidthInches = request.WidthInches,
            MaxEnds = request.MaxEnds,
            Status = "Available",
            CreatedBy = createdBy
        };

        _context.Beams.Add(beam);
        await _context.SaveChangesAsync();

        return MapToDto(beam);
    }

    public async Task<BeamDto?> UpdateAsync(int id, CreateBeamRequest request, string modifiedBy)
    {
        var beam = await _context.Beams.FindAsync(id);
        if (beam == null) return null;

        if (await _context.Beams.AnyAsync(b => b.BeamNo == request.BeamNo && b.Id != id))
            throw new InvalidOperationException($"Beam number '{request.BeamNo}' already exists");

        beam.BeamNo = request.BeamNo;
        beam.BeamType = request.BeamType;
        beam.TareWeight = request.TareWeight;
        beam.WidthInches = request.WidthInches;
        beam.MaxEnds = request.MaxEnds;
        beam.ModifiedBy = modifiedBy;
        beam.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(beam);
    }

    public async Task<bool> DeleteAsync(int id, string modifiedBy)
    {
        var beam = await _context.Beams.FindAsync(id);
        if (beam == null) return false;

        if (beam.Status == "InUse")
            throw new InvalidOperationException("Cannot delete a beam that is currently in use");

        beam.IsActive = false;
        beam.ModifiedBy = modifiedBy;
        beam.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<BeamDto>> GetAvailableBeamsAsync(string beamType)
    {
        return await _context.Beams
            .Where(b => b.BeamType == beamType && b.Status == "Available" && b.IsActive)
            .OrderBy(b => b.BeamNo)
            .Select(b => MapToDto(b))
            .ToListAsync();
    }

    public async Task<bool> UpdateStatusAsync(int id, string status, int? jobCardId, string? jobCardType, string modifiedBy)
    {
        var beam = await _context.Beams.FindAsync(id);
        if (beam == null) return false;

        beam.Status = status;
        beam.CurrentJobCardId = jobCardId;
        beam.CurrentJobCardType = jobCardType;
        beam.ModifiedBy = modifiedBy;
        beam.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    private static BeamDto MapToDto(Beam beam)
    {
        return new BeamDto
        {
            Id = beam.Id,
            BeamNo = beam.BeamNo,
            BeamType = beam.BeamType,
            TareWeight = beam.TareWeight,
            WidthInches = beam.WidthInches,
            MaxEnds = beam.MaxEnds,
            Status = beam.Status,
            CurrentJobCardId = beam.CurrentJobCardId,
            CurrentJobCardType = beam.CurrentJobCardType,
            IsActive = beam.IsActive
        };
    }
}
