namespace SudhanTextileERP.API.Entities;

public class YarnDelivery : BaseEntity
{
    public string DCNo { get; set; } = string.Empty;
    public DateTime DCDate { get; set; }
    public int FinancialYearId { get; set; }
    public int PartyId { get; set; }
    public int? VehicleId { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public decimal TotalWeight { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Approved, Dispatched
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? DispatchedBy { get; set; }
    public DateTime? DispatchedDate { get; set; }
    public string? ReceiverSignature { get; set; }
    public string? Remarks { get; set; }

    // Navigation
    public virtual FinancialYear FinancialYear { get; set; } = null!;
    public virtual Party Party { get; set; } = null!;
    public virtual Vehicle? Vehicle { get; set; }
    public virtual ICollection<YarnDeliveryDetail> Details { get; set; } = new List<YarnDeliveryDetail>();
}

public class YarnDeliveryDetail : BaseEntity
{
    public int YarnDeliveryId { get; set; }
    public int YarnCountId { get; set; }
    public string? LotNo { get; set; }
    public int Bags { get; set; }
    public int Cones { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal TareWeight { get; set; }
    public decimal NetWeight { get; set; }
    public decimal RatePerKg { get; set; }
    public decimal Amount { get; set; }

    // Navigation
    public virtual YarnDelivery YarnDelivery { get; set; } = null!;
    public virtual YarnCount YarnCount { get; set; } = null!;
}
