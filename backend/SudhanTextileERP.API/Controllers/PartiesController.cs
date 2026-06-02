using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Services;
using System.Security.Claims;

namespace SudhanTextileERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PartiesController : ControllerBase
{
    private readonly IPartyService _partyService;

    public PartiesController(IPartyService partyService)
    {
        _partyService = partyService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<PartyDto>>>> GetAll(
        [FromQuery] PaginationParams paging,
        [FromQuery] string? partyType = null)
    {
        var result = await _partyService.GetAllAsync(paging, partyType);
        return Ok(ApiResponse<PagedResult<PartyDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<PartyDto>>> GetById(int id)
    {
        var result = await _partyService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<PartyDto>.Fail("Party not found"));

        return Ok(ApiResponse<PartyDto>.Ok(result));
    }

    [HttpGet("lookup")]
    public async Task<ActionResult<ApiResponse<List<PartyDto>>>> GetLookup([FromQuery] string? partyType = null)
    {
        var result = await _partyService.GetLookupAsync(partyType);
        return Ok(ApiResponse<List<PartyDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<PartyDto>>> Create([FromBody] CreatePartyRequest request)
    {
        var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _partyService.CreateAsync(request, createdBy);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<PartyDto>.Ok(result, "Party created successfully"));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<PartyDto>>> Update(int id, [FromBody] UpdatePartyRequest request)
    {
        if (id != request.Id)
            return BadRequest(ApiResponse<PartyDto>.Fail("ID mismatch"));

        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _partyService.UpdateAsync(id, request, modifiedBy);
        
        if (result == null)
            return NotFound(ApiResponse<PartyDto>.Fail("Party not found"));

        return Ok(ApiResponse<PartyDto>.Ok(result, "Party updated successfully"));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _partyService.DeleteAsync(id, modifiedBy);
        
        if (!result)
            return NotFound(ApiResponse<bool>.Fail("Party not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Party deleted successfully"));
    }
}
