using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IPartyService
{
    Task<PagedResult<PartyDto>> GetAllAsync(PaginationParams paging, string? partyType = null);
    Task<PartyDto?> GetByIdAsync(int id);
    Task<PartyDto> CreateAsync(CreatePartyRequest request, string createdBy);
    Task<PartyDto?> UpdateAsync(int id, UpdatePartyRequest request, string modifiedBy);
    Task<bool> DeleteAsync(int id, string modifiedBy);
    Task<List<PartyDto>> GetLookupAsync(string? partyType = null);
}

public class PartyService : IPartyService
{
    private readonly ApplicationDbContext _context;

    public PartyService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<PartyDto>> GetAllAsync(PaginationParams paging, string? partyType = null)
    {
        var query = _context.Parties.AsQueryable();

        if (!string.IsNullOrEmpty(partyType))
            query = query.Where(p => p.PartyType == partyType);

        if (!string.IsNullOrEmpty(paging.Search))
        {
            var search = paging.Search.ToLower();
            query = query.Where(p => 
                p.PartyCode.ToLower().Contains(search) ||
                p.PartyName.ToLower().Contains(search) ||
                (p.GSTIN != null && p.GSTIN.ToLower().Contains(search)) ||
                p.City.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync();

        query = paging.SortBy?.ToLower() switch
        {
            "partycode" => paging.SortDesc ? query.OrderByDescending(p => p.PartyCode) : query.OrderBy(p => p.PartyCode),
            "city" => paging.SortDesc ? query.OrderByDescending(p => p.City) : query.OrderBy(p => p.City),
            _ => paging.SortDesc ? query.OrderByDescending(p => p.PartyName) : query.OrderBy(p => p.PartyName)
        };

        var items = await query
            .Skip((paging.PageNumber - 1) * paging.PageSize)
            .Take(paging.PageSize)
            .Select(p => MapToDto(p))
            .ToListAsync();

        return new PagedResult<PartyDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paging.PageNumber,
            PageSize = paging.PageSize
        };
    }

    public async Task<PartyDto?> GetByIdAsync(int id)
    {
        var party = await _context.Parties.FindAsync(id);
        return party == null ? null : MapToDto(party);
    }

    public async Task<PartyDto> CreateAsync(CreatePartyRequest request, string createdBy)
    {
        // Check for duplicate code
        if (await _context.Parties.AnyAsync(p => p.PartyCode == request.PartyCode))
            throw new InvalidOperationException($"Party code '{request.PartyCode}' already exists");

        var party = new Party
        {
            PartyCode = request.PartyCode,
            PartyName = request.PartyName,
            PartyType = request.PartyType,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City = request.City,
            State = request.State,
            StateCode = request.StateCode,
            Pincode = request.Pincode,
            Phone = request.Phone,
            Mobile = request.Mobile,
            Email = request.Email,
            ContactPerson = request.ContactPerson,
            GSTIN = request.GSTIN,
            PAN = request.PAN,
            CreditDays = request.CreditDays,
            CreditLimit = request.CreditLimit,
            IsBillToBill = request.IsBillToBill,
            CreatedBy = createdBy
        };

        _context.Parties.Add(party);
        await _context.SaveChangesAsync();

        return MapToDto(party);
    }

    public async Task<PartyDto?> UpdateAsync(int id, UpdatePartyRequest request, string modifiedBy)
    {
        var party = await _context.Parties.FindAsync(id);
        if (party == null)
            return null;

        // Check for duplicate code
        if (await _context.Parties.AnyAsync(p => p.PartyCode == request.PartyCode && p.Id != id))
            throw new InvalidOperationException($"Party code '{request.PartyCode}' already exists");

        party.PartyCode = request.PartyCode;
        party.PartyName = request.PartyName;
        party.PartyType = request.PartyType;
        party.AddressLine1 = request.AddressLine1;
        party.AddressLine2 = request.AddressLine2;
        party.City = request.City;
        party.State = request.State;
        party.StateCode = request.StateCode;
        party.Pincode = request.Pincode;
        party.Phone = request.Phone;
        party.Mobile = request.Mobile;
        party.Email = request.Email;
        party.ContactPerson = request.ContactPerson;
        party.GSTIN = request.GSTIN;
        party.PAN = request.PAN;
        party.CreditDays = request.CreditDays;
        party.CreditLimit = request.CreditLimit;
        party.IsBillToBill = request.IsBillToBill;
        party.IsActive = request.IsActive;
        party.ModifiedBy = modifiedBy;
        party.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(party);
    }

    public async Task<bool> DeleteAsync(int id, string modifiedBy)
    {
        var party = await _context.Parties.FindAsync(id);
        if (party == null)
            return false;

        // Soft delete
        party.IsActive = false;
        party.ModifiedBy = modifiedBy;
        party.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<PartyDto>> GetLookupAsync(string? partyType = null)
    {
        var query = _context.Parties.Where(p => p.IsActive);

        if (!string.IsNullOrEmpty(partyType))
            query = query.Where(p => p.PartyType == partyType || p.PartyType == "Both");

        return await query
            .OrderBy(p => p.PartyName)
            .Select(p => MapToDto(p))
            .ToListAsync();
    }

    private static PartyDto MapToDto(Party party)
    {
        return new PartyDto
        {
            Id = party.Id,
            PartyCode = party.PartyCode,
            PartyName = party.PartyName,
            PartyType = party.PartyType,
            AddressLine1 = party.AddressLine1,
            AddressLine2 = party.AddressLine2,
            City = party.City,
            State = party.State,
            StateCode = party.StateCode,
            Pincode = party.Pincode,
            Phone = party.Phone,
            Mobile = party.Mobile,
            Email = party.Email,
            ContactPerson = party.ContactPerson,
            GSTIN = party.GSTIN,
            PAN = party.PAN,
            CreditDays = party.CreditDays,
            CreditLimit = party.CreditLimit,
            IsBillToBill = party.IsBillToBill,
            IsActive = party.IsActive
        };
    }
}
