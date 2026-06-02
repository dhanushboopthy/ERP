using Microsoft.EntityFrameworkCore;
using SudhanTextileERP.API.Data;
using SudhanTextileERP.API.Entities;

namespace SudhanTextileERP.API.Services;

/// <summary>
/// Database initializer that ensures default data exists
/// </summary>
public static class DbInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext context, ILogger logger)
    {
        try
        {
            // Ensure database is created
            await context.Database.EnsureCreatedAsync();
            logger.LogInformation("Database initialized");

            // Check if we need to seed data
            if (await context.Users.AnyAsync())
            {
                logger.LogInformation("Database already contains data. Skipping seed.");
                return;
            }

            logger.LogInformation("Seeding database with default data...");

            // Seed Modules
            await SeedModulesAsync(context, logger);

            // Seed Permissions
            await SeedPermissionsAsync(context, logger);

            // Seed Roles
            await SeedRolesAsync(context, logger);

            // Seed Default Admin User
            await SeedDefaultUserAsync(context, logger);

            logger.LogInformation("✅ Database seeding completed successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Error initializing database");
            throw;
        }
    }

    private static async Task SeedModulesAsync(ApplicationDbContext context, ILogger logger)
    {
        var modules = new[]
        {
            new Module { ModuleKey = "MASTERS", ModuleName = "Masters", ParentModule = "ROOT", RoutePath = "/masters", Icon = "database", SortOrder = 1 },
            new Module { ModuleKey = "YARN", ModuleName = "Yarn Management", ParentModule = "ROOT", RoutePath = "/yarn", Icon = "package", SortOrder = 2 },
            new Module { ModuleKey = "WARPING", ModuleName = "Warping", ParentModule = "ROOT", RoutePath = "/warping", Icon = "layers", SortOrder = 3 },
            new Module { ModuleKey = "SIZING", ModuleName = "Sizing", ParentModule = "ROOT", RoutePath = "/sizing", Icon = "maximize", SortOrder = 4 },
            new Module { ModuleKey = "WEAVING", ModuleName = "Weaving", ParentModule = "ROOT", RoutePath = "/weaving", Icon = "grid", SortOrder = 5 },
            new Module { ModuleKey = "INVOICE", ModuleName = "Invoice", ParentModule = "ROOT", RoutePath = "/invoice", Icon = "file-text", SortOrder = 6 },
            new Module { ModuleKey = "REPORTS", ModuleName = "Reports", ParentModule = "ROOT", RoutePath = "/reports", Icon = "bar-chart", SortOrder = 7 },
            new Module { ModuleKey = "SETTINGS", ModuleName = "Settings", ParentModule = "ROOT", RoutePath = "/settings", Icon = "settings", SortOrder = 8 }
        };

        context.Modules.AddRange(modules);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} modules", modules.Length);
    }

    private static async Task SeedPermissionsAsync(ApplicationDbContext context, ILogger logger)
    {
        var modules = await context.Modules.ToListAsync();
        var permissions = new List<Permission>();

        foreach (var module in modules)
        {
            permissions.AddRange(new[]
            {
                new Permission { ModuleId = module.Id, ModuleKey = module.ModuleKey, PermissionCode = $"{module.ModuleKey}.VIEW", PermissionName = $"View {module.ModuleName}", Action = "VIEW", IsActive = true },
                new Permission { ModuleId = module.Id, ModuleKey = module.ModuleKey, PermissionCode = $"{module.ModuleKey}.CREATE", PermissionName = $"Create {module.ModuleName}", Action = "CREATE", IsActive = true },
                new Permission { ModuleId = module.Id, ModuleKey = module.ModuleKey, PermissionCode = $"{module.ModuleKey}.EDIT", PermissionName = $"Edit {module.ModuleName}", Action = "EDIT", IsActive = true },
                new Permission { ModuleId = module.Id, ModuleKey = module.ModuleKey, PermissionCode = $"{module.ModuleKey}.DELETE", PermissionName = $"Delete {module.ModuleName}", Action = "DELETE", IsActive = true }
            });
        }

        context.Permissions.AddRange(permissions);
        await context.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} permissions", permissions.Count);
    }

    private static async Task SeedRolesAsync(ApplicationDbContext context, ILogger logger)
    {
        var allPermissions = await context.Permissions.ToListAsync();

        var adminRole = new Role
        {
            RoleName = "Admin",
            RoleDescription = "System Administrator with full access",
            IsSystemRole = true,
            SortOrder = 1,
            IsActive = true,
            CreatedBy = "System",
            CreatedDate = DateTime.UtcNow
        };

        context.Roles.Add(adminRole);
        await context.SaveChangesAsync();

        // Grant all permissions to Admin role
        var rolePermissions = allPermissions.Select(p => new RolePermission
        {
            RoleId = adminRole.Id,
            PermissionId = p.Id
        }).ToList();

        context.RolePermissions.AddRange(rolePermissions);
        await context.SaveChangesAsync();

        logger.LogInformation("Seeded Admin role with {Count} permissions", rolePermissions.Count);
    }

    private static async Task SeedDefaultUserAsync(ApplicationDbContext context, ILogger logger)
    {
        var adminRole = await context.Roles.FirstAsync(r => r.RoleName == "Admin");

        // Hash the password "Admin@123" using BCrypt
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");

        var adminUser = new User
        {
            Username = "Admin",
            Email = "admin@sudhantextile.com",
            PasswordHash = passwordHash,
            FullName = "System Administrator",
            RoleId = adminRole.Id,
            IsActive = true,
            MustChangePassword = false, // Set to false for development
            FailedLoginAttempts = 0,
            CreatedBy = "System",
            CreatedDate = DateTime.UtcNow
        };

        context.Users.Add(adminUser);
        await context.SaveChangesAsync();

        logger.LogInformation("✅ Created default admin user:");
        logger.LogInformation("   Username: Admin");
        logger.LogInformation("   Password: Admin@123");
        logger.LogInformation("   Email: admin@sudhantextile.com");
    }
}
