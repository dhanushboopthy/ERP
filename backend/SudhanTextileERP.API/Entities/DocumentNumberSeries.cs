namespace SudhanTextileERP.API.Entities;

public class DocumentNumberSeries : BaseEntity
{
    public string DocumentType { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public int FinancialYearId { get; set; }
    public string Prefix { get; set; } = string.Empty;
    public string? Suffix { get; set; }
    public int CurrentNumber { get; set; }
    public int PadLength { get; set; } = 6;
    public bool ResetOnFYChange { get; set; } = true;
    public bool AllowManualOverride { get; set; } = false;
    public bool LockAfterPrint { get; set; } = false;
    public bool LockAfterApproval { get; set; } = true;

    // Navigation
    public virtual FinancialYear FinancialYear { get; set; } = null!;
}
