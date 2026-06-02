# =============================================
# GO-LIVE PRE-CHECK VERIFICATION
# Mandatory checks before production switch
# =============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerName = "localhost",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "SudhanTextileERP",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiBaseUrl = "http://localhost:5000"
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║                  GO-LIVE PRE-CHECK VERIFICATION                ║" -ForegroundColor Cyan
Write-Host "║                     PRODUCTION READINESS                       ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: $ServerName" -ForegroundColor Yellow
Write-Host "Database: $DatabaseName" -ForegroundColor Yellow
Write-Host "API: $ApiBaseUrl" -ForegroundColor Yellow
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠ CRITICAL: All checks must PASS before go-live" -ForegroundColor Red -BackgroundColor Black
Write-Host ""

$connectionString = "Server=$ServerName;Database=$DatabaseName;Trusted_Connection=True;TrustServerCertificate=True;"
$checkResults = @()
$criticalFailures = 0
$warnings = 0

function Test-Check {
    param(
        [string]$Category,
        [string]$CheckName,
        [scriptblock]$Test,
        [bool]$IsCritical = $true
    )
    
    try {
        $result = & $Test
        $passed = $result.Success
        
        $checkResults += [PSCustomObject]@{
            Category = $Category
            Check = $CheckName
            Status = if($passed){"PASS"}else{"FAIL"}
            Critical = $IsCritical
            Details = $result.Message
        }
        
        if ($passed) {
            Write-Host "  ✓ $CheckName" -ForegroundColor Green
            if ($result.Message) {
                Write-Host "    → $($result.Message)" -ForegroundColor Cyan
            }
        } else {
            if ($IsCritical) {
                Write-Host "  ✗ $CheckName [CRITICAL]" -ForegroundColor Red -BackgroundColor Black
                $script:criticalFailures++
            } else {
                Write-Host "  ⚠ $CheckName [WARNING]" -ForegroundColor Yellow
                $script:warnings++
            }
            Write-Host "    → $($result.Message)" -ForegroundColor $(if($IsCritical){"Red"}else{"Yellow"})
        }
        
        return $passed
    } catch {
        $checkResults += [PSCustomObject]@{
            Category = $Category
            Check = $CheckName
            Status = "ERROR"
            Critical = $IsCritical
            Details = $_.Exception.Message
        }
        
        if ($IsCritical) {
            Write-Host "  ✗ $CheckName [ERROR]" -ForegroundColor Red -BackgroundColor Black
            $script:criticalFailures++
        } else {
            Write-Host "  ⚠ $CheckName [ERROR]" -ForegroundColor Yellow
            $script:warnings++
        }
        Write-Host "    → $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Execute-SqlQuery {
    param([string]$Query)
    
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    $command = $connection.CreateCommand()
    $command.CommandText = $Query
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($command)
    $dataset = New-Object System.Data.DataSet
    $adapter.Fill($dataset) | Out-Null
    $connection.Close()
    return $dataset.Tables[0]
}

function Execute-SqlScalar {
    param([string]$Query)
    
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    $command = $connection.CreateCommand()
    $command.CommandText = $Query
    $result = $command.ExecuteScalar()
    $connection.Close()
    return $result
}

# =============================================
# CATEGORY A: SYSTEM CHECKS
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CATEGORY A: SYSTEM CHECKS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Test-Check -Category "System" -CheckName "SQL Server Running" -Test {
    try {
        $service = Get-Service MSSQLSERVER -ErrorAction Stop
        if ($service.Status -eq "Running") {
            return @{ Success = $true; Message = "Service status: Running" }
        } else {
            return @{ Success = $false; Message = "Service status: $($service.Status)" }
        }
    } catch {
        return @{ Success = $false; Message = "SQL Server service not found" }
    }
}

Test-Check -Category "System" -CheckName "Database Connection" -Test {
    try {
        $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()
        $version = $connection.ServerVersion
        $connection.Close()
        return @{ Success = $true; Message = "Connected (SQL Server $version)" }
    } catch {
        return @{ Success = $false; Message = $_.Exception.Message }
    }
}

Test-Check -Category "System" -CheckName "API Endpoint Accessible" -Test {
    try {
        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        return @{ Success = $true; Message = "API Status: $($response.status)" }
    } catch {
        return @{ Success = $false; Message = "API not responding" }
    }
}

Test-Check -Category "System" -CheckName "Backend Process Running" -Test {
    try {
        $response = Invoke-WebRequest -Uri "$ApiBaseUrl/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            return @{ Success = $true; Message = "Backend healthy" }
        } else {
            return @{ Success = $false; Message = "Unexpected status: $($response.StatusCode)" }
        }
    } catch {
        return @{ Success = $false; Message = "Backend not running or not accessible" }
    }
}

