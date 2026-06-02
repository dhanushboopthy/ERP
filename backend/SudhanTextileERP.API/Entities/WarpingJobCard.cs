namespace SudhanTextileERP.API.Entities;

public class WarpingJobCard : BaseEntity
{
    public string JobCardNumber { get; set; } = string.Empty;
    public string SetNo { get; set; } = string.Empty;
    public DateTime JobCardDate { get; set; }
    public int PartyId { get; set; }
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public int TotalEnds { get; set; }
    public int EndsPerBeam { get; set; }
    public decimal SetLength { get; set; }
    public decimal? ActualLength { get; set; }
    public int NumberOfBeams { get; set; }
    public string? WarpingMachineNo { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, InProgress, Completed
    public DateTime? WarpingDate { get; set; }
    public int FinancialYearId { get; set; }
    public string? Remarks { get; set; }
    public bool IsLocked { get; set; } = false;

    // Navigation
    public virtual Party Party { get; set; } = null!;
    public virtual YarnCount YarnCount { get; set; } = null!;
    public virtual FinancialYear FinancialYear { get; set; } = null!;
    public virtual ICollection<WarpingJobCardBeam> Beams { get; set; } = new List<WarpingJobCardBeam>();
}
