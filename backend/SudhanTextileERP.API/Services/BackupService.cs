using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.Entities;
using System.IO.Compression;
using System.Text.Json;

namespace SudhanTextileERP.API.Services
{
    public interface IBackupService
    {
        Task<BackupResult> CreateBackupAsync(string backupType = "Manual", string? triggeredBy = null);
        Task<List<BackupHistory>> GetBackupHistoryAsync(int days = 30);
        Task<bool> RestoreBackupAsync(string backupFilePath);
        Task CleanupOldBackupsAsync();
        Task<BackupConfiguration?> GetConfigurationAsync();
        Task UpdateConfigurationAsync(BackupConfiguration config);
    }

    public class BackupResult
    {
        public bool Success { get; set; }
        public string? BackupFilePath { get; set; }
        public long FileSizeBytes { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class BackupHistory
    {
        public int Id { get; set; }
        public string BackupType { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public bool IsSuccessful { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class BackupConfiguration
    {
        public int Id { get; set; }
        public bool AutoBackupEnabled { get; set; }
        public int BackupIntervalHours { get; set; } = 24;
        public int RetentionDays { get; set; } = 30;
        public string BackupPath { get; set; } = "Backups";
        public bool IncludeDatabase { get; set; } = true;
        public bool IncludeConfigs { get; set; } = true;
        public bool IncludeAuditLogs { get; set; } = true;
        public string? NotificationEmail { get; set; }
        public DateTime? LastBackupTime { get; set; }
    }

    public class BackupService : IBackupService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<BackupService> _logger;
        private readonly IAuditLogService _auditLogService;

        public BackupService(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<BackupService> logger,
            IAuditLogService auditLogService)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _auditLogService = auditLogService;
        }

        public async Task<BackupResult> CreateBackupAsync(string backupType = "Manual", string? triggeredBy = null)
        {
            var result = new BackupResult
            {
                Timestamp = DateTime.UtcNow
            };

            try
            {
                var config = await GetConfigurationAsync();
                var backupDir = config?.BackupPath ?? "Backups";

                // Create backup directory if it doesn't exist
                if (!Directory.Exists(backupDir))
                {
                    Directory.CreateDirectory(backupDir);
                }

                // Generate backup filename with timestamp
                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var backupFileName = $"ERP_Backup_{timestamp}.zip";
                var backupFilePath = Path.Combine(backupDir, backupFileName);

                // Create temporary directory for backup contents
                var tempDir = Path.Combine(Path.GetTempPath(), $"backup_{timestamp}");
                Directory.CreateDirectory(tempDir);

                try
                {
                    // Backup database
                    if (config?.IncludeDatabase ?? true)
                    {
                        await BackupDatabaseAsync(tempDir);
                    }

                    // Backup configuration files
                    if (config?.IncludeConfigs ?? true)
                    {
                        BackupConfigurationFiles(tempDir);
                    }

                    // Backup audit logs (export recent logs)
                    if (config?.IncludeAuditLogs ?? true)
                    {
                        await BackupAuditLogsAsync(tempDir);
                    }

                    // Create metadata file
                    CreateBackupMetadata(tempDir, backupType, triggeredBy);

                    // Compress to zip
                    ZipFile.CreateFromDirectory(tempDir, backupFilePath, CompressionLevel.Optimal, false);

                    // Get file size
                    var fileInfo = new FileInfo(backupFilePath);
                    result.FileSizeBytes = fileInfo.Length;
                    result.BackupFilePath = backupFilePath;
                    result.Success = true;

                    // Log backup history
                    await LogBackupHistoryAsync(new BackupHistory
                    {
                        BackupType = backupType,
                        FilePath = backupFilePath,
                        FileSizeBytes = result.FileSizeBytes,
                        CreatedAt = result.Timestamp,
                        CreatedBy = triggeredBy,
                        IsSuccessful = true
                    });

                    // Update last backup time in configuration
                    if (config != null)
                    {
                        config.LastBackupTime = result.Timestamp;
                        await UpdateConfigurationAsync(config);
                    }

                    _logger.LogInformation("Backup created successfully: {BackupFile} ({Size} bytes)", 
                        backupFilePath, result.FileSizeBytes);
                }
                finally
                {
                    // Cleanup temp directory
                    if (Directory.Exists(tempDir))
                    {
                        Directory.Delete(tempDir, true);
                    }
                }
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.ErrorMessage = ex.Message;
                _logger.LogError(ex, "Backup failed: {Error}", ex.Message);

                // Log failed backup
                await LogBackupHistoryAsync(new BackupHistory
                {
                    BackupType = backupType,
                    FilePath = "",
                    FileSizeBytes = 0,
                    CreatedAt = result.Timestamp,
                    CreatedBy = triggeredBy,
                    IsSuccessful = false,
                    ErrorMessage = ex.Message
                });
            }

            return result;
        }

        private async Task BackupDatabaseAsync(string targetDir)
        {
            // For SQLite, simply copy the database file
            var dbPath = "SudhanTextileERP.db";
            if (File.Exists(dbPath))
            {
                var targetPath = Path.Combine(targetDir, "database.db");
                File.Copy(dbPath, targetPath, true);

                // Also copy WAL and SHM files if they exist
                if (File.Exists($"{dbPath}-wal"))
                    File.Copy($"{dbPath}-wal", $"{targetPath}-wal", true);
                if (File.Exists($"{dbPath}-shm"))
                    File.Copy($"{dbPath}-shm", $"{targetPath}-shm", true);
            }
        }

        private void BackupConfigurationFiles(string targetDir)
        {
            var configDir = Path.Combine(targetDir, "config");
            Directory.CreateDirectory(configDir);

            // Backup appsettings files
            var configFiles = new[] { "appsettings.json", "appsettings.Production.json", "appsettings.Development.json" };
            foreach (var file in configFiles)
            {
                if (File.Exists(file))
                {
                    File.Copy(file, Path.Combine(configDir, file), true);
                }
            }
        }

        private async Task BackupAuditLogsAsync(string targetDir)
        {
            try
            {
                // Export recent audit logs (last 90 days)
                var startDate = DateTime.UtcNow.AddDays(-90);
                var logs = await _context.AuditLogs
                    .Where(a => a.ChangedAt >= startDate)
                    .OrderByDescending(a => a.ChangedAt)
                    .Take(10000)
                    .ToListAsync();

                var auditFile = Path.Combine(targetDir, "audit_logs.json");
                var json = JsonSerializer.Serialize(logs, new JsonSerializerOptions { WriteIndented = true });
                await File.WriteAllTextAsync(auditFile, json);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to backup audit logs");
            }
        }

        private void CreateBackupMetadata(string targetDir, string backupType, string? triggeredBy)
        {
            var metadata = new
            {
                BackupType = backupType,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = triggeredBy ?? "System",
                ServerVersion = Environment.Version.ToString(),
                MachineName = Environment.MachineName,
                DatabaseType = "SQLite"
            };

            var metadataFile = Path.Combine(targetDir, "backup_metadata.json");
            var json = JsonSerializer.Serialize(metadata, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(metadataFile, json);
        }

        private async Task LogBackupHistoryAsync(BackupHistory history)
        {
            // This would be stored in a BackupHistory table - for now, just log it
            _logger.LogInformation(
                "Backup History: Type={Type}, Success={Success}, Size={Size}, Path={Path}",
                history.BackupType, history.IsSuccessful, history.FileSizeBytes, history.FilePath);

            // TODO: When BackupHistory entity is added to DbContext, save it here
        }

        public async Task<List<BackupHistory>> GetBackupHistoryAsync(int days = 30)
        {
            // TODO: Implement when BackupHistory table is added
            // For now, return list from filesystem
            var config = await GetConfigurationAsync();
            var backupDir = config?.BackupPath ?? "Backups";

            if (!Directory.Exists(backupDir))
                return new List<BackupHistory>();

            var files = Directory.GetFiles(backupDir, "ERP_Backup_*.zip")
                .OrderByDescending(f => new FileInfo(f).CreationTime)
                .Take(50)
                .Select(f =>
                {
                    var fileInfo = new FileInfo(f);
                    return new BackupHistory
                    {
                        FilePath = f,
                        FileSizeBytes = fileInfo.Length,
                        CreatedAt = fileInfo.CreationTime,
                        IsSuccessful = true
                    };
                })
                .ToList();

            return files;
        }

        public async Task<bool> RestoreBackupAsync(string backupFilePath)
        {
            try
            {
                if (!File.Exists(backupFilePath))
                {
                    _logger.LogError("Backup file not found: {Path}", backupFilePath);
                    return false;
                }

                // Extract to temp directory
                var tempDir = Path.Combine(Path.GetTempPath(), $"restore_{DateTime.Now:yyyyMMdd_HHmmss}");
                ZipFile.ExtractToDirectory(backupFilePath, tempDir);

                try
                {
                    // Restore database
                    var dbBackup = Path.Combine(tempDir, "database.db");
                    if (File.Exists(dbBackup))
                    {
                        // Close database connections
                        await _context.Database.CloseConnectionAsync();

                        // Replace database file
                        File.Copy(dbBackup, "SudhanTextileERP.db", true);
                        
                        if (File.Exists($"{dbBackup}-wal"))
                            File.Copy($"{dbBackup}-wal", "SudhanTextileERP.db-wal", true);
                        if (File.Exists($"{dbBackup}-shm"))
                            File.Copy($"{dbBackup}-shm", "SudhanTextileERP.db-shm", true);
                    }

                    _logger.LogInformation("Database restored from: {Path}", backupFilePath);
                    return true;
                }
                finally
                {
                    // Cleanup temp directory
                    if (Directory.Exists(tempDir))
                    {
                        Directory.Delete(tempDir, true);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Restore failed: {Error}", ex.Message);
                return false;
            }
        }

        public async Task CleanupOldBackupsAsync()
        {
            try
            {
                var config = await GetConfigurationAsync();
                var retentionDays = config?.RetentionDays ?? 30;
                var backupDir = config?.BackupPath ?? "Backups";

                if (!Directory.Exists(backupDir))
                    return;

                var cutoffDate = DateTime.Now.AddDays(-retentionDays);
                var oldBackups = Directory.GetFiles(backupDir, "ERP_Backup_*.zip")
                    .Where(f => new FileInfo(f).CreationTime < cutoffDate)
                    .ToList();

                foreach (var file in oldBackups)
                {
                    try
                    {
                        File.Delete(file);
                        _logger.LogInformation("Deleted old backup: {File}", file);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete backup: {File}", file);
                    }
                }

                if (oldBackups.Any())
                {
                    _logger.LogInformation("Cleaned up {Count} old backups", oldBackups.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Backup cleanup failed");
            }
        }

        public async Task<BackupConfiguration?> GetConfigurationAsync()
        {
            var dbConfig = await _context.BackupConfigurations
                .Where(b => b.IsActive)
                .OrderByDescending(b => b.IsEnabled)
                .ThenBy(b => b.Id)
                .FirstOrDefaultAsync();

            if (dbConfig == null)
            {
                return new BackupConfiguration
                {
                    Id = 1,
                    AutoBackupEnabled = true,
                    BackupIntervalHours = 24,
                    RetentionDays = 30,
                    BackupPath = "Backups",
                    IncludeDatabase = true,
                    IncludeConfigs = true,
                    IncludeAuditLogs = true
                };
            }

            return new BackupConfiguration
            {
                Id = dbConfig.Id,
                AutoBackupEnabled = dbConfig.IsEnabled,
                BackupIntervalHours = FrequencyToHours(dbConfig.Frequency),
                RetentionDays = dbConfig.RetentionDays,
                BackupPath = dbConfig.BackupPath,
                IncludeDatabase = true,
                IncludeConfigs = true,
                IncludeAuditLogs = true,
                LastBackupTime = dbConfig.LastBackupTime
            };
        }

        public async Task UpdateConfigurationAsync(BackupConfiguration config)
        {
            var dbConfig = await _context.BackupConfigurations.FindAsync(config.Id);
            if (dbConfig == null)
            {
                dbConfig = await _context.BackupConfigurations
                    .Where(b => b.IsActive)
                    .OrderByDescending(b => b.IsEnabled)
                    .ThenBy(b => b.Id)
                    .FirstOrDefaultAsync();
            }

            if (dbConfig == null)
            {
                _logger.LogWarning("Backup configuration not found; unable to update");
                return;
            }

            dbConfig.IsEnabled = config.AutoBackupEnabled;
            dbConfig.RetentionDays = config.RetentionDays;
            dbConfig.BackupPath = config.BackupPath;
            dbConfig.ModifiedBy = "System";
            dbConfig.ModifiedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private static int FrequencyToHours(string frequency) => frequency.ToLowerInvariant() switch
        {
            "weekly" => 24 * 7,
            "monthly" => 24 * 30,
            _ => 24
        };
    }
}
