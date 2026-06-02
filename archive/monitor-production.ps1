# =============================================
# PRODUCTION MONITORING SCRIPT
# Real-time health checks for first 72 hours
# =============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ApiBaseUrl = "http://localhost:5000",
    
    [Parameter(Mandatory=$false)]
    [string]$ConnectionString = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Continuous = $false,
    
    [Parameter(Mandatory=$false)]
    [int]$IntervalMinutes = 30
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║              PRODUCTION MONITORING SYSTEM                      ║" -ForegroundColor Cyan
Write-Host "║                Real-time Health Checks                         ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Monitoring Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "Mode: $(if ($Continuous) { "Continuous (every $IntervalMinutes minutes)" } else { "Single Check" })" -ForegroundColor White
Write-Host ""

# Get connection string from config if not provided
if ([string]::IsNullOrEmpty($ConnectionString)) {
    $prodConfig = "backend\SudhanTextileERP.API\appsettings.Production.json"
    if (Test-Path $prodConfig) {
        $config = Get-Content $prodConfig -Raw | ConvertFrom-Json
        $ConnectionString = $config.ConnectionStrings.DefaultConnection
    }
}

# Results tracking
$results = @{
    Timestamp = Get-Date
    Checks = @()
    CriticalIssues = @()
    Warnings = @()
    Status = "UNKNOWN"
}

function Add-CheckResult {
    param(
        [string]$Category,
        [string]$Check,
        [string]$Status,
        [string]$Message,
        [string]$Severity = "INFO"
    )
    
    $result = @{
        Category = $Category
        Check = $Check
        Status = $Status
        Message = $Message
        Severity = $Severity
        Timestamp = Get-Date
    }
    
    $results.Checks += $result
    
    if ($Severity -eq "CRITICAL" -and $Status -eq "FAIL") {
        $results.CriticalIssues += $result
    } elseif ($Severity -eq "WARNING" -and $Status -eq "FAIL") {
        $results.Warnings += $result
    }
    
    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { if ($Severity -eq "CRITICAL") { "Red" } else { "Yellow" } }
        "WARN" { "Yellow" }
        default { "White" }
    }
    
    $icon = switch ($Status) {
        "PASS" { "✓" }
        "FAIL" { "✗" }
        "WARN" { "⚠" }
        default { "•" }
    }
    
    Write-Host "  $icon $Check`: " -NoNewline -ForegroundColor $color
    Write-Host $Message -ForegroundColor $color
}

