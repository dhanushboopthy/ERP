using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Services;

namespace SudhanTextileERP.API.Controllers;

// This controller exposes legacy route shapes expected by the frontend
// (e.g., /api/financialyears, /api/documentseries) while reusing existing services.
[ApiController]
[Route("api")]
[Authorize]
public class LegacyRoutesController : ControllerBase
{
    private readonly SettingsService _settingsService;
    private readonly ISizingJobCardService _sizingJobCardService;

    public LegacyRoutesController(SettingsService settingsService, ISizingJobCardService sizingJobCardService)
    {
        _settingsService = settingsService;
        _sizingJobCardService = sizingJobCardService;
    }

    // GET /api/financialyears
    [HttpGet("financialyears")]
    public async Task<ActionResult<List<FinancialYearDto>>> GetFinancialYears()
    {
        var years = await _settingsService.GetFinancialYearsAsync();
        return Ok(years);
    }

    // GET /api/documentseries
    [HttpGet("documentseries")]
    public async Task<ActionResult<List<DocumentNumberSettingDto>>> GetDocumentSeries()
    {
        var result = await _settingsService.GetDocumentNumberSettingsAsync(null);
        return Ok(result);
    }

    // GET /api/sizing-job-cards (legacy hyphenated route)
    [HttpGet("sizing-job-cards")]
    public async Task<ActionResult<ApiResponse<PagedResult<SizingJobCardListDto>>>> GetSizingJobCards(
        [FromQuery] PaginationParams paging,
        [FromQuery] int? partyId = null,
        [FromQuery] string? status = null)
    {
        var result = await _sizingJobCardService.GetAllAsync(paging, partyId, status);
        return Ok(ApiResponse<PagedResult<SizingJobCardListDto>>.Ok(result));
    }
}
