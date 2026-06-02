# =============================================
# SQL SERVER AUTOMATED DEPLOYMENT SCRIPT
# Sudhan Textile ERP - Production Migration
# =============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerName = "localhost",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "SudhanTextileERP",
    
    [Parameter(Mandatory=$false)]
    [switch]$UseWindowsAuth = $true,
    
    [Parameter(Mandatory=$false)]
    [string]$SqlUsername = "",
    
    [Parameter(Mandatory=$false)]
    [string]$SqlPassword = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBackup = $false
)

$ErrorActionPreference = "Stop"
$scriptPath = $PSScriptRoot
$databasePath = Join-Path $scriptPath "database"
$logPath = Join-Path $scriptPath "migration-logs"

# Create log directory
if (-not (Test-Path $logPath)) {
    New-Item -ItemType Directory -Path $logPath | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = Join-Path $logPath "migration_$timestamp.log"

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $logFile -Value $logMessage
}

# Header
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "SQL SERVER DEPLOYMENT - SUDHAN TEXTILE ERP" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Log "Migration started"
Write-Log "Server: $ServerName"
Write-Log "Database: $DatabaseName"
Write-Log "Authentication: $(if($UseWindowsAuth){'Windows'}else{'SQL Server'})"

# Build connection string
if ($UseWindowsAuth) {
    $connectionString = "Server=$ServerName;Database=master;Integrated Security=True;TrustServerCertificate=True;"
} else {
    if ([string]::IsNullOrEmpty($SqlUsername) -or [string]::IsNullOrEmpty($SqlPassword)) {
        Write-Log "SQL authentication requires username and password" "ERROR"
        throw "Missing SQL credentials"
    }
    $connectionString = "Server=$ServerName;Database=master;User Id=$SqlUsername;Password=$SqlPassword;TrustServerCertificate=True;"
}

# Test SQL Server connectivity
Write-Host ""
Write-Host "Step 1: Testing SQL Server Connectivity..." -ForegroundColor Yellow
Write-Log "Testing connection to SQL Server..."

try {
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    $serverVersion = $connection.ServerVersion
    $connection.Close()
    Write-Host "✓ Connected to SQL Server (Version: $serverVersion)" -ForegroundColor Green
    Write-Log "Connection successful - Server version: $serverVersion"
} catch {
    Write-Host "✗ FAILED: Cannot connect to SQL Server" -ForegroundColor Red
    Write-Log "Connection failed: $_" "ERROR"
    throw "SQL Server connection failed: $_"
}

# Check if database exists
Write-Host ""
Write-Host "Step 2: Checking Database Status..." -ForegroundColor Yellow

try {
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    
    $checkDbCmd = $connection.CreateCommand()
    $checkDbCmd.CommandText = "SELECT database_id FROM sys.databases WHERE name = @dbName"
    $checkDbCmd.Parameters.AddWithValue("@dbName", $DatabaseName) | Out-Null
    
    $dbExists = $checkDbCmd.ExecuteScalar()
    $connection.Close()
    
    if ($dbExists) {
        Write-Host "⚠ Database '$DatabaseName' already exists" -ForegroundColor Yellow
        Write-Log "Database already exists" "WARNING"
        
        if (-not $SkipBackup) {
            Write-Host "Creating backup before proceeding..." -ForegroundColor Yellow
            $backupPath = "C:\Backups"
            if (-not (Test-Path $backupPath)) {
                New-Item -ItemType Directory -Path $backupPath | Out-Null
            }
            
            $backupFile = Join-Path $backupPath "${DatabaseName}_PreMigration_$timestamp.bak"
            
            $backupConn = New-Object System.Data.SqlClient.SqlConnection($connectionString)
            $backupConn.Open()
            $backupCmd = $backupConn.CreateCommand()
            $backupCmd.CommandTimeout = 300
            $backupCmd.CommandText = @"
BACKUP DATABASE [$DatabaseName]
TO DISK = '$backupFile'
WITH FORMAT, INIT, NAME = 'Pre-Migration Backup', COMPRESSION;
"@
            
            Write-Log "Creating backup: $backupFile"
            $backupCmd.ExecuteNonQuery() | Out-Null
            $backupConn.Close()
            
            Write-Host "✓ Backup created: $backupFile" -ForegroundColor Green
            Write-Log "Backup completed successfully"
        }
        
        $response = Read-Host "Do you want to DROP and recreate the database? (yes/no)"
        if ($response -ne "yes") {
            Write-Log "User cancelled migration" "WARNING"
            throw "Migration cancelled by user"
        }
        
        # Drop database
        Write-Host "Dropping existing database..." -ForegroundColor Yellow
        $dropConn = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $dropConn.Open()
        $dropCmd = $dropConn.CreateCommand()
        $dropCmd.CommandText = @"
ALTER DATABASE [$DatabaseName] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE [$DatabaseName];
"@
        $dropCmd.ExecuteNonQuery() | Out-Null
        $dropConn.Close()
        Write-Host "✓ Database dropped" -ForegroundColor Green
        Write-Log "Database dropped successfully"
    }
} catch {
    Write-Log "Error checking database status: $_" "ERROR"
    throw
}

