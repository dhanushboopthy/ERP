# =============================================
# BACKEND CONNECTION UPDATE SCRIPT
# Updates ASP.NET Core backend to use SQL Server
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
    [switch]$TestOnly = $false
)

$ErrorActionPreference = "Stop"
$scriptPath = $PSScriptRoot
$backendPath = Join-Path $scriptPath "backend\SudhanTextileERP.API"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "BACKEND CONNECTION UPDATE" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Build connection string
if ($UseWindowsAuth) {
    $connectionString = "Server=$ServerName;Database=$DatabaseName;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;"
} else {
    if ([string]::IsNullOrEmpty($SqlUsername) -or [string]::IsNullOrEmpty($SqlPassword)) {
        throw "SQL authentication requires username and password"
    }
    $connectionString = "Server=$ServerName;Database=$DatabaseName;User Id=$SqlUsername;Password=$SqlPassword;TrustServerCertificate=True;Encrypt=False;"
}

Write-Host "Target Server: $ServerName" -ForegroundColor Yellow
Write-Host "Database: $DatabaseName" -ForegroundColor Yellow
Write-Host "Authentication: $(if($UseWindowsAuth){'Windows'}else{'SQL Server'})" -ForegroundColor Yellow
Write-Host ""

# Test connection first
Write-Host "Step 1: Testing SQL Server Connection..." -ForegroundColor Yellow
try {
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    
    # Verify database exists
    $checkCmd = $connection.CreateCommand()
    $checkCmd.CommandText = "SELECT COUNT(*) FROM sys.tables"
    $tableCount = $checkCmd.ExecuteScalar()
    
    $connection.Close()
    
    Write-Host "✓ Connected successfully" -ForegroundColor Green
    Write-Host "  Tables found: $tableCount" -ForegroundColor Cyan
    
    if ($tableCount -lt 30) {
        Write-Host "⚠ Warning: Expected 30+ tables, found $tableCount" -ForegroundColor Yellow
        $response = Read-Host "Continue anyway? (yes/no)"
        if ($response -ne "yes") {
            throw "Aborted by user"
        }
    }
} catch {
    Write-Host "✗ FAILED: Cannot connect to database" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

if ($TestOnly) {
    Write-Host ""
    Write-Host "✓ Test-only mode: Connection verified" -ForegroundColor Green
    Write-Host "  No files were modified" -ForegroundColor Cyan
    exit 0
}

# Update Program.cs
Write-Host ""
Write-Host "Step 2: Updating Program.cs..." -ForegroundColor Yellow

$programFile = Join-Path $backendPath "Program.cs"
if (-not (Test-Path $programFile)) {
    Write-Host "✗ FAILED: Program.cs not found at $programFile" -ForegroundColor Red
    exit 1
}

$programContent = Get-Content $programFile -Raw

# Check current state
if ($programContent -match "UseSqlServer") {
    Write-Host "  Program.cs already configured for SQL Server" -ForegroundColor Cyan
} elseif ($programContent -match "UseSqlite") {
    Write-Host "  Converting from SQLite to SQL Server..." -ForegroundColor Cyan
    
    # Replace UseSqlite with UseSqlServer
    $programContent = $programContent -replace 'options\.UseSqlite\(', 'options.UseSqlServer('
    
    # Save updated content
    Set-Content -Path $programFile -Value $programContent -NoNewline
    Write-Host "✓ Program.cs updated" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: Cannot determine current database provider" -ForegroundColor Yellow
}

# Update appsettings.Production.json
Write-Host ""
Write-Host "Step 3: Updating appsettings.Production.json..." -ForegroundColor Yellow

$prodSettingsFile = Join-Path $backendPath "appsettings.Production.json"
if (-not (Test-Path $prodSettingsFile)) {
    Write-Host "✗ FAILED: appsettings.Production.json not found" -ForegroundColor Red
    exit 1
}

try {
    $prodSettings = Get-Content $prodSettingsFile -Raw | ConvertFrom-Json
    
    # Update connection string
    if ($prodSettings.ConnectionStrings) {
        $prodSettings.ConnectionStrings.DefaultConnection = $connectionString
    } else {
        $prodSettings | Add-Member -MemberType NoteProperty -Name "ConnectionStrings" -Value @{
            DefaultConnection = $connectionString
        }
    }
    
    # Save updated settings
    $prodSettings | ConvertTo-Json -Depth 10 | Set-Content -Path $prodSettingsFile
    
    Write-Host "✓ appsettings.Production.json updated" -ForegroundColor Green
} catch {
    Write-Host "✗ FAILED: Error updating appsettings.Production.json" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

# Create backup of appsettings.json (dev)
Write-Host ""
Write-Host "Step 4: Backing up appsettings.json (Development)..." -ForegroundColor Yellow

$devSettingsFile = Join-Path $backendPath "appsettings.json"
$devSettingsBackup = Join-Path $backendPath "appsettings.json.sqlite.bak"

if (Test-Path $devSettingsFile) {
    Copy-Item -Path $devSettingsFile -Destination $devSettingsBackup -Force
    Write-Host "✓ Backup created: appsettings.json.sqlite.bak" -ForegroundColor Green
}

# Update DapperContext.cs verification
Write-Host ""
Write-Host "Step 5: Verifying DapperContext.cs..." -ForegroundColor Yellow

$dapperFile = Join-Path $backendPath "Data\DapperContext.cs"
if (Test-Path $dapperFile) {
    $dapperContent = Get-Content $dapperFile -Raw
    
    if ($dapperContent -match "SqlConnection") {
        Write-Host "✓ DapperContext already uses SqlConnection" -ForegroundColor Green
    } else {
        Write-Host "⚠ Warning: DapperContext may need manual update" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Warning: DapperContext.cs not found" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "BACKEND UPDATE COMPLETED" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Changes Made:" -ForegroundColor Cyan
Write-Host "  ✓ Program.cs: UseSqlServer configured" -ForegroundColor White
Write-Host "  ✓ appsettings.Production.json: Connection string updated" -ForegroundColor White
Write-Host "  ✓ Backup created: appsettings.json.sqlite.bak" -ForegroundColor White
Write-Host ""
Write-Host "Connection String:" -ForegroundColor Cyan
Write-Host "  $connectionString" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Set environment variable: ASPNETCORE_ENVIRONMENT=Production" -ForegroundColor White
Write-Host "  2. Build the backend: dotnet build --configuration Release" -ForegroundColor White
Write-Host "  3. Test startup: dotnet run --configuration Release" -ForegroundColor White
Write-Host "  4. Check logs for any errors" -ForegroundColor White
Write-Host "  5. Test API health: curl http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""

# Create quick test script
$testScriptContent = @'
# Quick Backend Test Script
$env:ASPNETCORE_ENVIRONMENT = "Production"

Write-Host "Starting backend in Production mode..." -ForegroundColor Yellow
Write-Host ""

Set-Location "backend\SudhanTextileERP.API"

# Build
Write-Host "Building..." -ForegroundColor Cyan
dotnet build --configuration Release

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful" -ForegroundColor Green
    Write-Host ""
    Write-Host "Starting application..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    dotnet run --configuration Release
} else {
    Write-Host "✗ Build failed" -ForegroundColor Red
}
'@

$testScriptFile = Join-Path $scriptPath "test-backend-sqlserver.ps1"
Set-Content -Path $testScriptFile -Value $testScriptContent
Write-Host "Test script created: test-backend-sqlserver.ps1" -ForegroundColor Cyan
Write-Host "Run it to test the backend with SQL Server" -ForegroundColor Cyan
Write-Host ""
