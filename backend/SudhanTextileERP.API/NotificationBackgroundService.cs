using SudhanTextileERP.API.Services;

namespace SudhanTextileERP.API;

/// <summary>
/// Background service that periodically generates notifications and performs cleanup
/// </summary>
public class NotificationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5); // Check every 5 minutes

    public NotificationBackgroundService(IServiceProvider serviceProvider, ILogger<NotificationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Notification Background Service started");

        // Initial seed of sample notifications on startup
        await SeedInitialNotificationsAsync();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await GenerateNotificationsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in notification background service");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Notification Background Service stopped");
    }

    private async Task SeedInitialNotificationsAsync()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

            // Create welcome notification for all users
            await notificationService.CreateBroadcastNotificationAsync(
                "system",
                "Welcome to Sudhan Textile ERP",
                "Real-time notifications are now active. You will receive alerts for approvals, invoices, and stock updates.",
                "/dashboard",
                "low",
                "System");

            _logger.LogInformation("Initial notifications seeded successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding initial notifications");
        }
    }

    private async Task GenerateNotificationsAsync()
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var notificationService = scope.ServiceProvider.GetRequiredService<NotificationService>();

            // Generate different types of notifications
            await notificationService.GeneratePendingApprovalNotificationsAsync();
            await notificationService.GenerateOverdueInvoiceNotificationsAsync();
            await notificationService.GenerateLowStockNotificationsAsync();

            // Cleanup old notifications (older than 30 days)
            var cleaned = await notificationService.CleanupOldNotificationsAsync(30);
            if (cleaned > 0)
            {
                _logger.LogInformation($"Cleaned up {cleaned} old notifications");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating notifications");
        }
    }
}
