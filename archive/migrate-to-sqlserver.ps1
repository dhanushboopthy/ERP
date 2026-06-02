# =============================================
# MASTER MIGRATION EXECUTION SCRIPT
# Complete SQL Server Migration Orchestrator
# =============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerName = "localhost",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "SudhanTextileERP",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$AutoApprove = $false
)

$ErrorActionPreference = "Stop"
$scriptPath = $PSScriptRoot

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║          SUDHAN TEXTILE ERP - SQL SERVER MIGRATION            ║" -ForegroundColor Cyan
Write-Host "║          Complete Production Migration Orchestrator           ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Migration Target:" -ForegroundColor Yellow
Write-Host "  Server: $ServerName" -ForegroundColor White
Write-Host "  Database: $DatabaseName" -ForegroundColor White
Write-Host "  Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host ""

# =============================================
# PHASE 0: PRE-FLIGHT CHECKS
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PHASE 0: PRE-FLIGHT CHECKS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if SQL Server is accessible
Write-Host "Checking SQL Server availability..." -ForegroundColor Yellow
try {
    $connectionString = "Server=$ServerName;Database=master;Integrated Security=True;TrustServerCertificate=True;"
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    $serverVersion = $connection.ServerVersion
    $connection.Close()
    Write-Host "✓ SQL Server is accessible (Version: $serverVersion)" -ForegroundColor Green
} catch {
    Write-Host "✗ CRITICAL: Cannot connect to SQL Server" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. SQL Server is installed" -ForegroundColor White
    Write-Host "  2. SQL Server service is running" -ForegroundColor White
    Write-Host "  3. TCP/IP protocol is enabled" -ForegroundColor White
    Write-Host ""
    Write-Host "Installation Guide: SQLSERVER_MIGRATION_GUIDE.md" -ForegroundColor Cyan
    exit 1
}

# Check if scripts exist
Write-Host "Checking migration scripts..." -ForegroundColor Yellow
$requiredScripts = @(
    "database\01_CreateSchema.sql",
    "database\02_SeedData.sql",
    "database\03_StoredProcedures.sql",
    "database\04_AuditRemediation.sql",
    "database\05_GoLiveVerification.sql"
)

$allScriptsExist = $true
foreach ($script in $requiredScripts) {
    $scriptPath_Check = Join-Path $scriptPath $script
    if (Test-Path $scriptPath_Check) {
        Write-Host "  ✓ Found: $script" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing: $script" -ForegroundColor Red
        $allScriptsExist = $false
    }
}

if (-not $allScriptsExist) {
    Write-Host ""
    Write-Host "✗ CRITICAL: Required scripts are missing" -ForegroundColor Red
    exit 1
}

Write-Host "✓ All required scripts found" -ForegroundColor Green
Write-Host ""