do {
    $results.Checks = @()
    $results.CriticalIssues = @()
    $results.Warnings = @()
    
    # =============================================
    # 1. API HEALTH CHECK
    # =============================================
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "1. API HEALTH" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        $apiStart = Get-Date
        $health = Invoke-RestMethod -Uri "$ApiBaseUrl/api/health" -Method GET -TimeoutSec 10
        $apiDuration = ((Get-Date) - $apiStart).TotalMilliseconds
        
        Add-CheckResult -Category "API" -Check "API Status" -Status "PASS" `
            -Message "API is responding (${apiDuration}ms)" -Severity "CRITICAL"
        
        # Check response time
        if ($apiDuration -gt 2000) {
            Add-CheckResult -Category "API" -Check "Response Time" -Status "WARN" `
                -Message "Slow response: ${apiDuration}ms (threshold: 2000ms)" -Severity "WARNING"
        } else {
            Add-CheckResult -Category "API" -Check "Response Time" -Status "PASS" `
                -Message "${apiDuration}ms (good)" -Severity "INFO"
        }
    } catch {
        Add-CheckResult -Category "API" -Check "API Status" -Status "FAIL" `
            -Message "API not responding: $_" -Severity "CRITICAL"
    }
    
    # Check environment
    try {
        $envCheck = $env:ASPNETCORE_ENVIRONMENT
        if ($envCheck -eq "Production") {
            Add-CheckResult -Category "API" -Check "Environment" -Status "PASS" `
                -Message "Running in Production mode" -Severity "CRITICAL"
        } else {
            Add-CheckResult -Category "API" -Check "Environment" -Status "FAIL" `
                -Message "Not in Production mode (current: $envCheck)" -Severity "CRITICAL"
        }
    } catch {
        Add-CheckResult -Category "API" -Check "Environment" -Status "WARN" `
            -Message "Could not verify environment" -Severity "WARNING"
    }
    
    # =============================================
    # 2. DATABASE HEALTH
    # =============================================
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "2. DATABASE HEALTH" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not [string]::IsNullOrEmpty($ConnectionString)) {
        try {
            $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
            $dbStart = Get-Date
            $conn.Open()
            $dbDuration = ((Get-Date) - $dbStart).TotalMilliseconds
            
            Add-CheckResult -Category "Database" -Check "Connection" -Status "PASS" `
                -Message "Connected (${dbDuration}ms)" -Severity "CRITICAL"
            
            # Check database size
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = @"
SELECT 
    SUM(size * 8 / 1024) AS SizeMB
FROM sys.master_files
WHERE database_id = DB_ID()
"@
            $reader = $cmd.ExecuteReader()
            if ($reader.Read()) {
                $sizeMB = $reader["SizeMB"]
                Add-CheckResult -Category "Database" -Check "Database Size" -Status "PASS" `
                    -Message "${sizeMB} MB" -Severity "INFO"
            }
            $reader.Close()
            
            # Check active connections
            $cmd.CommandText = @"
SELECT COUNT(*) AS ConnectionCount
FROM sys.dm_exec_sessions
WHERE is_user_process = 1
"@
            $reader = $cmd.ExecuteReader()
            if ($reader.Read()) {
                $connCount = $reader["ConnectionCount"]
                if ($connCount -gt 50) {
                    Add-CheckResult -Category "Database" -Check "Active Connections" -Status "WARN" `
                        -Message "High connection count: $connCount" -Severity "WARNING"
                } else {
                    Add-CheckResult -Category "Database" -Check "Active Connections" -Status "PASS" `
                        -Message "$connCount connections" -Severity "INFO"
                }
            }
            $reader.Close()
            
            # Check blocked processes
            $cmd.CommandText = @"
SELECT COUNT(*) AS BlockedCount
FROM sys.dm_exec_requests
WHERE blocking_session_id <> 0
"@
            $reader = $cmd.ExecuteReader()
            if ($reader.Read()) {
                $blockedCount = $reader["BlockedCount"]
                if ($blockedCount -gt 0) {
                    Add-CheckResult -Category "Database" -Check "Blocked Processes" -Status "FAIL" `
                        -Message "$blockedCount processes blocked" -Severity "WARNING"
                } else {
                    Add-CheckResult -Category "Database" -Check "Blocked Processes" -Status "PASS" `
                        -Message "No blocking detected" -Severity "INFO"
                }
            }
            $reader.Close()
            
            $conn.Close()
            
        } catch {
            Add-CheckResult -Category "Database" -Check "Connection" -Status "FAIL" `
                -Message "Cannot connect: $_" -Severity "CRITICAL"
        }
    } else {
        Add-CheckResult -Category "Database" -Check "Connection String" -Status "WARN" `
            -Message "No connection string provided" -Severity "WARNING"
    }
    
    # =============================================
    # 3. DATA INTEGRITY
    # =============================================
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "3. DATA INTEGRITY" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not [string]::IsNullOrEmpty($ConnectionString)) {
        try {
            $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
            $conn.Open()
            
            # Check for negative stock
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = @"
SELECT COUNT(*) AS NegativeStockCount
FROM YarnStocks
WHERE CurrentBalanceKg < 0
"@
            $reader = $cmd.ExecuteReader()
            if ($reader.Read()) {
                $negCount = $reader["NegativeStockCount"]
                if ($negCount -gt 0) {
                    Add-CheckResult -Category "Data" -Check "Negative Stock" -Status "FAIL" `
                        -Message "$negCount items with negative stock!" -Severity "CRITICAL"
                } else {
                    Add-CheckResult -Category "Data" -Check "Negative Stock" -Status "PASS" `
                        -Message "No negative stock" -Severity "CRITICAL"
                }
            }
            $reader.Close()
            
            # Check for orphaned records
            $cmd.CommandText = @"
SELECT COUNT(*) AS OrphanCount
FROM BabyCones bc
LEFT JOIN YarnReceipts yr ON bc.ReceiptId = yr.ReceiptId
WHERE yr.ReceiptId IS NULL
"@
            $reader = $cmd.ExecuteReader()
            if ($reader.Read()) {
                $orphanCount = $reader["OrphanCount"]
                if ($orphanCount -gt 0) {
                    Add-CheckResult -Category "Data" -Check "Orphaned Records" -Status "WARN" `
                        -Message "$orphanCount orphaned baby cones" -Severity "WARNING"
                } else {
                    Add-CheckResult -Category "Data" -Check "Orphaned Records" -Status "PASS" `
                        -Message "No orphaned records" -Severity "INFO"
                }
            }
            $reader.Close()
            
            # Check recent transactions
            $cmd.CommandText = @"
SELECT COUNT(*) AS RecentCount
FROM YarnReceipts
WHERE CreatedDate >= DATEADD(HOUR, -2, GETDATE())
"@
            $reader = $cmd.ExecuteReader()
            if ($reader.Read()) {
                $recentCount = $reader["RecentCount"]
                Add-CheckResult -Category "Data" -Check "Recent Transactions" -Status "PASS" `
                    -Message "$recentCount receipts in last 2 hours" -Severity "INFO"
            }
            $reader.Close()
            
            $conn.Close()
            
        } catch {
            Add-CheckResult -Category "Data" -Check "Integrity Checks" -Status "FAIL" `
                -Message "Error checking data: $_" -Severity "WARNING"
        }
    }
    
    # =============================================
    # 4. ERROR MONITORING
    # =============================================
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "4. ERROR MONITORING" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Check log files for errors
    $logPath = "backend\SudhanTextileERP.API\logs"
    if (Test-Path $logPath) {
        $today = Get-Date -Format "yyyyMMdd"
        $todayLogs = Get-ChildItem -Path $logPath -Filter "log-$today*.txt" -ErrorAction SilentlyContinue
        
        if ($todayLogs) {
            $errorCount = 0
            foreach ($log in $todayLogs) {
                $errors = Select-String -Path $log.FullName -Pattern "ERROR|FATAL|Exception" -CaseSensitive:$false
                $errorCount += $errors.Count
            }
            
            if ($errorCount -gt 0) {
                Add-CheckResult -Category "Errors" -Check "Error Logs" -Status "WARN" `
                    -Message "$errorCount errors found in today's logs" -Severity "WARNING"
            } else {
                Add-CheckResult -Category "Errors" -Check "Error Logs" -Status "PASS" `
                    -Message "No errors in logs" -Severity "INFO"
            }
        } else {
            Add-CheckResult -Category "Errors" -Check "Error Logs" -Status "WARN" `
                -Message "No log files found for today" -Severity "WARNING"
        }
    } else {
        Add-CheckResult -Category "Errors" -Check "Error Logs" -Status "WARN" `
            -Message "Log directory not found" -Severity "WARNING"
    }
    
    # =============================================
    # 5. BACKUP STATUS
    # =============================================
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "5. BACKUP STATUS" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not [string]::IsNullOrEmpty($ConnectionString)) {
        try {
            $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
            $conn.Open()
            
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = @"
SELECT TOP 1 
    backup_finish_date,
    DATEDIFF(HOUR, backup_finish_date, GETDATE()) AS HoursSinceBackup
FROM msdb.dbo.backupset
WHERE database_name = DB_NAME()
    AND type = 'D'
ORDER BY backup_finish_date DESC
"@
            $reader = $cmd.ExecuteReader()
            if ($reader.Read()) {
                $hoursSince = $reader["HoursSinceBackup"]
                if ($hoursSince -gt 24) {
                    Add-CheckResult -Category "Backup" -Check "Last Backup" -Status "FAIL" `
                        -Message "Last backup was $hoursSince hours ago!" -Severity "CRITICAL"
                } else {
                    Add-CheckResult -Category "Backup" -Check "Last Backup" -Status "PASS" `
                        -Message "$hoursSince hours ago" -Severity "WARNING"
                }
            } else {
                Add-CheckResult -Category "Backup" -Check "Last Backup" -Status "FAIL" `
                    -Message "No backup found!" -Severity "CRITICAL"
            }
            $reader.Close()
            
            $conn.Close()
            
        } catch {
            Add-CheckResult -Category "Backup" -Check "Backup Status" -Status "WARN" `
                -Message "Could not check backup: $_" -Severity "WARNING"
        }
    }
    
    # =============================================
    # 6. PERFORMANCE METRICS
    # =============================================
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "6. PERFORMANCE METRICS" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not [string]::IsNullOrEmpty($ConnectionString)) {
        try {
            $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
            $conn.Open()
            
            # Check for slow queries (if Query Store is enabled)
            $cmd = $conn.CreateCommand()
            $cmd.CommandText = @"
SELECT COUNT(*) AS SlowQueryCount
FROM sys.dm_exec_query_stats
WHERE total_elapsed_time / execution_count > 5000000
"@
            try {
                $reader = $cmd.ExecuteReader()
                if ($reader.Read()) {
                    $slowCount = $reader["SlowQueryCount"]
                    if ($slowCount -gt 10) {
                        Add-CheckResult -Category "Performance" -Check "Slow Queries" -Status "WARN" `
                            -Message "$slowCount slow queries detected" -Severity "WARNING"
                    } else {
                        Add-CheckResult -Category "Performance" -Check "Slow Queries" -Status "PASS" `
                            -Message "$slowCount slow queries (acceptable)" -Severity "INFO"
                    }
                }
                $reader.Close()
            } catch {
                Add-CheckResult -Category "Performance" -Check "Slow Queries" -Status "WARN" `
                    -Message "Could not check query performance" -Severity "INFO"
            }
            
            $conn.Close()
            
        } catch {
            Add-CheckResult -Category "Performance" -Check "Performance Metrics" -Status "WARN" `
                -Message "Could not check performance: $_" -Severity "INFO"
        }
    }
    
    # =============================================
    # SUMMARY
    # =============================================
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "MONITORING SUMMARY" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    
    $passCount = ($results.Checks | Where-Object { $_.Status -eq "PASS" }).Count
    $failCount = ($results.Checks | Where-Object { $_.Status -eq "FAIL" }).Count
    $warnCount = ($results.Checks | Where-Object { $_.Status -eq "WARN" }).Count
    $totalChecks = $results.Checks.Count
    
    Write-Host "Total Checks: $totalChecks" -ForegroundColor White
    Write-Host "  Passed: $passCount" -ForegroundColor Green
    Write-Host "  Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "White" })
    Write-Host "  Warnings: $warnCount" -ForegroundColor $(if ($warnCount -gt 0) { "Yellow" } else { "White" })
    Write-Host ""
    
    if ($results.CriticalIssues.Count -gt 0) {
        $results.Status = "CRITICAL"
        Write-Host "⚠ CRITICAL ISSUES DETECTED" -ForegroundColor Red -BackgroundColor Black
        Write-Host ""
        foreach ($issue in $results.CriticalIssues) {
            Write-Host "  ✗ $($issue.Check): $($issue.Message)" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "ACTION REQUIRED: Investigate and resolve immediately!" -ForegroundColor Red
    } elseif ($results.Warnings.Count -gt 0) {
        $results.Status = "WARNING"
        Write-Host "⚠ Warnings Detected" -ForegroundColor Yellow
        Write-Host ""
        foreach ($warning in $results.Warnings) {
            Write-Host "  ⚠ $($warning.Check): $($warning.Message)" -ForegroundColor Yellow
        }
        Write-Host ""
        Write-Host "ACTION: Monitor closely, may need attention" -ForegroundColor Yellow
    } else {
        $results.Status = "HEALTHY"
        Write-Host "✓ System is HEALTHY" -ForegroundColor Green
        Write-Host "  All critical checks passed" -ForegroundColor Green
    }
    
    # Save results
    $reportFile = "monitoring-report-$timestamp.json"
    $results | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportFile
    Write-Host ""
    Write-Host "Report saved: $reportFile" -ForegroundColor Cyan
    Write-Host ""
    
    if ($Continuous) {
        Write-Host "Next check in $IntervalMinutes minutes..." -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
        Write-Host ""
        Start-Sleep -Seconds ($IntervalMinutes * 60)
        
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor White
        Write-Host ""
    }
    
} while ($Continuous)

Write-Host "Monitoring complete." -ForegroundColor Green
Write-Host ""
