namespace SudhanTextileERP.API.Entities;

public class SizingJobCard : BaseEntity
{
    public string JobCardNumber { get; set; } = string.Empty;
    public DateTime JobCardDate { get; set; }
    public int PartyId { get; set; }
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public string SetNo { get; set; } = string.Empty;
    public int? LoomTypeId { get; set; }
    public int TotalEnds { get; set; }
    public decimal SetLength { get; set; }
    public decimal? ActualLength { get; set; }
    public decimal? BeamWidth { get; set; }
    public string? SizingMachineNo { get; set; }
    public string? SizeRecipe { get; set; }
    public int? OutputSizingBeamId { get; set; }
    public decimal? OutputWeight { get; set; }
    public DateTime? SizingDate { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Prepared, Checked, Approved, Authorized, Completed, Invoiced
    public int? InvoiceId { get; set; }
    
    // Approval fields
    public string? PreparedBy { get; set; }
    public DateTime? PreparedDate { get; set; }
    public string? CheckedBy { get; set; }
    public DateTime? CheckedDate { get; set; }
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? AuthorizedBy { get; set; }
    public DateTime? AuthorizedDate { get; set; }
    
    public int FinancialYearId { get; set; }
    public string? Remarks { get; set; }
    public bool IsLocked { get; set; } = false;

    // Navigation
    public virtual Party Party { get; set; } = null!;
    public virtual YarnCount YarnCount { get; set; } = null!;
    public virtual LoomType? LoomType { get; set; }
    public virtual FinancialYear FinancialYear { get; set; } = null!;
    public virtual Beam? OutputSizingBeam { get; set; }
    public virtual TaxInvoice? Invoice { get; set; }
    public virtual ICollection<SizingJobCardBeam> SourceBeams { get; set; } = new List<SizingJobCardBeam>();
}
