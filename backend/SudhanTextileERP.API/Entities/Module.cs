namespace SudhanTextileERP.API.Entities;

/// <summary>
/// Represents a module in the ERP system for permission management
/// </summary>
public class Module : BaseEntity
{
    /// <summary>
    /// Unique key for the module (e.g., YARN_RECEIPT, SIZING_JOB_CARD)
    /// </summary>
    public string ModuleKey { get; set; } = string.Empty;
    
    /// <summary>
    /// Display name for the module
    /// </summary>
    public string ModuleName { get; set; } = string.Empty;
    
    /// <summary>
    /// Parent module group (e.g., SIZING, MASTERS, REPORTS, SETTINGS)
    /// </summary>
    public string ParentModule { get; set; } = string.Empty;
    
    /// <summary>
    /// Frontend route path
    /// </summary>
    public string RoutePath { get; set; } = string.Empty;
    
    /// <summary>
    /// Icon name for the module
    /// </summary>
    public string Icon { get; set; } = string.Empty;
    
    /// <summary>
    /// Display order within parent module
    /// </summary>
    public int SortOrder { get; set; }
    
    /// <summary>
    /// Description of the module
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Whether the module is active
    /// </summary>
    public new bool IsActive { get; set; } = true;
    
    /// <summary>
    /// Navigation property to permissions
    /// </summary>
    public virtual ICollection<Permission> Permissions { get; set; } = new List<Permission>();
}

/// <summary>
/// Module groups/categories
/// </summary>
public static class ModuleGroups
{
    public const string Dashboard = "DASHBOARD";
    public const string Masters = "MASTERS";
    public const string SizingERP = "SIZING";
    public const string Reports = "REPORTS";
    public const string Settings = "SETTINGS";
}

/// <summary>
/// Module keys for all individual modules
/// </summary>
public static class ModuleKeys
{
    // Dashboard
    public const string Dashboard = "DASHBOARD";
    
    // Masters
    public const string Company = "COMPANY";
    public const string Party = "PARTY";
    public const string YarnCount = "YARN_COUNT";
    public const string LoomType = "LOOM_TYPE";
    public const string Beam = "BEAM";
    public const string Vehicle = "VEHICLE";
    public const string FinancialYear = "FINANCIAL_YEAR";
    public const string DocumentSeries = "DOCUMENT_SERIES";
    
    // Sizing ERP
    public const string YarnReceipt = "YARN_RECEIPT";
    public const string BabyCone = "BABY_CONE";
    public const string WarpingJobCard = "WARPING_JOB_CARD";
    public const string SizingJobCard = "SIZING_JOB_CARD";
    public const string BeamManagement = "BEAM_MANAGEMENT";
    public const string YarnStock = "YARN_STOCK";
    public const string YarnReturn = "YARN_RETURN";
    public const string YarnDelivery = "YARN_DELIVERY";
    public const string GSTInvoice = "GST_INVOICE";
    
    // Reports
    public const string YarnStockReport = "YARN_STOCK_REPORT";
    public const string SetProductionReport = "SET_PRODUCTION_REPORT";
    public const string BeamUtilizationReport = "BEAM_UTILIZATION_REPORT";
    public const string PartyLedgerReport = "PARTY_LEDGER_REPORT";
    public const string InvoiceRegisterReport = "INVOICE_REGISTER_REPORT";
    public const string PendingInvoicesReport = "PENDING_INVOICES_REPORT";
    
    // Settings
    public const string UserManagement = "USER_MANAGEMENT";
    public const string RolePermissions = "ROLE_PERMISSIONS";
    public const string ApprovalMatrix = "APPROVAL_MATRIX";
    public const string SystemSettings = "SYSTEM_SETTINGS";
    public const string SecurityPolicies = "SECURITY_POLICIES";
    public const string AuditLogs = "AUDIT_LOGS";
    public const string Backup = "BACKUP";
    public const string Notifications = "NOTIFICATIONS";
}

/// <summary>
/// Permission actions
/// </summary>
public static class PermissionActions
{
    public const string View = "VIEW";
    public const string Create = "CREATE";
    public const string Edit = "EDIT";
    public const string Delete = "DELETE";
    public const string Approve = "APPROVE";
    public const string Print = "PRINT";
    public const string Export = "EXPORT";
}
