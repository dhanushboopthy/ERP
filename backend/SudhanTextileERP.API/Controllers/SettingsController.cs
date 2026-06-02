using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Services;

namespace SudhanTextileERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly SettingsService _settingsService;
    private readonly AuditLogService _auditLogService;

    public SettingsController(SettingsService settingsService, AuditLogService auditLogService)
    {
        _settingsService = settingsService;
        _auditLogService = auditLogService;
    }

    // ============================================
    // USER MANAGEMENT
    // ============================================

    [HttpGet("users")]
    public async Task<ActionResult<PagedResult<UserListDto>>> GetUsers([FromQuery] PaginationParams paging)
    {
        var result = await _settingsService.GetUsersAsync(paging);
        return Ok(result);
    }

    [HttpGet("users/{id}")]
    public async Task<ActionResult<UserListDto>> GetUser(int id)
    {
        var user = await _settingsService.GetUserByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost("users")]
    public async Task<ActionResult<ApiResponse<UserListDto>>> CreateUser([FromBody] CreateUserRequest request)
    {
        var result = await _settingsService.CreateUserAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("users/{id}")]
    public async Task<ActionResult<ApiResponse<UserListDto>>> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        if (id != request.Id) return BadRequest("ID mismatch");
        var result = await _settingsService.UpdateUserAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("users/{id}/lock")]
    public async Task<ActionResult<ApiResponse<bool>>> LockUser(int id, [FromBody] LockUserRequest request)
    {
        request.UserId = id;
        var result = await _settingsService.LockUserAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("users/{id}/unlock")]
    public async Task<ActionResult<ApiResponse<bool>>> UnlockUser(int id)
    {
        var result = await _settingsService.UnlockUserAsync(id, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("users/{id}/reset-password")]
    public async Task<ActionResult<ApiResponse<bool>>> ResetPassword(int id, [FromBody] ResetPasswordRequest request)
    {
        request.UserId = id;
        var result = await _settingsService.ResetPasswordAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("users/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeactivateUser(int id)
    {
        var result = await _settingsService.DeactivateUserAsync(id, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("users/{id}/activate")]
    public async Task<ActionResult<ApiResponse<bool>>> ActivateUser(int id)
    {
        var result = await _settingsService.ActivateUserAsync(id, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ============================================
    // ROLE & PERMISSION MANAGEMENT
    // ============================================

    [HttpGet("roles")]
    public async Task<ActionResult<List<RoleDto>>> GetRoles()
    {
        var roles = await _settingsService.GetRolesAsync();
        return Ok(roles);
    }

    [HttpGet("roles/{id}")]
    public async Task<ActionResult<RoleDto>> GetRole(int id)
    {
        var role = await _settingsService.GetRoleByIdAsync(id);
        if (role == null) return NotFound();
        return Ok(role);
    }

    [HttpPost("roles")]
    public async Task<ActionResult<ApiResponse<RoleDto>>> CreateRole([FromBody] CreateRoleRequest request)
    {
        var result = await _settingsService.CreateRoleAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("roles/{id}")]
    public async Task<ActionResult<ApiResponse<RoleDto>>> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
    {
        if (id != request.Id) return BadRequest("ID mismatch");
        var result = await _settingsService.UpdateRoleAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("roles/{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteRole(int id)
    {
        var result = await _settingsService.DeleteRoleAsync(id, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("permissions")]
    public async Task<ActionResult<List<PermissionModuleDto>>> GetPermissions()
    {
        var permissions = await _settingsService.GetPermissionsGroupedByModuleAsync();
        return Ok(permissions);
    }

    [HttpGet("modules")]
    public async Task<ActionResult<List<ModuleDto>>> GetModules()
    {
        var modules = await _settingsService.GetModulesAsync();
        return Ok(modules);
    }

    [HttpGet("roles/{roleId}/permissions")]
    public async Task<ActionResult<List<PermissionModuleDto>>> GetRolePermissions(int roleId)
    {
        var permissions = await _settingsService.GetRolePermissionsAsync(roleId);
        return Ok(permissions);
    }

    [HttpPut("roles/{roleId}/permissions")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateRolePermissions(int roleId, [FromBody] List<int> permissionIds)
    {
        var result = await _settingsService.UpdateRolePermissionsAsync(roleId, permissionIds, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ============================================
    // APPROVAL MATRIX
    // ============================================

    [HttpGet("approval-matrix")]
    public async Task<ActionResult<List<ApprovalMatrixDto>>> GetApprovalMatrix()
    {
        var matrix = await _settingsService.GetApprovalMatrixAsync();
        return Ok(matrix);
    }

    [HttpGet("approval-matrix/{documentType}")]
    public async Task<ActionResult<List<ApprovalMatrixDto>>> GetApprovalMatrixForDocument(string documentType)
    {
        var matrix = await _settingsService.GetApprovalMatrixForDocumentAsync(documentType);
        return Ok(matrix);
    }

    [HttpPost("approval-matrix")]
    public async Task<ActionResult<ApiResponse<bool>>> SaveApprovalMatrix([FromBody] SaveApprovalMatrixRequest request)
    {
        var result = await _settingsService.SaveApprovalMatrixAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("approval-history")]
    public async Task<ActionResult<PagedResult<ApprovalHistoryDto>>> GetApprovalHistory(
        [FromQuery] string? documentType, 
        [FromQuery] int? documentId,
        [FromQuery] PaginationParams paging)
    {
        var history = await _settingsService.GetApprovalHistoryAsync(documentType, documentId, paging);
        return Ok(history);
    }

    // ============================================
    // FINANCIAL YEAR
    // ============================================

    [HttpGet("financial-years")]
    public async Task<ActionResult<List<FinancialYearDto>>> GetFinancialYears()
    {
        var years = await _settingsService.GetFinancialYearsAsync();
        return Ok(years);
    }

    [HttpGet("financial-years/{id}")]
    public async Task<ActionResult<FinancialYearDto>> GetFinancialYear(int id)
    {
        var year = await _settingsService.GetFinancialYearByIdAsync(id);
        if (year == null) return NotFound();
        return Ok(year);
    }

    [HttpPost("financial-years")]
    public async Task<ActionResult<ApiResponse<FinancialYearDto>>> CreateFinancialYear([FromBody] CreateFinancialYearRequest request)
    {
        var result = await _settingsService.CreateFinancialYearAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("financial-years/{id}/set-current")]
    public async Task<ActionResult<ApiResponse<bool>>> SetCurrentFinancialYear(int id)
    {
        var result = await _settingsService.SetCurrentFinancialYearAsync(id, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("financial-years/{id}/close")]
    public async Task<ActionResult<ApiResponse<bool>>> CloseFinancialYear(int id, [FromBody] CloseFinancialYearRequest request)
    {
        request.YearId = id;
        var result = await _settingsService.CloseFinancialYearAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("financial-years/{id}/pending-documents")]
    public async Task<ActionResult<object>> GetPendingDocuments(int id)
    {
        var pending = await _settingsService.GetPendingDocumentsForYearAsync(id);
        return Ok(pending);
    }

    // ============================================
    // DOCUMENT NUMBER SETTINGS
    // ============================================

    [HttpGet("document-numbers")]
    public async Task<ActionResult<List<DocumentNumberSettingDto>>> GetDocumentNumberSettings([FromQuery] int? financialYearId)
    {
        var settings = await _settingsService.GetDocumentNumberSettingsAsync(financialYearId);
        return Ok(settings);
    }

    [HttpPut("document-numbers/{id}")]
    public async Task<ActionResult<ApiResponse<DocumentNumberSettingDto>>> UpdateDocumentNumberSetting(
        int id, [FromBody] UpdateDocumentNumberSettingRequest request)
    {
        if (id != request.Id) return BadRequest("ID mismatch");
        var result = await _settingsService.UpdateDocumentNumberSettingAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ============================================
    // SYSTEM CONFIGURATION
    // ============================================

    [HttpGet("system-config")]
    public async Task<ActionResult<List<SystemConfigCategoryDto>>> GetSystemConfigs()
    {
        var configs = await _settingsService.GetSystemConfigsGroupedAsync();
        return Ok(configs);
    }

    [HttpGet("system-config/{key}")]
    public async Task<ActionResult<SystemConfigDto>> GetSystemConfig(string key)
    {
        var config = await _settingsService.GetSystemConfigByKeyAsync(key);
        if (config == null) return NotFound();
        return Ok(config);
    }

    [HttpPut("system-config/{id}")]
    public async Task<ActionResult<ApiResponse<SystemConfigDto>>> UpdateSystemConfig(
        int id, [FromBody] UpdateSystemConfigRequest request)
    {
        if (id != request.Id) return BadRequest("ID mismatch");
        var result = await _settingsService.UpdateSystemConfigAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("system-config/bulk")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateSystemConfigsBulk([FromBody] List<UpdateSystemConfigRequest> requests)
    {
        var result = await _settingsService.UpdateSystemConfigsBulkAsync(requests, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ============================================
    // SECURITY POLICIES
    // ============================================

    [HttpGet("security-policies")]
    public async Task<ActionResult<List<SecurityPolicyDto>>> GetSecurityPolicies()
    {
        var policies = await _settingsService.GetSecurityPoliciesAsync();
        return Ok(policies);
    }

    [HttpPut("security-policies/{id}")]
    public async Task<ActionResult<ApiResponse<SecurityPolicyDto>>> UpdateSecurityPolicy(
        int id, [FromBody] UpdateSecurityPolicyRequest request)
    {
        if (id != request.Id) return BadRequest("ID mismatch");
        var result = await _settingsService.UpdateSecurityPolicyAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ============================================
    // BACKUP CONFIGURATION
    // ============================================

    [HttpGet("backup-config")]
    public async Task<ActionResult<List<BackupConfigDto>>> GetBackupConfigs()
    {
        var configs = await _settingsService.GetBackupConfigsAsync();
        return Ok(configs);
    }

    [HttpPut("backup-config/{id}")]
    public async Task<ActionResult<ApiResponse<BackupConfigDto>>> UpdateBackupConfig(
        int id, [FromBody] UpdateBackupConfigRequest request)
    {
        if (id != request.Id) return BadRequest("ID mismatch");
        var result = await _settingsService.UpdateBackupConfigAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("backup-config/trigger")]
    public async Task<ActionResult<ApiResponse<bool>>> TriggerBackup()
    {
        var result = await _settingsService.TriggerManualBackupAsync(GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ============================================
    // NOTIFICATION SETTINGS
    // ============================================

    [HttpGet("notifications")]
    public async Task<ActionResult<List<NotificationSettingDto>>> GetNotificationSettings()
    {
        var settings = await _settingsService.GetNotificationSettingsAsync();
        return Ok(settings);
    }

    [HttpPut("notifications/{id}")]
    public async Task<ActionResult<ApiResponse<NotificationSettingDto>>> UpdateNotificationSetting(
        int id, [FromBody] UpdateNotificationSettingRequest request)
    {
        if (id != request.Id) return BadRequest("ID mismatch");
        var result = await _settingsService.UpdateNotificationSettingAsync(request, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("notifications/{id}/test")]
    public async Task<ActionResult<ApiResponse<bool>>> TestNotification(int id)
    {
        var result = await _settingsService.SendTestNotificationAsync(id, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ============================================
    // AUDIT LOGS
    // ============================================

    [HttpGet("audit-logs")]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> GetAuditLogs([FromQuery] AuditLogFilterRequest filter)
    {
        var logs = await _auditLogService.GetAuditLogsAsync(filter);
        return Ok(logs);
    }

    [HttpGet("audit-logs/{id}")]
    public async Task<ActionResult<AuditLogDto>> GetAuditLog(long id)
    {
        var log = await _auditLogService.GetAuditLogByIdAsync(id);
        if (log == null) return NotFound();
        return Ok(log);
    }

    [HttpGet("audit-logs/export")]
    public async Task<IActionResult> ExportAuditLogs([FromQuery] AuditLogFilterRequest filter)
    {
        var csvBytes = await _auditLogService.ExportAuditLogsAsync(filter);
        return File(csvBytes, "text/csv", $"audit_logs_{DateTime.Now:yyyyMMdd_HHmmss}.csv");
    }

    [HttpGet("audit-logs/modules")]
    public async Task<ActionResult<List<string>>> GetAuditModules()
    {
        var modules = await _auditLogService.GetDistinctModulesAsync();
        return Ok(modules);
    }

    [HttpGet("audit-logs/users")]
    public async Task<ActionResult<List<string>>> GetAuditUsers()
    {
        var users = await _auditLogService.GetDistinctUsersAsync();
        return Ok(users);
    }

    // ============================================
    // USER SESSIONS
    // ============================================

    [HttpGet("sessions")]
    public async Task<ActionResult<PagedResult<UserSessionDto>>> GetUserSessions([FromQuery] int? userId, [FromQuery] PaginationParams paging)
    {
        var sessions = await _settingsService.GetUserSessionsAsync(userId, paging);
        return Ok(sessions);
    }

    [HttpPost("sessions/{id}/terminate")]
    public async Task<ActionResult<ApiResponse<bool>>> TerminateSession(int id)
    {
        var result = await _settingsService.TerminateSessionAsync(id, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("sessions/terminate-all/{userId}")]
    public async Task<ActionResult<ApiResponse<bool>>> TerminateAllUserSessions(int userId)
    {
        var result = await _settingsService.TerminateAllUserSessionsAsync(userId, GetCurrentUsername());
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private string GetCurrentUsername()
    {
        return User.Identity?.Name ?? "System";
    }
}
