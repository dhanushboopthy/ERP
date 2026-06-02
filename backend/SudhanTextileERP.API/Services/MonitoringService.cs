using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Text.Json;

namespace SudhanTextileERP.API.Services
{
    /// <summary>
    /// Monitoring service for tracking application metrics and alerts
    /// </summary>
    public interface IMonitoringService
    {
        Task LogMetricAsync(string metricName, double value, Dictionary<string, string>? tags = null);
        Task RaiseAlertAsync(string alertType, string message, AlertSeverity severity);
        Task<List<Alert>> GetRecentAlertsAsync(int hours = 24);
        Task<Dictionary<string, object>> GetSystemMetricsAsync();
    }

    public enum AlertSeverity
    {
        Info,
        Warning,
        Error,
        Critical
    }

    public class Alert
    {
        public string AlertType { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public AlertSeverity Severity { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsAcknowledged { get; set; }
        public string? AcknowledgedBy { get; set; }
    }

    public class MonitoringService : IMonitoringService
    {
        private readonly ILogger<MonitoringService> _logger;
        private readonly IConfiguration _configuration;
        private static readonly List<Alert> _recentAlerts = new();
        private static readonly object _alertLock = new();

        // Alert throttling to prevent spam
        private static readonly Dictionary<string, DateTime> _lastAlertTime = new();
        private static readonly TimeSpan _alertThrottle = TimeSpan.FromMinutes(15);

        public MonitoringService(ILogger<MonitoringService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public Task LogMetricAsync(string metricName, double value, Dictionary<string, string>? tags = null)
        {
            // Log metrics (in production, this would send to monitoring service like Prometheus/Grafana)
            var tagString = tags != null ? string.Join(", ", tags.Select(t => $"{t.Key}={t.Value}")) : "";
            _logger.LogInformation("METRIC: {Metric} = {Value} [{Tags}]", metricName, value, tagString);
            return Task.CompletedTask;
        }

        public async Task RaiseAlertAsync(string alertType, string message, AlertSeverity severity)
        {
            // Check throttling
            lock (_alertLock)
            {
                if (_lastAlertTime.TryGetValue(alertType, out var lastTime))
                {
                    if (DateTime.UtcNow - lastTime < _alertThrottle)
                    {
                        _logger.LogDebug("Alert throttled: {AlertType}", alertType);
                        return;
                    }
                }

                _lastAlertTime[alertType] = DateTime.UtcNow;
            }

            var alert = new Alert
            {
                AlertType = alertType,
                Message = message,
                Severity = severity,
                Timestamp = DateTime.UtcNow
            };

            lock (_alertLock)
            {
                _recentAlerts.Add(alert);
                
                // Keep only last 1000 alerts
                if (_recentAlerts.Count > 1000)
                {
                    _recentAlerts.RemoveRange(0, _recentAlerts.Count - 1000);
                }
            }

            // Log alert
            var logLevel = severity switch
            {
                AlertSeverity.Critical => LogLevel.Critical,
                AlertSeverity.Error => LogLevel.Error,
                AlertSeverity.Warning => LogLevel.Warning,
                _ => LogLevel.Information
            };

            _logger.Log(logLevel, "ALERT [{Severity}] {Type}: {Message}", severity, alertType, message);

            // Send email for critical alerts
            if (severity == AlertSeverity.Critical)
            {
                await SendAlertEmailAsync(alert);
            }
        }

        public Task<List<Alert>> GetRecentAlertsAsync(int hours = 24)
        {
            lock (_alertLock)
            {
                var cutoff = DateTime.UtcNow.AddHours(-hours);
                var filtered = _recentAlerts
                    .Where(a => a.Timestamp >= cutoff)
                    .OrderByDescending(a => a.Timestamp)
                    .ToList();
                return Task.FromResult(filtered);
            }
        }

        public Task<Dictionary<string, object>> GetSystemMetricsAsync()
        {
            var process = System.Diagnostics.Process.GetCurrentProcess();
            
            var metrics = new Dictionary<string, object>
            {
                { "timestamp", DateTime.UtcNow },
                { "memoryUsageMB", process.WorkingSet64 / 1024 / 1024 },
                { "cpuTimeSeconds", process.TotalProcessorTime.TotalSeconds },
                { "uptimeMinutes", (DateTime.Now - process.StartTime).TotalMinutes },
                { "threadCount", process.Threads.Count },
                { "machineName", Environment.MachineName },
                { "processorCount", Environment.ProcessorCount }
            };

            return Task.FromResult(metrics);
        }

        private async Task SendAlertEmailAsync(Alert alert)
        {
            // TODO: Implement email sending
            // For now, just log it
            _logger.LogWarning("CRITICAL ALERT EMAIL: {Message}", alert.Message);
            await Task.CompletedTask;
        }
    }

    /// <summary>
    /// Background service to monitor application health and raise alerts
    /// </summary>
    public class HealthMonitorService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<HealthMonitorService> _logger;
        private Timer? _timer;

        public HealthMonitorService(IServiceProvider serviceProvider, ILogger<HealthMonitorService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Health Monitor started");

            // Check every 5 minutes
            _timer = new Timer(CheckHealth, null, TimeSpan.Zero, TimeSpan.FromMinutes(5));

            return Task.CompletedTask;
        }

        private async void CheckHealth(object? state)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var monitoring = scope.ServiceProvider.GetRequiredService<IMonitoringService>();

                // Check process metrics
                var process = System.Diagnostics.Process.GetCurrentProcess();
                var memoryMB = process.WorkingSet64 / 1024 / 1024;

                await monitoring.LogMetricAsync("memory_usage_mb", memoryMB);

                // Alert if memory usage is high
                if (memoryMB > 1000)
                {
                    await monitoring.RaiseAlertAsync(
                        "HighMemoryUsage",
                        $"Memory usage is {memoryMB}MB (threshold: 1000MB)",
                        AlertSeverity.Warning);
                }

                // Check error rate from logs (simplified - in production, track actual errors)
                var errorCount = 0; // Would count recent errors
                if (errorCount > 10)
                {
                    await monitoring.RaiseAlertAsync(
                        "HighErrorRate",
                        $"High error rate detected: {errorCount} errors in last 5 minutes",
                        AlertSeverity.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in health monitor");
            }
        }

        public override void Dispose()
        {
            _timer?.Dispose();
            base.Dispose();
        }
    }
}
