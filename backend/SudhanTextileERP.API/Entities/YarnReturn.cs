namespace SudhanTextileERP.API.Entities;

public class YarnReturn : BaseEntity
{
    public string DCNo { get; set; } = string.Empty;
    public DateTime DCDate { get; set; }
    public int FinancialYearId { get; set; }
    public int PartyId { get; set; }
    public string ReturnType { get; set; } = "Jobwork"; // Mill or Jobwork
    public int? SizingJobCardId { get; set; }
    public int? VehicleId { get; set; }
    public string? DriverName { get; set; }
    public decimal TotalWeight { get; set; }
    public bool IsNotForSale { get; set; } = true;
    public string Status { get; set; } = "Draft"; // Draft, Approved, Dispatched
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? Remarks { get; set; }

    // Navigation
    public virtual FinancialYear FinancialYear { get; set; } = null!;
    public virtual Party Party { get; set; } = null!;
    public virtual SizingJobCard? SizingJobCard { get; set; }
    public virtual Vehicle? Vehicle { get; set; }
    public virtual ICollection<YarnReturnDetail> Details { get; set; } = new List<YarnReturnDetail>();
}

public class YarnReturnDetail : BaseEntity
{
    public int YarnReturnId { get; set; }
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public int Bags { get; set; }
    public int Cones { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
    public decimal NetWeight { get; set; }

    // Navigation
    public virtual YarnReturn YarnReturn { get; set; } = null!;
    public virtual YarnCount YarnCount { get; set; } = null!;
}
