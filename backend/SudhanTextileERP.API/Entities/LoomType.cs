namespace SudhanTextileERP.API.Entities;

public class LoomType : BaseEntity
{
    public string LoomTypeCode { get; set; } = string.Empty;
    public string LoomTypeName { get; set; } = string.Empty;
    public decimal? WidthInches { get; set; }

    // Navigation
    public virtual ICollection<SizingJobCard> SizingJobCards { get; set; } = new List<SizingJobCard>();
}
