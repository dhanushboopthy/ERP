using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Services;
using System.Security.Claims;

namespace SudhanTextileERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BabyConesController : ControllerBase
{
    private readonly IBabyConeService _babyConeService;

    public BabyConesController(IBabyConeService babyConeService)
    {
        _babyConeService = babyConeService;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetAll(
        [FromQuery] PaginationParams paging,
        [FromQuery] int? partyId = null,
        [FromQuery] int? yarnReceiptId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            var result = await _babyConeService.GetAllAsync(paging, partyId, yarnReceiptId, fromDate, toDate);
            var summary = await _babyConeService.GetSummaryAsync();

            var response = new
            {
                success = true,
                data = result.Items,
                summary = new
                {
                    total_baby_cones = summary.TotalBabyCones,
                    available_for_warping = summary.AvailableForWarping,
                    total_weight = summary.TotalWeight
                }
            };

            return Ok(response);
        }
        catch (Exception)
        {
            var response = new
            {
                success = true,
                data = new List<BabyConeListDto>(),
                summary = new
                {
                    total_baby_cones = 0,
                    available_for_warping = 0,
                    total_weight = 0
                }
            };

            return Ok(response);
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<BabyConeDto>>> GetById(int id)
    {
        var result = await _babyConeService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<BabyConeDto>.Fail("Baby cone not found"));

        return Ok(ApiResponse<BabyConeDto>.Ok(result));
    }

    [HttpGet("available-for-warping")]
    public async Task<ActionResult<ApiResponse<List<BabyConeDto>>>> GetAvailableForWarping(
        [FromQuery] int yarnCountId,
        [FromQuery] string? lotNo = null)
    {
        var result = await _babyConeService.GetAvailableForWarpingAsync(yarnCountId, lotNo);
        return Ok(ApiResponse<List<BabyConeDto>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<BabyConeDto>>> Create([FromBody] CreateBabyConeRequest request)
    {
        var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        try
        {
            var result = await _babyConeService.CreateAsync(request, createdBy);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<BabyConeDto>.Ok(result, "Baby cone created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<BabyConeDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<BabyConeDto>>> Update(int id, [FromBody] UpdateBabyConeRequest request)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        try
        {
            var result = await _babyConeService.UpdateAsync(id, request, modifiedBy);
            if (result == null)
                return NotFound(ApiResponse<BabyConeDto>.Fail("Baby cone not found"));

            return Ok(ApiResponse<BabyConeDto>.Ok(result, "Baby cone updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<BabyConeDto>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        try
        {
            var result = await _babyConeService.DeleteAsync(id, modifiedBy);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("Baby cone not found"));

            return Ok(ApiResponse<bool>.Ok(true, "Baby cone deleted successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<bool>.Fail(ex.Message));
        }
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class YarnReturnsController : ControllerBase
{
    private readonly IYarnReturnService _yarnReturnService;

    public YarnReturnsController(IYarnReturnService yarnReturnService)
    {
        _yarnReturnService = yarnReturnService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<YarnReturnListDto>>>> GetAll(
        [FromQuery] PaginationParams paging,
        [FromQuery] int? partyId = null,
        [FromQuery] string? returnType = null,
        [FromQuery] string? status = null)
    {
        var result = await _yarnReturnService.GetAllAsync(paging, partyId, returnType, status);
        return Ok(ApiResponse<PagedResult<YarnReturnListDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<YarnReturnDto>>> GetById(int id)
    {
        var result = await _yarnReturnService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<YarnReturnDto>.Fail("Yarn return not found"));

        return Ok(ApiResponse<YarnReturnDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<YarnReturnDto>>> Create([FromBody] CreateYarnReturnRequest request)
    {
        var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        var result = await _yarnReturnService.CreateAsync(request, createdBy);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<YarnReturnDto>.Ok(result, "Yarn return DC created successfully"));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<YarnReturnDto>>> Update(int id, [FromBody] UpdateYarnReturnRequest request)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        try
        {
            var result = await _yarnReturnService.UpdateAsync(id, request, modifiedBy);
            if (result == null)
                return NotFound(ApiResponse<YarnReturnDto>.Fail("Yarn return not found"));

            return Ok(ApiResponse<YarnReturnDto>.Ok(result, "Yarn return updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<YarnReturnDto>.Fail(ex.Message));
        }
    }

    [HttpPost("{id}/approve")]
    [Authorize(Policy = "ManagerAccess")]
    public async Task<ActionResult<ApiResponse<YarnReturnDto>>> Approve(int id)
    {
        var approvedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        try
        {
            var result = await _yarnReturnService.ApproveAsync(id, approvedBy);
            if (result == null)
                return NotFound(ApiResponse<YarnReturnDto>.Fail("Yarn return not found"));

            return Ok(ApiResponse<YarnReturnDto>.Ok(result, "Yarn return approved successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<YarnReturnDto>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        try
        {
            var result = await _yarnReturnService.DeleteAsync(id, modifiedBy);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("Yarn return not found"));

            return Ok(ApiResponse<bool>.Ok(true, "Yarn return deleted successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<bool>.Fail(ex.Message));
        }
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class YarnDeliveriesController : ControllerBase
{
    private readonly IYarnDeliveryService _yarnDeliveryService;

    public YarnDeliveriesController(IYarnDeliveryService yarnDeliveryService)
    {
        _yarnDeliveryService = yarnDeliveryService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<YarnDeliveryListDto>>>> GetAll(
        [FromQuery] PaginationParams paging,
        [FromQuery] int? partyId = null,
        [FromQuery] string? status = null)
    {
        var result = await _yarnDeliveryService.GetAllAsync(paging, partyId, status);
        return Ok(ApiResponse<PagedResult<YarnDeliveryListDto>>.Ok(result));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<YarnDeliveryDto>>> GetById(int id)
    {
        var result = await _yarnDeliveryService.GetByIdAsync(id);
        if (result == null)
            return NotFound(ApiResponse<YarnDeliveryDto>.Fail("Yarn delivery not found"));

        return Ok(ApiResponse<YarnDeliveryDto>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<YarnDeliveryDto>>> Create([FromBody] CreateYarnDeliveryRequest request)
    {
        var createdBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        try
        {
            var result = await _yarnDeliveryService.CreateAsync(request, createdBy);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<YarnDeliveryDto>.Ok(result, "Yarn delivery DC created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<YarnDeliveryDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<YarnDeliveryDto>>> Update(int id, [FromBody] UpdateYarnDeliveryRequest request)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        try
        {
            var result = await _yarnDeliveryService.UpdateAsync(id, request, modifiedBy);
            if (result == null)
                return NotFound(ApiResponse<YarnDeliveryDto>.Fail("Yarn delivery not found"));

            return Ok(ApiResponse<YarnDeliveryDto>.Ok(result, "Yarn delivery updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<YarnDeliveryDto>.Fail(ex.Message));
        }
    }

    [HttpPost("{id}/approve")]
    [Authorize(Policy = "ManagerAccess")]
    public async Task<ActionResult<ApiResponse<YarnDeliveryDto>>> Approve(int id)
    {
        var approvedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        try
        {
            var result = await _yarnDeliveryService.ApproveAsync(id, approvedBy);
            if (result == null)
                return NotFound(ApiResponse<YarnDeliveryDto>.Fail("Yarn delivery not found"));

            return Ok(ApiResponse<YarnDeliveryDto>.Ok(result, "Yarn delivery approved successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<YarnDeliveryDto>.Fail(ex.Message));
        }
    }

    [HttpPost("{id}/dispatch")]
    [Authorize(Policy = "OperatorAccess")]
    public async Task<ActionResult<ApiResponse<YarnDeliveryDto>>> Dispatch(int id, [FromBody] string? receiverSignature)
    {
        var dispatchedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        try
        {
            var result = await _yarnDeliveryService.DispatchAsync(id, dispatchedBy, receiverSignature);
            if (result == null)
                return NotFound(ApiResponse<YarnDeliveryDto>.Fail("Yarn delivery not found"));

            return Ok(ApiResponse<YarnDeliveryDto>.Ok(result, "Yarn delivery dispatched successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<YarnDeliveryDto>.Fail(ex.Message));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var modifiedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
        try
        {
            var result = await _yarnDeliveryService.DeleteAsync(id, modifiedBy);
            if (!result)
                return NotFound(ApiResponse<bool>.Fail("Yarn delivery not found"));

            return Ok(ApiResponse<bool>.Ok(true, "Yarn delivery deleted successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<bool>.Fail(ex.Message));
        }
    }
}
