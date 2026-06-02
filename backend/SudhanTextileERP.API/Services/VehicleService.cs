using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public interface IVehicleService
{
    Task<List<VehicleDto>> GetAllAsync();
    Task<VehicleDto?> GetByIdAsync(int id);
    Task<VehicleDto> CreateAsync(CreateVehicleRequest request, string createdBy);
    Task<VehicleDto?> UpdateAsync(int id, CreateVehicleRequest request, string modifiedBy);
    Task<bool> DeleteAsync(int id, string modifiedBy);
}

public class VehicleService : IVehicleService
{
    private readonly ApplicationDbContext _context;

    public VehicleService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<VehicleDto>> GetAllAsync()
    {
        return await _context.Vehicles
            .Where(v => v.IsActive)
            .OrderBy(v => v.VehicleNo)
            .Select(v => new VehicleDto
            {
                Id = v.Id,
                VehicleNo = v.VehicleNo,
                VehicleType = v.VehicleType,
                DriverName = v.DriverName,
                DriverPhone = v.DriverPhone,
                OwnerName = v.OwnerName,
                IsActive = v.IsActive
            })
            .ToListAsync();
    }

    public async Task<VehicleDto?> GetByIdAsync(int id)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null) return null;

        return new VehicleDto
        {
            Id = vehicle.Id,
            VehicleNo = vehicle.VehicleNo,
            VehicleType = vehicle.VehicleType,
            DriverName = vehicle.DriverName,
            DriverPhone = vehicle.DriverPhone,
            OwnerName = vehicle.OwnerName,
            IsActive = vehicle.IsActive
        };
    }

    public async Task<VehicleDto> CreateAsync(CreateVehicleRequest request, string createdBy)
    {
        if (await _context.Vehicles.AnyAsync(v => v.VehicleNo == request.VehicleNo))
            throw new InvalidOperationException($"Vehicle '{request.VehicleNo}' already exists");

        var vehicle = new Vehicle
        {
            VehicleNo = request.VehicleNo.ToUpper(),
            VehicleType = request.VehicleType,
            DriverName = request.DriverName,
            DriverPhone = request.DriverPhone,
            OwnerName = request.OwnerName,
            CreatedBy = createdBy
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        return new VehicleDto
        {
            Id = vehicle.Id,
            VehicleNo = vehicle.VehicleNo,
            VehicleType = vehicle.VehicleType,
            DriverName = vehicle.DriverName,
            DriverPhone = vehicle.DriverPhone,
            OwnerName = vehicle.OwnerName,
            IsActive = vehicle.IsActive
        };
    }

    public async Task<VehicleDto?> UpdateAsync(int id, CreateVehicleRequest request, string modifiedBy)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null) return null;

        if (await _context.Vehicles.AnyAsync(v => v.VehicleNo == request.VehicleNo && v.Id != id))
            throw new InvalidOperationException($"Vehicle '{request.VehicleNo}' already exists");

        vehicle.VehicleNo = request.VehicleNo.ToUpper();
        vehicle.VehicleType = request.VehicleType;
        vehicle.DriverName = request.DriverName;
        vehicle.DriverPhone = request.DriverPhone;
        vehicle.OwnerName = request.OwnerName;
        vehicle.ModifiedBy = modifiedBy;
        vehicle.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new VehicleDto
        {
            Id = vehicle.Id,
            VehicleNo = vehicle.VehicleNo,
            VehicleType = vehicle.VehicleType,
            DriverName = vehicle.DriverName,
            DriverPhone = vehicle.DriverPhone,
            OwnerName = vehicle.OwnerName,
            IsActive = vehicle.IsActive
        };
    }

    public async Task<bool> DeleteAsync(int id, string modifiedBy)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null) return false;

        vehicle.IsActive = false;
        vehicle.ModifiedBy = modifiedBy;
        vehicle.ModifiedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }
}