# Execute SQL scripts
function Execute-SqlScript {
    param(
        [string]$ScriptPath,
        [string]$Description,
        [int]$StepNumber
    )
    
    Write-Host ""
    Write-Host "Step $StepNumber`: $Description..." -ForegroundColor Yellow
    Write-Log "Executing: $ScriptPath"
    
    if (-not (Test-Path $ScriptPath)) {
        Write-Host "✗ FAILED: Script not found: $ScriptPath" -ForegroundColor Red
        Write-Log "Script not found: $ScriptPath" "ERROR"
        throw "Script not found"
    }
    
    $scriptLogFile = Join-Path $logPath "$(Split-Path $ScriptPath -Leaf)_$timestamp.log"
    
    try {
        # Use sqlcmd for execution
        if ($UseWindowsAuth) {
            $output = sqlcmd -S $ServerName -E -i $ScriptPath -b -m 1 2>&1
        } else {
            $output = sqlcmd -S $ServerName -U $SqlUsername -P $SqlPassword -i $ScriptPath -b -m 1 2>&1
        }
        
        # Save output to log
        $output | Out-File -FilePath $scriptLogFile
        
        # Check for errors
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ FAILED: Errors occurred during execution" -ForegroundColor Red
            Write-Log "Script execution failed with exit code: $LASTEXITCODE" "ERROR"
            Write-Host "Check log file: $scriptLogFile" -ForegroundColor Red
            throw "Script execution failed"
        }
        
        Write-Host "✓ $Description completed successfully" -ForegroundColor Green
        Write-Log "$Description completed"
        return $true
    } catch {
        Write-Host "✗ FAILED: $_" -ForegroundColor Red
        Write-Log "Script execution error: $_" "ERROR"
        throw
    }
}

# Execute scripts in order
try {
    Execute-SqlScript -ScriptPath (Join-Path $databasePath "01_CreateSchema.sql") -Description "Creating Schema" -StepNumber 3
    Execute-SqlScript -ScriptPath (Join-Path $databasePath "02_SeedData.sql") -Description "Loading Seed Data" -StepNumber 4
    Execute-SqlScript -ScriptPath (Join-Path $databasePath "03_StoredProcedures.sql") -Description "Creating Stored Procedures" -StepNumber 5
    Execute-SqlScript -ScriptPath (Join-Path $databasePath "04_AuditRemediation.sql") -Description "Applying Audit Remediation" -StepNumber 6
    Execute-SqlScript -ScriptPath (Join-Path $databasePath "05_GoLiveVerification.sql") -Description "Running Go-Live Verification" -StepNumber 7
} catch {
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host "MIGRATION FAILED" -ForegroundColor Red
    Write-Host "=============================================" -ForegroundColor Red
    Write-Log "Migration failed" "ERROR"
    exit 1
}

# Verification
Write-Host ""
Write-Host "Step 8: Post-Deployment Verification..." -ForegroundColor Yellow
Write-Log "Running post-deployment verification"

