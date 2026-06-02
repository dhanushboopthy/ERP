# ===================================================================
# PHASE-2 ENVIRONMENT SETUP & VALIDATION SCRIPT
# ===================================================================
# Purpose: Set up and validate DEV/STAGING/PROD environment separation
# Usage: .\setup-phase2-environment.ps1 -Environment <Dev|Staging|Prod>
# ===================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Dev", "Staging", "Prod")]
    [string]$Environment,
    
    [switch]$Validate,  # Only validate, don't set up
    [switch]$Force      # Override safety checks
)

$ErrorActionPreference = "Stop"
$script:Issues = @()
$script:Passed = @()
$script:Warnings = @()

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PHASE-2 ENVIRONMENT SETUP & VALIDATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Mode: $(if ($Validate) { 'VALIDATE ONLY' } else { 'SETUP & VALIDATE' })" -ForegroundColor Yellow
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# ===================================================================
# ENVIRONMENT CONFIGURATION
# ===================================================================

$envConfig = @{
    Dev = @{
        ApiUrl = "https://localhost:7001"
        DbServer = "localhost"
        DbName = "SudhanTextileERP_Dev"
        AllowSchemaChanges = $true
        AllowDirectDbEdit = $true
        FeatureFlagsDefaultState = "ON"  # Enable all for testing
        LogLevel = "Debug"
        RequireApproval = $false
    }
    Staging = @{
        ApiUrl = "https://staging.sudhantextile.local:7002"
        DbServer = "localhost"
        DbName = "SudhanTextileERP_Staging"
        AllowSchemaChanges = $false
        AllowDirectDbEdit = $false
        FeatureFlagsDefaultState = "OFF"  # Mirror production
        LogLevel = "Information"
        RequireApproval = $true
    }
    Prod = @{
        ApiUrl = "https://erp.sudhantextile.com"
        DbServer = "localhost"  # Or remote server
        DbName = "SudhanTextileERP"
        AllowSchemaChanges = $false
        AllowDirectDbEdit = $false
        FeatureFlagsDefaultState = "OFF"  # All features OFF by default
        LogLevel = "Warning"
        RequireApproval = $true
    }
}

$config = $envConfig[$Environment]

# ===================================================================
# VALIDATION FUNCTIONS
# ===================================================================

function Test-EnvironmentSeparation {
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "[CHECK] Environment Separation" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    
    # Check appsettings file exists
    $appSettingsFile = "backend\SudhanTextileERP.API\appsettings.$Environment.json"
    
    if (Test-Path $appSettingsFile) {
        Write-Host "✓ Configuration file exists: $appSettingsFile" -ForegroundColor Green
        $script:Passed += "Configuration file exists"
        
        try {
            $settings = Get-Content $appSettingsFile | ConvertFrom-Json
            
            # Validate database name is environment-specific
            if ($Environment -ne "Prod" -and $settings.ConnectionStrings.DefaultConnection -notmatch "_$Environment") {
                $script:Warnings += "Database name should include environment suffix (_$Environment)"
                Write-Host "⚠ Database name should include environment suffix" -ForegroundColor Yellow
            } else {
                Write-Host "✓ Database name is environment-specific" -ForegroundColor Green
                $script:Passed += "Database naming convention correct"
            }
            
            # Validate log level
            if ($settings.Logging.LogLevel.Default -eq $config.LogLevel) {
                Write-Host "✓ Log level set correctly: $($config.LogLevel)" -ForegroundColor Green
                $script:Passed += "Log level correct"
            } else {
                $script:Warnings += "Log level should be $($config.LogLevel) for $Environment"
                Write-Host "⚠ Log level should be $($config.LogLevel)" -ForegroundColor Yellow
            }
            
        } catch {
            $script:Issues += "Could not parse configuration file"
            Write-Host "✗ Could not parse configuration file: $_" -ForegroundColor Red
        }
        
    } else {
        $script:Issues += "Configuration file missing: $appSettingsFile"
        Write-Host "✗ Configuration file missing: $appSettingsFile" -ForegroundColor Red
    }
    
    Write-Host ""
}

