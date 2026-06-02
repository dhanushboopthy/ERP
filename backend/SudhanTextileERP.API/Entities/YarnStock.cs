namespace SudhanTextileERP.API.Entities;

public class YarnStock : BaseEntity
{
    public int YarnCountId { get; set; }
    public int PartyId { get; set; }
    public string? LotNo { get; set; }
    public string TransactionType { get; set; } = string.Empty; // YarnReceipt, WarpingIssue, Return, etc.
    public int TransactionId { get; set; }
    public DateTime TransactionDate { get; set; }
    public decimal InwardQtyKg { get; set; }
    public decimal OutwardQtyKg { get; set; }
    public decimal CurrentBalanceKg { get; set; }
    public int FinancialYearId { get; set; }

    // Navigation
    public virtual YarnCount YarnCount { get; set; } = null!;
    public virtual Party Party { get; set; } = null!;
    public virtual FinancialYear FinancialYear { get; set; } = null!;
}
