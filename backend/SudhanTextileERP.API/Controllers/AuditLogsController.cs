using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.Services;
using SudhanTextileERP.API.DTOs;

namespace SudhanTextileERP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AuditLogsController : ControllerBase
    {
        private readonly IAuditLogService _auditLogService;

        public AuditLogsController(IAuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        /// <summary>
        /// Get audit logs with optional filtering
        /// </summary>
        /// <param name="module">Filter by module (e.g., "YarnReceipts", "Parties")</param>
        /// <param name="startDate">Filter by start date (UTC)</param>
        /// <param name="endDate">Filter by end date (UTC)</param>
        /// <param name="pageNumber">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 50, max: 100)</param>
        [HttpGet]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] string? module = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            if (pageSize > 100) pageSize = 100;

            var filter = new AuditLogFilterRequest
            {
                TableName = module,
                FromDate = startDate,
                ToDate = endDate,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            var logs = await _auditLogService.GetAuditLogsAsync(filter);

            return Ok(logs);
        }

        /// <summary>
        /// Get audit trail for a specific record
        /// </summary>
        [HttpGet("record/{module}/{recordId}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> GetRecordAuditTrail(string module, string recordId)
        {
            var filter = new AuditLogFilterRequest
            {
                TableName = module,
                PageSize = 100
            };

            var result = await _auditLogService.GetAuditLogsAsync(filter);
            var filtered = result.Items.Where(l => l.RecordId.ToString() == recordId).ToList();

            return Ok(new
            {
                module,
                recordId,
                auditTrail = filtered
            });
        }
    }
}
