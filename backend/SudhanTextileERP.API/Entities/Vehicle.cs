namespace SudhanTextileERP.API.Entities;

public class Vehicle : BaseEntity
{
    public string VehicleNo { get; set; } = string.Empty;
    public string? VehicleType { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string? OwnerName { get; set; }

    // Navigation
    public virtual ICollection<YarnReceipt> YarnReceipts { get; set; } = new List<YarnReceipt>();
}