function Test-DatabaseConfiguration {
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "[CHECK] Database Configuration" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    
    $appSettingsFile = "backend\SudhanTextileERP.API\appsettings.$Environment.json"
    
    if (-not (Test-Path $appSettingsFile)) {
        Write-Host "⚠ Skipping (config file missing)" -ForegroundColor Yellow
        return
    }
    
    try {
        $settings = Get-Content $appSettingsFile | ConvertFrom-Json
        $connString = $settings.ConnectionStrings.DefaultConnection
        
        Write-Host "Database: $($config.DbName)" -ForegroundColor Cyan
        Write-Host "Server: $($config.DbServer)" -ForegroundColor Cyan
        
        # Try to connect
        try {
            $result = Invoke-Sqlcmd -ServerInstance $config.DbServer -Database "master" -Query "SELECT 1" -ErrorAction Stop
            Write-Host "✓ Database server reachable" -ForegroundColor Green
            $script:Passed += "Database server reachable"
            
            # Check if database exists
            $dbExists = Invoke-Sqlcmd -ServerInstance $config.DbServer -Database "master" -Query @"
SELECT COUNT(*) as DbCount FROM sys.databases WHERE name = '$($config.DbName)'
"@ -ErrorAction Stop
            
            if ($dbExists.DbCount -eq 1) {
                Write-Host "✓ Database exists: $($config.DbName)" -ForegroundColor Green
                $script:Passed += "Database exists"
                
                # Check schema version
                try {
                    $schemaVersion = Invoke-Sqlcmd -ServerInstance $config.DbServer -Database $config.DbName -Query @"
SELECT TOP 1 MigrationId FROM __EFMigrationsHistory ORDER BY MigrationId DESC
"@ -ErrorAction SilentlyContinue
                    
                    if ($schemaVersion) {
                        Write-Host "  Latest migration: $($schemaVersion.MigrationId)" -ForegroundColor Cyan
                    }
                } catch {
                    Write-Host "  ⚠ Could not check migration history" -ForegroundColor Yellow
                }
                
            } else {
                $script:Warnings += "Database does not exist: $($config.DbName)"
                Write-Host "⚠ Database does not exist: $($config.DbName)" -ForegroundColor Yellow
                Write-Host "  Run database migrations to create" -ForegroundColor Gray
            }
            
        } catch {
            $script:Warnings += "Could not connect to database server"
            Write-Host "⚠ Could not connect to database: $_" -ForegroundColor Yellow
        }
        
    } catch {
        $script:Issues += "Could not read database configuration"
        Write-Host "✗ Could not read database configuration: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

function Test-FeatureFlagConfiguration {
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "[CHECK] Feature Flag Configuration" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    
    $appSettingsFile = "backend\SudhanTextileERP.API\appsettings.$Environment.json"
    
    if (-not (Test-Path $appSettingsFile)) {
        Write-Host "⚠ Skipping (config file missing)" -ForegroundColor Yellow
        return
    }
    
    try {
        $settings = Get-Content $appSettingsFile | ConvertFrom-Json
        
        if ($settings.FeatureFlags) {
            Write-Host "✓ Feature flags section exists" -ForegroundColor Green
            $script:Passed += "Feature flags configured"
            
            # Check default state
            $expectedDefault = $config.FeatureFlagsDefaultState
            Write-Host "  Expected default state: $expectedDefault" -ForegroundColor Cyan
            
            # List all feature flags
            $flagCount = 0
            $settings.FeatureFlags.PSObject.Properties | ForEach-Object {
                $flagName = $_.Name
                $flagValue = $_.Value
                
                if ($flagValue -is [PSCustomObject]) {
                    $enabled = $flagValue.Enabled
                    $flagCount++
                    
                    $status = if ($enabled) { "ON" } else { "OFF" }
                    $color = if ($enabled -eq ($expectedDefault -eq "ON")) { "Green" } else { "Yellow" }
                    Write-Host "  - $flagName : $status" -ForegroundColor $color
                }
            }
            
            if ($flagCount -eq 0) {
                Write-Host "  No feature flags defined yet (OK for early Phase-2)" -ForegroundColor Gray
            }
            
        } else {
            $script:Warnings += "Feature flags section missing in configuration"
            Write-Host "⚠ Feature flags section missing" -ForegroundColor Yellow
            Write-Host "  Add FeatureFlags section to appsettings" -ForegroundColor Gray
        }
        
    } catch {
        $script:Issues += "Could not read feature flag configuration"
        Write-Host "✗ Could not read feature flag configuration: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

function Test-SecurityConfiguration {
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "[CHECK] Security Configuration" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    
    $appSettingsFile = "backend\SudhanTextileERP.API\appsettings.$Environment.json"
    
    if (-not (Test-Path $appSettingsFile)) {
        Write-Host "⚠ Skipping (config file missing)" -ForegroundColor Yellow
        return
    }
    
    try {
        $settings = Get-Content $appSettingsFile | ConvertFrom-Json
        
        # Check JWT settings
        if ($settings.Jwt) {
            Write-Host "✓ JWT settings configured" -ForegroundColor Green
            
            # Check if using default key (BAD for Prod)
            if ($Environment -eq "Prod" -and $settings.Jwt.Key -like "*your-256-bit-secret*") {
                $script:Issues += "CRITICAL: Production using default JWT key"
                Write-Host "✗ CRITICAL: Production using default JWT key" -ForegroundColor Red
            } else {
                Write-Host "  ✓ JWT key appears customized" -ForegroundColor Green
                $script:Passed += "JWT key not default"
            }
            
            # Check token expiry
            if ($settings.Jwt.ExpiryInMinutes) {
                $expiry = $settings.Jwt.ExpiryInMinutes
                Write-Host "  Token expiry: $expiry minutes" -ForegroundColor Cyan
                
                if ($Environment -eq "Prod" -and $expiry -gt 1440) {
                    $script:Warnings += "Production token expiry >24 hours (security risk)"
                    Write-Host "  ⚠ Token expiry >24 hours (consider reducing)" -ForegroundColor Yellow
                }
            }
            
        } else {
            $script:Warnings += "JWT settings missing"
            Write-Host "⚠ JWT settings missing" -ForegroundColor Yellow
        }
        
        # Check CORS settings
        if ($settings.AllowedOrigins) {
            Write-Host "✓ CORS settings configured" -ForegroundColor Green
            
            if ($Environment -eq "Prod" -and $settings.AllowedOrigins -contains "*") {
                $script:Issues += "CRITICAL: Production allowing all CORS origins (*)"
                Write-Host "✗ CRITICAL: Production allowing all CORS origins" -ForegroundColor Red
            } else {
                Write-Host "  Allowed origins: $($settings.AllowedOrigins -join ', ')" -ForegroundColor Cyan
            }
        }
        
    } catch {
        $script:Issues += "Could not read security configuration"
        Write-Host "✗ Could not read security configuration: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

function Test-EnvironmentRestrictions {
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "[CHECK] Environment Restrictions" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    
    Write-Host "Environment: $Environment" -ForegroundColor Cyan
    Write-Host "Schema changes allowed: $($config.AllowSchemaChanges)" -ForegroundColor Cyan
    Write-Host "Direct DB edits allowed: $($config.AllowDirectDbEdit)" -ForegroundColor Cyan
    Write-Host "Approval required for deployment: $($config.RequireApproval)" -ForegroundColor Cyan
    
    if ($Environment -eq "Prod") {
        if ($config.AllowSchemaChanges -eq $false) {
            Write-Host "✓ Production schema changes BLOCKED (correct)" -ForegroundColor Green
            $script:Passed += "Production schema changes blocked"
        } else {
            $script:Issues += "CRITICAL: Production allows schema changes"
            Write-Host "✗ CRITICAL: Production allows schema changes" -ForegroundColor Red
        }
        
        if ($config.RequireApproval -eq $true) {
            Write-Host "✓ Production deployments require approval (correct)" -ForegroundColor Green
            $script:Passed += "Production requires approval"
        } else {
            $script:Issues += "Production deployments should require approval"
            Write-Host "✗ Production deployments should require approval" -ForegroundColor Red
        }
    }
    
    if ($Environment -eq "Staging") {
        if ($config.AllowSchemaChanges -eq $false) {
            Write-Host "✓ Staging schema changes BLOCKED (mirrors production)" -ForegroundColor Green
            $script:Passed += "Staging schema changes blocked"
        } else {
            $script:Warnings += "Staging should block schema changes (mirror production)"
            Write-Host "⚠ Staging should block schema changes" -ForegroundColor Yellow
        }
    }
    
    if ($Environment -eq "Dev") {
        if ($config.AllowSchemaChanges -eq $true) {
            Write-Host "✓ Dev allows schema changes (correct for development)" -ForegroundColor Green
            $script:Passed += "Dev allows schema changes"
        }
    }
    
    Write-Host ""
}

function Test-BackupConfiguration {
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "[CHECK] Backup Configuration" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
    
    if ($Environment -eq "Prod" -or $Environment -eq "Staging") {
        # Check if backup script exists
        if (Test-Path "backup-database.ps1") {
            Write-Host "✓ Backup script exists" -ForegroundColor Green
            $script:Passed += "Backup script exists"
        } else {
            $script:Warnings += "Backup script not found"
            Write-Host "⚠ Backup script not found (backup-database.ps1)" -ForegroundColor Yellow
        }
        
        # Check for recent backups
        $backupPath = "backups"
        if (Test-Path $backupPath) {
            $recentBackups = Get-ChildItem $backupPath -Filter "*.bak" -ErrorAction SilentlyContinue | 
                             Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) } |
                             Sort-Object LastWriteTime -Descending
            
            if ($recentBackups.Count -gt 0) {
                Write-Host "✓ Recent backups found: $($recentBackups.Count)" -ForegroundColor Green
                Write-Host "  Latest backup: $($recentBackups[0].Name) ($($recentBackups[0].LastWriteTime))" -ForegroundColor Cyan
                $script:Passed += "Recent backups exist"
            } else {
                $script:Warnings += "No recent backups found (last 7 days)"
                Write-Host "⚠ No recent backups found (last 7 days)" -ForegroundColor Yellow
            }
        } else {
            $script:Warnings += "Backup directory not found"
            Write-Host "⚠ Backup directory not found: $backupPath" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ℹ Backup checks skipped for Dev environment" -ForegroundColor Gray
    }
    
    Write-Host ""
}

# ===================================================================
# SETUP FUNCTIONS (if not -Validate)
# ===================================================================

function Initialize-EnvironmentConfiguration {
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  ENVIRONMENT SETUP" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    $appSettingsFile = "backend\SudhanTextileERP.API\appsettings.$Environment.json"
    
    # Create appsettings if it doesn't exist
    if (-not (Test-Path $appSettingsFile)) {
        Write-Host "Creating new configuration file: $appSettingsFile" -ForegroundColor Yellow
        
        $template = @{
            Logging = @{
                LogLevel = @{
                    Default = $config.LogLevel
                    "Microsoft.AspNetCore" = "Warning"
                }
            }
            AllowedHosts = "*"
            ConnectionStrings = @{
                DefaultConnection = "Server=$($config.DbServer);Database=$($config.DbName);Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
            }
            Jwt = @{
                Key = "your-256-bit-secret-key-here-CHANGE-IN-PRODUCTION"
                Issuer = "SudhanTextileERP"
                Audience = "SudhanTextileERP"
                ExpiryInMinutes = 480
            }
            AllowedOrigins = @(
                "https://localhost:3000"
                $config.ApiUrl
            )
            FeatureFlags = @{
                ScheduledReports = @{
                    Enabled = if ($config.FeatureFlagsDefaultState -eq "ON") { $true } else { $false }
                }
                StockAlerts = @{
                    Enabled = if ($config.FeatureFlagsDefaultState -eq "ON") { $true } else { $false }
                }
                DashboardCustomization = @{
                    Enabled = if ($config.FeatureFlagsDefaultState -eq "ON") { $true } else { $false }
                }
            }
        }
        
        $template | ConvertTo-Json -Depth 10 | Out-File $appSettingsFile -Encoding UTF8
        Write-Host "✓ Configuration file created" -ForegroundColor Green
    } else {
        Write-Host "✓ Configuration file already exists" -ForegroundColor Green
    }
    
    Write-Host ""
}

# ===================================================================
# MAIN EXECUTION
# ===================================================================

if (-not $Validate) {
    Initialize-EnvironmentConfiguration
}

# Run all validation checks
Test-EnvironmentSeparation
Test-DatabaseConfiguration
Test-FeatureFlagConfiguration
Test-SecurityConfiguration
Test-EnvironmentRestrictions
Test-BackupConfiguration

# ===================================================================
# FINAL VERDICT
# ===================================================================

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  VALIDATION RESULTS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Checks Passed: $($script:Passed.Count)" -ForegroundColor Green
Write-Host "Warnings: $($script:Warnings.Count)" -ForegroundColor Yellow
Write-Host "Issues: $($script:Issues.Count)" -ForegroundColor Red
Write-Host ""

if ($script:Issues.Count -eq 0) {
    if ($script:Warnings.Count -eq 0) {
        Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                                                           ║" -ForegroundColor Green
        Write-Host "║   ✓ $Environment ENVIRONMENT READY                            ║" -ForegroundColor Green
        Write-Host "║                                                           ║" -ForegroundColor Green
        Write-Host "║   All validation checks passed.                           ║" -ForegroundColor Green
        Write-Host "║                                                           ║" -ForegroundColor Green
        Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
        $exitCode = 0
    } else {
        Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "║   ⚠ $Environment ENVIRONMENT READY (WITH WARNINGS)            ║" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "║   Review warnings before proceeding.                      ║" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
        $exitCode = 0
    }
} else {
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                                                           ║" -ForegroundColor Red
    Write-Host "║   ✗ $Environment ENVIRONMENT NOT READY                        ║" -ForegroundColor Red
    Write-Host "║                                                           ║" -ForegroundColor Red
    Write-Host "║   Critical issues must be resolved.                       ║" -ForegroundColor Red
    Write-Host "║                                                           ║" -ForegroundColor Red
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Red
    $exitCode = 1
}

Write-Host ""

# Show issues
if ($script:Issues.Count -gt 0) {
    Write-Host "CRITICAL ISSUES:" -ForegroundColor Red
    foreach ($issue in $script:Issues) {
        Write-Host "  ✗ $issue" -ForegroundColor Red
    }
    Write-Host ""
}

# Show warnings
if ($script:Warnings.Count -gt 0) {
    Write-Host "WARNINGS:" -ForegroundColor Yellow
    foreach ($warning in $script:Warnings) {
        Write-Host "  ⚠ $warning" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ===================================================================
# NEXT STEPS
# ===================================================================

if ($exitCode -eq 0) {
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
    Write-Host ""
    
    if ($Environment -eq "Dev") {
        Write-Host "1. Run database migrations:" -ForegroundColor White
        Write-Host "   cd backend\SudhanTextileERP.API" -ForegroundColor Gray
        Write-Host "   dotnet ef database update" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Start development server:" -ForegroundColor White
        Write-Host "   dotnet run --environment Development" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Begin Track A/B/C development" -ForegroundColor White
    }
    
    if ($Environment -eq "Staging") {
        Write-Host "1. Copy anonymized data from production" -ForegroundColor White
        Write-Host "2. Test deployment procedure" -ForegroundColor White
        Write-Host "3. Run UAT testing for 3+ days before production" -ForegroundColor White
    }
    
    if ($Environment -eq "Prod") {
        Write-Host "1. Verify Phase-2 entry conditions (run validate-phase2-entry.ps1)" -ForegroundColor White
        Write-Host "2. Review Phase-2 Sprint Plan" -ForegroundColor White
        Write-Host "3. Ensure all approvals obtained" -ForegroundColor White
        Write-Host "4. Schedule first deployment (Saturday 10 PM)" -ForegroundColor White
    }
    
    Write-Host ""
}

# Create validation record
$validationRecord = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    environment = $Environment
    passed = $script:Passed.Count
    warnings = $script:Warnings.Count
    issues = $script:Issues.Count
    issuesList = $script:Issues
    warningsList = $script:Warnings
    passedChecks = $script:Passed
    verdict = if ($exitCode -eq 0) { "READY" } else { "NOT READY" }
}

$validationFile = "environment-validation-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$validationRecord | ConvertTo-Json -Depth 5 | Out-File $validationFile -Encoding UTF8

Write-Host "Validation record saved: $validationFile" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
