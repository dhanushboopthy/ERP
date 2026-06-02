namespace SudhanTextileERP.API.Entities;

/// <summary>
/// Security audit log entity for comprehensive security event tracking
/// Phase-2 Enterprise Security
/// </summary>
public class SecurityAuditLog
{
    public long Id { get; set; }
    public DateTime Timestamp { get; set; }
    public string EventType { get; set; } = string.Empty;
    public int SeverityLevel { get; set; }
    public string EventCategory { get; set; } = string.Empty;
    public string? UserId { get; set; }
    public string? Username { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? RequestPath { get; set; }
    public string? RequestMethod { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? AffectedResource { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public bool IsSuccessful { get; set; }
    public string? FailureReason { get; set; }
    public string? CorrelationId { get; set; }
    public string? SessionId { get; set; }
}
