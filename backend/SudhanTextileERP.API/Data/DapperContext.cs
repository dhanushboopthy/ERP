using Microsoft.Data.Sqlite;
using MySql.Data.MySqlClient;
using System.Data;

namespace SudhanTextileERP.API.Data;

public interface IDapperContext
{
    IDbConnection CreateConnection();
}

public class DapperContext : IDapperContext
{
    private readonly IConfiguration _configuration;

    public DapperContext(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public IDbConnection CreateConnection()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        var databaseProvider = _configuration.GetConnectionString("DatabaseProvider") ?? "MySQL";

        if (databaseProvider.Equals("MySQL", StringComparison.OrdinalIgnoreCase))
        {
            return new MySqlConnection(connectionString);
        }
        else if (databaseProvider.Equals("SQLite", StringComparison.OrdinalIgnoreCase))
        {
            return new SqliteConnection(connectionString);
        }
        else
        {
            throw new InvalidOperationException($"Unsupported database provider: {databaseProvider}");
        }
    }
}

