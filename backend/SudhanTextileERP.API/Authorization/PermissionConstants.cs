namespace SudhanTextileERP.API.Authorization;

/// <summary>
/// Defines all permission constants for the ERP system.
/// Format: Module.Action
/// </summary>
public static class Permissions
{
    // Dashboard
    public const string DashboardView = "Dashboard.View";
    
    // Masters
    public const string MastersView = "Masters.View";
    public const string MastersCreate = "Masters.Create";
    public const string MastersEdit = "Masters.Edit";
    public const string MastersDelete = "Masters.Delete";
    
    // Company
    public const string CompanyView = "Company.View";
    public const string CompanyEdit = "Company.Edit";
    
    // Party
    public const string PartyView = "Party.View";
    public const string PartyCreate = "Party.Create";
    public const string PartyEdit = "Party.Edit";
    public const string PartyDelete = "Party.Delete";
    
    // Yarn Count
    public const string YarnCountView = "YarnCount.View";
    public const string YarnCountCreate = "YarnCount.Create";
    public const string YarnCountEdit = "YarnCount.Edit";
    public const string YarnCountDelete = "YarnCount.Delete";
    
    // Loom Type
    public const string LoomTypeView = "LoomType.View";
    public const string LoomTypeCreate = "LoomType.Create";
    public const string LoomTypeEdit = "LoomType.Edit";
    public const string LoomTypeDelete = "LoomType.Delete";
    
    // Beam
    public const string BeamView = "Beam.View";
    public const string BeamCreate = "Beam.Create";
    public const string BeamEdit = "Beam.Edit";
    public const string BeamDelete = "Beam.Delete";
    
    // Vehicle
    public const string VehicleView = "Vehicle.View";
    public const string VehicleCreate = "Vehicle.Create";
    public const string VehicleEdit = "Vehicle.Edit";
    public const string VehicleDelete = "Vehicle.Delete";
    
    // Yarn Receipt
    public const string YarnReceiptView = "YarnReceipt.View";
    public const string YarnReceiptCreate = "YarnReceipt.Create";
    public const string YarnReceiptEdit = "YarnReceipt.Edit";
    public const string YarnReceiptDelete = "YarnReceipt.Delete";
    public const string YarnReceiptApprove = "YarnReceipt.Approve";
    public const string YarnReceiptPrint = "YarnReceipt.Print";
    
    // Warping Job Card
    public const string WarpingView = "Warping.View";
    public const string WarpingCreate = "Warping.Create";
    public const string WarpingEdit = "Warping.Edit";
    public const string WarpingDelete = "Warping.Delete";
    public const string WarpingApprove = "Warping.Approve";
    public const string WarpingPrint = "Warping.Print";
    
    // Sizing Job Card
    public const string SizingView = "Sizing.View";
    public const string SizingCreate = "Sizing.Create";
    public const string SizingEdit = "Sizing.Edit";
    public const string SizingDelete = "Sizing.Delete";
    public const string SizingApprove = "Sizing.Approve";
    public const string SizingPrint = "Sizing.Print";
    
    // Baby Cone
    public const string BabyConeView = "BabyCone.View";
    public const string BabyConeCreate = "BabyCone.Create";
    public const string BabyConeEdit = "BabyCone.Edit";
    public const string BabyConeDelete = "BabyCone.Delete";
    
    // Yarn Stock
    public const string YarnStockView = "YarnStock.View";
    public const string YarnStockAdjust = "YarnStock.Adjust";
    
    // Yarn Return
    public const string YarnReturnView = "YarnReturn.View";
    public const string YarnReturnCreate = "YarnReturn.Create";
    public const string YarnReturnEdit = "YarnReturn.Edit";
    public const string YarnReturnDelete = "YarnReturn.Delete";
    public const string YarnReturnApprove = "YarnReturn.Approve";
    
    // Yarn Delivery
    public const string YarnDeliveryView = "YarnDelivery.View";
    public const string YarnDeliveryCreate = "YarnDelivery.Create";
    public const string YarnDeliveryEdit = "YarnDelivery.Edit";
    public const string YarnDeliveryDelete = "YarnDelivery.Delete";
    public const string YarnDeliveryApprove = "YarnDelivery.Approve";
    
    // Invoice
    public const string InvoiceView = "Invoice.View";
    public const string InvoiceCreate = "Invoice.Create";
    public const string InvoiceEdit = "Invoice.Edit";
    public const string InvoiceDelete = "Invoice.Delete";
    public const string InvoiceApprove = "Invoice.Approve";
    public const string InvoicePrint = "Invoice.Print";
    public const string InvoiceLock = "Invoice.Lock";
    public const string InvoiceUnlock = "Invoice.Unlock";
    
    // Reports
    public const string ReportsView = "Reports.View";
    public const string ReportsExport = "Reports.Export";
    public const string ReportsPrint = "Reports.Print";
    
