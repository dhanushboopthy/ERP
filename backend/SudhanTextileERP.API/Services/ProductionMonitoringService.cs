using System.Collections.Concurrent;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;

namespace SudhanTextileERP.API.Services;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// PRODUCTION MONITORING SERVICE - Phase-2 Enterprise Security
// Real-time monitoring, alerting, and observability
// ═══════════════════════════════════════════════════════════════════════════════════════════

public interface IProductionMonitoringService
{
    Task<SystemHealthReport> GetSystemHealthAsync();
    Task<ApiMetricsReport> GetApiMetricsAsync(TimeSpan period);
    Task<List<PerformanceAlert>> GetActiveAlertsAsync();
    void RecordApiCall(string endpoint, int statusCode, long durationMs);
    void RecordError(string endpoint, Exception error);
    Task<MonitoringDashboard> GetMonitoringDashboardAsync();
}

public class ProductionMonitoringService : IProductionMonitoringService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductionMonitoringService> _logger;
    private readonly IConfiguration _configuration;
    
    // In-memory metrics storage (in production, use Redis or dedicated metrics store)
    private static readonly ConcurrentDictionary<string, EndpointMetrics> _endpointMetrics = new();
    private static readonly ConcurrentQueue<ErrorRecord> _recentErrors = new();
    private static readonly ConcurrentQueue<PerformanceAlert> _activeAlerts = new();
    private static DateTime _metricsStartTime = DateTime.UtcNow;
    
    // Thresholds
    private const int SlowRequestThresholdMs = 2000;
    private const int ErrorRateThresholdPercent = 5;
    private const int MaxMemoryUsageMb = 1024;
    private const int MaxActiveConnections = 100;

    public ProductionMonitoringService(
        ApplicationDbContext context,
        ILogger<ProductionMonitoringService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<SystemHealthReport> GetSystemHealthAsync()
    {
        var report = new SystemHealthReport
        {
            CheckedAt = DateTime.UtcNow,
            Components = new List<ComponentHealth>()
        };

        // Database Health
        report.Components.Add(await CheckDatabaseHealthAsync());

        // API Health
        report.Components.Add(CheckApiHealth());

        // Memory Health
        report.Components.Add(CheckMemoryHealth());

        // Backup Health
        report.Components.Add(await CheckBackupHealthAsync());

        // Overall status
        report.OverallStatus = report.Components.All(c => c.Status == HealthStatus.Healthy) 
            ? HealthStatus.Healthy
            : report.Components.Any(c => c.Status == HealthStatus.Critical)
                ? HealthStatus.Critical
                : HealthStatus.Degraded;

        return report;
    }

    private async Task<ComponentHealth> CheckDatabaseHealthAsync()
    {
        var health = new ComponentHealth
        {
            ComponentName = "Database",
            CheckedAt = DateTime.UtcNow
        };

        try
        {
            var sw = Stopwatch.StartNew();
            var canConnect = await _context.Database.CanConnectAsync();
            sw.Stop();

            if (!canConnect)
            {
                health.Status = HealthStatus.Critical;
                health.Message = "Cannot connect to database";
                health.Metrics["ConnectionTime"] = "N/A";
            }
            else if (sw.ElapsedMilliseconds > 1000)
            {
                health.Status = HealthStatus.Degraded;
                health.Message = $"Slow database connection ({sw.ElapsedMilliseconds}ms)";
                health.Metrics["ConnectionTime"] = $"{sw.ElapsedMilliseconds}ms";
            }
            else
            {
                health.Status = HealthStatus.Healthy;
                health.Message = "Database connection healthy";
                health.Metrics["ConnectionTime"] = $"{sw.ElapsedMilliseconds}ms";
            }

            // Check active connections (if MySQL)
            try
            {
                using var connection = _context.Database.GetDbConnection();
                await connection.OpenAsync();
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT COUNT(*) FROM information_schema.PROCESSLIST";
                var activeConnections = Convert.ToInt32(await command.ExecuteScalarAsync());
                health.Metrics["ActiveConnections"] = activeConnections.ToString();

                if (activeConnections > MaxActiveConnections * 0.8)
                {
                    health.Status = HealthStatus.Degraded;
                    health.Message = $"High connection count: {activeConnections}";
                }
            }
            catch
            {
                // SQLite doesn't support this
                health.Metrics["ActiveConnections"] = "N/A";
            }
        }
        catch (Exception ex)
        {
            health.Status = HealthStatus.Critical;
            health.Message = $"Database error: {ex.Message}";
            _logger.LogError(ex, "Database health check failed");
        }

        return health;
    }

    private ComponentHealth CheckApiHealth()
    {
        var health = new ComponentHealth
        {
            ComponentName = "API",
            CheckedAt = DateTime.UtcNow
        };

        var totalRequests = _endpointMetrics.Values.Sum(m => m.TotalRequests);
        var totalErrors = _endpointMetrics.Values.Sum(m => m.ErrorCount);
        var avgResponseTime = _endpointMetrics.Values.Any() 
            ? _endpointMetrics.Values.Average(m => m.AverageResponseTimeMs)
            : 0;

        var errorRate = totalRequests > 0 ? (totalErrors * 100.0 / totalRequests) : 0;

        health.Metrics["TotalRequests"] = totalRequests.ToString();
        health.Metrics["ErrorRate"] = $"{errorRate:F2}%";
        health.Metrics["AvgResponseTime"] = $"{avgResponseTime:F0}ms";

        if (errorRate > ErrorRateThresholdPercent)
        {
            health.Status = HealthStatus.Critical;
            health.Message = $"High error rate: {errorRate:F2}%";
            CreateAlert(AlertType.HighErrorRate, $"Error rate is {errorRate:F2}%");
        }
        else if (avgResponseTime > SlowRequestThresholdMs)
        {
            health.Status = HealthStatus.Degraded;
            health.Message = $"Slow response times: {avgResponseTime:F0}ms average";
            CreateAlert(AlertType.SlowResponse, $"Average response time is {avgResponseTime:F0}ms");
        }
        else
        {
            health.Status = HealthStatus.Healthy;
            health.Message = "API performing normally";
        }

        return health;
    }

    private ComponentHealth CheckMemoryHealth()
    {
        var health = new ComponentHealth
        {
            ComponentName = "Memory",
            CheckedAt = DateTime.UtcNow
        };

        var process = Process.GetCurrentProcess();
        var memoryMb = process.WorkingSet64 / (1024 * 1024);
        var gcMemoryMb = GC.GetTotalMemory(false) / (1024 * 1024);

        health.Metrics["ProcessMemory"] = $"{memoryMb}MB";
        health.Metrics["ManagedMemory"] = $"{gcMemoryMb}MB";
        health.Metrics["Gen0Collections"] = GC.CollectionCount(0).ToString();
        health.Metrics["Gen1Collections"] = GC.CollectionCount(1).ToString();
        health.Metrics["Gen2Collections"] = GC.CollectionCount(2).ToString();

        if (memoryMb > MaxMemoryUsageMb)
        {
            health.Status = HealthStatus.Critical;
            health.Message = $"High memory usage: {memoryMb}MB";
            CreateAlert(AlertType.HighMemoryUsage, $"Memory usage is {memoryMb}MB");
        }
        else if (memoryMb > MaxMemoryUsageMb * 0.8)
        {
            health.Status = HealthStatus.Degraded;
            health.Message = $"Elevated memory usage: {memoryMb}MB";
        }
        else
        {
            health.Status = HealthStatus.Healthy;
            health.Message = "Memory usage normal";
        }

        return health;
    }

    private async Task<ComponentHealth> CheckBackupHealthAsync()
    {
        var health = new ComponentHealth
        {
            ComponentName = "Backup",
            CheckedAt = DateTime.UtcNow
        };

        try
        {
            var lastBackup = await _context.BackupConfigurations
                .OrderByDescending(b => b.LastBackupTime)
                .FirstOrDefaultAsync();

            if (lastBackup == null)
            {
                health.Status = HealthStatus.Degraded;
                health.Message = "No backup configuration found";
                health.Metrics["LastBackup"] = "Never";
            }
            else
            {
                var hoursSinceBackup = (DateTime.UtcNow - lastBackup.LastBackupTime)?.TotalHours ?? 999;
                health.Metrics["LastBackup"] = lastBackup.LastBackupTime?.ToString("g") ?? "Never";
                health.Metrics["BackupStatus"] = lastBackup.LastBackupStatus ?? "Unknown";

                if (lastBackup.LastBackupStatus == "Failed")
                {
                    health.Status = HealthStatus.Critical;
                    health.Message = "Last backup failed";
                    CreateAlert(AlertType.BackupFailure, "Last backup operation failed");
                }
                else if (hoursSinceBackup > 8) // More than 8 hours
                {
                    health.Status = HealthStatus.Degraded;
                    health.Message = $"Backup is {hoursSinceBackup:F0} hours old";
                }
                else
                {
                    health.Status = HealthStatus.Healthy;
                    health.Message = "Backups running normally";
                }
            }
        }
        catch (Exception ex)
        {
            health.Status = HealthStatus.Degraded;
            health.Message = $"Cannot check backup status: {ex.Message}";
        }

        return health;
    }

    public async Task<ApiMetricsReport> GetApiMetricsAsync(TimeSpan period)
    {
        var report = new ApiMetricsReport
        {
            PeriodStart = DateTime.UtcNow.Subtract(period),
            PeriodEnd = DateTime.UtcNow
        };

        foreach (var (endpoint, metrics) in _endpointMetrics)
        {
            report.EndpointMetrics.Add(new EndpointMetricsDto
            {
                Endpoint = endpoint,
                TotalRequests = metrics.TotalRequests,
                SuccessfulRequests = metrics.TotalRequests - metrics.ErrorCount,
                FailedRequests = metrics.ErrorCount,
                AverageResponseTimeMs = metrics.AverageResponseTimeMs,
                MaxResponseTimeMs = metrics.MaxResponseTimeMs,
                MinResponseTimeMs = metrics.MinResponseTimeMs,
                P95ResponseTimeMs = metrics.P95ResponseTimeMs
            });
        }

        report.TotalRequests = report.EndpointMetrics.Sum(m => m.TotalRequests);
        report.TotalErrors = report.EndpointMetrics.Sum(m => m.FailedRequests);
        report.ErrorRate = report.TotalRequests > 0 
            ? (report.TotalErrors * 100.0 / report.TotalRequests) 
            : 0;
        report.AverageResponseTimeMs = report.EndpointMetrics.Any()
            ? report.EndpointMetrics.Average(m => m.AverageResponseTimeMs)
            : 0;

        // Top slow endpoints
        report.SlowestEndpoints = report.EndpointMetrics
            .OrderByDescending(m => m.AverageResponseTimeMs)
            .Take(5)
            .ToList();

        // Most error-prone endpoints
        report.MostErrorProneEndpoints = report.EndpointMetrics
            .Where(m => m.FailedRequests > 0)
            .OrderByDescending(m => m.FailedRequests)
            .Take(5)
            .ToList();

        return report;
    }

    public async Task<List<PerformanceAlert>> GetActiveAlertsAsync()
    {
        // Clean up old alerts (older than 1 hour)
        var cutoff = DateTime.UtcNow.AddHours(-1);
        while (_activeAlerts.TryPeek(out var alert) && alert.CreatedAt < cutoff)
        {
            _activeAlerts.TryDequeue(out _);
        }

        return _activeAlerts.ToList();
    }

    public void RecordApiCall(string endpoint, int statusCode, long durationMs)
    {
        var metrics = _endpointMetrics.GetOrAdd(endpoint, _ => new EndpointMetrics());
        
        lock (metrics)
        {
            metrics.TotalRequests++;
            if (statusCode >= 400)
            {
                metrics.ErrorCount++;
            }

            // Update response time stats
            metrics.ResponseTimes.Add(durationMs);
            if (metrics.ResponseTimes.Count > 1000)
            {
                metrics.ResponseTimes.RemoveAt(0); // Keep last 1000
            }

            metrics.MinResponseTimeMs = Math.Min(metrics.MinResponseTimeMs, durationMs);
            metrics.MaxResponseTimeMs = Math.Max(metrics.MaxResponseTimeMs, durationMs);
            metrics.AverageResponseTimeMs = metrics.ResponseTimes.Average();
            
            if (metrics.ResponseTimes.Count >= 20)
            {
                var sorted = metrics.ResponseTimes.OrderBy(t => t).ToList();
                metrics.P95ResponseTimeMs = sorted[(int)(sorted.Count * 0.95)];
            }
        }

        // Check for slow request
        if (durationMs > SlowRequestThresholdMs)
        {
            _logger.LogWarning("Slow request detected: {Endpoint} took {Duration}ms", endpoint, durationMs);
        }
    }

    public void RecordError(string endpoint, Exception error)
    {
        _recentErrors.Enqueue(new ErrorRecord
        {
            Endpoint = endpoint,
            ErrorMessage = error.Message,
            StackTrace = error.StackTrace,
            OccurredAt = DateTime.UtcNow
        });

        // Keep only last 100 errors
        while (_recentErrors.Count > 100)
        {
            _recentErrors.TryDequeue(out _);
        }

        // Check for error spike
        var recentErrorCount = _recentErrors.Count(e => e.OccurredAt > DateTime.UtcNow.AddMinutes(-5));
        if (recentErrorCount > 10)
        {
            CreateAlert(AlertType.ErrorSpike, $"Error spike detected: {recentErrorCount} errors in last 5 minutes");
        }
    }

    public async Task<MonitoringDashboard> GetMonitoringDashboardAsync()
    {
        var health = await GetSystemHealthAsync();
        var metrics = await GetApiMetricsAsync(TimeSpan.FromHours(1));
        var alerts = await GetActiveAlertsAsync();

        return new MonitoringDashboard
        {
            GeneratedAt = DateTime.UtcNow,
            UptimeHours = (DateTime.UtcNow - _metricsStartTime).TotalHours,
            OverallHealth = health.OverallStatus,
            ComponentStatuses = health.Components.ToDictionary(c => c.ComponentName, c => c.Status),
            RequestsLastHour = metrics.TotalRequests,
            ErrorsLastHour = metrics.TotalErrors,
            AverageResponseTime = metrics.AverageResponseTimeMs,
            ActiveAlerts = alerts.Count,
            RecentErrors = _recentErrors.TakeLast(10).ToList()
        };
    }

    private void CreateAlert(AlertType type, string message)
    {
        // Check if similar alert already exists
        if (_activeAlerts.Any(a => a.Type == type && a.CreatedAt > DateTime.UtcNow.AddMinutes(-15)))
        {
            return; // Don't duplicate alerts
        }

        var alert = new PerformanceAlert
        {
            Id = Guid.NewGuid().ToString(),
            Type = type,
            Message = message,
            CreatedAt = DateTime.UtcNow,
            Severity = type switch
            {
                AlertType.HighErrorRate => AlertSeverity.Critical,
                AlertType.BackupFailure => AlertSeverity.Critical,
                AlertType.HighMemoryUsage => AlertSeverity.Error,
                AlertType.SlowResponse => AlertSeverity.Warning,
                AlertType.ErrorSpike => AlertSeverity.Error,
                _ => AlertSeverity.Info
            }
        };

        _activeAlerts.Enqueue(alert);
        _logger.LogWarning("[ALERT:{Severity}] {Type}: {Message}", alert.Severity, alert.Type, message);
    }
}

