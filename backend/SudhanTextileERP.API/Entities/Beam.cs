namespace SudhanTextileERP.API.Entities;

public class Beam : BaseEntity
{
    public string BeamNo { get; set; } = string.Empty;
    public string BeamType { get; set; } = "Sizing Beam"; // Sizing Beam, Warping Beam
    public decimal TareWeight { get; set; }
    public decimal? WidthInches { get; set; }
    public int? MaxEnds { get; set; }
    public string Status { get; set; } = "Available"; // Available, InUse, Maintenance, SizingComplete
    public int? CurrentJobCardId { get; set; }
    public string? CurrentJobCardType { get; set; }

    // Navigation
    public virtual ICollection<WarpingJobCardBeam> WarpingJobCardBeams { get; set; } = new List<WarpingJobCardBeam>();
    public virtual ICollection<SizingJobCardBeam> SizingJobCardBeams { get; set; } = new List<SizingJobCardBeam>();
}
