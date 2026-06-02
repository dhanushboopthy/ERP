using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Services;
using System.Security.Claims;

namespace SudhanTextileERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly SettingsService _settingsService;
    private readonly NotificationService _notificationService;

    public NotificationsController(SettingsService settingsService, NotificationService notificationService)
    {
        _settingsService = settingsService;
        _notificationService = notificationService;
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : 0;
    }

    private int? GetCurrentUserRoleId()
    {
        var roleIdClaim = User.FindFirst("RoleId")?.Value;
        return int.TryParse(roleIdClaim, out var roleId) ? roleId : null;
    }

    // ====================================
    // REAL-TIME NOTIFICATIONS ENDPOINTS
    // ====================================

    /// <summary>
    /// Get notifications for current user (supports real-time polling)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<NotificationListResponse>>> GetNotifications([FromQuery] int limit = 20)
    {
        var userId = GetCurrentUserId();
        var roleId = GetCurrentUserRoleId();

        if (userId == 0)
            return Unauthorized();

        var result = await _notificationService.GetNotificationsForUserAsync(userId, roleId, limit);
        return Ok(ApiResponse<NotificationListResponse>.Ok(result));
    }

    /// <summary>
    /// Get unread count only (lightweight for badge updates)
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        var roleId = GetCurrentUserRoleId();

        if (userId == 0)
            return Unauthorized();

        var count = await _notificationService.GetUnreadCountAsync(userId, roleId);
        return Ok(ApiResponse<int>.Ok(count));
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    [HttpPost("{id}/read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized();

        var result = await _notificationService.MarkAsReadAsync(id, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPost("read-all")]
    public async Task<ActionResult<ApiResponse<int>>> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        var roleId = GetCurrentUserRoleId();

        if (userId == 0)
            return Unauthorized();

        var result = await _notificationService.MarkAllAsReadAsync(userId, roleId);
        return Ok(result);
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteNotification(int id)
    {
        var userId = GetCurrentUserId();
        if (userId == 0)
            return Unauthorized();

        var result = await _notificationService.DeleteNotificationAsync(id, userId);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    // ====================================
    // NOTIFICATION SETTINGS ENDPOINTS
    // ====================================

    /// <summary>
    /// Get notification settings
    /// </summary>
    [HttpGet("settings")]
    public async Task<ActionResult<List<NotificationSettingDto>>> GetSettings()
    {
        var settings = await _settingsService.GetNotificationSettingsAsync();
        return Ok(settings);
    }

    /// <summary>
    /// Update notification setting
    /// </summary>
    [HttpPut("settings/{id}")]
    public async Task<ActionResult<ApiResponse<NotificationSettingDto>>> UpdateSetting(int id, [FromBody] UpdateNotificationSettingRequest request)
    {
        if (id != request.Id) return BadRequest("ID mismatch");
        var result = await _settingsService.UpdateNotificationSettingAsync(request, User.Identity?.Name ?? "System");
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    /// <summary>
    /// Send test notification
    /// </summary>
    [HttpPost("settings/{id}/test")]
    public async Task<ActionResult<ApiResponse<bool>>> TestNotificationSetting(int id)
    {
        var result = await _settingsService.SendTestNotificationAsync(id, User.Identity?.Name ?? "System");
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // ====================================
    // ADMIN ENDPOINTS
    // ====================================

    /// <summary>
    /// Manually trigger notification generation (admin only)
    /// </summary>
    [HttpPost("generate")]
    public async Task<ActionResult<ApiResponse<string>>> GenerateNotifications()
    {
        await _notificationService.GeneratePendingApprovalNotificationsAsync();
        await _notificationService.GenerateOverdueInvoiceNotificationsAsync();
        await _notificationService.GenerateLowStockNotificationsAsync();
        
        return Ok(ApiResponse<string>.Ok("Notifications generated successfully"));
    }

    /// <summary>
    /// Create sample notifications for testing (admin only)
    /// </summary>
    [HttpPost("seed-samples")]
    public async Task<ActionResult<ApiResponse<string>>> SeedSampleNotifications()
    {
        var userId = GetCurrentUserId();
        
        // Create sample notifications
        await _notificationService.CreateUserNotificationAsync(
            userId, "approval", "Pending Approval",
            "Sizing Job Card SET/24-25/000145 needs your approval",
            "/sizing/sizing-job-card", "high");

        await _notificationService.CreateUserNotificationAsync(
            userId, "invoice", "Invoice Overdue",
            "Invoice INV/24-25/000089 is overdue by 3 days",
            "/sizing/invoices", "urgent");

        await _notificationService.CreateUserNotificationAsync(
            userId, "stock", "Low Stock Alert",
            "Yarn Count 40s 2/100 stock below threshold (234 kg)",
            "/sizing/yarn-stock", "high");

        await _notificationService.CreateUserNotificationAsync(
            userId, "document", "Document Ready",
            "Warping Job Card WRP/24-25/000156 is ready for review",
            "/sizing/warping-job-card", "normal");

        await _notificationService.CreateBroadcastNotificationAsync(
            "system", "System Update",
            "New features added to Invoice module. Check out the improved PDF export!",
            "/sizing/invoices", "low");

        return Ok(ApiResponse<string>.Ok("Sample notifications created successfully"));
    }

    /// <summary>
    /// Cleanup old notifications (admin only)
    /// </summary>
    [HttpPost("cleanup")]
    public async Task<ActionResult<ApiResponse<int>>> CleanupOldNotifications([FromQuery] int daysOld = 30)
    {
        var count = await _notificationService.CleanupOldNotificationsAsync(daysOld);
        return Ok(ApiResponse<int>.Ok(count, $"{count} old notifications cleaned up"));
    }
}
