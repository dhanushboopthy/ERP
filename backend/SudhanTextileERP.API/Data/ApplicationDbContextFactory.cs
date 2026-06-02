using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SudhanTextileERP.API.Data;

public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        
        // Use a temporary connection string for migrations
        // This will be replaced at runtime with actual connection string
        var connectionString = "Server=auth-db1993.hstgr.io;Port=3306;Database=u244866688_ERP;Uid=u244866688_ERP;Pwd=@ERP@Duolink12345678;SslMode=Required;";
        
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 21));
        optionsBuilder.UseMySql(connectionString, serverVersion);
        
        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
