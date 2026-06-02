namespace SudhanTextileERP.API.Entities;

public class ApprovalMatrix : BaseEntity
{
    public string DocumentType { get; set; } = string.Empty; // YarnReceipt, WarpingJobCard, SizingJobCard, etc.
    public int ApprovalLevel { get; set; } // 1, 2, 3, 4
    public string LevelName { get; set; } = string.Empty; // Prepared, Checked, Approved, Authorized
    public int RequiredRoleId { get; set; }
    public bool IsRequired { get; set; } = true;
    public decimal? AutoApprovalThreshold { get; set; } // Amount threshold for auto-approval
    public int SortOrder { get; set; }

    // Navigation
    public virtual Role RequiredRole { get; set; } = null!;
}

public class ApprovalHistory : BaseEntity
{
    public string DocumentType { get; set; } = string.Empty;
    public int DocumentId { get; set; }
    public int ApprovalLevel { get; set; }
    public string LevelName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Approved, Rejected, Returned
    public int ApprovedByUserId { get; set; }
    public DateTime ApprovalDate { get; set; } = DateTime.UtcNow;
    public string? Comments { get; set; }
    public string? IpAddress { get; set; }

    // Navigation
    public virtual User ApprovedByUser { get; set; } = null!;
}
