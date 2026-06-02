using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using SudhanTextileERP.API.Services;

// Alias to resolve ambiguity with SudhanTextileERP.API.Services.HealthStatus
using MsHealthStatus = Microsoft.Extensions.Diagnostics.HealthChecks.HealthStatus;

namespace SudhanTextileERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly HealthCheckService _healthCheckService;
        private readonly IMonitoringService _monitoringService;

        public HealthController(HealthCheckService healthCheckService, IMonitoringService monitoringService)
        {
            _healthCheckService = healthCheckService;
            _monitoringService = monitoringService;
        }

        /// <summary>
        /// Basic health check endpoint
        /// </summary>
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                status = "Healthy",
                timestamp = DateTime.UtcNow,
                application = "Sudhan Textile ERP",
                version = "1.0.0"
            });
        }

        /// <summary>
        /// Detailed health check with all dependencies
        /// </summary>
        [HttpGet("detailed")]
        public async Task<IActionResult> GetDetailed()
        {
            var healthReport = await _healthCheckService.CheckHealthAsync();

            var response = new
            {
                status = healthReport.Status.ToString(),
                timestamp = DateTime.UtcNow,
                totalDuration = healthReport.TotalDuration.TotalMilliseconds,
                checks = healthReport.Entries.Select(e => new
                {
                    name = e.Key,
                    status = e.Value.Status.ToString(),
                    description = e.Value.Description,
                    duration = e.Value.Duration.TotalMilliseconds,
                    data = e.Value.Data
                })
            };

            var statusCode = healthReport.Status == MsHealthStatus.Healthy ? 200 : 503;
            return StatusCode(statusCode, response);
        }

        /// <summary>
        /// Get system metrics
        /// </summary>
        [HttpGet("metrics")]
        public async Task<IActionResult> GetMetrics()
        {
            var metrics = await _monitoringService.GetSystemMetricsAsync();
            return Ok(metrics);
        }

        /// <summary>
        /// Get recent alerts
        /// </summary>
        [HttpGet("alerts")]
        public async Task<IActionResult> GetAlerts([FromQuery] int hours = 24)
        {
            var alerts = await _monitoringService.GetRecentAlertsAsync(hours);
            return Ok(new
            {
                alerts,
                count = alerts.Count,
                criticalCount = alerts.Count(a => a.Severity == AlertSeverity.Critical),
                errorCount = alerts.Count(a => a.Severity == AlertSeverity.Error)
            });
        }
    }
}
