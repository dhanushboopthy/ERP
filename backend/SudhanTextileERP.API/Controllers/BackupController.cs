using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.Services;
using System.Security.Claims;

namespace SudhanTextileERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "AdminOnly")]
    public class BackupController : ControllerBase
    {
        private readonly IBackupService _backupService;
        private readonly ILogger<BackupController> _logger;

        public BackupController(IBackupService backupService, ILogger<BackupController> logger)
        {
            _backupService = backupService;
            _logger = logger;
        }

        /// <summary>
        /// Trigger a manual backup
        /// </summary>
        [HttpPost("create")]
        public async Task<IActionResult> CreateBackup()
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            _logger.LogInformation("Manual backup triggered by: {User}", username);

            var result = await _backupService.CreateBackupAsync("Manual", username);

            if (result.Success)
            {
                return Ok(new
                {
                    success = true,
                    message = "Backup created successfully",
                    backupFile = result.BackupFilePath,
                    fileSizeBytes = result.FileSizeBytes,
                    timestamp = result.Timestamp
                });
            }

            return StatusCode(500, new
            {
                success = false,
                message = "Backup failed",
                error = result.ErrorMessage
            });
        }

        /// <summary>
        /// Get backup history
        /// </summary>
        [HttpGet("history")]
        public async Task<IActionResult> GetBackupHistory([FromQuery] int days = 30)
        {
            var history = await _backupService.GetBackupHistoryAsync(days);
            return Ok(new
            {
                backups = history,
                count = history.Count
            });
        }

        /// <summary>
        /// Get backup configuration
        /// </summary>
        [HttpGet("configuration")]
        public async Task<IActionResult> GetConfiguration()
        {
            var config = await _backupService.GetConfigurationAsync();
            return Ok(config);
        }

        /// <summary>
        /// Update backup configuration
        /// </summary>
        [HttpPut("configuration")]
        public async Task<IActionResult> UpdateConfiguration([FromBody] BackupConfiguration config)
        {
            await _backupService.UpdateConfigurationAsync(config);
            return Ok(new { message = "Configuration updated successfully" });
        }

        /// <summary>
        /// Trigger cleanup of old backups
        /// </summary>
        [HttpPost("cleanup")]
        public async Task<IActionResult> CleanupOldBackups()
        {
            await _backupService.CleanupOldBackupsAsync();
            return Ok(new { message = "Cleanup completed" });
        }

        /// <summary>
        /// Download a backup file
        /// </summary>
        [HttpGet("download/{fileName}")]
        public async Task<IActionResult> DownloadBackup(string fileName)
        {
            var config = await _backupService.GetConfigurationAsync();
            var backupDir = config?.BackupPath ?? "Backups";
            var filePath = Path.Combine(backupDir, fileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = "Backup file not found" });
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, "application/zip", fileName);
        }
    }
}
