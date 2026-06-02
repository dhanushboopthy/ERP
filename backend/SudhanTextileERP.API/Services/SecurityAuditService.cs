using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// SECURITY AUDIT LOGGING SERVICE - Phase-2 Enterprise Security
// Comprehensive security event logging for compliance and forensics
// ═══════════════════════════════════════════════════════════════════════════════════════════

/// <summary>
/// Security event types for audit logging
/// </summary>
public enum SecurityEventType
{
    // Authentication Events
    LoginSuccess,
    LoginFailure,
    LoginBlocked,
    Logout,
    TokenRefresh,
    TokenRefreshFailure,
    SessionExpired,
    
    // Password Events
    PasswordChange,
    PasswordChangeFailed,
    PasswordReset,
    PasswordResetRequested,
    
    // Authorization Events
    AccessGranted,
    AccessDenied,
    PrivilegeEscalationAttempt,
    UnauthorizedApiAccess,
    
    // User Management Events
    UserCreated,
    UserModified,
    UserDeleted,
    UserLocked,
    UserUnlocked,
    UserActivated,
    UserDeactivated,
    
    // Role & Permission Events
    RoleCreated,
    RoleModified,
    RoleDeleted,
    PermissionGranted,
    PermissionRevoked,
    
    // Data Events
    SensitiveDataAccess,
    DataExport,
    BulkDataOperation,
    
    // System Events
    BackupTriggered,
    BackupCompleted,
    BackupFailed,
    ConfigurationChanged,
    SystemHealthAlert,
    
    // Security Events
    SuspiciousActivity,
    RateLimitExceeded,
    InvalidTokenUsed,
    IpBlocked,
    SqlInjectionAttempt,
    XssAttempt
}

