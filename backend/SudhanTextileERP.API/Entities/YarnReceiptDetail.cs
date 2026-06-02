namespace SudhanTextileERP.API.Entities;

public class YarnReceiptDetail : BaseEntity
{
    public int YarnReceiptId { get; set; }
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public string? BagNo { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
    public decimal NetWeight { get; set; } // Computed: GrossWeight - TareWeight
    public int? ConeCount { get; set; }
    public decimal RatePerKg { get; set; }

    // Navigation
    public virtual YarnReceipt YarnReceipt { get; set; } = null!;
    public virtual YarnCount YarnCount { get; set; } = null!;
}