#region Monitoring DTOs

public enum HealthStatus
{
    Healthy,
    Degraded,
    Critical
}

public enum AlertType
{
    HighErrorRate,
    SlowResponse,
    HighMemoryUsage,
    BackupFailure,
    ErrorSpike,
    DatabaseConnectionIssue
}

// NOTE: AlertSeverity is defined in MonitoringService.cs - using that enum

public class SystemHealthReport
{
    public DateTime CheckedAt { get; set; }
    public HealthStatus OverallStatus { get; set; }
    public List<ComponentHealth> Components { get; set; } = new();
}

public class ComponentHealth
{
    public string ComponentName { get; set; } = string.Empty;
    public HealthStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CheckedAt { get; set; }
    public Dictionary<string, string> Metrics { get; set; } = new();
}

public class ApiMetricsReport
{
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public long TotalRequests { get; set; }
    public long TotalErrors { get; set; }
    public double ErrorRate { get; set; }
    public double AverageResponseTimeMs { get; set; }
    public List<EndpointMetricsDto> EndpointMetrics { get; set; } = new();
    public List<EndpointMetricsDto> SlowestEndpoints { get; set; } = new();
    public List<EndpointMetricsDto> MostErrorProneEndpoints { get; set; } = new();
}

public class EndpointMetricsDto
{
    public string Endpoint { get; set; } = string.Empty;
    public long TotalRequests { get; set; }
    public long SuccessfulRequests { get; set; }
    public long FailedRequests { get; set; }
    public double AverageResponseTimeMs { get; set; }
    public long MaxResponseTimeMs { get; set; }
    public long MinResponseTimeMs { get; set; }
    public long P95ResponseTimeMs { get; set; }
}

public class EndpointMetrics
{
    public long TotalRequests { get; set; }
    public long ErrorCount { get; set; }
    public List<long> ResponseTimes { get; set; } = new();
    public double AverageResponseTimeMs { get; set; }
    public long MaxResponseTimeMs { get; set; }
    public long MinResponseTimeMs { get; set; } = long.MaxValue;
    public long P95ResponseTimeMs { get; set; }
}

public class PerformanceAlert
{
    public string Id { get; set; } = string.Empty;
    public AlertType Type { get; set; }
    public AlertSeverity Severity { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ErrorRecord
{
    public string Endpoint { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
    public string? StackTrace { get; set; }
    public DateTime OccurredAt { get; set; }
}

public class MonitoringDashboard
{
    public DateTime GeneratedAt { get; set; }
    public double UptimeHours { get; set; }
    public HealthStatus OverallHealth { get; set; }
    public Dictionary<string, HealthStatus> ComponentStatuses { get; set; } = new();
    public long RequestsLastHour { get; set; }
    public long ErrorsLastHour { get; set; }
    public double AverageResponseTime { get; set; }
    public int ActiveAlerts { get; set; }
    public List<ErrorRecord> RecentErrors { get; set; } = new();
}

#endregion