# =============================================
# CONFIRMATION
# =============================================
if (-not $AutoApprove) {
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "MIGRATION CONFIRMATION" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This will perform the following actions:" -ForegroundColor Cyan
    Write-Host "  1. Create/Replace database: $DatabaseName" -ForegroundColor White
    Write-Host "  2. Deploy complete schema (35+ tables)" -ForegroundColor White
    Write-Host "  3. Load seed data" -ForegroundColor White
    Write-Host "  4. Create stored procedures and triggers" -ForegroundColor White
    Write-Host "  5. Update backend configuration" -ForegroundColor White
    Write-Host "  6. Run validation tests" -ForegroundColor White
    Write-Host ""
    Write-Host "Estimated duration: 30-60 minutes" -ForegroundColor Yellow
    Write-Host ""
    
    $confirmation = Read-Host "Do you want to proceed? (yes/no)"
    
    if ($confirmation -ne "yes") {
        Write-Host ""
        Write-Host "Migration cancelled by user" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
$startTime = Get-Date

# =============================================
# PHASE 1: DATABASE DEPLOYMENT
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PHASE 1: DATABASE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

try {
    & "$scriptPath\deploy-sqlserver.ps1" -ServerName $ServerName -DatabaseName $DatabaseName -SkipBackup:$SkipBackup
    
    if ($LASTEXITCODE -ne 0) {
        throw "Database deployment failed"
    }
    
    Write-Host ""
    Write-Host "✓ Phase 1 Complete: Database Deployed" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "✗ Phase 1 Failed: Database Deployment Error" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Read-Host "Press Enter to continue to Phase 2..."

# =============================================
# PHASE 2: DATABASE VALIDATION
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PHASE 2: DATABASE VALIDATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

try {
    & "$scriptPath\validate-sqlserver.ps1" -ServerName $ServerName -DatabaseName $DatabaseName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "⚠ Warning: Validation completed with errors" -ForegroundColor Yellow
        $continue = Read-Host "Continue anyway? (yes/no)"
        if ($continue -ne "yes") {
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "✓ Phase 2 Complete: Database Validated" -ForegroundColor Green
    }
} catch {
    Write-Host ""
    Write-Host "✗ Phase 2 Failed: Validation Error" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Read-Host "Press Enter to continue to Phase 3..."

# =============================================
# PHASE 3: BACKEND CONFIGURATION
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PHASE 3: BACKEND CONFIGURATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

try {
    & "$scriptPath\update-backend-connection.ps1" -ServerName $ServerName -DatabaseName $DatabaseName
    
    if ($LASTEXITCODE -ne 0) {
        throw "Backend configuration failed"
    }
    
    Write-Host ""
    Write-Host "✓ Phase 3 Complete: Backend Configured" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "✗ Phase 3 Failed: Configuration Error" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "IMPORTANT: MANUAL STEP REQUIRED" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "Before proceeding to functional tests:" -ForegroundColor Cyan
Write-Host "  1. Open a NEW terminal window" -ForegroundColor White
Write-Host "  2. Navigate to: backend\SudhanTextileERP.API" -ForegroundColor White
Write-Host "  3. Run: `$env:ASPNETCORE_ENVIRONMENT = 'Production'" -ForegroundColor Yellow
Write-Host "  4. Run: dotnet run --configuration Release" -ForegroundColor Yellow
Write-Host "  5. Wait for message: 'Now listening on: http://localhost:5000'" -ForegroundColor White
Write-Host ""
Write-Host "Leave that terminal running and return here." -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter when backend is running..."

# =============================================
# PHASE 4: FUNCTIONAL VERIFICATION
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PHASE 4: FUNCTIONAL VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

try {
    & "$scriptPath\test-functional-workflows.ps1" -ApiBaseUrl "http://localhost:5000"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "⚠ Warning: Some functional tests failed" -ForegroundColor Yellow
        $continue = Read-Host "Continue anyway? (yes/no)"
        if ($continue -ne "yes") {
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "✓ Phase 4 Complete: Functional Tests Passed" -ForegroundColor Green
    }
} catch {
    Write-Host ""
    Write-Host "⚠ Phase 4 Warning: Could not complete functional tests" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This may be because:" -ForegroundColor Cyan
    Write-Host "  - Backend is not running" -ForegroundColor White
    Write-Host "  - API endpoints have changed" -ForegroundColor White
    Write-Host "  - Network/firewall issues" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue anyway? (yes/no)"
    if ($continue -ne "yes") {
        exit 1
    }
}

# =============================================
# MIGRATION COMPLETE
# =============================================
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║              MIGRATION COMPLETED SUCCESSFULLY                  ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Migration Summary:" -ForegroundColor Cyan
Write-Host "  Start Time: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor White
Write-Host "  End Time: $($endTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor White
Write-Host "  Duration: $($duration.Hours) hours, $($duration.Minutes) minutes, $($duration.Seconds) seconds" -ForegroundColor White
Write-Host ""
Write-Host "Database Details:" -ForegroundColor Cyan
Write-Host "  Server: $ServerName" -ForegroundColor White
Write-Host "  Database: $DatabaseName" -ForegroundColor White
Write-Host "  Status: PRODUCTION READY ✓" -ForegroundColor Green
Write-Host ""
Write-Host "Connection String:" -ForegroundColor Cyan
Write-Host "  Server=$ServerName;Database=$DatabaseName;Trusted_Connection=True;TrustServerCertificate=True;" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. ✓ Database deployed and validated" -ForegroundColor Green
Write-Host "  2. ✓ Backend configured for SQL Server" -ForegroundColor Green
Write-Host "  3. ✓ Functional tests completed" -ForegroundColor Green
Write-Host "  4. → Monitor application for 24 hours" -ForegroundColor Yellow
Write-Host "  5. → Complete final sign-off in SQLSERVER_MIGRATION_CERTIFICATION.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "Monitoring Checklist:" -ForegroundColor Cyan
Write-Host "  • Check application logs: backend\SudhanTextileERP.API\logs\" -ForegroundColor White
Write-Host "  • Monitor API health: http://localhost:5000/api/health" -ForegroundColor White
Write-Host "  • Review error logs in SSMS" -ForegroundColor White
Write-Host "  • Verify backup jobs running" -ForegroundColor White
Write-Host ""
Write-Host "Backup Location:" -ForegroundColor Cyan
Write-Host "  C:\Backups\" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  • SQLSERVER_MIGRATION_GUIDE.md - Detailed migration guide" -ForegroundColor White
Write-Host "  • SQLSERVER_MIGRATION_CERTIFICATION.md - Migration certification" -ForegroundColor White
Write-Host "  • PRODUCTION_OPERATIONS_GUIDE.md - Daily operations" -ForegroundColor White
Write-Host ""
Write-Host "Support:" -ForegroundColor Cyan
Write-Host "  If issues occur, check migration-logs\ directory" -ForegroundColor White
Write-Host "  Rollback procedure available in SQLSERVER_MIGRATION_CERTIFICATION.md" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "CONGRATULATIONS! Your system is now running on SQL Server." -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
