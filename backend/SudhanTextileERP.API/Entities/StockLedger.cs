namespace SudhanTextileERP.API.Entities;

/// <summary>
/// Unified Stock Ledger - Single source of truth for all stock movements
/// All stock reports read ONLY from this table
/// Ledger updates ONLY on Approved status
/// </summary>
public class StockLedger : BaseEntity
{
    public DateTime TransactionDate { get; set; }
    
    /// <summary>
    /// Module that created this entry: YarnReceipt, BabyCone, YarnReturn, YarnDelivery, SizingJobCard
    /// </summary>
    public string Module { get; set; } = string.Empty;
    
    /// <summary>
    /// Reference number from the source document (e.g., YR/2024/0001)
    /// </summary>
    public string ReferenceNo { get; set; } = string.Empty;
    
    /// <summary>
    /// ID of the source document
    /// </summary>
    public int ReferenceId { get; set; }
    
    public int YarnCountId { get; set; }
    public int PartyId { get; set; }
    public string? LotNo { get; set; }
    
    /// <summary>
    /// Quantity added to stock
    /// </summary>
    public decimal InwardQty { get; set; }
    
    /// <summary>
    /// Quantity removed from stock
    /// </summary>
    public decimal OutwardQty { get; set; }
    
    /// <summary>
    /// Running balance after this transaction
    /// </summary>
    public decimal BalanceQty { get; set; }
    
    /// <summary>
    /// Rate per unit (for valuation)
    /// </summary>
    public decimal RatePerUnit { get; set; }
    
    /// <summary>
    /// Value of this transaction
    /// </summary>
    public decimal TransactionValue { get; set; }
    
    /// <summary>
    /// Type of transaction: Inward, Outward, Return, Adjustment
    /// </summary>
    public string TransactionType { get; set; } = string.Empty;
    
    /// <summary>
    /// Additional description/narration
    /// </summary>
    public string? Narration { get; set; }
    
    public int FinancialYearId { get; set; }
    
    // Navigation properties
    public virtual YarnCount YarnCount { get; set; } = null!;
    public virtual Party Party { get; set; } = null!;
    public virtual FinancialYear FinancialYear { get; set; } = null!;
}