    // User Management
    public const string UsersView = "Users.View";
    public const string UsersCreate = "Users.Create";
    public const string UsersEdit = "Users.Edit";
    public const string UsersDelete = "Users.Delete";
    public const string UsersLock = "Users.Lock";
    public const string UsersResetPassword = "Users.ResetPassword";
    public const string UsersForceLogout = "Users.ForceLogout";
    
    // Role Management
    public const string RolesView = "Roles.View";
    public const string RolesCreate = "Roles.Create";
    public const string RolesEdit = "Roles.Edit";
    public const string RolesDelete = "Roles.Delete";
    public const string RolesAssignPermissions = "Roles.AssignPermissions";
    
    // Settings
    public const string SettingsView = "Settings.View";
    public const string SettingsEdit = "Settings.Edit";
    public const string SettingsAdmin = "Settings.Admin";
    
    // Approval Matrix
    public const string ApprovalMatrixView = "ApprovalMatrix.View";
    public const string ApprovalMatrixEdit = "ApprovalMatrix.Edit";
    
    // Financial Year
    public const string FinancialYearView = "FinancialYear.View";
    public const string FinancialYearCreate = "FinancialYear.Create";
    public const string FinancialYearClose = "FinancialYear.Close";
    
    // Document Numbers
    public const string DocumentNumbersView = "DocumentNumbers.View";
    public const string DocumentNumbersEdit = "DocumentNumbers.Edit";
    public const string DocumentNumbersOverride = "DocumentNumbers.Override";
    
    // Security
    public const string SecurityPoliciesView = "Security.View";
    public const string SecurityPoliciesEdit = "Security.Edit";
    
    // Audit
    public const string AuditLogsView = "AuditLogs.View";
    public const string AuditLogsExport = "AuditLogs.Export";
    
    // Backup
    public const string BackupView = "Backup.View";
    public const string BackupCreate = "Backup.Create";
    public const string BackupRestore = "Backup.Restore";
    
    // Notifications
    public const string NotificationsView = "Notifications.View";
    public const string NotificationsEdit = "Notifications.Edit";
    
