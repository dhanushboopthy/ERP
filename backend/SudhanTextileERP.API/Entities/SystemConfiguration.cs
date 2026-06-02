namespace SudhanTextileERP.API.Entities;

public class SystemConfiguration : BaseEntity
{
    public string ConfigKey { get; set; } = string.Empty;
    public string ConfigValue { get; set; } = string.Empty;
    public string ConfigType { get; set; } = string.Empty; // String, Number, Boolean, Json
    public string Category { get; set; } = string.Empty; // General, Stock, Invoice, Security, Notification
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsEditable { get; set; } = true;
    public int SortOrder { get; set; }
}

public class SecurityPolicy : BaseEntity
{
    public string PolicyKey { get; set; } = string.Empty;
    public string PolicyValue { get; set; } = string.Empty;
    public string PolicyType { get; set; } = string.Empty; // Password, Session, Login
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class BackupConfiguration : BaseEntity
{
    public string BackupType { get; set; } = string.Empty; // Full, Differential
    public string Frequency { get; set; } = string.Empty; // Daily, Weekly, Monthly
    public int RetentionDays { get; set; } = 30;
    public string BackupPath { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public DateTime? LastBackupTime { get; set; }
    public string? LastBackupStatus { get; set; }
    public string? LastBackupSize { get; set; }
    public DateTime? NextScheduledBackup { get; set; }
}

public class NotificationSetting : BaseEntity
{
    public string NotificationType { get; set; } = string.Empty; // Email, SMS, InApp
    public string EventType { get; set; } = string.Empty; // OverdueInvoice, LowStock, ApprovalPending
    public string DisplayName { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public int? ThresholdValue { get; set; }
    public string? RecipientRoles { get; set; } // JSON array of role IDs
    public string? EmailTemplate { get; set; }
}

public class UserSession
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string SessionToken { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? DeviceInfo { get; set; }
    public DateTime LoginTime { get; set; } = DateTime.UtcNow;
    public DateTime? LogoutTime { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public virtual User User { get; set; } = null!;
}
