using System.Security.Cryptography;

namespace SudhanTextileERP.API.Configuration;

/// <summary>
/// Secure configuration loader that REQUIRES environment variables for sensitive data.
/// Application will FAIL TO START if required secrets are not configured.
/// </summary>
public static class SecureConfigurationLoader
{
    private const int MinJwtKeyLength = 32; // 256 bits minimum

    /// <summary>
    /// Validates all required security configurations are present.
    /// Throws StartupException if any critical configuration is missing.
    /// </summary>
    public static void ValidateSecurityConfiguration(IConfiguration configuration, IWebHostEnvironment environment)
    {
        var errors = new List<string>();

        // In Production, ALL secrets MUST come from environment variables
        if (environment.IsProduction())
        {
            ValidateProductionSecrets(errors);
        }
        else
        {
            // In Development, allow config file but warn about insecure patterns
            ValidateDevelopmentSecrets(configuration, errors);
        }

        if (errors.Any())
        {
            var message = "SECURITY CONFIGURATION FAILURE - Application cannot start:\n" + 
                         string.Join("\n", errors.Select(e => $"  ❌ {e}"));
            throw new SecurityConfigurationException(message);
        }
    }

    private static void ValidateProductionSecrets(List<string> errors)
    {
        // Database Connection String
        var dbConnection = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(dbConnection))
        {
            errors.Add("DB_CONNECTION_STRING environment variable is REQUIRED in production");
        }

        // JWT Secret Key
        var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
        if (string.IsNullOrWhiteSpace(jwtSecret))
        {
            errors.Add("JWT_SECRET_KEY environment variable is REQUIRED in production");
        }
        else if (jwtSecret.Length < MinJwtKeyLength)
        {
            errors.Add($"JWT_SECRET_KEY must be at least {MinJwtKeyLength} characters (256 bits)");
        }

        // CORS Origins
        var corsOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
        if (string.IsNullOrWhiteSpace(corsOrigins))
        {
            errors.Add("CORS_ALLOWED_ORIGINS environment variable is REQUIRED in production");
        }
        else if (corsOrigins.Contains("localhost", StringComparison.OrdinalIgnoreCase))
        {
            errors.Add("CORS_ALLOWED_ORIGINS cannot contain 'localhost' in production");
        }
    }

    private static void ValidateDevelopmentSecrets(IConfiguration configuration, List<string> errors)
    {
        // Check for obviously insecure patterns in config
        var jwtKey = GetJwtSecretKey(configuration);
        
        if (jwtKey.Contains("__") || jwtKey.Contains("REPLACE") || jwtKey.Contains("ENV"))
        {
            // Placeholder detected - check for env var
            var envKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
            if (string.IsNullOrWhiteSpace(envKey))
            {
                errors.Add("JWT_SECRET_KEY not configured. Set environment variable or update appsettings.Development.json");
            }
        }

        var connString = GetConnectionString(configuration);
        if (connString.Contains("__") || connString.Contains("REPLACE") || connString.Contains("ENV"))
        {
            var envConn = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
            if (string.IsNullOrWhiteSpace(envConn))
            {
                // In dev, allow SQLite without env var
                var provider = configuration.GetConnectionString("DatabaseProvider");
                if (!provider?.Equals("SQLite", StringComparison.OrdinalIgnoreCase) ?? true)
                {
                    errors.Add("DB_CONNECTION_STRING not configured for MySQL. Set environment variable.");
                }
            }
        }
    }

    /// <summary>
    /// Gets the database connection string from environment variable (preferred) or configuration.
    /// </summary>
    public static string GetConnectionString(IConfiguration configuration)
    {
        // Priority: Environment Variable > Configuration
        var envConnectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
        if (!string.IsNullOrWhiteSpace(envConnectionString))
        {
            return envConnectionString;
        }

        return configuration.GetConnectionString("DefaultConnection") ?? 
               throw new SecurityConfigurationException("Database connection string not configured");
    }

    /// <summary>
    /// Gets the JWT secret key from environment variable (preferred) or configuration.
    /// </summary>
    public static string GetJwtSecretKey(IConfiguration configuration)
    {
        // Priority: Environment Variable > Configuration
        var envJwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
        if (!string.IsNullOrWhiteSpace(envJwtSecret))
        {
            return envJwtSecret;
        }

        var configSecret = configuration["JwtSettings:SecretKey"];
        if (string.IsNullOrWhiteSpace(configSecret) || 
            configSecret.Contains("__") || 
            configSecret.Contains("REPLACE"))
        {
            throw new SecurityConfigurationException("JWT_SECRET_KEY not configured");
        }

        return configSecret;
    }

    /// <summary>
    /// Gets CORS allowed origins from environment variable (preferred) or configuration.
    /// </summary>
    public static string[] GetCorsOrigins(IConfiguration configuration)
    {
        // Priority: Environment Variable > Configuration
        var envCorsOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
        if (!string.IsNullOrWhiteSpace(envCorsOrigins))
        {
            return envCorsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                 .Select(o => o.Trim())
                                 .ToArray();
        }

        return configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>() 
               ?? new[] { "http://localhost:3000" };
    }

    /// <summary>
    /// Generates a cryptographically secure random key for JWT signing.
    /// Use this to generate production keys.
    /// </summary>
    public static string GenerateSecureJwtKey(int lengthInBytes = 32)
    {
        var key = new byte[lengthInBytes];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(key);
        return Convert.ToBase64String(key);
    }
}

/// <summary>
/// Exception thrown when security configuration is invalid or missing.
/// </summary>
public class SecurityConfigurationException : Exception
{
    public SecurityConfigurationException(string message) : base(message) { }
}
