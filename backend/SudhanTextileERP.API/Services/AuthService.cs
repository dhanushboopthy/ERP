using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SudhanTextileERP.API.Configuration;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace SudhanTextileERP.API.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<LoginResponse?> RefreshTokenAsync(string refreshToken);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<UserDto?> GetCurrentUserAsync(int userId);
    Task<bool> RequiresPasswordChangeAsync(int userId);
}

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(ApplicationDbContext context, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        // ═══════════════════════════════════════════════════════════════════════════
        // SECURITY: NO HARDCODED CREDENTIALS - Database authentication ONLY
        // ═══════════════════════════════════════════════════════════════════════════
        
        try
        {
            var normalizedUsername = request.Username?.Trim().ToLower() ?? string.Empty;

            var user = await _context.Users
                .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .ThenInclude(p => p.Module)
                .FirstOrDefaultAsync(u =>
                    u.IsActive &&
                    (u.Username.ToLower() == normalizedUsername || u.Email.ToLower() == normalizedUsername));

            if (user == null)
            {
                _logger.LogWarning("Login failed: User '{Username}' not found or inactive", request.Username);
                return null;
            }

            if (user.IsLocked)
            {
                _logger.LogWarning("Login failed: User '{Username}' is locked", request.Username);
                return null;
            }

            // Verify password hash - NO PLAINTEXT COMPARISON EVER
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                user.FailedLoginAttempts++;
                var maxAttempts = _configuration.GetValue<int>("Security:MaxLoginAttempts", 5);
                
                if (user.FailedLoginAttempts >= maxAttempts)
                {
                    user.IsLocked = true;
                    user.LockoutEndTime = DateTime.UtcNow.AddMinutes(
                        _configuration.GetValue<int>("Security:LockoutDurationMinutes", 30));
                    _logger.LogWarning("User '{Username}' locked after {Attempts} failed attempts", 
                        request.Username, user.FailedLoginAttempts);
                }
                
                await _context.SaveChangesAsync();
                return null;
            }

            // Reset failed attempts on successful login
            user.FailedLoginAttempts = 0;
            user.LastLoginDate = DateTime.UtcNow;
            user.LockoutEndTime = null;

            // Generate tokens
            var token = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

            await _context.SaveChangesAsync();
            
            _logger.LogInformation("User '{Username}' logged in successfully", request.Username);

            return new LoginResponse
            {
                Token = token,
                RefreshToken = refreshToken,
                Expiry = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "120")),
                User = MapToUserDto(user),
                RequiresPasswordChange = user.MustChangePassword
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login error for user '{Username}'", request.Username);
            return null;
        }
    }

    /// <summary>
    /// Checks if user must change password (first login or admin reset)
    /// </summary>
    public async Task<bool> RequiresPasswordChangeAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user?.MustChangePassword ?? false;
    }

    public async Task<LoginResponse?> RefreshTokenAsync(string refreshToken)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .ThenInclude(p => p.Module)
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && u.RefreshTokenExpiry > DateTime.UtcNow && u.IsActive);

        if (user == null)
            return null;

        var token = GenerateJwtToken(user);
        var newRefreshToken = GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

        await _context.SaveChangesAsync();

        return new LoginResponse
        {
            Token = token,
            RefreshToken = newRefreshToken,
            Expiry = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "480")),
            User = MapToUserDto(user)
        };
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return false;

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<UserDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .ThenInclude(r => r.RolePermissions)
            .ThenInclude(rp => rp.Permission)
            .ThenInclude(p => p.Module)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        return user == null ? null : MapToUserDto(user);
    }

    private string GenerateJwtToken(User user)
    {
        // Get JWT secret from secure configuration (environment variable preferred)
        var jwtSecret = Configuration.SecureConfigurationLoader.GetJwtSecretKey(_configuration);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Get permissions from role
        var permissions = GetUserPermissions(user);
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.RoleName),
            new Claim("fullName", user.FullName),
            new Claim("roleId", user.RoleId.ToString())
        };
        
        // Add each permission as a claim
        foreach (var permission in permissions)
        {
            claims.Add(new Claim("permissions", permission));
        }

        var expiryMinutes = int.Parse(_configuration["JwtSettings:ExpiryMinutes"] ?? "120");
        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }
    
    private List<string> GetUserPermissions(User user)
    {
        // Admin role gets all permissions
        if (user.Role.RoleName.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
            user.Role.RoleName.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase))
        {
            return new List<string> { "All" };
        }
        
        // Try to get from RolePermissions first
        if (user.Role.RolePermissions?.Any() == true)
        {
            return user.Role.RolePermissions
                .Where(rp => rp.IsGranted)
                .Select(rp => rp.Permission.PermissionCode)
                .ToList();
        }
        
        // Fallback to JSON permissions
        try
        {
            return JsonSerializer.Deserialize<List<string>>(user.Role.Permissions) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private static UserDto MapToUserDto(User user)
    {
        var permissions = new List<string>();
        var modulePermissions = new List<ModulePermissionDto>();
        
        // Admin/SuperAdmin gets all permissions
        var isAdmin = user.Role.RoleName.Equals("Admin", StringComparison.OrdinalIgnoreCase) ||
                      user.Role.RoleName.Equals("SuperAdmin", StringComparison.OrdinalIgnoreCase);
        
        if (isAdmin)
        {
            // Return the wildcard permission for admin - frontend will interpret this as full access
            permissions = new List<string> { "All", "*" };
        }
        else if (user.Role.RolePermissions?.Any() == true)
        {
            // Get flat permission codes for quick permission checks
            permissions = user.Role.RolePermissions
                .Where(rp => rp.IsGranted && rp.Permission != null)
                .Select(rp => rp.Permission.PermissionCode)
                .ToList();
            
            // Group by module for structured permissions (for sidebar/UI rendering)
            modulePermissions = user.Role.RolePermissions
                .Where(rp => rp.IsGranted && rp.Permission?.Module != null)
                .GroupBy(rp => rp.Permission.ModuleKey)
                .Select(g => new ModulePermissionDto
                {
                    ModuleKey = g.Key ?? "",
                    ModuleName = g.First().Permission.Module?.ModuleName ?? "",
                    ParentModule = g.First().Permission.Module?.ParentModule ?? "",
                    RoutePath = g.First().Permission.Module?.RoutePath ?? "",
                    Icon = g.First().Permission.Module?.Icon ?? "",
                    SortOrder = g.First().Permission.Module?.SortOrder ?? 0,
                    Actions = g.Select(rp => new PermissionActionDto
                    {
                        PermissionId = rp.PermissionId,
                        PermissionCode = rp.Permission.PermissionCode,
                        Action = rp.Permission.Action ?? "",
                        IsGranted = rp.IsGranted
                    }).ToList()
                })
                .OrderBy(mp => mp.ParentModule)
                .ThenBy(mp => mp.SortOrder)
                .ToList();
        }
        else
        {
            // Fallback to JSON permissions (legacy)
            try
            {
                permissions = JsonSerializer.Deserialize<List<string>>(user.Role.Permissions) ?? new List<string>();
            }
            catch { }
        }

        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            RoleName = user.Role.RoleName,
            RoleId = user.RoleId,
            Permissions = permissions,
            ModulePermissions = modulePermissions
        };
    }
}
