namespace SudhanTextileERP.API.Entities;

public class SizingJobCardBeam : BaseEntity
{
    public int SizingJobCardId { get; set; }
    public int BeamId { get; set; }
    public int BeamSequence { get; set; }
    public int? EndsOnBeam { get; set; }

    // Navigation
    public virtual SizingJobCard SizingJobCard { get; set; } = null!;
    public virtual Beam Beam { get; set; } = null!;
}