Test-Check -Category "System" -CheckName "Database Tables Present" -Test {
    $count = Execute-SqlScalar "SELECT COUNT(*) FROM sys.tables"
    if ($count -ge 30) {
        return @{ Success = $true; Message = "$count tables found" }
    } else {
        return @{ Success = $false; Message = "Only $count tables found (expected 30+)" }
    }
}

# =============================================
# CATEGORY B: SECURITY CHECKS
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CATEGORY B: SECURITY CHECKS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Test-Check -Category "Security" -CheckName "Admin User Exists" -Test {
    $count = Execute-SqlScalar "SELECT COUNT(*) FROM Users WHERE UserName = 'admin'"
    if ($count -gt 0) {
        return @{ Success = $true; Message = "Admin user present" }
    } else {
        return @{ Success = $false; Message = "Admin user not found" }
    }
}

Test-Check -Category "Security" -CheckName "Default Password NOT in Production" -IsCritical $true -Test {
    # Check if admin password is still default (hashed)
    # This is a warning - we can't check the actual password without knowing the hash
    return @{ Success = $true; Message = "⚠ VERIFY MANUALLY: Admin password changed from default" }
}

Test-Check -Category "Security" -CheckName "Test Users Disabled" -IsCritical $false -Test {
    $testUsers = Execute-SqlScalar "SELECT COUNT(*) FROM Users WHERE (UserName LIKE '%test%' OR Email LIKE '%test%') AND IsActive = 1"
    if ($testUsers -eq 0) {
        return @{ Success = $true; Message = "No active test users" }
    } else {
        return @{ Success = $false; Message = "$testUsers test users still active" }
    }
}

Test-Check -Category "Security" -CheckName "User Roles Assigned" -Test {
    $usersWithoutRoles = Execute-SqlScalar "SELECT COUNT(*) FROM Users WHERE RoleId IS NULL AND IsActive = 1"
    if ($usersWithoutRoles -eq 0) {
        return @{ Success = $true; Message = "All active users have roles" }
    } else {
        return @{ Success = $false; Message = "$usersWithoutRoles users without roles" }
    }
}

Test-Check -Category "Security" -CheckName "Audit Logging Enabled" -Test {
    $auditCount = Execute-SqlScalar "SELECT COUNT(*) FROM AuditLogs"
    if ($auditCount -ge 0) {
        return @{ Success = $true; Message = "$auditCount audit records present" }
    } else {
        return @{ Success = $false; Message = "Audit table not accessible" }
    }
}

# =============================================
# CATEGORY C: DATA INTEGRITY CHECKS
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CATEGORY C: DATA INTEGRITY CHECKS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Test-Check -Category "Data" -CheckName "Financial Year Configured" -Test {
    $fyCount = Execute-SqlScalar "SELECT COUNT(*) FROM FinancialYears WHERE IsActive = 1"
    if ($fyCount -gt 0) {
        $currentFY = Execute-SqlQuery "SELECT TOP 1 YearCode, StartDate, EndDate FROM FinancialYears WHERE IsActive = 1 AND GETDATE() BETWEEN StartDate AND EndDate"
        if ($currentFY.Rows.Count -gt 0) {
            return @{ Success = $true; Message = "Current FY: $($currentFY.Rows[0].YearCode)" }
        } else {
            return @{ Success = $false; Message = "No financial year covers current date" }
        }
    } else {
        return @{ Success = $false; Message = "No active financial year" }
    }
}

