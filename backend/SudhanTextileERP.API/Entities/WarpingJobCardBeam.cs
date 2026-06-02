namespace SudhanTextileERP.API.Entities;

public class WarpingJobCardBeam : BaseEntity
{
    public int WarpingJobCardId { get; set; }
    public int BeamId { get; set; }
    public int BeamSequence { get; set; }
    public DateTime? WarpingDate { get; set; }
    public int? EndsOnBeam { get; set; }
    public decimal? BeamWeight { get; set; }

    // Navigation
    public virtual WarpingJobCard WarpingJobCard { get; set; } = null!;
    public virtual Beam Beam { get; set; } = null!;
}
