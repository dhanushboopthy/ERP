namespace SudhanTextileERP.API.Entities;

public class YarnCount : BaseEntity
{
    public string CountCode { get; set; } = string.Empty;
    public string? CountDescription { get; set; }
    public int Ply { get; set; } = 1;

    // Navigation
    public virtual ICollection<YarnReceiptDetail> YarnReceiptDetails { get; set; } = new List<YarnReceiptDetail>();
    public virtual ICollection<SizingJobCard> SizingJobCards { get; set; } = new List<SizingJobCard>();
}
