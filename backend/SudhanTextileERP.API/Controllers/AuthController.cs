using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Services;

namespace SudhanTextileERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Authenticate user and get JWT token.
    /// Rate limited to 5 attempts per minute per IP.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]  // SECURITY: Rate limit login attempts
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        _logger.LogInformation("Login attempt for user '{Username}' from IP {IP}", request.Username, clientIp);
        
        var result = await _authService.LoginAsync(request);
        
        if (result == null)
        {
            _logger.LogWarning("Login failed for user '{Username}' from IP {IP}", request.Username, clientIp);
            return Unauthorized(ApiResponse<LoginResponse>.Fail("Invalid username or password"));
        }

        _logger.LogInformation("Login successful for user '{Username}'", request.Username);
        
        // Check if password change is required
        if (result.RequiresPasswordChange)
        {
            return Ok(ApiResponse<LoginResponse>.Ok(result, "Login successful. Password change required."));
        }

        return Ok(ApiResponse<LoginResponse>.Ok(result, "Login successful"));
    }

    /// <summary>
    /// Refresh JWT token using refresh token.
    /// Rate limited to 5 attempts per minute per IP.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [EnableRateLimiting("auth")]  // SECURITY: Rate limit refresh attempts
    public async Task<ActionResult<ApiResponse<LoginResponse>>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var result = await _authService.RefreshTokenAsync(request.RefreshToken);
        
        if (result == null)
            return Unauthorized(ApiResponse<LoginResponse>.Fail("Invalid or expired refresh token"));

        return Ok(ApiResponse<LoginResponse>.Ok(result, "Token refreshed successfully"));
    }

    /// <summary>
    /// Change current user's password.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetCurrentUserId();
        var result = await _authService.ChangePasswordAsync(userId, request);
        
        if (!result)
            return BadRequest(ApiResponse<bool>.Fail("Current password is incorrect or new password doesn't meet requirements"));

        _logger.LogInformation("Password changed successfully for user ID {UserId}", userId);
        return Ok(ApiResponse<bool>.Ok(true, "Password changed successfully"));
    }

    /// <summary>
    /// Get current authenticated user's information.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        var user = await _authService.GetCurrentUserAsync(userId);
        
        if (user == null)
            return NotFound(ApiResponse<UserDto>.Fail("User not found"));

        return Ok(ApiResponse<UserDto>.Ok(user));
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return int.Parse(claim?.Value ?? "0");
    }
}