/// <summary>
/// Security event severity levels
/// </summary>
public enum SecuritySeverity
{
    Info = 0,
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

/// <summary>
/// Security audit log entry
/// </summary>
public class SecurityAuditEntry
{
    public long Id { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public SecurityEventType EventType { get; set; }
    public SecuritySeverity Severity { get; set; }
    public string EventCategory { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? Username { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? RequestPath { get; set; }
    public string? RequestMethod { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? AffectedResource { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public bool IsSuccessful { get; set; }
    public string? FailureReason { get; set; }
    public string? CorrelationId { get; set; }
    public string? SessionId { get; set; }
}

public interface ISecurityAuditService
{
    Task LogSecurityEventAsync(SecurityEventType eventType, string description, 
        string? userId = null, string? username = null, object? details = null,
        SecuritySeverity? severity = null, bool isSuccessful = true, string? failureReason = null);
    
    Task LogLoginAttemptAsync(string username, bool success, string? failureReason = null);
    Task LogPasswordChangeAsync(string userId, string username, bool success, string? reason = null);
    Task LogAccessDeniedAsync(string userId, string username, string resource, string action);
    Task LogDataAccessAsync(string userId, string username, string resource, string action, object? details = null);
    Task LogAdminOperationAsync(string userId, string username, string operation, object? oldValue = null, object? newValue = null);
    Task LogBackupEventAsync(string eventDescription, bool success, string? details = null);
    Task LogSuspiciousActivityAsync(string description, string? ipAddress = null, object? details = null);
    
    Task<List<SecurityAuditEntry>> GetSecurityEventsAsync(DateTime from, DateTime to, 
        SecurityEventType? eventType = null, SecuritySeverity? minSeverity = null);
    
    Task<SecurityDashboardDto> GetSecurityDashboardAsync();
}

public class SecurityAuditService : ISecurityAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<SecurityAuditService> _logger;
    private readonly ConcurrentQueue<SecurityAuditEntry> _pendingLogs = new();
    private readonly SemaphoreSlim _flushSemaphore = new(1, 1);
    
    // In-memory buffer for high-frequency events
    private const int BufferFlushThreshold = 50;
    private const int BufferFlushIntervalMs = 5000;
    private DateTime _lastFlush = DateTime.UtcNow;

    public SecurityAuditService(
        ApplicationDbContext context,
        IHttpContextAccessor httpContextAccessor,
        ILogger<SecurityAuditService> logger)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task LogSecurityEventAsync(
        SecurityEventType eventType,
        string description,
        string? userId = null,
        string? username = null,
        object? details = null,
        SecuritySeverity? severity = null,
        bool isSuccessful = true,
        string? failureReason = null)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        
        var entry = new SecurityAuditEntry
        {
            Timestamp = DateTime.UtcNow,
            EventType = eventType,
            Severity = severity ?? GetDefaultSeverity(eventType),
            EventCategory = GetEventCategory(eventType),
            UserId = userId,
            Username = username,
            IpAddress = GetClientIpAddress(httpContext),
            UserAgent = httpContext?.Request?.Headers["User-Agent"].ToString()?.Truncate(500),
            RequestPath = httpContext?.Request?.Path.Value,
            RequestMethod = httpContext?.Request?.Method,
            Description = description,
            Details = details != null ? JsonSerializer.Serialize(details) : null,
            IsSuccessful = isSuccessful,
            FailureReason = failureReason,
            CorrelationId = httpContext?.TraceIdentifier,
            SessionId = GetSessionId(httpContext)
        };

        // Add to buffer
        _pendingLogs.Enqueue(entry);

        // Log to file/console immediately for high severity events
        if (entry.Severity >= SecuritySeverity.High)
        {
            _logger.LogWarning("[SECURITY:{Severity}] {EventType}: {Description} | User: {Username} | IP: {IP}",
                entry.Severity, entry.EventType, description, username ?? "Anonymous", entry.IpAddress);
        }

        // Flush buffer if threshold reached
        if (_pendingLogs.Count >= BufferFlushThreshold || 
            (DateTime.UtcNow - _lastFlush).TotalMilliseconds >= BufferFlushIntervalMs)
        {
            await FlushLogsAsync();
        }
    }

    public async Task LogLoginAttemptAsync(string username, bool success, string? failureReason = null)
    {
        await LogSecurityEventAsync(
            success ? SecurityEventType.LoginSuccess : SecurityEventType.LoginFailure,
            success ? $"User '{username}' logged in successfully" : $"Login failed for user '{username}'",
            username: username,
            severity: success ? SecuritySeverity.Info : SecuritySeverity.Medium,
            isSuccessful: success,
            failureReason: failureReason
        );
    }

    public async Task LogPasswordChangeAsync(string userId, string username, bool success, string? reason = null)
    {
        await LogSecurityEventAsync(
            success ? SecurityEventType.PasswordChange : SecurityEventType.PasswordChangeFailed,
            success ? $"Password changed for user '{username}'" : $"Password change failed for user '{username}'",
            userId: userId,
            username: username,
            severity: SecuritySeverity.Medium,
            isSuccessful: success,
            failureReason: reason
        );
    }

    public async Task LogAccessDeniedAsync(string userId, string username, string resource, string action)
    {
        await LogSecurityEventAsync(
            SecurityEventType.AccessDenied,
            $"Access denied: User '{username}' attempted to {action} on {resource}",
            userId: userId,
            username: username,
            details: new { Resource = resource, Action = action },
            severity: SecuritySeverity.Medium,
            isSuccessful: false,
            failureReason: "Insufficient permissions"
        );
    }

    public async Task LogDataAccessAsync(string userId, string username, string resource, string action, object? details = null)
    {
        await LogSecurityEventAsync(
            SecurityEventType.SensitiveDataAccess,
            $"Data access: User '{username}' performed {action} on {resource}",
            userId: userId,
            username: username,
            details: details,
            severity: SecuritySeverity.Info,
            isSuccessful: true
        );
    }

    public async Task LogAdminOperationAsync(string userId, string username, string operation, object? oldValue = null, object? newValue = null)
    {
        var entry = new SecurityAuditEntry
        {
            Timestamp = DateTime.UtcNow,
            EventType = SecurityEventType.ConfigurationChanged,
            Severity = SecuritySeverity.High,
            EventCategory = "Administration",
            UserId = userId,
            Username = username,
            Description = $"Admin operation: {operation}",
            OldValue = oldValue != null ? JsonSerializer.Serialize(oldValue) : null,
            NewValue = newValue != null ? JsonSerializer.Serialize(newValue) : null,
            IsSuccessful = true
        };

        var httpContext = _httpContextAccessor.HttpContext;
        entry.IpAddress = GetClientIpAddress(httpContext);
        entry.UserAgent = httpContext?.Request?.Headers["User-Agent"].ToString()?.Truncate(500);

        _pendingLogs.Enqueue(entry);
        
        _logger.LogWarning("[SECURITY:Admin] {Operation} by {Username} from {IP}",
            operation, username, entry.IpAddress);

        await FlushLogsAsync();
    }

    public async Task LogBackupEventAsync(string eventDescription, bool success, string? details = null)
    {
        await LogSecurityEventAsync(
            success ? SecurityEventType.BackupCompleted : SecurityEventType.BackupFailed,
            eventDescription,
            details: details != null ? new { Details = details } : null,
            severity: success ? SecuritySeverity.Info : SecuritySeverity.High,
            isSuccessful: success
        );
    }

    public async Task LogSuspiciousActivityAsync(string description, string? ipAddress = null, object? details = null)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        
        await LogSecurityEventAsync(
            SecurityEventType.SuspiciousActivity,
            description,
            details: details,
            severity: SecuritySeverity.High,
            isSuccessful: false
        );

        _logger.LogError("[SECURITY:ALERT] Suspicious Activity: {Description} | IP: {IP}",
            description, ipAddress ?? GetClientIpAddress(httpContext));
    }

    public async Task<List<SecurityAuditEntry>> GetSecurityEventsAsync(
        DateTime from, DateTime to,
        SecurityEventType? eventType = null,
        SecuritySeverity? minSeverity = null)
    {
        // Flush pending logs first
        await FlushLogsAsync();

        var query = _context.Set<SecurityAuditLog>()
            .Where(l => l.Timestamp >= from && l.Timestamp <= to);

        if (eventType.HasValue)
            query = query.Where(l => l.EventType == eventType.Value.ToString());

        if (minSeverity.HasValue)
            query = query.Where(l => l.SeverityLevel >= (int)minSeverity.Value);

        var logs = await query
            .OrderByDescending(l => l.Timestamp)
            .Take(1000)
            .ToListAsync();

        return logs.Select(l => new SecurityAuditEntry
        {
            Id = l.Id,
            Timestamp = l.Timestamp,
            EventType = Enum.Parse<SecurityEventType>(l.EventType),
            Severity = (SecuritySeverity)l.SeverityLevel,
            EventCategory = l.EventCategory,
            UserId = l.UserId,
            Username = l.Username,
            IpAddress = l.IpAddress,
            Description = l.Description,
            Details = l.Details,
            IsSuccessful = l.IsSuccessful
        }).ToList();
    }

    public async Task<SecurityDashboardDto> GetSecurityDashboardAsync()
    {
        await FlushLogsAsync();

        var now = DateTime.UtcNow;
        var today = now.Date;
        var last24Hours = now.AddHours(-24);
        var last7Days = now.AddDays(-7);

        var logs = await _context.Set<SecurityAuditLog>()
            .Where(l => l.Timestamp >= last7Days)
            .ToListAsync();

        return new SecurityDashboardDto
        {
            TotalEventsLast24Hours = logs.Count(l => l.Timestamp >= last24Hours),
            FailedLoginsLast24Hours = logs.Count(l => l.Timestamp >= last24Hours && 
                l.EventType == SecurityEventType.LoginFailure.ToString()),
            SuccessfulLoginsLast24Hours = logs.Count(l => l.Timestamp >= last24Hours && 
                l.EventType == SecurityEventType.LoginSuccess.ToString()),
            AccessDeniedLast24Hours = logs.Count(l => l.Timestamp >= last24Hours && 
                l.EventType == SecurityEventType.AccessDenied.ToString()),
            SuspiciousActivitiesLast24Hours = logs.Count(l => l.Timestamp >= last24Hours && 
                l.SeverityLevel >= (int)SecuritySeverity.High),
            CriticalEventsLast7Days = logs.Count(l => l.SeverityLevel >= (int)SecuritySeverity.Critical),
            UniqueUsersLast24Hours = logs.Where(l => l.Timestamp >= last24Hours)
                .Select(l => l.Username).Distinct().Count(),
            UniqueIpsLast24Hours = logs.Where(l => l.Timestamp >= last24Hours)
                .Select(l => l.IpAddress).Distinct().Count(),
            TopFailedLoginUsers = logs.Where(l => l.EventType == SecurityEventType.LoginFailure.ToString())
                .GroupBy(l => l.Username)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => new SecurityMetricItem { Name = g.Key ?? "Unknown", Count = g.Count() })
                .ToList(),
            TopSuspiciousIps = logs.Where(l => l.SeverityLevel >= (int)SecuritySeverity.Medium)
                .GroupBy(l => l.IpAddress)
                .OrderByDescending(g => g.Count())
                .Take(5)
                .Select(g => new SecurityMetricItem { Name = g.Key ?? "Unknown", Count = g.Count() })
                .ToList()
        };
    }

    private async Task FlushLogsAsync()
    {
        if (!await _flushSemaphore.WaitAsync(100))
            return;

        try
        {
            var entries = new List<SecurityAuditEntry>();
            while (_pendingLogs.TryDequeue(out var entry))
            {
                entries.Add(entry);
            }

            if (entries.Count == 0)
                return;

            var dbEntries = entries.Select(e => new SecurityAuditLog
            {
                Timestamp = e.Timestamp,
                EventType = e.EventType.ToString(),
                SeverityLevel = (int)e.Severity,
                EventCategory = e.EventCategory,
                UserId = e.UserId,
                Username = e.Username,
                IpAddress = e.IpAddress,
                UserAgent = e.UserAgent,
                RequestPath = e.RequestPath,
                RequestMethod = e.RequestMethod,
                Description = e.Description,
                Details = e.Details,
                AffectedResource = e.AffectedResource,
                OldValue = e.OldValue,
                NewValue = e.NewValue,
                IsSuccessful = e.IsSuccessful,
                FailureReason = e.FailureReason,
                CorrelationId = e.CorrelationId,
                SessionId = e.SessionId
            });

            await _context.Set<SecurityAuditLog>().AddRangeAsync(dbEntries);
            await _context.SaveChangesAsync();

            _lastFlush = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to flush security audit logs to database");
            // Re-queue critical events
        }
        finally
        {
            _flushSemaphore.Release();
        }
    }

    private static string? GetClientIpAddress(HttpContext? context)
    {
        if (context == null) return null;

        // Check for forwarded headers (behind load balancer/proxy)
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        return context.Connection.RemoteIpAddress?.ToString();
    }

    private static string? GetSessionId(HttpContext? context)
    {
        return context?.User?.FindFirst("session_id")?.Value;
    }

    private static SecuritySeverity GetDefaultSeverity(SecurityEventType eventType)
    {
        return eventType switch
        {
            SecurityEventType.LoginSuccess => SecuritySeverity.Info,
            SecurityEventType.LoginFailure => SecuritySeverity.Medium,
            SecurityEventType.LoginBlocked => SecuritySeverity.High,
            SecurityEventType.AccessDenied => SecuritySeverity.Medium,
            SecurityEventType.PrivilegeEscalationAttempt => SecuritySeverity.Critical,
            SecurityEventType.SuspiciousActivity => SecuritySeverity.High,
            SecurityEventType.SqlInjectionAttempt => SecuritySeverity.Critical,
            SecurityEventType.XssAttempt => SecuritySeverity.Critical,
            SecurityEventType.PasswordChange => SecuritySeverity.Medium,
            SecurityEventType.RoleModified => SecuritySeverity.High,
            SecurityEventType.PermissionGranted => SecuritySeverity.High,
            SecurityEventType.BackupFailed => SecuritySeverity.High,
            SecurityEventType.InvalidTokenUsed => SecuritySeverity.High,
            _ => SecuritySeverity.Info
        };
    }

    private static string GetEventCategory(SecurityEventType eventType)
    {
        return eventType switch
        {
            SecurityEventType.LoginSuccess or SecurityEventType.LoginFailure or 
            SecurityEventType.LoginBlocked or SecurityEventType.Logout or
            SecurityEventType.TokenRefresh or SecurityEventType.SessionExpired
                => "Authentication",
            
            SecurityEventType.PasswordChange or SecurityEventType.PasswordChangeFailed or
            SecurityEventType.PasswordReset or SecurityEventType.PasswordResetRequested
                => "Password",
            
            SecurityEventType.AccessGranted or SecurityEventType.AccessDenied or
            SecurityEventType.PrivilegeEscalationAttempt or SecurityEventType.UnauthorizedApiAccess
                => "Authorization",
            
            SecurityEventType.UserCreated or SecurityEventType.UserModified or
            SecurityEventType.UserDeleted or SecurityEventType.UserLocked or
            SecurityEventType.UserUnlocked
                => "User Management",
            
            SecurityEventType.RoleCreated or SecurityEventType.RoleModified or
            SecurityEventType.RoleDeleted or SecurityEventType.PermissionGranted or
            SecurityEventType.PermissionRevoked
                => "Role & Permissions",
            
            SecurityEventType.BackupTriggered or SecurityEventType.BackupCompleted or
            SecurityEventType.BackupFailed or SecurityEventType.ConfigurationChanged
                => "System",
            
            SecurityEventType.SuspiciousActivity or SecurityEventType.RateLimitExceeded or
            SecurityEventType.InvalidTokenUsed or SecurityEventType.IpBlocked or
            SecurityEventType.SqlInjectionAttempt or SecurityEventType.XssAttempt
                => "Security Threat",
            
            _ => "Other"
        };
    }
}

// DTOs for Security Dashboard
public class SecurityDashboardDto
{
    public int TotalEventsLast24Hours { get; set; }
    public int FailedLoginsLast24Hours { get; set; }
    public int SuccessfulLoginsLast24Hours { get; set; }
    public int AccessDeniedLast24Hours { get; set; }
    public int SuspiciousActivitiesLast24Hours { get; set; }
    public int CriticalEventsLast7Days { get; set; }
    public int UniqueUsersLast24Hours { get; set; }
    public int UniqueIpsLast24Hours { get; set; }
    public List<SecurityMetricItem> TopFailedLoginUsers { get; set; } = new();
    public List<SecurityMetricItem> TopSuspiciousIps { get; set; } = new();
}

public class SecurityMetricItem
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
}

// Extension methods
public static class StringExtensions
{
    public static string? Truncate(this string? value, int maxLength)
    {
        if (string.IsNullOrEmpty(value)) return value;
        return value.Length <= maxLength ? value : value[..maxLength];
    }
}