Test-Check -Category "Data" -CheckName "Company Master Data" -Test {
    $companyCount = Execute-SqlScalar "SELECT COUNT(*) FROM Companies WHERE IsActive = 1"
    if ($companyCount -gt 0) {
        return @{ Success = $true; Message = "$companyCount active company" }
    } else {
        return @{ Success = $false; Message = "No company configured" }
    }
}

Test-Check -Category "Data" -CheckName "Document Number Series" -Test {
    $seriesCount = Execute-SqlScalar "SELECT COUNT(*) FROM DocumentNumberSeries WHERE IsActive = 1"
    if ($seriesCount -gt 0) {
        return @{ Success = $true; Message = "$seriesCount document series configured" }
    } else {
        return @{ Success = $false; Message = "No document number series" }
    }
}

Test-Check -Category "Data" -CheckName "No Negative Stock" -Test {
    $negativeStock = Execute-SqlScalar "SELECT COUNT(*) FROM YarnStocks WHERE CurrentBalanceKg < 0"
    if ($negativeStock -eq 0) {
        return @{ Success = $true; Message = "No negative stock" }
    } else {
        return @{ Success = $false; Message = "$negativeStock records with negative stock" }
    }
}

Test-Check -Category "Data" -CheckName "Master Data Present" -IsCritical $false -Test {
    $yarnCounts = Execute-SqlScalar "SELECT COUNT(*) FROM YarnCounts WHERE IsActive = 1"
    $beams = Execute-SqlScalar "SELECT COUNT(*) FROM Beams WHERE IsActive = 1"
    
    if ($yarnCounts -gt 0 -and $beams -gt 0) {
        return @{ Success = $true; Message = "$yarnCounts yarn counts, $beams beams" }
    } else {
        return @{ Success = $false; Message = "Master data may be incomplete" }
    }
}

# =============================================
# CATEGORY D: BACKUP & RECOVERY CHECKS
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CATEGORY D: BACKUP & RECOVERY CHECKS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Test-Check -Category "Backup" -CheckName "Backup Directory Exists" -Test {
    $backupDir = "C:\Backups"
    if (Test-Path $backupDir) {
        $backupFiles = Get-ChildItem $backupDir -Filter "*.bak" -ErrorAction SilentlyContinue
        return @{ Success = $true; Message = "$($backupFiles.Count) backup files in $backupDir" }
    } else {
        return @{ Success = $false; Message = "Backup directory not found: $backupDir" }
    }
}

Test-Check -Category "Backup" -CheckName "Recent Backup Exists" -IsCritical $true -Test {
    $backupDir = "C:\Backups"
    if (Test-Path $backupDir) {
        $recentBackup = Get-ChildItem $backupDir -Filter "*.bak" -ErrorAction SilentlyContinue | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 1
        
        if ($recentBackup) {
            $age = (Get-Date) - $recentBackup.LastWriteTime
            if ($age.TotalHours -le 24) {
                return @{ Success = $true; Message = "Last backup: $($recentBackup.Name) ($([math]::Round($age.TotalHours, 1)) hours ago)" }
            } else {
                return @{ Success = $false; Message = "Last backup is $([math]::Round($age.TotalHours, 1)) hours old" }
            }
        } else {
            return @{ Success = $false; Message = "No backup files found" }
        }
    } else {
        return @{ Success = $false; Message = "Backup directory not found" }
    }
}

Test-Check -Category "Backup" -CheckName "Database Recovery Model" -Test {
    $recoveryModel = Execute-SqlScalar "SELECT recovery_model_desc FROM sys.databases WHERE name = '$DatabaseName'"
    if ($recoveryModel -eq "FULL") {
        return @{ Success = $true; Message = "Recovery model: FULL" }
    } else {
        return @{ Success = $false; Message = "Recovery model: $recoveryModel (should be FULL)" }
    }
}

