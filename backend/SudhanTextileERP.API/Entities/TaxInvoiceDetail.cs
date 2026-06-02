namespace SudhanTextileERP.API.Entities;

public class TaxInvoiceDetail : BaseEntity
{
    public int TaxInvoiceId { get; set; }
    public int? SizingJobCardId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string HSNCode { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string UOM { get; set; } = "MTR";
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
    public decimal CGSTRate { get; set; }
    public decimal CGSTAmount { get; set; }
    public decimal SGSTRate { get; set; }
    public decimal SGSTAmount { get; set; }
    public decimal IGSTRate { get; set; }
    public decimal IGSTAmount { get; set; }

    // Navigation
    public virtual TaxInvoice TaxInvoice { get; set; } = null!;
    public virtual SizingJobCard? SizingJobCard { get; set; }
}
