namespace SudhanTextileERP.API.Entities;

public class TaxInvoice : BaseEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime InvoiceDate { get; set; }
    public int PartyId { get; set; }
    public string PlaceOfSupply { get; set; } = string.Empty;
    public bool IsInterState { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal CGSTAmount { get; set; }
    public decimal SGSTAmount { get; set; }
    public decimal IGSTAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal RoundOff { get; set; }
    public decimal GrandTotal { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Finalized, Cancelled
    public int FinancialYearId { get; set; }
    public DateTime? DueDate { get; set; }
    public string? TransportMode { get; set; }
    public string? VehicleNo { get; set; }
    public string? EwayBillNo { get; set; }
    public DateTime? EwayBillDate { get; set; }
    public string? IRNNumber { get; set; }
    public DateTime? IRNDate { get; set; }
    public string? Remarks { get; set; }
    public bool IsLocked { get; set; } = false;
    public bool IsPrinted { get; set; } = false;
    public DateTime? PrintedAt { get; set; }

    // Navigation
    public virtual Party Party { get; set; } = null!;
    public virtual FinancialYear FinancialYear { get; set; } = null!;
    public virtual ICollection<TaxInvoiceDetail> Details { get; set; } = new List<TaxInvoiceDetail>();
    public virtual ICollection<SizingJobCard> SizingJobCards { get; set; } = new List<SizingJobCard>();
}
