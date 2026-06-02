namespace SudhanTextileERP.API.Entities;

public class FinancialYear : BaseEntity
{
    public string YearCode { get; set; } = string.Empty;
    public string YearName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; } // Default FY for new transactions
    public bool IsClosed { get; set; }
    public DateTime? ClosedAt { get; set; }
    public int? ClosedByUserId { get; set; }
    public string? ClosureRemarks { get; set; }

    // Navigation
    public virtual ICollection<DocumentNumberSeries> DocumentNumberSeries { get; set; } = new List<DocumentNumberSeries>();
    public virtual ICollection<YarnReceipt> YarnReceipts { get; set; } = new List<YarnReceipt>();
    public virtual ICollection<SizingJobCard> SizingJobCards { get; set; } = new List<SizingJobCard>();
    public virtual ICollection<TaxInvoice> TaxInvoices { get; set; } = new List<TaxInvoice>();
}
