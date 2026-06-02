namespace SudhanTextileERP.API.Entities;

public class YarnReceipt : BaseEntity
{
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime ReceiptDate { get; set; }
    public int PartyId { get; set; }
    public string? PDCNo { get; set; }
    public DateTime? PDCDate { get; set; }
    public string? MillName { get; set; }
    public int? VehicleId { get; set; }
    public string? VehicleNo { get; set; }
    public string? DriverName { get; set; }
    public int FinancialYearId { get; set; }
    public string? Remarks { get; set; }
    
    // Status and Approval workflow
    public string Status { get; set; } = "Draft"; // Draft, Approved
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    
    public bool IsLocked { get; set; } = false;
    public bool IsUsedInJobCard { get; set; } = false;

    // Navigation
    public virtual Party Party { get; set; } = null!;
    public virtual Vehicle? Vehicle { get; set; }
    public virtual FinancialYear FinancialYear { get; set; } = null!;
    public virtual ICollection<YarnReceiptDetail> Details { get; set; } = new List<YarnReceiptDetail>();
}