    /// <summary>
    /// Get all permissions grouped by module
    /// </summary>
    public static Dictionary<string, List<PermissionInfo>> GetAllPermissions()
    {
        return new Dictionary<string, List<PermissionInfo>>
        {
            ["Dashboard"] = new()
            {
                new(DashboardView, "View Dashboard", "View the main dashboard"),
            },
            ["Masters"] = new()
            {
                new(MastersView, "View Masters", "View all master data"),
                new(MastersCreate, "Create Masters", "Create new master records"),
                new(MastersEdit, "Edit Masters", "Edit existing master records"),
                new(MastersDelete, "Delete Masters", "Delete master records"),
            },
            ["Company"] = new()
            {
                new(CompanyView, "View Company", "View company information"),
                new(CompanyEdit, "Edit Company", "Edit company settings"),
            },
            ["Party"] = new()
            {
                new(PartyView, "View Parties", "View party/vendor list"),
                new(PartyCreate, "Create Party", "Create new parties"),
                new(PartyEdit, "Edit Party", "Edit party information"),
                new(PartyDelete, "Delete Party", "Delete parties"),
            },
            ["YarnCount"] = new()
            {
                new(YarnCountView, "View Yarn Counts", "View yarn count list"),
                new(YarnCountCreate, "Create Yarn Count", "Create new yarn counts"),
                new(YarnCountEdit, "Edit Yarn Count", "Edit yarn count details"),
                new(YarnCountDelete, "Delete Yarn Count", "Delete yarn counts"),
            },
            ["LoomType"] = new()
            {
                new(LoomTypeView, "View Loom Types", "View loom type list"),
                new(LoomTypeCreate, "Create Loom Type", "Create new loom types"),
                new(LoomTypeEdit, "Edit Loom Type", "Edit loom type details"),
                new(LoomTypeDelete, "Delete Loom Type", "Delete loom types"),
            },
            ["Beam"] = new()
            {
                new(BeamView, "View Beams", "View beam master"),
                new(BeamCreate, "Create Beam", "Create new beams"),
                new(BeamEdit, "Edit Beam", "Edit beam details"),
                new(BeamDelete, "Delete Beam", "Delete beams"),
            },
            ["Vehicle"] = new()
            {
                new(VehicleView, "View Vehicles", "View vehicle master"),
                new(VehicleCreate, "Create Vehicle", "Create new vehicles"),
                new(VehicleEdit, "Edit Vehicle", "Edit vehicle details"),
                new(VehicleDelete, "Delete Vehicle", "Delete vehicles"),
            },
            ["YarnReceipt"] = new()
            {
                new(YarnReceiptView, "View Yarn Receipts", "View yarn receipts"),
                new(YarnReceiptCreate, "Create Yarn Receipt", "Create new receipts"),
                new(YarnReceiptEdit, "Edit Yarn Receipt", "Edit receipts"),
                new(YarnReceiptDelete, "Delete Yarn Receipt", "Delete receipts"),
                new(YarnReceiptApprove, "Approve Yarn Receipt", "Approve receipts"),
                new(YarnReceiptPrint, "Print Yarn Receipt", "Print receipts"),
            },
            ["Warping"] = new()
            {
                new(WarpingView, "View Warping", "View warping job cards"),
                new(WarpingCreate, "Create Warping", "Create new warping cards"),
                new(WarpingEdit, "Edit Warping", "Edit warping cards"),
                new(WarpingDelete, "Delete Warping", "Delete warping cards"),
                new(WarpingApprove, "Approve Warping", "Approve warping cards"),
                new(WarpingPrint, "Print Warping", "Print warping cards"),
            },
            ["Sizing"] = new()
            {
                new(SizingView, "View Sizing", "View sizing job cards"),
                new(SizingCreate, "Create Sizing", "Create new sizing cards"),
                new(SizingEdit, "Edit Sizing", "Edit sizing cards"),
                new(SizingDelete, "Delete Sizing", "Delete sizing cards"),
                new(SizingApprove, "Approve Sizing", "Approve sizing cards"),
                new(SizingPrint, "Print Sizing", "Print sizing cards"),
            },
            ["BabyCone"] = new()
            {
                new(BabyConeView, "View Baby Cone", "View baby cone entries"),
                new(BabyConeCreate, "Create Baby Cone", "Create baby cone entries"),
                new(BabyConeEdit, "Edit Baby Cone", "Edit baby cone entries"),
                new(BabyConeDelete, "Delete Baby Cone", "Delete baby cone entries"),
            },
            ["YarnStock"] = new()
            {
                new(YarnStockView, "View Yarn Stock", "View yarn stock ledger"),
                new(YarnStockAdjust, "Adjust Yarn Stock", "Make stock adjustments"),
            },
            ["YarnReturn"] = new()
            {
                new(YarnReturnView, "View Yarn Returns", "View yarn returns"),
                new(YarnReturnCreate, "Create Yarn Return", "Create yarn returns"),
                new(YarnReturnEdit, "Edit Yarn Return", "Edit yarn returns"),
                new(YarnReturnDelete, "Delete Yarn Return", "Delete yarn returns"),
                new(YarnReturnApprove, "Approve Yarn Return", "Approve yarn returns"),
            },
            ["YarnDelivery"] = new()
            {
                new(YarnDeliveryView, "View Yarn Delivery", "View yarn deliveries"),
                new(YarnDeliveryCreate, "Create Yarn Delivery", "Create deliveries"),
                new(YarnDeliveryEdit, "Edit Yarn Delivery", "Edit deliveries"),
                new(YarnDeliveryDelete, "Delete Yarn Delivery", "Delete deliveries"),
                new(YarnDeliveryApprove, "Approve Yarn Delivery", "Approve deliveries"),
            },
            ["Invoice"] = new()
            {
                new(InvoiceView, "View Invoices", "View tax invoices"),
                new(InvoiceCreate, "Create Invoice", "Create new invoices"),
                new(InvoiceEdit, "Edit Invoice", "Edit invoices"),
                new(InvoiceDelete, "Delete Invoice", "Delete invoices"),
                new(InvoiceApprove, "Approve Invoice", "Approve invoices"),
                new(InvoicePrint, "Print Invoice", "Print invoices"),
                new(InvoiceLock, "Lock Invoice", "Lock invoices"),
                new(InvoiceUnlock, "Unlock Invoice", "Unlock locked invoices"),
            },
            ["Reports"] = new()
            {
                new(ReportsView, "View Reports", "View all reports"),
                new(ReportsExport, "Export Reports", "Export reports to Excel/PDF"),
                new(ReportsPrint, "Print Reports", "Print reports"),
            },
            ["Users"] = new()
            {
                new(UsersView, "View Users", "View user list"),
                new(UsersCreate, "Create User", "Create new users"),
                new(UsersEdit, "Edit User", "Edit user details"),
                new(UsersDelete, "Delete User", "Delete users"),
                new(UsersLock, "Lock/Unlock User", "Lock or unlock user accounts"),
                new(UsersResetPassword, "Reset Password", "Reset user passwords"),
                new(UsersForceLogout, "Force Logout", "Force logout user sessions"),
            },
            ["Roles"] = new()
            {
                new(RolesView, "View Roles", "View role list"),
                new(RolesCreate, "Create Role", "Create new roles"),
                new(RolesEdit, "Edit Role", "Edit role details"),
                new(RolesDelete, "Delete Role", "Delete roles"),
                new(RolesAssignPermissions, "Assign Permissions", "Manage role permissions"),
            },
            ["Settings"] = new()
            {
                new(SettingsView, "View Settings", "View system settings"),
                new(SettingsEdit, "Edit Settings", "Edit system settings"),
                new(SettingsAdmin, "Admin Settings", "Access admin settings"),
            },
            ["ApprovalMatrix"] = new()
            {
                new(ApprovalMatrixView, "View Approval Matrix", "View approval workflows"),
                new(ApprovalMatrixEdit, "Edit Approval Matrix", "Edit approval workflows"),
            },
            ["FinancialYear"] = new()
            {
                new(FinancialYearView, "View Financial Years", "View financial years"),
                new(FinancialYearCreate, "Create Financial Year", "Create new FY"),
                new(FinancialYearClose, "Close Financial Year", "Close financial years"),
            },
            ["DocumentNumbers"] = new()
            {
                new(DocumentNumbersView, "View Doc Numbers", "View document series"),
                new(DocumentNumbersEdit, "Edit Doc Numbers", "Edit document series"),
                new(DocumentNumbersOverride, "Override Doc Numbers", "Override document numbers"),
            },
            ["Security"] = new()
            {
                new(SecurityPoliciesView, "View Security", "View security policies"),
                new(SecurityPoliciesEdit, "Edit Security", "Edit security policies"),
            },
            ["AuditLogs"] = new()
            {
                new(AuditLogsView, "View Audit Logs", "View audit trail"),
                new(AuditLogsExport, "Export Audit Logs", "Export audit logs"),
            },
            ["Backup"] = new()
            {
                new(BackupView, "View Backups", "View backup settings"),
                new(BackupCreate, "Create Backup", "Create database backups"),
                new(BackupRestore, "Restore Backup", "Restore from backup"),
            },
            ["Notifications"] = new()
            {
                new(NotificationsView, "View Notifications", "View notification settings"),
                new(NotificationsEdit, "Edit Notifications", "Edit notification settings"),
            },
        };
    }
    
