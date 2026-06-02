namespace SudhanTextileERP.API.Entities;

/// <summary>
/// Represents a real-time notification for users
/// </summary>
public class Notification : BaseEntity
{
    public string Type { get; set; } = string.Empty; // approval, invoice, stock, document, system
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Priority { get; set; } = "normal"; // low, normal, high, urgent
    public string? Link { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
    
    // Target user/role - if null, it's a broadcast
    public int? UserId { get; set; }
    public int? RoleId { get; set; }
    
    // Reference to source entity
    public string? ReferenceType { get; set; } // SizingJobCard, TaxInvoice, YarnReceipt, etc.
    public int? ReferenceId { get; set; }
    
    // Navigation
    public virtual User? User { get; set; }
    public virtual Role? TargetRole { get; set; }
}
