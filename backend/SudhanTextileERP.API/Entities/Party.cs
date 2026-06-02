namespace SudhanTextileERP.API.Entities;

public class Party : BaseEntity
{
    public string PartyCode { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public string PartyType { get; set; } = "Customer"; // Customer, Vendor, Both
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string StateCode { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
    public string? Phone { get; set; }
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public string? ContactPerson { get; set; }
    public string? GSTIN { get; set; }
    public string? PAN { get; set; }
    public int CreditDays { get; set; }
    public decimal CreditLimit { get; set; }
    public bool IsBillToBill { get; set; }
    public decimal OpeningBalance { get; set; }
    public string OpeningBalanceType { get; set; } = "Dr"; // Dr, Cr

    // Navigation
    public virtual ICollection<YarnReceipt> YarnReceipts { get; set; } = new List<YarnReceipt>();
    public virtual ICollection<SizingJobCard> SizingJobCards { get; set; } = new List<SizingJobCard>();
    public virtual ICollection<TaxInvoice> TaxInvoices { get; set; } = new List<TaxInvoice>();
}