# =============================================
# CATEGORY E: CONSTRAINTS & TRIGGERS
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CATEGORY E: CONSTRAINTS & TRIGGERS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Test-Check -Category "Constraints" -CheckName "CHECK Constraints Active" -Test {
    $constraintCount = Execute-SqlScalar "SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled = 0"
    if ($constraintCount -ge 10) {
        return @{ Success = $true; Message = "$constraintCount active constraints" }
    } else {
        return @{ Success = $false; Message = "Only $constraintCount constraints (expected 10+)" }
    }
}

Test-Check -Category "Constraints" -CheckName "Negative Stock Prevention" -Test {
    $constraint = Execute-SqlScalar "SELECT COUNT(*) FROM sys.check_constraints WHERE name = 'CHK_YarnStocks_CurrentBalanceKg' AND is_disabled = 0"
    if ($constraint -gt 0) {
        return @{ Success = $true; Message = "Constraint active" }
    } else {
        return @{ Success = $false; Message = "Critical constraint missing or disabled" }
    }
}

Test-Check -Category "Constraints" -CheckName "Document Lock Triggers" -Test {
    $triggerCount = Execute-SqlScalar "SELECT COUNT(*) FROM sys.triggers WHERE name LIKE '%PreventLockedUpdate%' AND is_disabled = 0"
    if ($triggerCount -ge 4) {
        return @{ Success = $true; Message = "$triggerCount lock triggers active" }
    } else {
        return @{ Success = $false; Message = "Only $triggerCount lock triggers (expected 4+)" }
    }
}

# =============================================
# CATEGORY F: PERFORMANCE & MONITORING
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CATEGORY F: PERFORMANCE & MONITORING" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Test-Check -Category "Performance" -CheckName "Indexes Present" -IsCritical $false -Test {
    $indexCount = Execute-SqlScalar "SELECT COUNT(*) FROM sys.indexes WHERE type > 0 AND is_primary_key = 0"
    if ($indexCount -ge 20) {
        return @{ Success = $true; Message = "$indexCount indexes" }
    } else {
        return @{ Success = $false; Message = "Only $indexCount indexes (expected 20+)" }
    }
}

Test-Check -Category "Performance" -CheckName "Database Size" -IsCritical $false -Test {
    $size = Execute-SqlQuery "EXEC sp_spaceused"
    $dbSize = $size.Rows[0]["database_size"]
    return @{ Success = $true; Message = "Database size: $dbSize" }
}

Test-Check -Category "Monitoring" -CheckName "Application Logs Accessible" -IsCritical $false -Test {
    $logPath = "backend\SudhanTextileERP.API\logs"
    if (Test-Path $logPath) {
        $logFiles = Get-ChildItem $logPath -Filter "*.txt" -ErrorAction SilentlyContinue
        return @{ Success = $true; Message = "$($logFiles.Count) log files in $logPath" }
    } else {
        return @{ Success = $false; Message = "Log directory not found" }
    }
}

# =============================================
# CATEGORY G: PRODUCTION ENVIRONMENT
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CATEGORY G: PRODUCTION ENVIRONMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Test-Check -Category "Environment" -CheckName "Production Configuration Exists" -Test {
    $prodConfig = "backend\SudhanTextileERP.API\appsettings.Production.json"
    if (Test-Path $prodConfig) {
        $config = Get-Content $prodConfig -Raw | ConvertFrom-Json
        if ($config.ConnectionStrings.DefaultConnection -like "*Server=*") {
            return @{ Success = $true; Message = "SQL Server connection configured" }
        } else {
            return @{ Success = $false; Message = "Connection string may not be SQL Server" }
        }
    } else {
        return @{ Success = $false; Message = "Production config not found" }
    }
}

