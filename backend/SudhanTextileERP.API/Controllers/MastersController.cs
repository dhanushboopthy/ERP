using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Services;
using System.Security.Claims;
using SudhanTextileERP.API.Authorization;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class YarnCountsController : ControllerBase
{
    private readonly IYarnCountService _yarnCountService;

    public YarnCountsController(IYarnCountService yarnCountService)
    {
        _yarnCountService = yarnCountService;
    }

    [HttpGet]
    [RequirePermission($"{ModuleKeys.YarnCount}.{PermissionActions.View}")]
    public async Task<ActionResult<ApiResponse<List<YarnCountDto>>>> GetAll()
    {
        var result = await _yarnCountService.GetAllAsync();
        return Ok(ApiResponse<List<YarnCountDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    [RequirePermission($"{ModuleKeys.YarnCount}.{PermissionActions.View}")]
    public async Task<ActionResult<ApiResponse<YarnCountDto>>> GetById(int id)
    {
        var result = await _yarnCountService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<YarnCountDto>.Fail("Yarn count not found"));

        return Ok(ApiResponse<YarnCountDto>.Ok(result));
    }

    [HttpPost]
    [RequirePermission($"{ModuleKeys.YarnCount}.{PermissionActions.Create}")]
    public async Task<ActionResult<ApiResponse<YarnCountDto>>> Create([FromBody] CreateYarnCountRequest request)
    {
        var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _yarnCountService.CreateAsync(request, createdBy);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<YarnCountDto>.Ok(result, "Yarn count created successfully"));
    }

    [HttpPut("{id}")]
    [RequirePermission($"{ModuleKeys.YarnCount}.{PermissionActions.Edit}")]
    public async Task<ActionResult<ApiResponse<YarnCountDto>>> Update(int id, [FromBody] CreateYarnCountRequest request)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _yarnCountService.UpdateAsync(id, request, modifiedBy);
        
        if (result == null)
            return NotFound(ApiResponse<YarnCountDto>.Fail("Yarn count not found"));

        return Ok(ApiResponse<YarnCountDto>.Ok(result, "Yarn count updated successfully"));
    }

    [HttpDelete("{id}")]
    [RequirePermission($"{ModuleKeys.YarnCount}.{PermissionActions.Delete}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _yarnCountService.DeleteAsync(id, modifiedBy);
        
        if (!result)
            return NotFound(ApiResponse<bool>.Fail("Yarn count not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Yarn count deleted successfully"));
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BeamsController : ControllerBase
{
    private readonly IBeamService _beamService;

    public BeamsController(IBeamService beamService)
    {
        _beamService = beamService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<BeamDto>>>> GetAll(
        [FromQuery] PaginationParams paging,
        [FromQuery] string? beamType = null,
        [FromQuery] string? status = null)
    {
        var result = await _beamService.GetAllAsync(paging, beamType, status);
        return Ok(ApiResponse<PagedResult<BeamDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<BeamDto>>> GetById(int id)
    {
        var result = await _beamService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<BeamDto>.Fail("Beam not found"));

        return Ok(ApiResponse<BeamDto>.Ok(result));
    }

    [HttpGet("available/{beamType}")]
    public async Task<ActionResult<ApiResponse<List<BeamDto>>>> GetAvailable(string beamType)
    {
        var result = await _beamService.GetAvailableBeamsAsync(beamType);
        return Ok(ApiResponse<List<BeamDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<BeamDto>>> Create([FromBody] CreateBeamRequest request)
    {
        var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _beamService.CreateAsync(request, createdBy);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<BeamDto>.Ok(result, "Beam created successfully"));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<BeamDto>>> Update(int id, [FromBody] CreateBeamRequest request)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _beamService.UpdateAsync(id, request, modifiedBy);
        
        if (result == null)
            return NotFound(ApiResponse<BeamDto>.Fail("Beam not found"));

        return Ok(ApiResponse<BeamDto>.Ok(result, "Beam updated successfully"));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _beamService.DeleteAsync(id, modifiedBy);
        
        if (!result)
            return NotFound(ApiResponse<bool>.Fail("Beam not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Beam deleted successfully"));
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleService _vehicleService;

    public VehiclesController(IVehicleService vehicleService)
    {
        _vehicleService = vehicleService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<VehicleDto>>>> GetAll()
    {
        var result = await _vehicleService.GetAllAsync();
        return Ok(ApiResponse<List<VehicleDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<VehicleDto>>> GetById(int id)
    {
        var result = await _vehicleService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<VehicleDto>.Fail("Vehicle not found"));

        return Ok(ApiResponse<VehicleDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<VehicleDto>>> Create([FromBody] CreateVehicleRequest request)
    {
        var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _vehicleService.CreateAsync(request, createdBy);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<VehicleDto>.Ok(result, "Vehicle created successfully"));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<VehicleDto>>> Update(int id, [FromBody] CreateVehicleRequest request)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _vehicleService.UpdateAsync(id, request, modifiedBy);
        
        if (result == null)
            return NotFound(ApiResponse<VehicleDto>.Fail("Vehicle not found"));

        return Ok(ApiResponse<VehicleDto>.Ok(result, "Vehicle updated successfully"));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _vehicleService.DeleteAsync(id, modifiedBy);
        
        if (!result)
            return NotFound(ApiResponse<bool>.Fail("Vehicle not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Vehicle deleted successfully"));
    }
}
