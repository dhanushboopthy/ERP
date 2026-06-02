using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public class CompanyService
{
    private readonly ApplicationDbContext _context;
    private readonly AuditLogService _auditLogService;

    public CompanyService(ApplicationDbContext context, AuditLogService auditLogService)
    {
        _context = context;
        _auditLogService = auditLogService;
    }

    public async Task<CompanyDto?> GetCurrentAsync()
    {
        // Return the first (main) company - textile mills typically have one company
        return await _context.Companies
            .OrderBy(c => c.Id)
            .Select(c => new CompanyDto
            {
                Id = c.Id,
                CompanyName = c.CompanyName,
                ShortName = c.ShortName,
                AddressLine1 = c.AddressLine1,
                AddressLine2 = c.AddressLine2,
                City = c.City,
                State = c.State,
                StateCode = c.StateCode,
                Pincode = c.Pincode,
                Country = c.Country,
                Phone = c.Phone,
                Email = c.Email,
                Website = c.Website,
                GSTIN = c.GSTIN,
                PAN = c.PAN,
                BankName = c.BankName,
                BankBranch = c.BankBranch,
                BankAccountNo = c.BankAccountNo,
                BankIFSC = c.BankIFSC,
                IsActive = c.IsActive
            })
            .FirstOrDefaultAsync();
    }

    public async Task<CompanyDto?> GetByIdAsync(int id)
    {
        return await _context.Companies
            .Where(c => c.Id == id)
            .Select(c => new CompanyDto
            {
                Id = c.Id,
                CompanyName = c.CompanyName,
                ShortName = c.ShortName,
                AddressLine1 = c.AddressLine1,
                AddressLine2 = c.AddressLine2,
                City = c.City,
                State = c.State,
                StateCode = c.StateCode,
                Pincode = c.Pincode,
                Country = c.Country,
                Phone = c.Phone,
                Email = c.Email,
                Website = c.Website,
                GSTIN = c.GSTIN,
                PAN = c.PAN,
                BankName = c.BankName,
                BankBranch = c.BankBranch,
                BankAccountNo = c.BankAccountNo,
                BankIFSC = c.BankIFSC,
                IsActive = c.IsActive
            })
            .FirstOrDefaultAsync();
    }

    public async Task<List<CompanyDto>> GetAllAsync()
    {
        return await _context.Companies
            .OrderBy(c => c.CompanyName)
            .Select(c => new CompanyDto
            {
                Id = c.Id,
                CompanyName = c.CompanyName,
                ShortName = c.ShortName,
                AddressLine1 = c.AddressLine1,
                AddressLine2 = c.AddressLine2,
                City = c.City,
                State = c.State,
                StateCode = c.StateCode,
                Pincode = c.Pincode,
                Country = c.Country,
                Phone = c.Phone,
                Email = c.Email,
                Website = c.Website,
                GSTIN = c.GSTIN,
                PAN = c.PAN,
                BankName = c.BankName,
                BankBranch = c.BankBranch,
                BankAccountNo = c.BankAccountNo,
                BankIFSC = c.BankIFSC,
                IsActive = c.IsActive
            })
            .ToListAsync();
    }

    public async Task<CompanyDto> CreateAsync(CreateCompanyRequest request, int userId)
    {
        var entity = new Company
        {
            CompanyName = request.CompanyName,
            ShortName = request.ShortName,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City = request.City,
            State = request.State,
            StateCode = request.StateCode,
            Pincode = request.Pincode,
            Country = request.Country ?? "India",
            Phone = request.Phone,
            Email = request.Email,
            Website = request.Website,
            GSTIN = request.GSTIN,
            PAN = request.PAN,
            BankName = request.BankName,
            BankBranch = request.BankBranch,
            BankAccountNo = request.BankAccountNo,
            BankIFSC = request.BankIFSC,
            IsActive = true,
            CreatedBy = userId.ToString(),
            CreatedDate = DateTime.UtcNow
        };

        _context.Companies.Add(entity);
        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("Company", entity.Id, "Create", userId, null,
            System.Text.Json.JsonSerializer.Serialize(new { request.CompanyName, request.GSTIN }));

        return MapToDto(entity);
    }

    public async Task<CompanyDto> UpdateAsync(int id, UpdateCompanyRequest request, int userId)
    {
        var entity = await _context.Companies.FindAsync(id);
        if (entity == null)
        {
            throw new InvalidOperationException("Company not found.");
        }

        var oldValues = System.Text.Json.JsonSerializer.Serialize(new
        {
            entity.CompanyName,
            entity.GSTIN,
            entity.PAN
        });

        entity.CompanyName = request.CompanyName;
        entity.ShortName = request.ShortName;
        entity.AddressLine1 = request.AddressLine1;
        entity.AddressLine2 = request.AddressLine2;
        entity.City = request.City;
        entity.State = request.State;
        entity.StateCode = request.StateCode;
        entity.Pincode = request.Pincode;
        entity.Country = request.Country ?? "India";
        entity.Phone = request.Phone;
        entity.Email = request.Email;
        entity.Website = request.Website;
        entity.GSTIN = request.GSTIN;
        entity.PAN = request.PAN;
        entity.BankName = request.BankName;
        entity.BankBranch = request.BankBranch;
        entity.BankAccountNo = request.BankAccountNo;
        entity.BankIFSC = request.BankIFSC;
        entity.ModifiedBy = userId.ToString();
        entity.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("Company", entity.Id, "Update", userId, oldValues,
            System.Text.Json.JsonSerializer.Serialize(new { request.CompanyName, request.GSTIN }));

        return MapToDto(entity);
    }

    public async Task<bool> UpdateLogoAsync(int id, byte[] logo, int userId)
    {
        var entity = await _context.Companies.FindAsync(id);
        if (entity == null)
        {
            return false;
        }

        entity.Logo = logo;
        entity.ModifiedBy = userId.ToString();
        entity.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _auditLogService.LogAsync("Company", entity.Id, "UpdateLogo", userId, null, "Logo updated");

        return true;
    }

    public async Task<byte[]?> GetLogoAsync(int id)
    {
        var company = await _context.Companies.FindAsync(id);
        return company?.Logo;
    }

    private static CompanyDto MapToDto(Company c)
    {
        return new CompanyDto
        {
            Id = c.Id,
            CompanyName = c.CompanyName,
            ShortName = c.ShortName,
            AddressLine1 = c.AddressLine1,
            AddressLine2 = c.AddressLine2,
            City = c.City,
            State = c.State,
            StateCode = c.StateCode,
            Pincode = c.Pincode,
            Country = c.Country,
            Phone = c.Phone,
            Email = c.Email,
            Website = c.Website,
            GSTIN = c.GSTIN,
            PAN = c.PAN,
            BankName = c.BankName,
            BankBranch = c.BankBranch,
            BankAccountNo = c.BankAccountNo,
            BankIFSC = c.BankIFSC,
            IsActive = c.IsActive
        };
    }
}
