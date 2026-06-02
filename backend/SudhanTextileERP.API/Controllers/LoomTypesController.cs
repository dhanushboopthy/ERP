using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Services;
using System.Security.Claims;

namespace SudhanTextileERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LoomTypesController : ControllerBase
{
    private readonly LoomTypeService _service;

    public LoomTypesController(LoomTypeService service)
    {
        _service = service;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    /// <summary>
    /// Get all loom types with pagination
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<LoomTypeDto>>>> GetAll([FromQuery] PaginationParams pagination)
    {
        var result = await _service.GetAllAsync(pagination);
        return Ok(ApiResponse<PagedResult<LoomTypeDto>>.Ok(result));
    }

    /// <summary>
    /// Get active loom types for dropdowns
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<List<LoomTypeDto>>>> GetActive()
    {
        var result = await _service.GetActiveAsync();
        return Ok(ApiResponse<List<LoomTypeDto>>.Ok(result));
    }

    /// <summary>
    /// Get loom type by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<LoomTypeDto>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(ApiResponse<LoomTypeDto>.Fail("Loom type not found"));
        }
        return Ok(ApiResponse<LoomTypeDto>.Ok(result));
    }

    /// <summary>
    /// Create a new loom type
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<LoomTypeDto>>> Create([FromBody] CreateLoomTypeRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<LoomTypeDto>.Ok(result, "Loom type created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<LoomTypeDto>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Update an existing loom type
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<LoomTypeDto>>> Update(int id, [FromBody] UpdateLoomTypeRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(id, request, GetUserId());
            return Ok(ApiResponse<LoomTypeDto>.Ok(result, "Loom type updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<LoomTypeDto>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Delete a loom type (soft delete)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        try
        {
            var result = await _service.DeleteAsync(id, GetUserId());
            if (!result)
            {
                return NotFound(ApiResponse<bool>.Fail("Loom type not found"));
            }
            return Ok(ApiResponse<bool>.Ok(true, "Loom type deleted successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<bool>.Fail(ex.Message));
        }
    }
}