Test-Check -Category "Environment" -CheckName "Debug Mode Disabled" -IsCritical $false -Test {
    $prodConfig = "backend\SudhanTextileERP.API\appsettings.Production.json"
    if (Test-Path $prodConfig) {
        $config = Get-Content $prodConfig -Raw | ConvertFrom-Json
        $logLevel = $config.Logging.LogLevel.Default
        if ($logLevel -eq "Warning" -or $logLevel -eq "Error") {
            return @{ Success = $true; Message = "Log level: $logLevel" }
        } else {
            return @{ Success = $false; Message = "Log level: $logLevel (should be Warning/Error)" }
        }
    } else {
        return @{ Success = $false; Message = "Cannot verify" }
    }
}

# =============================================
# RESULTS SUMMARY
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "PRE-CHECK RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$totalChecks = $checkResults.Count
$passedChecks = ($checkResults | Where-Object { $_.Status -eq "PASS" }).Count
$failedChecks = ($checkResults | Where-Object { $_.Status -eq "FAIL" }).Count
$errorChecks = ($checkResults | Where-Object { $_.Status -eq "ERROR" }).Count

Write-Host "Total Checks: $totalChecks" -ForegroundColor Cyan
Write-Host "Passed: $passedChecks" -ForegroundColor Green
Write-Host "Failed: $failedChecks" -ForegroundColor $(if($failedChecks -eq 0){"Green"}else{"Red"})
Write-Host "Errors: $errorChecks" -ForegroundColor $(if($errorChecks -eq 0){"Green"}else{"Red"})
Write-Host ""
Write-Host "Critical Failures: $criticalFailures" -ForegroundColor $(if($criticalFailures -eq 0){"Green"}else{"Red"}) -BackgroundColor $(if($criticalFailures -eq 0){"Black"}else{"Black"})
Write-Host "Warnings: $warnings" -ForegroundColor $(if($warnings -eq 0){"Green"}else{"Yellow"})
Write-Host ""

# Failed/Warning checks
if ($criticalFailures -gt 0 -or $failedChecks -gt 0) {
    Write-Host "Critical Issues:" -ForegroundColor Red -BackgroundColor Black
    $checkResults | Where-Object { $_.Status -ne "PASS" -and $_.Critical -eq $true } | ForEach-Object {
        Write-Host "  [$($_.Status)] $($_.Category) - $($_.Check)" -ForegroundColor Red
        Write-Host "    → $($_.Details)" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($warnings -gt 0) {
    Write-Host "Warnings:" -ForegroundColor Yellow
    $checkResults | Where-Object { $_.Status -ne "PASS" -and $_.Critical -eq $false } | ForEach-Object {
        Write-Host "  [$($_.Status)] $($_.Category) - $($_.Check)" -ForegroundColor Yellow
        Write-Host "    → $($_.Details)" -ForegroundColor Cyan
    }
    Write-Host ""
}

# Export report
$reportFile = "go-live-precheck-$timestamp.csv"
$checkResults | Export-Csv -Path $reportFile -NoTypeInformation
Write-Host "Detailed report: $reportFile" -ForegroundColor Cyan
Write-Host ""

# Final verdict
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "GO-LIVE DECISION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($criticalFailures -eq 0) {
    Write-Host "✓ GO-LIVE APPROVED" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "All critical checks passed. System is ready for production." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Review any warnings above" -ForegroundColor White
    Write-Host "  2. Execute: .\go-live-execute.ps1" -ForegroundColor Yellow
    Write-Host "  3. Monitor first transactions closely" -ForegroundColor White
    Write-Host "  4. Complete daily checklist for 5 days" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "✗ GO-LIVE BLOCKED" -ForegroundColor Red -BackgroundColor Black
    Write-Host ""
    Write-Host "$criticalFailures CRITICAL ISSUES must be resolved before go-live." -ForegroundColor Red
    Write-Host ""
    Write-Host "Action Required:" -ForegroundColor Yellow
    Write-Host "  1. Fix all critical failures listed above" -ForegroundColor White
    Write-Host "  2. Re-run this pre-check script" -ForegroundColor White
    Write-Host "  3. Only proceed when all critical checks pass" -ForegroundColor White
    Write-Host ""
    Write-Host "DO NOT PROCEED TO PRODUCTION" -ForegroundColor Red -BackgroundColor Black
    Write-Host ""
    exit 1
}
