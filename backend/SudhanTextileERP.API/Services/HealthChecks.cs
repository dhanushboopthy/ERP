using Microsoft.Extensions.Diagnostics.HealthChecks;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;

namespace SudhanTextileERP.API.Services
{
    /// <summary>
    /// Database health check
    /// </summary>
    public class DatabaseHealthCheck : IHealthCheck
    {
        private readonly ApplicationDbContext _context;

        public DatabaseHealthCheck(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Try to execute a simple query
                await _context.Database.CanConnectAsync(cancellationToken);
                
                var userCount = await _context.Users.CountAsync(cancellationToken);

                return HealthCheckResult.Healthy("Database is accessible", new Dictionary<string, object>
                {
                    { "userCount", userCount },
                    { "databaseType", "SQLite" }
                });
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("Database is not accessible", ex);
            }
        }
    }

    /// <summary>
    /// Application health check
    /// </summary>
    public class ApplicationHealthCheck : IHealthCheck
    {
        private readonly ILogger<ApplicationHealthCheck> _logger;

        public ApplicationHealthCheck(ILogger<ApplicationHealthCheck> logger)
        {
            _logger = logger;
        }

        public Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var process = Process.GetCurrentProcess();
                var memoryUsageMB = process.WorkingSet64 / 1024 / 1024;
                var cpuTimeSeconds = process.TotalProcessorTime.TotalSeconds;

                var data = new Dictionary<string, object>
                {
                    { "memoryUsageMB", memoryUsageMB },
                    { "cpuTimeSeconds", cpuTimeSeconds },
                    { "uptime", (DateTime.Now - process.StartTime).TotalMinutes },
                    { "threadCount", process.Threads.Count }
                };

                // Check if memory usage is concerning
                if (memoryUsageMB > 1000) // Over 1GB
                {
                    return Task.FromResult(
                        HealthCheckResult.Degraded("High memory usage", null, data));
                }

                return Task.FromResult(
                    HealthCheckResult.Healthy("Application is running normally", data));
            }
            catch (Exception ex)
            {
                return Task.FromResult(
                    HealthCheckResult.Unhealthy("Failed to check application health", ex));
            }
        }
    }

    /// <summary>
    /// Backup health check
    /// </summary>
    public class BackupHealthCheck : IHealthCheck
    {
        private readonly IServiceProvider _serviceProvider;

        public BackupHealthCheck(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var backupService = scope.ServiceProvider.GetRequiredService<IBackupService>();

                var config = await backupService.GetConfigurationAsync();
                var history = await backupService.GetBackupHistoryAsync(7);

                var hoursSinceLastBackup = config?.LastBackupTime.HasValue == true
                    ? (DateTime.UtcNow - config.LastBackupTime.Value).TotalHours
                    : double.MaxValue;

                var data = new Dictionary<string, object>
                {
                    { "autoBackupEnabled", config?.AutoBackupEnabled ?? false },
                    { "hoursSinceLastBackup", hoursSinceLastBackup },
                    { "backupCount7Days", history.Count(h => h.IsSuccessful) },
                    { "lastBackupTime", config?.LastBackupTime?.ToString() ?? "Never" }
                };

                // Alert if no backup in 48 hours
                if (hoursSinceLastBackup > 48)
                {
                    return HealthCheckResult.Degraded(
                        "No backup in last 48 hours", null, data);
                }

                return HealthCheckResult.Healthy("Backup system is functioning", data);
            }
            catch (Exception ex)
            {
                return HealthCheckResult.Unhealthy("Backup health check failed", ex);
            }
        }
    }
}
