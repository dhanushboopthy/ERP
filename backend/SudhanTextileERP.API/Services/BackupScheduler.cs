namespace SudhanTextileERP.API.Services
{
    /// <summary>
    /// Background service for automated backup scheduling
    /// </summary>
    public class BackupScheduler : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BackupScheduler> _logger;
        private Timer? _timer;

        public BackupScheduler(IServiceProvider serviceProvider, ILogger<BackupScheduler> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Backup Scheduler started");

            // Run every hour to check if backup is needed
            _timer = new Timer(CheckAndExecuteBackup, null, TimeSpan.Zero, TimeSpan.FromHours(1));

            return Task.CompletedTask;
        }

        private async void CheckAndExecuteBackup(object? state)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var backupService = scope.ServiceProvider.GetRequiredService<IBackupService>();

                var config = await backupService.GetConfigurationAsync();

                if (config == null || !config.AutoBackupEnabled)
                {
                    _logger.LogDebug("Auto-backup is disabled");
                    return;
                }

                // Check if backup is needed
                var hoursSinceLastBackup = config.LastBackupTime.HasValue
                    ? (DateTime.UtcNow - config.LastBackupTime.Value).TotalHours
                    : double.MaxValue;

                if (hoursSinceLastBackup >= config.BackupIntervalHours)
                {
                    _logger.LogInformation("Starting scheduled backup (last backup: {Hours} hours ago)", 
                        hoursSinceLastBackup);

                    var result = await backupService.CreateBackupAsync("Scheduled", "BackupScheduler");

                    if (result.Success)
                    {
                        _logger.LogInformation("Scheduled backup completed: {Path} ({Size} bytes)", 
                            result.BackupFilePath, result.FileSizeBytes);

                        // Cleanup old backups
                        await backupService.CleanupOldBackupsAsync();
                    }
                    else
                    {
                        _logger.LogError("Scheduled backup failed: {Error}", result.ErrorMessage);
                    }
                }
                else
                {
                    _logger.LogDebug("Backup not needed yet (next backup in {Hours} hours)", 
                        config.BackupIntervalHours - hoursSinceLastBackup);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in backup scheduler");
            }
        }

        public override void Dispose()
        {
            _timer?.Dispose();
            base.Dispose();
        }
    }
}
