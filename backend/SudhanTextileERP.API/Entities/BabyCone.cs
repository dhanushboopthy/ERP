namespace SudhanTextileERP.API.Entities;

public class BabyCone : BaseEntity
{
    public string BabyConeNo { get; set; } = string.Empty;
    public DateTime BabyConeDate { get; set; }
    public int FinancialYearId { get; set; }
    public int YarnReceiptId { get; set; }
    public int YarnReceiptDetailId { get; set; }
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public int BagNo { get; set; }
    public int TotalCones { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
    public decimal NetWeight { get; set; }
    public decimal WindingLoss { get; set; }
    public decimal LeftoverWeight { get; set; }
    public bool IsUsedInWarping { get; set; }
    public string? Remarks { get; set; }

    // Navigation
    public virtual FinancialYear FinancialYear { get; set; } = null!;
    public virtual YarnReceipt YarnReceipt { get; set; } = null!;
    public virtual YarnReceiptDetail YarnReceiptDetail { get; set; } = null!;
    public virtual YarnCount YarnCount { get; set; } = null!;
}