try {
    $verifyConn = New-Object System.Data.SqlClient.SqlConnection($connectionString.Replace("master", $DatabaseName))
    $verifyConn.Open()
    
    # Check table count
    $tableCmd = $verifyConn.CreateCommand()
    $tableCmd.CommandText = "SELECT COUNT(*) FROM sys.tables"
    $tableCount = $tableCmd.ExecuteScalar()
    
    Write-Host "  Tables created: $tableCount" -ForegroundColor Cyan
    Write-Log "Table count: $tableCount"
    
    # Check stored procedures
    $sprocCmd = $verifyConn.CreateCommand()
    $sprocCmd.CommandText = "SELECT COUNT(*) FROM sys.objects WHERE type = 'P' AND is_ms_shipped = 0"
    $sprocCount = $sprocCmd.ExecuteScalar()
    
    Write-Host "  Stored procedures: $sprocCount" -ForegroundColor Cyan
    Write-Log "Stored procedure count: $sprocCount"
    
    # Check constraints
    $constraintCmd = $verifyConn.CreateCommand()
    $constraintCmd.CommandText = "SELECT COUNT(*) FROM sys.check_constraints"
    $constraintCount = $constraintCmd.ExecuteScalar()
    
    Write-Host "  Check constraints: $constraintCount" -ForegroundColor Cyan
    Write-Log "Constraint count: $constraintCount"
    
    # Check triggers
    $triggerCmd = $verifyConn.CreateCommand()
    $triggerCmd.CommandText = "SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped = 0"
    $triggerCount = $triggerCmd.ExecuteScalar()
    
    Write-Host "  Triggers: $triggerCount" -ForegroundColor Cyan
    Write-Log "Trigger count: $triggerCount"
    
    # Check seed data
    $companyCmd = $verifyConn.CreateCommand()
    $companyCmd.CommandText = "SELECT COUNT(*) FROM Companies"
    $companyCount = $companyCmd.ExecuteScalar()
    
    Write-Host "  Companies: $companyCount" -ForegroundColor Cyan
    Write-Log "Company count: $companyCount"
    
    $verifyConn.Close()
    
    if ($tableCount -ge 30 -and $sprocCount -ge 10) {
        Write-Host "✓ Verification passed" -ForegroundColor Green
        Write-Log "Post-deployment verification passed"
    } else {
        Write-Host "⚠ Warning: Some objects may be missing" -ForegroundColor Yellow
        Write-Log "Warning: Object counts lower than expected" "WARNING"
    }
} catch {
    Write-Host "✗ Verification failed: $_" -ForegroundColor Red
    Write-Log "Verification error: $_" "ERROR"
}

# Create initial backup
Write-Host ""
Write-Host "Step 9: Creating Initial Backup..." -ForegroundColor Yellow

try {
    $backupPath = "C:\Backups"
    if (-not (Test-Path $backupPath)) {
        New-Item -ItemType Directory -Path $backupPath | Out-Null
    }
    
    $backupFile = Join-Path $backupPath "${DatabaseName}_Initial_$timestamp.bak"
    
    $backupConn = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $backupConn.Open()
    $backupCmd = $backupConn.CreateCommand()
    $backupCmd.CommandTimeout = 300
    $backupCmd.CommandText = @"
BACKUP DATABASE [$DatabaseName]
TO DISK = '$backupFile'
WITH FORMAT, INIT, NAME = 'Initial Production Backup', COMPRESSION;
"@
    
    Write-Log "Creating initial backup: $backupFile"
    $backupCmd.ExecuteNonQuery() | Out-Null
    $backupConn.Close()
    
    Write-Host "✓ Backup created: $backupFile" -ForegroundColor Green
    Write-Log "Initial backup completed"
} catch {
    Write-Host "⚠ Backup failed: $_" -ForegroundColor Yellow
    Write-Log "Backup error: $_" "WARNING"
}

# Summary
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "MIGRATION COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database Details:" -ForegroundColor Cyan
Write-Host "  Server: $ServerName" -ForegroundColor White
Write-Host "  Database: $DatabaseName" -ForegroundColor White
Write-Host "  Tables: $tableCount" -ForegroundColor White
Write-Host "  Stored Procedures: $sprocCount" -ForegroundColor White
Write-Host "  Constraints: $constraintCount" -ForegroundColor White
Write-Host "  Triggers: $triggerCount" -ForegroundColor White
Write-Host ""
Write-Host "Connection String (Windows Auth):" -ForegroundColor Cyan
Write-Host "  Server=$ServerName;Database=$DatabaseName;Trusted_Connection=True;TrustServerCertificate=True;" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Update backend appsettings.Production.json with connection string" -ForegroundColor White
Write-Host "  2. Run: .\update-backend-connection.ps1" -ForegroundColor White
Write-Host "  3. Test application startup" -ForegroundColor White
Write-Host "  4. Run functional verification tests" -ForegroundColor White
Write-Host ""
Write-Host "Log files saved to: $logPath" -ForegroundColor Cyan
Write-Host ""

Write-Log "Migration completed successfully"
Write-Log "=========================================="
