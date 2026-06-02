using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.Entities;
using System.Text.Json;

namespace SudhanTextileERP.API;

public static class SeedData
{
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Ensure Notifications table exists (may have been added after initial schema creation)
        await EnsureNotificationsTableExists(context);

        // Ensure system configuration defaults exist
        await EnsureSystemConfigurations(context);

        // Ensure security policy defaults exist
        await EnsureSecurityPolicies(context);

        // Ensure backup configuration defaults exist
        await EnsureBackupConfigurations(context);

        // Ensure notification settings defaults exist
        await EnsureNotificationSettings(context);

        // Check if already seeded
        if (await context.Roles.AnyAsync())
        {
            // If roles exist but modules don't, seed modules and permissions
            if (!await context.Modules.AnyAsync())
            {
                await SeedModulesAndPermissions(context);
            }
            return;
        }

        // Seed all data
        await SeedRolesAndUsers(context);
        await SeedModulesAndPermissions(context);
        await SeedMasterData(context);
    }

    /// <summary>
    /// Ensures the Notifications table exists (handles post-deployment schema additions)
    /// </summary>
    private static async Task EnsureNotificationsTableExists(ApplicationDbContext context)
    {
        try
        {
            // Check if table exists by trying to query it
            await context.Database.ExecuteSqlRawAsync(@"
                SELECT 1 FROM Notifications LIMIT 1
            ");
        }
        catch
        {
            // Table doesn't exist, create it
            var isMySql = context.Database.ProviderName?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true;
            
            if (isMySql)
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    CREATE TABLE IF NOT EXISTS `Notifications` (
                        `Id` int NOT NULL AUTO_INCREMENT,
                        `Type` varchar(50) NOT NULL,
                        `Title` varchar(255) NOT NULL,
                        `Message` text NOT NULL,
                        `Priority` varchar(20) NOT NULL DEFAULT 'normal',
                        `Link` varchar(500) NULL,
                        `IsRead` tinyint(1) NOT NULL DEFAULT 0,
                        `ReadAt` datetime(6) NULL,
                        `UserId` int NULL,
                        `RoleId` int NULL,
                        `ReferenceType` varchar(100) NULL,
                        `ReferenceId` int NULL,
                        `CreatedBy` varchar(100) NOT NULL DEFAULT 'System',
                        `CreatedDate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                        `ModifiedBy` varchar(100) NULL,
                        `ModifiedDate` datetime(6) NULL,
                        `IsActive` tinyint(1) NOT NULL DEFAULT 1,
                        PRIMARY KEY (`Id`),
                        INDEX `IX_Notifications_UserId` (`UserId`),
                        INDEX `IX_Notifications_RoleId` (`RoleId`),
                        INDEX `IX_Notifications_IsRead` (`IsRead`),
                        INDEX `IX_Notifications_CreatedDate` (`CreatedDate`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            }
            else
            {
                // SQLite syntax
                await context.Database.ExecuteSqlRawAsync(@"
                    CREATE TABLE IF NOT EXISTS ""Notifications"" (
                        ""Id"" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                        ""Type"" TEXT NOT NULL,
                        ""Title"" TEXT NOT NULL,
                        ""Message"" TEXT NOT NULL,
                        ""Priority"" TEXT NOT NULL DEFAULT 'normal',
                        ""Link"" TEXT NULL,
                        ""IsRead"" INTEGER NOT NULL DEFAULT 0,
                        ""ReadAt"" TEXT NULL,
                        ""UserId"" INTEGER NULL,
                        ""RoleId"" INTEGER NULL,
                        ""ReferenceType"" TEXT NULL,
                        ""ReferenceId"" INTEGER NULL,
                        ""CreatedBy"" TEXT NOT NULL DEFAULT 'System',
                        ""CreatedDate"" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        ""ModifiedBy"" TEXT NULL,
                        ""ModifiedDate"" TEXT NULL,
                        ""IsActive"" INTEGER NOT NULL DEFAULT 1
                    );
                ");
            }
        }
    }

    private static async Task EnsureSystemConfigurations(ApplicationDbContext context)
    {
        var configs = new List<SystemConfiguration>
        {
            // General
            new SystemConfiguration
            {
                ConfigKey = "CompanyCurrency",
                ConfigValue = "INR",
                ConfigType = "String",
                Category = "General",
                DisplayName = "Company Currency",
                Description = "Default currency used across the ERP.",
                DefaultValue = "INR",
                SortOrder = 1,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SystemConfiguration
            {
                ConfigKey = "TimeZone",
                ConfigValue = "Asia/Kolkata",
                ConfigType = "String",
                Category = "General",
                DisplayName = "Time Zone",
                Description = "Used for timestamps and schedules.",
                DefaultValue = "Asia/Kolkata",
                SortOrder = 2,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SystemConfiguration
            {
                ConfigKey = "DateFormat",
                ConfigValue = "dd/MM/yyyy",
                ConfigType = "String",
                Category = "General",
                DisplayName = "Date Format",
                Description = "Default date format for the UI.",
                DefaultValue = "dd/MM/yyyy",
                SortOrder = 3,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },

            // Stock
            new SystemConfiguration
            {
                ConfigKey = "AllowNegativeStock",
                ConfigValue = "false",
                ConfigType = "Boolean",
                Category = "Stock",
                DisplayName = "Allow Negative Stock",
                Description = "Allow stock to go below zero.",
                DefaultValue = "false",
                SortOrder = 1,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SystemConfiguration
            {
                ConfigKey = "LowStockThreshold",
                ConfigValue = "500",
                ConfigType = "Number",
                Category = "Stock",
                DisplayName = "Low Stock Threshold",
                Description = "Threshold used for low stock alerts.",
                DefaultValue = "500",
                SortOrder = 2,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SystemConfiguration
            {
                ConfigKey = "StockValuationMethod",
                ConfigValue = "FIFO",
                ConfigType = "String",
                Category = "Stock",
                DisplayName = "Stock Valuation Method",
                Description = "Used for inventory valuation.",
                DefaultValue = "FIFO",
                SortOrder = 3,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },

            // Invoice
            new SystemConfiguration
            {
                ConfigKey = "AutoInvoiceNumber",
                ConfigValue = "true",
                ConfigType = "Boolean",
                Category = "Invoice",
                DisplayName = "Auto Generate Invoice Number",
                Description = "Automatically generate invoice numbers.",
                DefaultValue = "true",
                SortOrder = 1,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SystemConfiguration
            {
                ConfigKey = "InvoiceDueDays",
                ConfigValue = "30",
                ConfigType = "Number",
                Category = "Invoice",
                DisplayName = "Invoice Due Days",
                Description = "Default payment due period in days.",
                DefaultValue = "30",
                SortOrder = 2,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SystemConfiguration
            {
                ConfigKey = "TaxInclusivePricing",
                ConfigValue = "false",
                ConfigType = "Boolean",
                Category = "Invoice",
                DisplayName = "Tax Inclusive Pricing",
                Description = "Treat pricing as tax-inclusive by default.",
                DefaultValue = "false",
                SortOrder = 3,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },

            // Security
            new SystemConfiguration
            {
                ConfigKey = "SessionTimeoutMinutes",
                ConfigValue = "30",
                ConfigType = "Number",
                Category = "Security",
                DisplayName = "Session Timeout (Minutes)",
                Description = "Idle time before sessions expire.",
                DefaultValue = "30",
                SortOrder = 1,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SystemConfiguration
            {
                ConfigKey = "MaxLoginAttempts",
                ConfigValue = "5",
                ConfigType = "Number",
                Category = "Security",
                DisplayName = "Max Login Attempts",
                Description = "Maximum allowed failed login attempts.",
                DefaultValue = "5",
                SortOrder = 2,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SystemConfiguration
            {
                ConfigKey = "RequireStrongPasswords",
                ConfigValue = "true",
                ConfigType = "Boolean",
                Category = "Security",
                DisplayName = "Require Strong Passwords",
                Description = "Enforce strong password policy.",
                DefaultValue = "true",
                SortOrder = 3,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },

            // Notification
            new SystemConfiguration
            {
                ConfigKey = "EnableEmailNotifications",
                ConfigValue = "true",
                ConfigType = "Boolean",
                Category = "Notification",
                DisplayName = "Enable Email Notifications",
                Description = "Toggle email notification delivery.",
                DefaultValue = "true",
                SortOrder = 1,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SystemConfiguration
            {
                ConfigKey = "DailySummaryTime",
                ConfigValue = "08:00",
                ConfigType = "String",
                Category = "Notification",
                DisplayName = "Daily Summary Time",
                Description = "Time to send daily summary notifications.",
                DefaultValue = "08:00",
                SortOrder = 2,
                IsEditable = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
        };

        var existingKeys = await context.SystemConfigurations
            .AsNoTracking()
            .Select(c => c.ConfigKey)
            .ToListAsync();

        var existingKeySet = new HashSet<string>(existingKeys, StringComparer.OrdinalIgnoreCase);
        var missingConfigs = configs
            .Where(config => !existingKeySet.Contains(config.ConfigKey))
            .ToList();

        if (missingConfigs.Count == 0)
        {
            return;
        }

        await context.SystemConfigurations.AddRangeAsync(missingConfigs);
        await context.SaveChangesAsync();
    }

    private static async Task EnsureSecurityPolicies(ApplicationDbContext context)
    {
        var policies = new List<SecurityPolicy>
        {
            // Password policies
            new SecurityPolicy
            {
                PolicyKey = "PasswordMinLength",
                PolicyValue = "8",
                PolicyType = "Password",
                DisplayName = "Minimum Password Length",
                Description = "Minimum number of characters required for passwords.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SecurityPolicy
            {
                PolicyKey = "PasswordRequireUppercase",
                PolicyValue = "true",
                PolicyType = "Password",
                DisplayName = "Require Uppercase",
                Description = "Passwords must include at least one uppercase letter.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SecurityPolicy
            {
                PolicyKey = "PasswordRequireLowercase",
                PolicyValue = "true",
                PolicyType = "Password",
                DisplayName = "Require Lowercase",
                Description = "Passwords must include at least one lowercase letter.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SecurityPolicy
            {
                PolicyKey = "PasswordRequireNumber",
                PolicyValue = "true",
                PolicyType = "Password",
                DisplayName = "Require Number",
                Description = "Passwords must include at least one number.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SecurityPolicy
            {
                PolicyKey = "PasswordRequireSpecial",
                PolicyValue = "true",
                PolicyType = "Password",
                DisplayName = "Require Special Character",
                Description = "Passwords must include at least one special character.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SecurityPolicy
            {
                PolicyKey = "PasswordExpiryDays",
                PolicyValue = "90",
                PolicyType = "Password",
                DisplayName = "Password Expiry (Days)",
                Description = "How often users must change passwords.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SecurityPolicy
            {
                PolicyKey = "PasswordHistoryCount",
                PolicyValue = "5",
                PolicyType = "Password",
                DisplayName = "Password History",
                Description = "Number of previous passwords that cannot be reused.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },

            // Session policies
            new SecurityPolicy
            {
                PolicyKey = "SessionTimeoutMinutes",
                PolicyValue = "30",
                PolicyType = "Session",
                DisplayName = "Session Timeout (Minutes)",
                Description = "Idle time before sessions expire.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SecurityPolicy
            {
                PolicyKey = "RememberMeDays",
                PolicyValue = "30",
                PolicyType = "Session",
                DisplayName = "Remember Me Duration (Days)",
                Description = "Duration for persistent login sessions.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },

            // Login policies
            new SecurityPolicy
            {
                PolicyKey = "MaxLoginAttempts",
                PolicyValue = "5",
                PolicyType = "Login",
                DisplayName = "Max Login Attempts",
                Description = "Maximum failed login attempts before lockout.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SecurityPolicy
            {
                PolicyKey = "LockoutDurationMinutes",
                PolicyValue = "15",
                PolicyType = "Login",
                DisplayName = "Lockout Duration (Minutes)",
                Description = "How long accounts stay locked after failed attempts.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SecurityPolicy
            {
                PolicyKey = "EnableTwoFactor",
                PolicyValue = "false",
                PolicyType = "Login",
                DisplayName = "Enable Two-Factor Authentication",
                Description = "Require a second factor during login.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },

            // Network policies
            new SecurityPolicy
            {
                PolicyKey = "EnableIpWhitelist",
                PolicyValue = "false",
                PolicyType = "Network",
                DisplayName = "Enable IP Whitelist",
                Description = "Restrict logins to approved IP ranges.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new SecurityPolicy
            {
                PolicyKey = "AllowedIpRanges",
                PolicyValue = "",
                PolicyType = "Network",
                DisplayName = "Allowed IP Ranges",
                Description = "Comma-separated list of allowed IPs or CIDR ranges.",
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
        };

        var existingKeys = await context.SecurityPolicies
            .AsNoTracking()
            .Select(p => p.PolicyKey)
            .ToListAsync();

        var existingKeySet = new HashSet<string>(existingKeys, StringComparer.OrdinalIgnoreCase);
        var missingPolicies = policies
            .Where(policy => !existingKeySet.Contains(policy.PolicyKey))
            .ToList();

        if (missingPolicies.Count == 0)
        {
            return;
        }

        await context.SecurityPolicies.AddRangeAsync(missingPolicies);
        await context.SaveChangesAsync();
    }

    private static async Task EnsureBackupConfigurations(ApplicationDbContext context)
    {
        var configs = new List<BackupConfiguration>
        {
            new BackupConfiguration
            {
                BackupType = "Full",
                Frequency = "Daily",
                RetentionDays = 30,
                BackupPath = "Backups",
                IsEnabled = true,
                LastBackupStatus = "Never",
                NextScheduledBackup = DateTime.UtcNow.AddDays(1),
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new BackupConfiguration
            {
                BackupType = "Differential",
                Frequency = "Weekly",
                RetentionDays = 60,
                BackupPath = "Backups",
                IsEnabled = false,
                LastBackupStatus = "Never",
                NextScheduledBackup = DateTime.UtcNow.AddDays(7),
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
        };

        var existing = await context.BackupConfigurations
            .AsNoTracking()
            .Select(b => new { b.BackupType, b.Frequency })
            .ToListAsync();

        var existingSet = new HashSet<string>(
            existing.Select(b => $"{b.BackupType}:{b.Frequency}"),
            StringComparer.OrdinalIgnoreCase);

        var missingConfigs = configs
            .Where(config => !existingSet.Contains($"{config.BackupType}:{config.Frequency}"))
            .ToList();

        if (missingConfigs.Count == 0)
        {
            return;
        }

        await context.BackupConfigurations.AddRangeAsync(missingConfigs);
        await context.SaveChangesAsync();
    }

    private static async Task EnsureNotificationSettings(ApplicationDbContext context)
    {
        var roleIds = await context.Roles
            .AsNoTracking()
            .Where(r => r.RoleName == "SuperAdmin" || r.RoleName == "Admin" || r.RoleName == "Manager")
            .Select(r => r.Id)
            .ToListAsync();

        var recipientRoles = JsonSerializer.Serialize(roleIds);

        var defaults = new List<NotificationSetting>
        {
            new NotificationSetting
            {
                NotificationType = "InApp",
                EventType = "LowStock",
                DisplayName = "Low Stock Alert",
                IsEnabled = true,
                ThresholdValue = 500,
                RecipientRoles = recipientRoles,
                EmailTemplate = null,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new NotificationSetting
            {
                NotificationType = "InApp",
                EventType = "OverdueInvoice",
                DisplayName = "Overdue Invoice Alert",
                IsEnabled = true,
                ThresholdValue = 7,
                RecipientRoles = recipientRoles,
                EmailTemplate = null,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new NotificationSetting
            {
                NotificationType = "InApp",
                EventType = "PendingApproval",
                DisplayName = "Pending Approval Alert",
                IsEnabled = true,
                ThresholdValue = 2,
                RecipientRoles = recipientRoles,
                EmailTemplate = null,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new NotificationSetting
            {
                NotificationType = "InApp",
                EventType = "BackupFailure",
                DisplayName = "Backup Failure Alert",
                IsEnabled = true,
                ThresholdValue = null,
                RecipientRoles = recipientRoles,
                EmailTemplate = null,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new NotificationSetting
            {
                NotificationType = "InApp",
                EventType = "LoginAlert",
                DisplayName = "Login Alert",
                IsEnabled = false,
                ThresholdValue = null,
                RecipientRoles = recipientRoles,
                EmailTemplate = null,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            }
        };

        var existing = await context.NotificationSettings
            .AsNoTracking()
            .Select(n => new { n.NotificationType, n.EventType })
            .ToListAsync();

        var existingSet = new HashSet<string>(
            existing.Select(n => $"{n.NotificationType}:{n.EventType}"),
            StringComparer.OrdinalIgnoreCase);

        var missingSettings = defaults
            .Where(setting => !existingSet.Contains($"{setting.NotificationType}:{setting.EventType}"))
            .ToList();

        if (missingSettings.Count == 0)
        {
            return;
        }

        await context.NotificationSettings.AddRangeAsync(missingSettings);
        await context.SaveChangesAsync();
    }
    
    private static async Task SeedModulesAndPermissions(ApplicationDbContext context)
    {
        // ===========================================
        // SEED MODULES
        // ===========================================
        var modules = new List<Module>
        {
            // Dashboard
            new Module { ModuleKey = ModuleKeys.Dashboard, ModuleName = "Dashboard", ParentModule = ModuleGroups.Dashboard, RoutePath = "/dashboard", Icon = "LayoutDashboard", SortOrder = 1, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            
            // Masters
            new Module { ModuleKey = ModuleKeys.Company, ModuleName = "Company Master", ParentModule = ModuleGroups.Masters, RoutePath = "/masters/company", Icon = "Building2", SortOrder = 1, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.Party, ModuleName = "Party / Vendor", ParentModule = ModuleGroups.Masters, RoutePath = "/masters/parties", Icon = "UserCircle", SortOrder = 2, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.YarnCount, ModuleName = "Yarn Count", ParentModule = ModuleGroups.Masters, RoutePath = "/masters/yarn-counts", Icon = "Layers", SortOrder = 3, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.LoomType, ModuleName = "Loom Type", ParentModule = ModuleGroups.Masters, RoutePath = "/masters/loom-types", Icon = "Factory", SortOrder = 4, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.Beam, ModuleName = "Beam Master", ParentModule = ModuleGroups.Masters, RoutePath = "/masters/beams", Icon = "Cylinder", SortOrder = 5, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.Vehicle, ModuleName = "Vehicle Master", ParentModule = ModuleGroups.Masters, RoutePath = "/masters/vehicles", Icon = "Truck", SortOrder = 6, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.FinancialYear, ModuleName = "Financial Year", ParentModule = ModuleGroups.Masters, RoutePath = "/masters/financial-years", Icon = "Calendar", SortOrder = 7, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.DocumentSeries, ModuleName = "Document Series", ParentModule = ModuleGroups.Masters, RoutePath = "/masters/document-series", Icon = "Hash", SortOrder = 8, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            
            // Sizing ERP
            new Module { ModuleKey = ModuleKeys.YarnReceipt, ModuleName = "Yarn Receipt", ParentModule = ModuleGroups.SizingERP, RoutePath = "/sizing/yarn-receipt", Icon = "Receipt", SortOrder = 1, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.BabyCone, ModuleName = "Baby Cone / Winding", ParentModule = ModuleGroups.SizingERP, RoutePath = "/sizing/baby-cone", Icon = "Scissors", SortOrder = 2, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.WarpingJobCard, ModuleName = "Warping Job Card", ParentModule = ModuleGroups.SizingERP, RoutePath = "/sizing/warping-job-card", Icon = "FileSpreadsheet", SortOrder = 3, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.SizingJobCard, ModuleName = "Sizing Job Card", ParentModule = ModuleGroups.SizingERP, RoutePath = "/sizing/sizing-job-card", Icon = "ClipboardList", SortOrder = 4, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.BeamManagement, ModuleName = "Beam Management", ParentModule = ModuleGroups.SizingERP, RoutePath = "/sizing/beam-management", Icon = "Cylinder", SortOrder = 5, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.YarnStock, ModuleName = "Yarn Stock Ledger", ParentModule = ModuleGroups.SizingERP, RoutePath = "/sizing/yarn-stock", Icon = "Scale", SortOrder = 6, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.YarnReturn, ModuleName = "Yarn Return", ParentModule = ModuleGroups.SizingERP, RoutePath = "/sizing/yarn-return", Icon = "Undo2", SortOrder = 7, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.YarnDelivery, ModuleName = "Yarn Delivery", ParentModule = ModuleGroups.SizingERP, RoutePath = "/sizing/yarn-delivery", Icon = "ArrowRightFromLine", SortOrder = 8, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.GSTInvoice, ModuleName = "GST Tax Invoice", ParentModule = ModuleGroups.SizingERP, RoutePath = "/sizing/invoices", Icon = "FileCheck", SortOrder = 9, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            
            // Reports
            new Module { ModuleKey = ModuleKeys.YarnStockReport, ModuleName = "Yarn Stock Register", ParentModule = ModuleGroups.Reports, RoutePath = "/reports/yarn-stock", Icon = "Scale", SortOrder = 1, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.SetProductionReport, ModuleName = "Set-wise Production", ParentModule = ModuleGroups.Reports, RoutePath = "/reports/set-production", Icon = "ClipboardList", SortOrder = 2, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.BeamUtilizationReport, ModuleName = "Beam Utilization", ParentModule = ModuleGroups.Reports, RoutePath = "/reports/beam-utilization", Icon = "Cylinder", SortOrder = 3, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.PartyLedgerReport, ModuleName = "Party Ledger", ParentModule = ModuleGroups.Reports, RoutePath = "/reports/party-ledger", Icon = "UserCircle", SortOrder = 4, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.InvoiceRegisterReport, ModuleName = "Invoice Register", ParentModule = ModuleGroups.Reports, RoutePath = "/reports/invoice-register", Icon = "FileCheck", SortOrder = 5, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.PendingInvoicesReport, ModuleName = "Pending Invoices", ParentModule = ModuleGroups.Reports, RoutePath = "/reports/pending-invoices", Icon = "FileText", SortOrder = 6, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            
            // Settings
            new Module { ModuleKey = ModuleKeys.UserManagement, ModuleName = "User Management", ParentModule = ModuleGroups.Settings, RoutePath = "/settings/users", Icon = "Users", SortOrder = 1, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.RolePermissions, ModuleName = "Role Permissions", ParentModule = ModuleGroups.Settings, RoutePath = "/settings/roles", Icon = "Shield", SortOrder = 2, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.ApprovalMatrix, ModuleName = "Approval Matrix", ParentModule = ModuleGroups.Settings, RoutePath = "/settings/approval-matrix", Icon = "GitBranch", SortOrder = 3, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.SystemSettings, ModuleName = "System Settings", ParentModule = ModuleGroups.Settings, RoutePath = "/settings/system", Icon = "Settings", SortOrder = 4, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.SecurityPolicies, ModuleName = "Security Policies", ParentModule = ModuleGroups.Settings, RoutePath = "/settings/security", Icon = "Lock", SortOrder = 5, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.AuditLogs, ModuleName = "Audit Logs", ParentModule = ModuleGroups.Settings, RoutePath = "/settings/audit-logs", Icon = "History", SortOrder = 6, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.Backup, ModuleName = "Backup & Safety", ParentModule = ModuleGroups.Settings, RoutePath = "/settings/backup", Icon = "Database", SortOrder = 7, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Module { ModuleKey = ModuleKeys.Notifications, ModuleName = "Notifications", ParentModule = ModuleGroups.Settings, RoutePath = "/settings/notifications", Icon = "Bell", SortOrder = 8, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
        };
        
        await context.Modules.AddRangeAsync(modules);
        await context.SaveChangesAsync();
        
        // ===========================================
        // SEED PERMISSIONS FOR EACH MODULE
        // ===========================================
        var permissions = new List<Permission>();
        int sortOrder = 1;
        
        foreach (var module in modules)
        {
            // Define which actions are applicable for each module type
            var actions = GetActionsForModule(module.ModuleKey);
            
            foreach (var action in actions)
            {
                permissions.Add(new Permission
                {
                    PermissionCode = $"{module.ModuleKey}.{action}",
                    PermissionName = $"{action} {module.ModuleName}",
                    ModuleId = module.Id,
                    ModuleKey = module.ModuleKey,
                    Action = action,
                    Description = $"Permission to {action.ToLower()} {module.ModuleName}",
                    SortOrder = sortOrder++,
                    IsActive = true,
                    CreatedBy = "System",
                    CreatedDate = DateTime.UtcNow
                });
            }
        }
        
        await context.Permissions.AddRangeAsync(permissions);
        await context.SaveChangesAsync();
        
        // ===========================================
        // ASSIGN ALL PERMISSIONS TO SUPERADMIN
        // ===========================================
        var superAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "SuperAdmin");
        if (superAdminRole != null)
        {
            var rolePermissions = permissions.Select(p => new RolePermission
            {
                RoleId = superAdminRole.Id,
                PermissionId = p.Id,
                IsGranted = true,
                GrantedAt = DateTime.UtcNow,
                GrantedBy = 0
            }).ToList();
            
            await context.RolePermissions.AddRangeAsync(rolePermissions);
            await context.SaveChangesAsync();
        }
        
        // Assign basic permissions to Admin role
        var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Admin");
        if (adminRole != null)
        {
            // Admin gets all permissions except system critical ones
            var adminPermissions = permissions
                .Where(p => !p.ModuleKey.Contains("BACKUP") && !p.ModuleKey.Contains("SECURITY_POLICIES"))
                .Select(p => new RolePermission
                {
                    RoleId = adminRole.Id,
                    PermissionId = p.Id,
                    IsGranted = true,
                    GrantedAt = DateTime.UtcNow,
                    GrantedBy = 0
                }).ToList();
            
            await context.RolePermissions.AddRangeAsync(adminPermissions);
            await context.SaveChangesAsync();
        }
        
        // ===========================================
        // ASSIGN PERMISSIONS TO MANAGER ROLE
        // ===========================================
        var managerRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Manager");
        if (managerRole != null)
        {
            // Manager gets dashboard, all masters (view only), sizing operations, reports, and approval permissions
            var managerModules = new[] { 
                ModuleKeys.Dashboard,
                // Masters - View Only
                ModuleKeys.Company, ModuleKeys.Party, ModuleKeys.YarnCount, ModuleKeys.LoomType, 
                ModuleKeys.Beam, ModuleKeys.Vehicle, ModuleKeys.FinancialYear, ModuleKeys.DocumentSeries,
                // Sizing ERP - Full Access
                ModuleKeys.YarnReceipt, ModuleKeys.BabyCone, ModuleKeys.WarpingJobCard, 
                ModuleKeys.SizingJobCard, ModuleKeys.BeamManagement, ModuleKeys.YarnStock,
                ModuleKeys.YarnReturn, ModuleKeys.YarnDelivery, ModuleKeys.GSTInvoice,
                // Reports - Full Access
                ModuleKeys.YarnStockReport, ModuleKeys.SetProductionReport, ModuleKeys.BeamUtilizationReport,
                ModuleKeys.PartyLedgerReport, ModuleKeys.InvoiceRegisterReport, ModuleKeys.PendingInvoicesReport,
                // Settings - Limited
                ModuleKeys.ApprovalMatrix, ModuleKeys.AuditLogs
            };
            
            var managerPermissions = permissions
                .Where(p => managerModules.Contains(p.ModuleKey))
                .Where(p => {
                    // For masters, only grant VIEW permission to managers
                    var masterModules = new[] { 
                        ModuleKeys.Company, ModuleKeys.Party, ModuleKeys.YarnCount, ModuleKeys.LoomType,
                        ModuleKeys.Beam, ModuleKeys.Vehicle, ModuleKeys.FinancialYear, ModuleKeys.DocumentSeries
                    };
                    if (masterModules.Contains(p.ModuleKey))
                    {
                        return p.Action == PermissionActions.View;
                    }
                    return true; // Full permissions for other modules
                })
                .Select(p => new RolePermission
                {
                    RoleId = managerRole.Id,
                    PermissionId = p.Id,
                    IsGranted = true,
                    GrantedAt = DateTime.UtcNow,
                    GrantedBy = 0
                }).ToList();
            
            await context.RolePermissions.AddRangeAsync(managerPermissions);
            await context.SaveChangesAsync();
        }
        
        // ===========================================
        // ASSIGN PERMISSIONS TO OPERATOR ROLE
        // ===========================================
        var operatorRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Operator");
        if (operatorRole != null)
        {
            // Operator gets dashboard, masters (view), and core sizing operations (create/edit, no delete)
            var operatorPermissions = new List<RolePermission>();
            
            // Dashboard VIEW
            var dashboardView = permissions.FirstOrDefault(p => p.ModuleKey == ModuleKeys.Dashboard && p.Action == PermissionActions.View);
            if (dashboardView != null) operatorPermissions.Add(new RolePermission { RoleId = operatorRole.Id, PermissionId = dashboardView.Id, IsGranted = true, GrantedAt = DateTime.UtcNow, GrantedBy = 0 });
            
            // Masters - VIEW only
            var masterModules = new[] { ModuleKeys.Party, ModuleKeys.YarnCount, ModuleKeys.LoomType, ModuleKeys.Beam, ModuleKeys.Vehicle };
            foreach (var module in masterModules)
            {
                var viewPerm = permissions.FirstOrDefault(p => p.ModuleKey == module && p.Action == PermissionActions.View);
                if (viewPerm != null) operatorPermissions.Add(new RolePermission { RoleId = operatorRole.Id, PermissionId = viewPerm.Id, IsGranted = true, GrantedAt = DateTime.UtcNow, GrantedBy = 0 });
            }
            
            // Sizing ERP - VIEW, CREATE, EDIT (no DELETE, no APPROVE)
            var sizingModules = new[] { 
                ModuleKeys.YarnReceipt, ModuleKeys.BabyCone, ModuleKeys.WarpingJobCard, 
                ModuleKeys.SizingJobCard, ModuleKeys.BeamManagement, ModuleKeys.YarnStock,
                ModuleKeys.YarnReturn, ModuleKeys.YarnDelivery
            };
            var operatorActions = new[] { PermissionActions.View, PermissionActions.Create, PermissionActions.Edit, PermissionActions.Print };
            foreach (var module in sizingModules)
            {
                foreach (var action in operatorActions)
                {
                    var perm = permissions.FirstOrDefault(p => p.ModuleKey == module && p.Action == action);
                    if (perm != null) operatorPermissions.Add(new RolePermission { RoleId = operatorRole.Id, PermissionId = perm.Id, IsGranted = true, GrantedAt = DateTime.UtcNow, GrantedBy = 0 });
                }
            }
            
            // Reports - VIEW only
            var reportModules = new[] { 
                ModuleKeys.YarnStockReport, ModuleKeys.SetProductionReport, ModuleKeys.BeamUtilizationReport
            };
            foreach (var module in reportModules)
            {
                var viewPerm = permissions.FirstOrDefault(p => p.ModuleKey == module && p.Action == PermissionActions.View);
                if (viewPerm != null) operatorPermissions.Add(new RolePermission { RoleId = operatorRole.Id, PermissionId = viewPerm.Id, IsGranted = true, GrantedAt = DateTime.UtcNow, GrantedBy = 0 });
            }
            
            await context.RolePermissions.AddRangeAsync(operatorPermissions);
            await context.SaveChangesAsync();
        }
        
        // ===========================================
        // ASSIGN PERMISSIONS TO VIEWER ROLE
        // ===========================================
        var viewerRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Viewer");
        if (viewerRole != null)
        {
            // Viewer gets VIEW permission on everything except sensitive settings
            var viewerPermissions = permissions
                .Where(p => p.Action == PermissionActions.View)
                .Where(p => !new[] { ModuleKeys.SecurityPolicies, ModuleKeys.Backup, ModuleKeys.UserManagement, ModuleKeys.RolePermissions }.Contains(p.ModuleKey))
                .Select(p => new RolePermission
                {
                    RoleId = viewerRole.Id,
                    PermissionId = p.Id,
                    IsGranted = true,
                    GrantedAt = DateTime.UtcNow,
                    GrantedBy = 0
                }).ToList();
            
            await context.RolePermissions.AddRangeAsync(viewerPermissions);
            await context.SaveChangesAsync();
        }
    }
    
    private static List<string> GetActionsForModule(string moduleKey)
    {
        // Define actions based on module type
        return moduleKey switch
        {
            // Dashboard only has View
            ModuleKeys.Dashboard => new List<string> { PermissionActions.View },
            
            // Transaction modules have full CRUD + Approve + Print
            ModuleKeys.YarnReceipt or
            ModuleKeys.WarpingJobCard or
            ModuleKeys.SizingJobCard or
            ModuleKeys.YarnReturn or
            ModuleKeys.YarnDelivery or
            ModuleKeys.GSTInvoice => new List<string> 
            { 
                PermissionActions.View, 
                PermissionActions.Create, 
                PermissionActions.Edit, 
                PermissionActions.Delete,
                PermissionActions.Approve,
                PermissionActions.Print
            },
            
            // Baby Cone and Beam Management
            ModuleKeys.BabyCone or
            ModuleKeys.BeamManagement => new List<string> 
            { 
                PermissionActions.View, 
                PermissionActions.Create, 
                PermissionActions.Edit, 
                PermissionActions.Delete
            },
            
            // Stock module has View and Export
            ModuleKeys.YarnStock => new List<string> 
            { 
                PermissionActions.View, 
                PermissionActions.Export
            },
            
            // Master modules have CRUD
            ModuleKeys.Company or
            ModuleKeys.Party or
            ModuleKeys.YarnCount or
            ModuleKeys.LoomType or
            ModuleKeys.Beam or
            ModuleKeys.Vehicle or
            ModuleKeys.FinancialYear or
            ModuleKeys.DocumentSeries => new List<string> 
            { 
                PermissionActions.View, 
                PermissionActions.Create, 
                PermissionActions.Edit, 
                PermissionActions.Delete
            },
            
            // Report modules have View, Print, Export
            ModuleKeys.YarnStockReport or
            ModuleKeys.SetProductionReport or
            ModuleKeys.BeamUtilizationReport or
            ModuleKeys.PartyLedgerReport or
            ModuleKeys.InvoiceRegisterReport or
            ModuleKeys.PendingInvoicesReport => new List<string> 
            { 
                PermissionActions.View, 
                PermissionActions.Print,
                PermissionActions.Export
            },
            
            // Settings modules
            ModuleKeys.UserManagement or
            ModuleKeys.RolePermissions => new List<string> 
            { 
                PermissionActions.View, 
                PermissionActions.Create, 
                PermissionActions.Edit, 
                PermissionActions.Delete
            },
            
            ModuleKeys.ApprovalMatrix or
            ModuleKeys.SystemSettings or
            ModuleKeys.Notifications => new List<string> 
            { 
                PermissionActions.View, 
                PermissionActions.Edit
            },
            
            ModuleKeys.SecurityPolicies or
            ModuleKeys.Backup => new List<string> 
            { 
                PermissionActions.View, 
                PermissionActions.Edit
            },
            
            ModuleKeys.AuditLogs => new List<string> 
            { 
                PermissionActions.View, 
                PermissionActions.Export
            },
            
            // Default: View only
            _ => new List<string> { PermissionActions.View }
        };
    }
    
    private static async Task SeedRolesAndUsers(ApplicationDbContext context)
    {
        // Seed Roles
        var roles = new List<Role>
        {
            new Role
            {
                RoleName = "SuperAdmin",
                RoleDescription = "Full system access with all permissions",
                Permissions = "[\"*\"]",
                IsSystemRole = true,
                SortOrder = 1,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new Role
            {
                RoleName = "Admin",
                RoleDescription = "Administrative access for masters and reports",
                Permissions = "[]",
                IsSystemRole = true,
                SortOrder = 2,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new Role
            {
                RoleName = "Manager",
                RoleDescription = "Manager access for approvals and reports",
                Permissions = "[]",
                IsSystemRole = true,
                SortOrder = 3,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new Role
            {
                RoleName = "Operator",
                RoleDescription = "Operator access for data entry",
                Permissions = "[]",
                IsSystemRole = false,
                SortOrder = 4,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new Role
            {
                RoleName = "Viewer",
                RoleDescription = "Read-only access to view data",
                Permissions = "[]",
                IsSystemRole = false,
                SortOrder = 5,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            }
        };

        await context.Roles.AddRangeAsync(roles);
        await context.SaveChangesAsync();

        // Seed Users (Password: Admin@123) - Using BCrypt for consistency with CreateUserAsync
        var superAdminRole = await context.Roles.FirstAsync(r => r.RoleName == "SuperAdmin");
        var managerRole = await context.Roles.FirstAsync(r => r.RoleName == "Manager");
        var operatorRole = await context.Roles.FirstAsync(r => r.RoleName == "Operator");
        
        // Use BCrypt for password hashing
        // SECURITY: Default password - users MUST change on first login
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");

        var users = new List<User>
        {
            new User
            {
                Username = "admin",
                Email = "admin@sudhan.com",
                FullName = "System Administrator",
                PasswordHash = passwordHash,
                RoleId = superAdminRole.Id,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow,
                FailedLoginAttempts = 0,
                IsLocked = false,
                MustChangePassword = true  // SECURITY: Force password change on first login
            },
            new User
            {
                Username = "manager",
                Email = "manager@sudhan.com",
                FullName = "Production Manager",
                PasswordHash = passwordHash,
                RoleId = managerRole.Id,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow,
                FailedLoginAttempts = 0,
                IsLocked = false,
                MustChangePassword = true  // SECURITY: Force password change on first login
            },
            new User
            {
                Username = "operator1",
                Email = "operator1@sudhan.com",
                FullName = "Machine Operator 1",
                PasswordHash = passwordHash,
                RoleId = operatorRole.Id,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow,
                FailedLoginAttempts = 0,
                IsLocked = false,
                MustChangePassword = true  // SECURITY: Force password change on first login
            }
        };

        await context.Users.AddRangeAsync(users);
        await context.SaveChangesAsync();
    }
    
    private static async Task SeedMasterData(ApplicationDbContext context)
    {
        // Seed Financial Years
        var financialYears = new List<FinancialYear>
        {
            new FinancialYear
            {
                YearCode = "2024-25",
                YearName = "FY 2024-25",
                StartDate = new DateTime(2024, 4, 1),
                EndDate = new DateTime(2025, 3, 31),
                IsCurrent = false,
                IsClosed = false,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new FinancialYear
            {
                YearCode = "2025-26",
                YearName = "FY 2025-26",
                StartDate = new DateTime(2025, 4, 1),
                EndDate = new DateTime(2026, 3, 31),
                IsCurrent = true,
                IsClosed = false,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            }
        };

        await context.FinancialYears.AddRangeAsync(financialYears);
        await context.SaveChangesAsync();

        // Seed Yarn Counts
        var yarnCounts = new List<YarnCount>
        {
            new YarnCount { CountCode = "20s 2/100", CountDescription = "20s Double 100 Ply", Ply = 2, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new YarnCount { CountCode = "30s 2/80", CountDescription = "30s Double 80 Ply", Ply = 2, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new YarnCount { CountCode = "30s 2/100", CountDescription = "30s Double 100 Ply", Ply = 2, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new YarnCount { CountCode = "40s 2/100", CountDescription = "40s Double 100 Ply", Ply = 2, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new YarnCount { CountCode = "Ne 40/1", CountDescription = "Compact 40s Single", Ply = 1, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new YarnCount { CountCode = "60s 2/100", CountDescription = "60s Double 100 Ply", Ply = 2, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new YarnCount { CountCode = "20s 2/80", CountDescription = "20s Double 80 Ply", Ply = 2, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow }
        };

        await context.YarnCounts.AddRangeAsync(yarnCounts);
        await context.SaveChangesAsync();

        // Seed Loom Types
        var loomTypes = new List<LoomType>
        {
            new LoomType { LoomTypeCode = "AIR36", LoomTypeName = "Air Jet 36 inches", WidthInches = 36, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new LoomType { LoomTypeCode = "AIR44", LoomTypeName = "Air Jet 44 inches", WidthInches = 44, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new LoomType { LoomTypeCode = "RAP36", LoomTypeName = "Rapier 36 inches", WidthInches = 36, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new LoomType { LoomTypeCode = "RAP44", LoomTypeName = "Rapier 44 inches", WidthInches = 44, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new LoomType { LoomTypeCode = "PRJ36", LoomTypeName = "Projectile 36 inches", WidthInches = 36, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new LoomType { LoomTypeCode = "PRJ44", LoomTypeName = "Projectile 44 inches", WidthInches = 44, IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow }
        };

        await context.LoomTypes.AddRangeAsync(loomTypes);
        await context.SaveChangesAsync();

        // Seed Company
        var company = new Company
        {
            CompanyName = "Sudhan Textile Mills Pvt Ltd",
            ShortName = "STMPL",
            AddressLine1 = "123, Industrial Estate, SIPCOT",
            AddressLine2 = "Near Water Tank Road",
            City = "Erode",
            State = "Tamil Nadu",
            StateCode = "33",
            Pincode = "638001",
            Country = "India",
            Phone = "0424-2345678",
            Email = "info@sudhantextile.com",
            Website = "www.sudhantextile.com",
            GSTIN = "33AABCS1234A1Z5",
            PAN = "AABCS1234A",
            BankName = "State Bank of India",
            BankBranch = "Erode Main Branch",
            BankAccountNo = "38574950238",
            BankIFSC = "SBIN0001234",
            IsActive = true,
            CreatedBy = "System",
            CreatedDate = DateTime.UtcNow
        };

        await context.Companies.AddAsync(company);
        await context.SaveChangesAsync();

        // Seed Sample Parties
        var parties = new List<Party>
        {
            new Party
            {
                PartyCode = "LWM",
                PartyName = "Lakshmi Weaving Mills",
                PartyType = "Customer",
                AddressLine1 = "45, Weaving Complex",
                City = "Erode",
                State = "Tamil Nadu",
                StateCode = "33",
                Pincode = "638001",
                Country = "India",
                Phone = "0424-2234567",
                ContactPerson = "Mr. Ganesh",
                GSTIN = "33AALFL4567B1Z8",
                CreditDays = 30,
                CreditLimit = 500000,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new Party
            {
                PartyCode = "NTM",
                PartyName = "New Textile Mills",
                PartyType = "Customer",
                AddressLine1 = "12, Industrial Area Phase-II",
                City = "Coimbatore",
                State = "Tamil Nadu",
                StateCode = "33",
                Pincode = "641014",
                Country = "India",
                Phone = "0422-3345678",
                ContactPerson = "Mr. Arjun",
                GSTIN = "33AANFN7890C1Z2",
                CreditDays = 45,
                CreditLimit = 750000,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new Party
            {
                PartyCode = "SBF",
                PartyName = "Sri Balaji Fabrics",
                PartyType = "Supplier",
                AddressLine1 = "78, Yarn Market Road",
                City = "Erode",
                State = "Tamil Nadu",
                StateCode = "33",
                Pincode = "638003",
                Country = "India",
                Phone = "0424-2456789",
                ContactPerson = "Mr. Venkatesh",
                GSTIN = "33AABFS5678D1Z4",
                CreditDays = 30,
                CreditLimit = 1000000,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            },
            new Party
            {
                PartyCode = "KWM",
                PartyName = "Kumar Weaving Mills",
                PartyType = "Customer",
                AddressLine1 = "55, Power Loom Street",
                City = "Salem",
                State = "Tamil Nadu",
                StateCode = "33",
                Pincode = "636001",
                Country = "India",
                Phone = "0427-3456789",
                ContactPerson = "Mr. Kumar",
                GSTIN = "33AABCK2345E1Z7",
                CreditDays = 30,
                CreditLimit = 600000,
                IsActive = true,
                CreatedBy = "System",
                CreatedDate = DateTime.UtcNow
            }
        };

        await context.Parties.AddRangeAsync(parties);
        await context.SaveChangesAsync();

        // Seed Vehicles
        var vehicles = new List<Vehicle>
        {
            new Vehicle { VehicleNo = "TN 33 AB 1234", VehicleType = "Lorry", DriverName = "Selvam", DriverPhone = "9876543210", OwnerName = "Sudhan Transport", IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Vehicle { VehicleNo = "TN 33 XY 6789", VehicleType = "Mini Truck", DriverName = "Murugan", DriverPhone = "9876543211", OwnerName = "Erode Carriers", IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Vehicle { VehicleNo = "TN 36 CD 4455", VehicleType = "Lorry", DriverName = "Rajan", DriverPhone = "9876543212", OwnerName = "Coimbatore Logistics", IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
        };

        await context.Vehicles.AddRangeAsync(vehicles);
        await context.SaveChangesAsync();

        // Seed Sample Beams
        var beams = new List<Beam>
        {
            new Beam { BeamNo = "WB-001", BeamType = "Warping Beam", TareWeight = 25, WidthInches = 44, MaxEnds = 6000, Status = "Available", IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Beam { BeamNo = "WB-002", BeamType = "Warping Beam", TareWeight = 25, WidthInches = 44, MaxEnds = 6000, Status = "Available", IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Beam { BeamNo = "WB-003", BeamType = "Warping Beam", TareWeight = 24, WidthInches = 36, MaxEnds = 4800, Status = "Available", IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Beam { BeamNo = "SB-001", BeamType = "Sizing Beam", TareWeight = 30, WidthInches = 44, MaxEnds = 6000, Status = "Available", IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Beam { BeamNo = "SB-002", BeamType = "Sizing Beam", TareWeight = 30, WidthInches = 44, MaxEnds = 6000, Status = "Available", IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Beam { BeamNo = "SB-003", BeamType = "Sizing Beam", TareWeight = 28, WidthInches = 36, MaxEnds = 4800, Status = "Available", IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Beam { BeamNo = "WB-004", BeamType = "Warping Beam", TareWeight = 25, WidthInches = 44, MaxEnds = 6000, Status = "Available", IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
            new Beam { BeamNo = "SB-004", BeamType = "Sizing Beam", TareWeight = 30, WidthInches = 44, MaxEnds = 6000, Status = "Available", IsActive = true, CreatedBy = "System", CreatedDate = DateTime.UtcNow },
        };

        await context.Beams.AddRangeAsync(beams);
        await context.SaveChangesAsync();
    }
}