    /// <summary>
    /// Get flat list of all permission codes
    /// </summary>
    public static List<string> GetAllPermissionCodes()
    {
        return GetAllPermissions()
            .SelectMany(m => m.Value.Select(p => p.Code))
            .ToList();
    }
}

public record PermissionInfo(string Code, string Name, string Description);

/// <summary>
/// Module visibility mapping - which permissions control which UI modules
/// </summary>
public static class ModulePermissions
{
    public static readonly Dictionary<string, string[]> Modules = new()
    {
        ["Dashboard"] = new[] { Permissions.DashboardView },
        ["Masters"] = new[] { Permissions.MastersView },
        ["Masters.Company"] = new[] { Permissions.CompanyView },
        ["Masters.Parties"] = new[] { Permissions.PartyView },
        ["Masters.YarnCounts"] = new[] { Permissions.YarnCountView },
        ["Masters.LoomTypes"] = new[] { Permissions.LoomTypeView },
        ["Masters.Beams"] = new[] { Permissions.BeamView },
        ["Masters.Vehicles"] = new[] { Permissions.VehicleView },
        ["Sizing"] = new[] { Permissions.YarnReceiptView, Permissions.WarpingView, Permissions.SizingView },
        ["Sizing.YarnReceipt"] = new[] { Permissions.YarnReceiptView },
        ["Sizing.BabyCone"] = new[] { Permissions.BabyConeView },
        ["Sizing.Warping"] = new[] { Permissions.WarpingView },
        ["Sizing.Sizing"] = new[] { Permissions.SizingView },
        ["Sizing.YarnStock"] = new[] { Permissions.YarnStockView },
        ["Sizing.YarnReturn"] = new[] { Permissions.YarnReturnView },
        ["Sizing.YarnDelivery"] = new[] { Permissions.YarnDeliveryView },
        ["Sizing.Invoices"] = new[] { Permissions.InvoiceView },
        ["Reports"] = new[] { Permissions.ReportsView },
        ["Settings"] = new[] { Permissions.SettingsView },
        ["Settings.Users"] = new[] { Permissions.UsersView },
        ["Settings.Roles"] = new[] { Permissions.RolesView },
        ["Settings.ApprovalMatrix"] = new[] { Permissions.ApprovalMatrixView },
        ["Settings.FinancialYears"] = new[] { Permissions.FinancialYearView },
        ["Settings.DocumentNumbers"] = new[] { Permissions.DocumentNumbersView },
        ["Settings.Security"] = new[] { Permissions.SecurityPoliciesView },
        ["Settings.AuditLogs"] = new[] { Permissions.AuditLogsView },
        ["Settings.Backup"] = new[] { Permissions.BackupView },
    };
}
