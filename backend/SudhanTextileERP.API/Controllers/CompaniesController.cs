using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Services;
using System.Security.Claims;

namespace SudhanTextileERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CompaniesController : ControllerBase
{
    private readonly CompanyService _service;

    public CompaniesController(CompanyService service)
    {
        _service = service;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    /// <summary>
    /// Get all companies
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CompanyDto>>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(ApiResponse<List<CompanyDto>>.Ok(result));
    }

    /// <summary>
    /// Get the current (main) company
    /// </summary>
    [HttpGet("current")]
    public async Task<ActionResult<ApiResponse<CompanyDto>>> GetCurrent()
    {
        var result = await _service.GetCurrentAsync();
        if (result == null)
        {
            return NotFound(ApiResponse<CompanyDto>.Fail("No company found. Please set up company details."));
        }
        return Ok(ApiResponse<CompanyDto>.Ok(result));
    }

    /// <summary>
    /// Get company by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CompanyDto>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(ApiResponse<CompanyDto>.Fail("Company not found"));
        }
        return Ok(ApiResponse<CompanyDto>.Ok(result));
    }

    /// <summary>
    /// Create a new company
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CompanyDto>>> Create([FromBody] CreateCompanyRequest request)
    {
        try
        {
            var result = await _service.CreateAsync(request, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<CompanyDto>.Ok(result, "Company created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<CompanyDto>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Update an existing company
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<CompanyDto>>> Update(int id, [FromBody] UpdateCompanyRequest request)
    {
        try
        {
            var result = await _service.UpdateAsync(id, request, GetUserId());
            return Ok(ApiResponse<CompanyDto>.Ok(result, "Company updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<CompanyDto>.Fail(ex.Message));
        }
    }

    /// <summary>
    /// Upload company logo
    /// </summary>
    [HttpPost("{id}/logo")]
    public async Task<ActionResult<ApiResponse<bool>>> UploadLogo(int id, IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<bool>.Fail("No file uploaded"));
        }

        if (file.Length > 2 * 1024 * 1024) // 2MB limit
        {
            return BadRequest(ApiResponse<bool>.Fail("File size exceeds 2MB limit"));
        }

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif" };
        if (!allowedTypes.Contains(file.ContentType))
        {
            return BadRequest(ApiResponse<bool>.Fail("Only JPEG, PNG, or GIF images are allowed"));
        }

        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var logoBytes = ms.ToArray();

        var result = await _service.UpdateLogoAsync(id, logoBytes, GetUserId());
        if (!result)
        {
            return NotFound(ApiResponse<bool>.Fail("Company not found"));
        }

        return Ok(ApiResponse<bool>.Ok(true, "Logo updated successfully"));
    }

    /// <summary>
    /// Get company logo
    /// </summary>
    [HttpGet("{id}/logo")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLogo(int id)
    {
        var logo = await _service.GetLogoAsync(id);
        if (logo == null || logo.Length == 0)
        {
            return NotFound();
        }

        return File(logo, "image/png");
    }
}
