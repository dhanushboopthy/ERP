using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.Entities;
using SudhanTextileERP.API.Services;
using System.Security.Claims;

namespace SudhanTextileERP.API.Middleware
{
    /// <summary>
    /// Enhanced authentication service with security features
    /// </summary>
    public class SecureAuthenticationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SecureAuthenticationService> _logger;
        private readonly IAuditLogService _auditLogService;
        private readonly IMonitoringService _monitoringService;

        // Track failed login attempts
        private static readonly Dictionary<string, LoginAttemptTracker> _loginAttempts = new();
        private static readonly object _lockObject = new();

        public SecureAuthenticationService(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<SecureAuthenticationService> logger,
            IAuditLogService auditLogService,
            IMonitoringService monitoringService)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _auditLogService = auditLogService;
            _monitoringService = monitoringService;
        }

        public async Task<(bool Success, string? Token, string? Error, User? User)> AuthenticateAsync(
            string username, 
            string password, 
            string? ipAddress = null)
        {
            var maxAttempts = _configuration.GetValue<int>("Security:MaxLoginAttempts", 5);
            var lockoutMinutes = _configuration.GetValue<int>("Security:LockoutDurationMinutes", 30);

            // Check if account is locked out
            bool isLocked = false;
            lock (_lockObject)
            {
                if (_loginAttempts.TryGetValue(username.ToLower(), out var tracker))
                {
                    if (tracker.IsLockedOut(lockoutMinutes))
                    {
                        isLocked = true;
                    }
                }
            }

            if (isLocked)
            {
                _logger.LogWarning("Login attempt for locked account: {Username} from {IP}", username, ipAddress);
                
                await _monitoringService.RaiseAlertAsync(
                    "LockedAccountAccess",
                    $"Attempted login to locked account: {username}",
                    AlertSeverity.Warning);

                return (false, null, "Account is locked due to multiple failed login attempts. Please try again later.", null);
            }

            // Find user
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());

            if (user == null)
            {
                RecordFailedAttempt(username);
                await LogFailedLoginAsync(username, ipAddress, "User not found");
                return (false, null, "Invalid username or password", null);
            }

            // Verify password
            var passwordHasher = new PasswordHasher<User>();
            var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);

            if (result == PasswordVerificationResult.Failed)
            {
                RecordFailedAttempt(username);
                await LogFailedLoginAsync(username, ipAddress, "Invalid password");

                // Alert on multiple failed attempts
                var attemptCount = GetAttemptCount(username);
                if (attemptCount >= maxAttempts)
                {
                    await _monitoringService.RaiseAlertAsync(
                        "AccountLocked",
                        $"Account locked after {attemptCount} failed attempts: {username}",
                        AlertSeverity.Error);
                }

                return (false, null, "Invalid username or password", null);
            }

            // Check if user is active
            if (!user.IsActive)
            {
                await LogFailedLoginAsync(username, ipAddress, "Account inactive");
                return (false, null, "Account is inactive", null);
            }

            // Successful login - clear failed attempts
            ClearFailedAttempts(username);

            // Update last login
            user.LastLoginDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log successful login
            await _auditLogService.LogAsync(
                tableName: "User",
                recordId: user.Id,
                action: "Login",
                oldValues: null,
                newValues: new { username, ipAddress, timestamp = DateTime.UtcNow },
                changedBy: user.Username);

            _logger.LogInformation("Successful login: {Username} from {IP}", username, ipAddress);

            // Generate JWT token (would integrate with existing JWT service)
            var token = GenerateJwtToken(user);

            return (true, token, null, user);
        }

        private void RecordFailedAttempt(string username)
        {
            lock (_lockObject)
            {
                var key = username.ToLower();
                if (!_loginAttempts.ContainsKey(key))
                {
                    _loginAttempts[key] = new LoginAttemptTracker();
                }
                _loginAttempts[key].RecordFailure();
            }
        }

        private void ClearFailedAttempts(string username)
        {
            lock (_lockObject)
            {
                var key = username.ToLower();
                if (_loginAttempts.ContainsKey(key))
                {
                    _loginAttempts.Remove(key);
                }
            }
        }

        private int GetAttemptCount(string username)
        {
            lock (_lockObject)
            {
                var key = username.ToLower();
                return _loginAttempts.TryGetValue(key, out var tracker) ? tracker.FailedAttempts : 0;
            }
        }

        private async Task LogFailedLoginAsync(string username, string? ipAddress, string reason)
        {
            await _auditLogService.LogAsync(
                tableName: "User",
                recordId: 0,
                action: "FailedLogin",
                oldValues: null,
                newValues: new { username, ipAddress, reason, timestamp = DateTime.UtcNow },
                changedBy: username);

            _logger.LogWarning("Failed login attempt: {Username} from {IP} - {Reason}", username, ipAddress, reason);
        }

        private string GenerateJwtToken(User user)
        {
            // TODO: Integrate with existing JWT service
            // This is a placeholder
            return "JWT_TOKEN_PLACEHOLDER";
        }

        private class LoginAttemptTracker
        {
            public int FailedAttempts { get; private set; }
            public DateTime? LastFailureTime { get; private set; }

            public void RecordFailure()
            {
                FailedAttempts++;
                LastFailureTime = DateTime.UtcNow;
            }

            public bool IsLockedOut(int lockoutMinutes)
            {
                if (!LastFailureTime.HasValue)
                    return false;

                var timeSinceLastFailure = DateTime.UtcNow - LastFailureTime.Value;
                
                // If enough time has passed, reset counter
                if (timeSinceLastFailure.TotalMinutes > lockoutMinutes)
                {
                    FailedAttempts = 0;
                    return false;
                }

                return FailedAttempts >= 5; // This should come from config
            }
        }
    }

    /// <summary>
    /// Password policy validator
    /// </summary>
    public class PasswordPolicyValidator
    {
        private readonly IConfiguration _configuration;

        public PasswordPolicyValidator(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public (bool IsValid, List<string> Errors) ValidatePassword(string password)
        {
            var errors = new List<string>();

            var minLength = _configuration.GetValue<int>("Security:MinPasswordLength", 8);
            var requireDigit = _configuration.GetValue<bool>("Security:RequireDigit", true);
            var requireUppercase = _configuration.GetValue<bool>("Security:RequireUppercase", true);
            var requireNonAlphanumeric = _configuration.GetValue<bool>("Security:RequireNonAlphanumeric", true);

            if (password.Length < minLength)
                errors.Add($"Password must be at least {minLength} characters long");

            if (requireDigit && !password.Any(char.IsDigit))
                errors.Add("Password must contain at least one digit");

            if (requireUppercase && !password.Any(char.IsUpper))
                errors.Add("Password must contain at least one uppercase letter");

            if (requireNonAlphanumeric && !password.Any(c => !char.IsLetterOrDigit(c)))
                errors.Add("Password must contain at least one special character");

            return (errors.Count == 0, errors);
        }
    }
}
