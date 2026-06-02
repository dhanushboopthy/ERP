using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.DTOs;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

public class NotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get notifications for a specific user (includes role-based and user-specific notifications)
    /// </summary>
    public async Task<NotificationListResponse> GetNotificationsForUserAsync(int userId, int? roleId = null, int limit = 20)
    {
        var query = _context.Notifications
            .Where(n => n.IsActive)
            .Where(n => 
                n.UserId == userId || // User-specific notifications
                (n.UserId == null && n.RoleId == null) || // Broadcast notifications
                (n.RoleId == roleId && roleId != null)) // Role-specific notifications
            .OrderByDescending(n => n.CreatedDate);

        var notifications = await query
            .Take(limit)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                Priority = n.Priority,
                Link = n.Link,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedDate,
                ReadAt = n.ReadAt
            })
            .ToListAsync();

        var unreadCount = await query.CountAsync(n => !n.IsRead);
        var totalCount = await query.CountAsync();

        return new NotificationListResponse
        {
            Notifications = notifications,
            UnreadCount = unreadCount,
            TotalCount = totalCount
        };
    }

    /// <summary>
    /// Get only unread count for badge display
    /// </summary>
    public async Task<int> GetUnreadCountAsync(int userId, int? roleId = null)
    {
        return await _context.Notifications
            .Where(n => n.IsActive && !n.IsRead)
            .Where(n =>
                n.UserId == userId ||
                (n.UserId == null && n.RoleId == null) ||
                (n.RoleId == roleId && roleId != null))
            .CountAsync();
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    public async Task<ApiResponse<bool>> MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && (n.UserId == userId || n.UserId == null));

        if (notification == null)
            return ApiResponse<bool>.Fail("Notification not found");

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Notification marked as read");
    }

    /// <summary>
    /// Mark all notifications as read for a user
    /// </summary>
    public async Task<ApiResponse<int>> MarkAllAsReadAsync(int userId, int? roleId = null)
    {
        var notifications = await _context.Notifications
            .Where(n => n.IsActive && !n.IsRead)
            .Where(n =>
                n.UserId == userId ||
                (n.UserId == null && n.RoleId == null) ||
                (n.RoleId == roleId && roleId != null))
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return ApiResponse<int>.Ok(notifications.Count, $"{notifications.Count} notifications marked as read");
    }

    /// <summary>
    /// Create a new notification
    /// </summary>
    public async Task<Notification> CreateNotificationAsync(CreateNotificationRequest request, string createdBy)
    {
        var notification = new Notification
        {
            Type = request.Type,
            Title = request.Title,
            Message = request.Message,
            Priority = request.Priority,
            Link = request.Link,
            UserId = request.UserId,
            RoleId = request.RoleId,
            ReferenceType = request.ReferenceType,
            ReferenceId = request.ReferenceId,
            CreatedBy = createdBy
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return notification;
    }

    /// <summary>
    /// Create notification for specific user
    /// </summary>
    public async Task CreateUserNotificationAsync(int userId, string type, string title, string message, string? link = null, string priority = "normal", string createdBy = "System")
    {
        await CreateNotificationAsync(new CreateNotificationRequest
        {
            Type = type,
            Title = title,
            Message = message,
            Link = link,
            Priority = priority,
            UserId = userId
        }, createdBy);
    }

    /// <summary>
    /// Create notification for specific role (all users with that role)
    /// </summary>
    public async Task CreateRoleNotificationAsync(int roleId, string type, string title, string message, string? link = null, string priority = "normal", string createdBy = "System")
    {
        await CreateNotificationAsync(new CreateNotificationRequest
        {
            Type = type,
            Title = title,
            Message = message,
            Link = link,
            Priority = priority,
            RoleId = roleId
        }, createdBy);
    }

    /// <summary>
    /// Create broadcast notification (all users)
    /// </summary>
    public async Task CreateBroadcastNotificationAsync(string type, string title, string message, string? link = null, string priority = "normal", string createdBy = "System")
    {
        await CreateNotificationAsync(new CreateNotificationRequest
        {
            Type = type,
            Title = title,
            Message = message,
            Link = link,
            Priority = priority
        }, createdBy);
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    public async Task<ApiResponse<bool>> DeleteNotificationAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && (n.UserId == userId || n.UserId == null));

        if (notification == null)
            return ApiResponse<bool>.Fail("Notification not found");

        notification.IsActive = false;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Notification deleted");
    }

    /// <summary>
    /// Clean up old notifications (older than specified days)
    /// </summary>
    public async Task<int> CleanupOldNotificationsAsync(int daysOld = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysOld);
        var oldNotifications = await _context.Notifications
            .Where(n => n.IsRead && n.CreatedDate < cutoffDate)
            .ToListAsync();

        _context.Notifications.RemoveRange(oldNotifications);
        await _context.SaveChangesAsync();

        return oldNotifications.Count;
    }

    // ====================================
    // AUTO-GENERATED NOTIFICATIONS
    // ====================================

    /// <summary>
    /// Generate notifications for pending approvals
    /// </summary>
    public async Task GeneratePendingApprovalNotificationsAsync()
    {
        // Get sizing job cards that are pending approval (Prepared or Checked status)
        var pendingSizingCards = await _context.SizingJobCards
            .Where(s => s.IsActive && (s.Status == "Prepared" || s.Status == "Checked"))
            .Include(s => s.Party)
            .ToListAsync();

        foreach (var card in pendingSizingCards)
        {
            // Check if we already have a notification for this
            var existingNotification = await _context.Notifications
                .AnyAsync(n => n.ReferenceType == "SizingJobCard" && n.ReferenceId == card.Id && !n.IsRead);

            if (!existingNotification)
            {
                // Determine the approval level based on status
                int approvalLevel = card.Status == "Prepared" ? 2 : 3; // Level 2 for Prepared, Level 3 for Checked
                
                // Find the role that needs to approve based on ApprovalLevel
                var approvalMatrix = await _context.ApprovalMatrix
                    .FirstOrDefaultAsync(a => a.DocumentType == "SizingJobCard" && a.ApprovalLevel == approvalLevel);

                if (approvalMatrix != null)
                {
                    await CreateNotificationAsync(new CreateNotificationRequest
                    {
                        Type = "approval",
                        Title = "Pending Approval",
                        Message = $"Sizing Job Card {card.JobCardNumber} needs your approval",
                        Link = "/sizing/sizing-job-card",
                        Priority = "high",
                        RoleId = approvalMatrix.RequiredRoleId,
                        ReferenceType = "SizingJobCard",
                        ReferenceId = card.Id
                    }, "System");
                }
            }
        }
    }

    /// <summary>
    /// Generate notifications for overdue invoices
    /// </summary>
    public async Task GenerateOverdueInvoiceNotificationsAsync()
    {
        var overdueInvoices = await _context.TaxInvoices
            .Where(i => i.IsActive && i.Status == "Finalized" && i.DueDate < DateTime.Today)
            .Include(i => i.Party)
            .ToListAsync();

        foreach (var invoice in overdueInvoices)
        {
            var existingNotification = await _context.Notifications
                .AnyAsync(n => n.ReferenceType == "TaxInvoice" && n.ReferenceId == invoice.Id && !n.IsRead);

            if (!existingNotification)
            {
                var daysOverdue = (DateTime.Today - invoice.DueDate.Value).Days;
                await CreateBroadcastNotificationAsync(
                    "invoice",
                    "Invoice Overdue",
                    $"Invoice {invoice.InvoiceNumber} is overdue by {daysOverdue} day(s)",
                    "/sizing/invoices",
                    daysOverdue > 7 ? "urgent" : "high",
                    "System");

                // Update the notification with reference
                var notification = await _context.Notifications
                    .OrderByDescending(n => n.Id)
                    .FirstAsync();
                notification.ReferenceType = "TaxInvoice";
                notification.ReferenceId = invoice.Id;
                await _context.SaveChangesAsync();
            }
        }
    }

    /// <summary>
    /// Generate notifications for low stock alerts
    /// </summary>
    public async Task GenerateLowStockNotificationsAsync()
    {
        // Get low stock threshold from system configuration
        var thresholdConfig = await _context.SystemConfigurations
            .FirstOrDefaultAsync(c => c.ConfigKey == "LowStockThreshold");
        var threshold = decimal.TryParse(thresholdConfig?.ConfigValue, out var t) ? t : 500m;

        // Get stock ledger entries and aggregate on client side (SQLite doesn't support Sum on decimal)
        var stockData = await _context.StockLedgers
            .Include(s => s.YarnCount)
            .Where(s => s.IsActive && s.YarnCount != null)
            .Select(s => new { s.YarnCountId, s.YarnCount.CountCode, s.YarnCount.Ply, s.InwardQty, s.OutwardQty })
            .ToListAsync();

        var lowStockItems = stockData
            .GroupBy(s => new { s.YarnCountId, s.CountCode, s.Ply })
            .Select(g => new
            {
                YarnCountId = g.Key.YarnCountId,
                YarnCountCode = g.Key.CountCode,
                Ply = g.Key.Ply,
                CurrentStock = g.Sum(x => x.InwardQty - x.OutwardQty)
            })
            .Where(x => x.CurrentStock < threshold && x.CurrentStock > 0)
            .ToList();

        foreach (var item in lowStockItems)
        {
            var existingNotification = await _context.Notifications
                .AnyAsync(n => n.ReferenceType == "YarnStock" && n.ReferenceId == item.YarnCountId && !n.IsRead);

            if (!existingNotification)
            {
                await CreateBroadcastNotificationAsync(
                    "stock",
                    "Low Stock Alert",
                    $"Yarn Count {item.YarnCountCode} (Ply: {item.Ply}) stock is low ({item.CurrentStock:N0} kg)",
                    "/sizing/yarn-stock",
                    item.CurrentStock < (threshold / 2) ? "urgent" : "high",
                    "System");

                var notification = await _context.Notifications
                    .OrderByDescending(n => n.Id)
                    .FirstAsync();
                notification.ReferenceType = "YarnStock";
                notification.ReferenceId = item.YarnCountId;
                await _context.SaveChangesAsync();
            }
        }
    }
}
