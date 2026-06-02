using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Services;
using System.Security.Claims;

namespace SudhanTextileERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class YarnReceiptsController : ControllerBase
{
    private readonly IYarnReceiptService _yarnReceiptService;

    public YarnReceiptsController(IYarnReceiptService yarnReceiptService)
    {
        _yarnReceiptService = yarnReceiptService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<YarnReceiptListDto>>>> GetAll(
        [FromQuery] PaginationParams paging,
        [FromQuery] int? partyId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var result = await _yarnReceiptService.GetAllAsync(paging, partyId, fromDate, toDate);
        return Ok(ApiResponse<PagedResult<YarnReceiptListDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<YarnReceiptDto>>> GetById(int id)
    {
        var result = await _yarnReceiptService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<YarnReceiptDto>.Fail("Yarn receipt not found"));

        return Ok(ApiResponse<YarnReceiptDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<YarnReceiptDto>>> Create([FromBody] CreateYarnReceiptRequest request)
    {
        var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _yarnReceiptService.CreateAsync(request, createdBy);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<YarnReceiptDto>.Ok(result, "Yarn receipt created successfully"));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<YarnReceiptDto>>> Update(int id, [FromBody] CreateYarnReceiptRequest request)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var isAdminOverride = User.IsInRole("SuperAdmin") || User.IsInRole("Admin");
        var result = await _yarnReceiptService.UpdateAsync(id, request, modifiedBy, isAdminOverride);
        
        if (result == null)
            return NotFound(ApiResponse<YarnReceiptDto>.Fail("Yarn receipt not found"));

        return Ok(ApiResponse<YarnReceiptDto>.Ok(result, "Yarn receipt updated successfully"));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _yarnReceiptService.DeleteAsync(id, modifiedBy);
        
        if (!result)
            return NotFound(ApiResponse<bool>.Fail("Yarn receipt not found"));

        return Ok(ApiResponse<bool>.Ok(true, "Yarn receipt deleted successfully"));
    }

    [HttpPost("{id}/approve")]
    [Authorize(Policy = "ManagerAccess")]
    public async Task<ActionResult<ApiResponse<YarnReceiptDto>>> Approve(int id)
    {
        var approvedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _yarnReceiptService.ApproveAsync(id, approvedBy);
        return Ok(ApiResponse<YarnReceiptDto>.Ok(result!, "Yarn receipt approved successfully. Stock updated."));
    }

    [HttpPost("sample")]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<CreateYarnReceiptRequest>>> GenerateSampleData()
    {
        try
        {
            var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
            var sampleData = await _yarnReceiptService.GenerateSampleDataAsync(createdBy);
            
            if (sampleData == null)
                return BadRequest(ApiResponse<CreateYarnReceiptRequest>.Fail(
                    "Unable to generate sample data. Please ensure Parties and Yarn Counts exist in the system."));
            
            return Ok(ApiResponse<CreateYarnReceiptRequest>.Ok(sampleData, "Sample data generated successfully"));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<CreateYarnReceiptRequest>.Fail(
                $"Failed to generate sample data: {ex.Message}"));
        }
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WarpingJobCardsController : ControllerBase
{
    private readonly IWarpingJobCardService _warpingService;

    public WarpingJobCardsController(IWarpingJobCardService warpingService)
    {
        _warpingService = warpingService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<WarpingJobCardListDto>>>> GetAll(
        [FromQuery] PaginationParams paging,
        [FromQuery] int? partyId = null,
        [FromQuery] string? status = null)
    {
        var result = await _warpingService.GetAllAsync(paging, partyId, status);
        return Ok(ApiResponse<PagedResult<WarpingJobCardListDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<WarpingJobCardDto>>> GetById(int id)
    {
        var result = await _warpingService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<WarpingJobCardDto>.Fail("Warping job card not found"));

        return Ok(ApiResponse<WarpingJobCardDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<WarpingJobCardDto>>> Create([FromBody] CreateWarpingJobCardRequest request)
    {
        var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _warpingService.CreateAsync(request, createdBy);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<WarpingJobCardDto>.Ok(result, "Warping job card created successfully"));
    }

    [HttpPost("{id}/complete")]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<WarpingJobCardDto>>> Complete(int id, [FromBody] decimal actualLength)
    {
        var completedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _warpingService.CompleteAsync(id, actualLength, completedBy);
        
        if (result == null)
            return NotFound(ApiResponse<WarpingJobCardDto>.Fail("Warping job card not found"));

        return Ok(ApiResponse<WarpingJobCardDto>.Ok(result, "Warping job card completed successfully"));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<WarpingJobCardDto>>> Update(int id, [FromBody] UpdateWarpingJobCardRequest request)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _warpingService.UpdateAsync(id, request, modifiedBy);
        
        if (result == null)
            return NotFound(ApiResponse<WarpingJobCardDto>.Fail("Warping job card not found or not editable"));

        return Ok(ApiResponse<WarpingJobCardDto>.Ok(result, "Warping job card updated successfully"));
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SizingJobCardsController : ControllerBase
{
    private readonly ISizingJobCardService _sizingService;

    public SizingJobCardsController(ISizingJobCardService sizingService)
    {
        _sizingService = sizingService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<SizingJobCardListDto>>>> GetAll(
        [FromQuery] PaginationParams paging,
        [FromQuery] int? partyId = null,
        [FromQuery] string? status = null)
    {
        var result = await _sizingService.GetAllAsync(paging, partyId, status);
        return Ok(ApiResponse<PagedResult<SizingJobCardListDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<SizingJobCardDto>>> GetById(int id)
    {
        var result = await _sizingService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<SizingJobCardDto>.Fail("Sizing job card not found"));

        return Ok(ApiResponse<SizingJobCardDto>.Ok(result));
    }

    [HttpGet("pending-invoice")]
    public async Task<ActionResult<ApiResponse<List<SizingJobCardDto>>>> GetPendingForInvoice([FromQuery] int? partyId = null)
    {
        var result = await _sizingService.GetPendingForInvoiceAsync(partyId);
        return Ok(ApiResponse<List<SizingJobCardDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<SizingJobCardDto>>> Create([FromBody] CreateSizingJobCardRequest request)
    {
        var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _sizingService.CreateAsync(request, createdBy);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<SizingJobCardDto>.Ok(result, "Sizing job card created successfully"));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<SizingJobCardDto>>> Update(int id, [FromBody] UpdateSizingJobCardRequest request)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _sizingService.UpdateAsync(id, request, modifiedBy);
        
        if (result == null)
            return NotFound(ApiResponse<SizingJobCardDto>.Fail("Sizing job card not found or not editable"));

        return Ok(ApiResponse<SizingJobCardDto>.Ok(result, "Sizing job card updated successfully"));
    }

    [HttpGet("production-set/{setId}")]
    public async Task<ActionResult<ApiResponse<ProductionSetDto>>> GetProductionSet(string setId)
    {
        var result = await _sizingService.GetProductionSetAsync(setId);
        if (result == null)
            return NotFound(ApiResponse<ProductionSetDto>.Fail("Production set not found"));

        return Ok(ApiResponse<ProductionSetDto>.Ok(result));
    }

    [HttpGet("production-sets")]
    public async Task<ActionResult<ApiResponse<List<ProductionSetDto>>>> GetAllProductionSets()
    {
        var result = await _sizingService.GetAllProductionSetsAsync();
        return Ok(ApiResponse<List<ProductionSetDto>>.Ok(result));
    }

    [HttpPost("{id}/complete")]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<SizingJobCardDto>>> Complete(int id, [FromBody] CompleteSizingJobCardRequest request)
    {
        var completedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _sizingService.CompleteAsync(id, request, completedBy);
        
        if (result == null)
            return NotFound(ApiResponse<SizingJobCardDto>.Fail("Sizing job card not found"));

        return Ok(ApiResponse<SizingJobCardDto>.Ok(result, "Sizing job card completed successfully"));
    }

    [HttpPost("{id}/approve")]
    [Authorize(Policy = "ManagerAccess")]
    public async Task<ActionResult<ApiResponse<SizingJobCardDto>>> Approve(int id, [FromBody] ApproveJobCardRequest request)
    {
        var approvedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _sizingService.ApproveAsync(id, request, approvedBy);
        
        if (result == null)
            return NotFound(ApiResponse<SizingJobCardDto>.Fail("Sizing job card not found"));

        return Ok(ApiResponse<SizingJobCardDto>.Ok(result, $"Sizing job card {request.ApprovalLevel}d successfully"));
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TaxInvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public TaxInvoicesController(IInvoiceService invoiceService)
    {
        _invoiceService = invoiceService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<TaxInvoiceListDto>>>> GetAll(
        [FromQuery] PaginationParams paging,
        [FromQuery] int? partyId = null,
        [FromQuery] string? status = null)
    {
        var result = await _invoiceService.GetAllAsync(paging, partyId, status);
        return Ok(ApiResponse<PagedResult<TaxInvoiceListDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<TaxInvoiceDto>>> GetById(int id)
    {
        var result = await _invoiceService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<TaxInvoiceDto>.Fail("Invoice not found"));

        return Ok(ApiResponse<TaxInvoiceDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<TaxInvoiceDto>>> Create([FromBody] CreateTaxInvoiceRequest request)
    {
        var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _invoiceService.CreateAsync(request, createdBy);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<TaxInvoiceDto>.Ok(result, "Invoice created successfully"));
    }

    [HttpPost("{id}/finalize")]
    [Authorize(Policy = "ManagerAccess")]
    public async Task<ActionResult<ApiResponse<TaxInvoiceDto>>> Finalize(int id)
    {
        var finalizedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _invoiceService.FinalizeAsync(id, finalizedBy);
        
        if (result == null)
            return NotFound(ApiResponse<TaxInvoiceDto>.Fail("Invoice not found"));

        return Ok(ApiResponse<TaxInvoiceDto>.Ok(result, "Invoice finalized successfully"));
    }

    [HttpPost("{id}/cancel")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<TaxInvoiceDto>>> Cancel(int id, [FromBody] string reason)
    {
        var cancelledBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _invoiceService.CancelAsync(id, cancelledBy, reason);
        
        if (result == null)
            return NotFound(ApiResponse<TaxInvoiceDto>.Fail("Invoice not found"));

        return Ok(ApiResponse<TaxInvoiceDto>.Ok(result, "Invoice cancelled successfully"));
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetStats([FromQuery] int? financialYearId = null)
    {
        var result = await _dashboardService.GetStatsAsync(financialYearId);
        return Ok(ApiResponse<DashboardStatsDto>.Ok(result));
    }

    /// <summary>
    /// Get comprehensive executive dashboard data with all KPIs
    /// </summary>
    [HttpGet("executive")]
    public async Task<ActionResult<ApiResponse<ExecutiveDashboardDto>>> GetExecutiveStats([FromQuery] int? financialYearId = null)
    {
        try
        {
            var result = await _dashboardService.GetExecutiveStatsAsync(financialYearId);
            return Ok(ApiResponse<ExecutiveDashboardDto>.Ok(result));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<ExecutiveDashboardDto>.Fail($"Error: {ex.Message} | Inner: {ex.InnerException?.Message}"));
        }
    }

    [HttpGet("yarn-stock")]
    public async Task<ActionResult<ApiResponse<List<YarnStockDto>>>> GetYarnStock(
        [FromQuery] int? partyId = null,
        [FromQuery] int? yarnCountId = null)
    {
        var result = await _dashboardService.GetYarnStockAsync(partyId, yarnCountId);
        return Ok(ApiResponse<List<YarnStockDto>>.Ok(result));
    }
}
