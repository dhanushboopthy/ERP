# =============================================
# 14-DAY STABILIZATION VERIFICATION
# Daily stability checks for post go-live period
# =============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ConnectionString = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiBaseUrl = "http://localhost:5000",
    
    [Parameter(Mandatory=$false)]
    [int]$DaysSinceGoLive = 0
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                                                                ║" -ForegroundColor Magenta
Write-Host "║          14-DAY STABILIZATION VERIFICATION                     ║" -ForegroundColor Magenta
Write-Host "║            Post Go-Live Stability Checks                       ║" -ForegroundColor Magenta
Write-Host "║                                                                ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "Verification Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White

# Get connection string
if ([string]::IsNullOrEmpty($ConnectionString)) {
    $prodConfig = "backend\SudhanTextileERP.API\appsettings.Production.json"
    if (Test-Path $prodConfig) {
        $config = Get-Content $prodConfig -Raw | ConvertFrom-Json
        $ConnectionString = $config.ConnectionStrings.DefaultConnection
    }
}

# Determine days since go-live
if ($DaysSinceGoLive -eq 0) {
    $goLiveRecords = Get-ChildItem -Filter "go-live-record-*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    if ($goLiveRecords) {
        $goLiveData = Get-Content $goLiveRecords[0].FullName -Raw | ConvertFrom-Json
        $goLiveDate = [DateTime]::Parse($goLiveData.GoLiveTime)
        $DaysSinceGoLive = ([DateTime]::Now - $goLiveDate).Days
    } else {
        Write-Host "⚠ Cannot determine go-live date. Please specify -DaysSinceGoLive" -ForegroundColor Yellow
        $DaysSinceGoLive = Read-Host "Enter days since go-live (1-14)"
    }
}

Write-Host "Days Since Go-Live: Day $DaysSinceGoLive of 14" -ForegroundColor Cyan
Write-Host ""

if ($DaysSinceGoLive -gt 14) {
    Write-Host "⚠ STABILIZATION PERIOD COMPLETE (Day $DaysSinceGoLive > 14)" -ForegroundColor Yellow
    Write-Host "  Run Phase-2 readiness assessment instead" -ForegroundColor Yellow
    Write-Host ""
}

# Results tracking
$results = @{
    Timestamp = Get-Date
    Day = $DaysSinceGoLive
    Checks = @()
    CriticalFailures = @()
    Warnings = @()
    StabilityScore = 0
    Verdict = "UNKNOWN"
}

function Add-StabilityCheck {
    param(
        [string]$Category,
        [string]$Check,
        [string]$Status,
        [string]$Message,
        [string]$Severity = "CRITICAL",
        [int]$Points = 0
    )
    
    $result = @{
        Category = $Category
        Check = $Check
        Status = $Status
        Message = $Message
        Severity = $Severity
        Points = $Points
    }
    
    $results.Checks += $result
    
    if ($Status -eq "PASS") {
        $results.StabilityScore += $Points
    }
    
    if ($Status -eq "FAIL" -and $Severity -eq "CRITICAL") {
        $results.CriticalFailures += $result
    } elseif ($Status -eq "FAIL" -and $Severity -eq "WARNING") {
        $results.Warnings += $result
    }
    
    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { if ($Severity -eq "CRITICAL") { "Red" } else { "Yellow" } }
        default { "White" }
    }
    
    $icon = switch ($Status) {
        "PASS" { "✓" }
        "FAIL" { "✗" }
        default { "•" }
    }
    
    Write-Host "  $icon $Check`: " -NoNewline -ForegroundColor $color
    Write-Host "$Message " -NoNewline -ForegroundColor $color
    if ($Points -gt 0 -and $Status -eq "PASS") {
        Write-Host "(+$Points pts)" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
}

# =============================================
# 1. SYSTEM STABILITY (25 points)
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "1. SYSTEM STABILITY VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# API Uptime
try {
    $apiStart = Get-Date
    $health = Invoke-RestMethod -Uri "$ApiBaseUrl/api/health" -Method GET -TimeoutSec 10
    $apiDuration = ((Get-Date) - $apiStart).TotalMilliseconds
    
    if ($apiDuration -lt 1000) {
        Add-StabilityCheck -Category "System" -Check "API Response Time" -Status "PASS" `
            -Message "${apiDuration}ms (excellent)" -Severity "CRITICAL" -Points 10
    } elseif ($apiDuration -lt 2000) {
        Add-StabilityCheck -Category "System" -Check "API Response Time" -Status "PASS" `
            -Message "${apiDuration}ms (acceptable)" -Severity "CRITICAL" -Points 5
    } else {
        Add-StabilityCheck -Category "System" -Check "API Response Time" -Status "FAIL" `
            -Message "${apiDuration}ms (too slow)" -Severity "WARNING"
    }
} catch {
    Add-StabilityCheck -Category "System" -Check "API Availability" -Status "FAIL" `
        -Message "API not responding" -Severity "CRITICAL"
}

# Check for crash loops (log errors in last hour)
$logPath = "backend\SudhanTextileERP.API\logs"
if (Test-Path $logPath) {
    $recentLogs = Get-ChildItem -Path $logPath -Filter "log-*.txt" | Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-1) }
    $crashCount = 0
    foreach ($log in $recentLogs) {
        $crashes = Select-String -Path $log.FullName -Pattern "FATAL|System.Exception|crashed" -CaseSensitive:$false
        $crashCount += $crashes.Count
    }
    
    if ($crashCount -eq 0) {
        Add-StabilityCheck -Category "System" -Check "No Crash Loops" -Status "PASS" `
            -Message "No crashes in last hour" -Severity "CRITICAL" -Points 10
    } else {
        Add-StabilityCheck -Category "System" -Check "No Crash Loops" -Status "FAIL" `
            -Message "$crashCount crashes detected!" -Severity "CRITICAL"
    }
}

# Production environment
$envCheck = $env:ASPNETCORE_ENVIRONMENT
if ($envCheck -eq "Production") {
    Add-StabilityCheck -Category "System" -Check "Environment Config" -Status "PASS" `
        -Message "Running in Production mode" -Severity "CRITICAL" -Points 5
} else {
    Add-StabilityCheck -Category "System" -Check "Environment Config" -Status "FAIL" `
        -Message "Not in Production mode (current: $envCheck)" -Severity "CRITICAL"
}

# =============================================
# 2. DATA INTEGRITY (30 points)
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "2. DATA INTEGRITY VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # CRITICAL: No negative stock
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT COUNT(*) FROM YarnStocks WHERE CurrentBalanceKg < 0"
        $negCount = $cmd.ExecuteScalar()
        
        if ($negCount -eq 0) {
            Add-StabilityCheck -Category "Data" -Check "Zero Negative Stock" -Status "PASS" `
                -Message "No negative stock values" -Severity "CRITICAL" -Points 10
        } else {
            Add-StabilityCheck -Category "Data" -Check "Zero Negative Stock" -Status "FAIL" `
                -Message "$negCount items with negative stock!" -Severity "CRITICAL"
        }
        
        # Stock reconciliation
        $cmd.CommandText = @"
SELECT 
    ABS(
        (SELECT ISNULL(SUM(NetWeightKg), 0) FROM YarnReceipts WHERE IsActive = 1) -
        (SELECT ISNULL(SUM(NetWeightKg), 0) FROM Beams WHERE IsActive = 1) -
        (SELECT ISNULL(SUM(CurrentBalanceKg), 0) FROM YarnStocks)
    ) AS Variance
"@
        $variance = $cmd.ExecuteScalar()
        
        if ($variance -lt 0.1) {
            Add-StabilityCheck -Category "Data" -Check "Stock Reconciliation" -Status "PASS" `
                -Message "Variance: $([Math]::Round($variance, 4)) kg (perfect)" -Severity "CRITICAL" -Points 10
        } elseif ($variance -lt 1.0) {
            Add-StabilityCheck -Category "Data" -Check "Stock Reconciliation" -Status "PASS" `
                -Message "Variance: $([Math]::Round($variance, 4)) kg (acceptable)" -Severity "WARNING" -Points 5
        } else {
            Add-StabilityCheck -Category "Data" -Check "Stock Reconciliation" -Status "FAIL" `
                -Message "Variance: $([Math]::Round($variance, 4)) kg (too high!)" -Severity "CRITICAL"
        }
        
        # No orphaned records
        $cmd.CommandText = @"
SELECT COUNT(*) FROM BabyCones bc
LEFT JOIN YarnReceipts yr ON bc.ReceiptId = yr.ReceiptId
WHERE yr.ReceiptId IS NULL
"@
        $orphanCount = $cmd.ExecuteScalar()
        
        if ($orphanCount -eq 0) {
            Add-StabilityCheck -Category "Data" -Check "No Orphaned Records" -Status "PASS" `
                -Message "No orphaned baby cones" -Severity "WARNING" -Points 5
        } else {
            Add-StabilityCheck -Category "Data" -Check "No Orphaned Records" -Status "FAIL" `
                -Message "$orphanCount orphaned records found" -Severity "WARNING"
        }
        
        # No duplicate document numbers
        $cmd.CommandText = @"
SELECT COUNT(*) FROM (
    SELECT ReceiptNo FROM YarnReceipts GROUP BY ReceiptNo HAVING COUNT(*) > 1
) Duplicates
"@
        $dupCount = $cmd.ExecuteScalar()
        
        if ($dupCount -eq 0) {
            Add-StabilityCheck -Category "Data" -Check "No Duplicate Documents" -Status "PASS" `
                -Message "All document numbers unique" -Severity "WARNING" -Points 5
        } else {
            Add-StabilityCheck -Category "Data" -Check "No Duplicate Documents" -Status "FAIL" `
                -Message "$dupCount duplicate document numbers!" -Severity "CRITICAL"
        }
        
        $conn.Close()
    } catch {
        Add-StabilityCheck -Category "Data" -Check "Data Integrity Checks" -Status "FAIL" `
            -Message "Cannot connect to database: $_" -Severity "CRITICAL"
    }
}

# =============================================
# 3. SECURITY & ACCESS (15 points)
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "3. SECURITY & ACCESS VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # Check for unauthorized access attempts (today)
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
SELECT COUNT(*) FROM AuditLogs
WHERE Action LIKE '%FAILED%'
    AND CreatedDate >= CAST(GETDATE() AS DATE)
"@
        $failedCount = $cmd.ExecuteScalar()
        
        if ($failedCount -eq 0) {
            Add-StabilityCheck -Category "Security" -Check "No Unauthorized Access" -Status "PASS" `
                -Message "No failed login attempts today" -Severity "WARNING" -Points 5
        } elseif ($failedCount -lt 5) {
            Add-StabilityCheck -Category "Security" -Check "No Unauthorized Access" -Status "PASS" `
                -Message "$failedCount failed attempts (acceptable)" -Severity "WARNING" -Points 3
        } else {
            Add-StabilityCheck -Category "Security" -Check "No Unauthorized Access" -Status "FAIL" `
                -Message "$failedCount failed attempts (investigate!)" -Severity "WARNING"
        }
        
        # Audit logs growing
        $cmd.CommandText = @"
SELECT COUNT(*) FROM AuditLogs
WHERE CreatedDate >= DATEADD(HOUR, -24, GETDATE())
"@
        $auditCount = $cmd.ExecuteScalar()
        
        if ($auditCount -gt 0) {
            Add-StabilityCheck -Category "Security" -Check "Audit Logs Active" -Status "PASS" `
                -Message "$auditCount audit entries in 24h" -Severity "CRITICAL" -Points 10
        } else {
            Add-StabilityCheck -Category "Security" -Check "Audit Logs Active" -Status "FAIL" `
                -Message "No audit logs in 24h!" -Severity "CRITICAL"
        }
        
        $conn.Close()
    } catch {
        Add-StabilityCheck -Category "Security" -Check "Security Checks" -Status "FAIL" `
            -Message "Cannot verify: $_" -Severity "WARNING"
    }
}

# =============================================
# 4. BACKUP & RECOVERY (15 points)
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "4. BACKUP & RECOVERY VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # Daily backup completed
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
SELECT TOP 1 
    backup_finish_date,
    DATEDIFF(HOUR, backup_finish_date, GETDATE()) AS HoursSinceBackup,
    backup_size / 1024 / 1024 AS BackupSizeMB
FROM msdb.dbo.backupset
WHERE database_name = DB_NAME()
    AND type = 'D'
ORDER BY backup_finish_date DESC
"@
        $reader = $cmd.ExecuteReader()
        if ($reader.Read()) {
            $hoursSince = $reader["HoursSinceBackup"]
            $sizeMB = [Math]::Round($reader["BackupSizeMB"], 2)
            
            if ($hoursSince -le 24) {
                Add-StabilityCheck -Category "Backup" -Check "Daily Backup Success" -Status "PASS" `
                    -Message "Last backup: $hoursSince hours ago ($sizeMB MB)" -Severity "CRITICAL" -Points 10
            } else {
                Add-StabilityCheck -Category "Backup" -Check "Daily Backup Success" -Status "FAIL" `
                    -Message "Last backup was $hoursSince hours ago!" -Severity "CRITICAL"
            }
        } else {
            Add-StabilityCheck -Category "Backup" -Check "Daily Backup Success" -Status "FAIL" `
                -Message "No backups found!" -Severity "CRITICAL"
        }
        $reader.Close()
        
        # Recovery model
        $cmd.CommandText = "SELECT recovery_model_desc FROM sys.databases WHERE name = DB_NAME()"
        $recoveryModel = $cmd.ExecuteScalar()
        
        if ($recoveryModel -eq "FULL" -or $recoveryModel -eq "SIMPLE") {
            Add-StabilityCheck -Category "Backup" -Check "Recovery Model Set" -Status "PASS" `
                -Message "Recovery model: $recoveryModel" -Severity "WARNING" -Points 5
        } else {
            Add-StabilityCheck -Category "Backup" -Check "Recovery Model Set" -Status "FAIL" `
                -Message "Recovery model: $recoveryModel (unexpected)" -Severity "WARNING"
        }
        
        $conn.Close()
    } catch {
        Add-StabilityCheck -Category "Backup" -Check "Backup Verification" -Status "FAIL" `
            -Message "Cannot verify: $_" -Severity "CRITICAL"
    }
}

# =============================================
# 5. REPORT ACCURACY (15 points)
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "5. REPORT ACCURACY VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # Transaction count matches across tables
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
SELECT 
    (SELECT COUNT(*) FROM YarnReceipts WHERE CAST(CreatedDate AS DATE) = CAST(GETDATE() AS DATE)) AS TodayReceipts,
    (SELECT COUNT(*) FROM AuditLogs WHERE EntityType = 'YarnReceipt' AND Action = 'CREATE' AND CAST(CreatedDate AS DATE) = CAST(GETDATE() AS DATE)) AS AuditedReceipts
"@
        $reader = $cmd.ExecuteReader()
        if ($reader.Read()) {
            $receipts = $reader["TodayReceipts"]
            $audited = $reader["AuditedReceipts"]
            
            if ($receipts -eq $audited -or ($receipts -eq 0 -and $audited -eq 0)) {
                Add-StabilityCheck -Category "Reports" -Check "Transaction-Audit Match" -Status "PASS" `
                    -Message "Receipts ($receipts) match audit logs ($audited)" -Severity "WARNING" -Points 10
            } else {
                Add-StabilityCheck -Category "Reports" -Check "Transaction-Audit Match" -Status "FAIL" `
                    -Message "Mismatch: $receipts receipts vs $audited audited" -Severity "WARNING"
            }
        }
        $reader.Close()
        
        # Stock report data consistency
        $cmd.CommandText = @"
SELECT COUNT(*) FROM YarnStocks 
WHERE YarnTypeId NOT IN (SELECT YarnTypeId FROM YarnTypes WHERE IsActive = 1)
"@
        $inconsistentStock = $cmd.ExecuteScalar()
        
        if ($inconsistentStock -eq 0) {
            Add-StabilityCheck -Category "Reports" -Check "Stock Data Consistency" -Status "PASS" `
                -Message "All stock references valid yarn types" -Severity "WARNING" -Points 5
        } else {
            Add-StabilityCheck -Category "Reports" -Check "Stock Data Consistency" -Status "FAIL" `
                -Message "$inconsistentStock stock entries with invalid references" -Severity "WARNING"
        }
        
        $conn.Close()
    } catch {
        Add-StabilityCheck -Category "Reports" -Check "Report Verification" -Status "FAIL" `
            -Message "Cannot verify: $_" -Severity "WARNING"
    }
}

# =============================================
# STABILITY SCORE & VERDICT
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "STABILITY ASSESSMENT - DAY $DaysSinceGoLive" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$maxScore = 100
$scorePercent = [Math]::Round(($results.StabilityScore / $maxScore) * 100, 1)

Write-Host "Stability Score: $($results.StabilityScore) / $maxScore ($scorePercent%)" -ForegroundColor Cyan
Write-Host ""

$passCount = ($results.Checks | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results.Checks | Where-Object { $_.Status -eq "FAIL" }).Count
$totalChecks = $results.Checks.Count

Write-Host "Checks Summary:" -ForegroundColor White
Write-Host "  Total: $totalChecks" -ForegroundColor White
Write-Host "  Passed: $passCount" -ForegroundColor Green
Write-Host "  Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "White" })
Write-Host ""

# Determine verdict
if ($results.CriticalFailures.Count -gt 0) {
    $results.Verdict = "UNSTABLE"
    Write-Host "⚠ VERDICT: UNSTABLE" -ForegroundColor Red -BackgroundColor Black
    Write-Host ""
    Write-Host "Critical Failures Detected:" -ForegroundColor Red
    foreach ($failure in $results.CriticalFailures) {
        Write-Host "  ✗ $($failure.Check): $($failure.Message)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "ACTION REQUIRED:" -ForegroundColor Yellow
    Write-Host "  1. Resolve all critical failures immediately" -ForegroundColor White
    Write-Host "  2. Do NOT proceed with Phase-2" -ForegroundColor White
    Write-Host "  3. Re-run verification after fixes" -ForegroundColor White
    Write-Host ""
} elseif ($scorePercent -ge 90) {
    $results.Verdict = "EXCELLENT"
    Write-Host "✓ VERDICT: EXCELLENT STABILITY" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "System is highly stable. Continue monitoring." -ForegroundColor Green
    if ($DaysSinceGoLive -ge 14) {
        Write-Host ""
        Write-Host "✓ Stabilization period complete ($DaysSinceGoLive days)" -ForegroundColor Green
        Write-Host "  Ready for Phase-2 readiness assessment" -ForegroundColor Cyan
    } else {
        Write-Host "  Days remaining in stabilization: $(14 - $DaysSinceGoLive)" -ForegroundColor Cyan
    }
} elseif ($scorePercent -ge 75) {
    $results.Verdict = "GOOD"
    Write-Host "✓ VERDICT: GOOD STABILITY" -ForegroundColor Green
    Write-Host ""
    Write-Host "System is stable with minor issues." -ForegroundColor Yellow
    if ($results.Warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "Warnings to Address:" -ForegroundColor Yellow
        foreach ($warning in $results.Warnings) {
            Write-Host "  ⚠ $($warning.Check): $($warning.Message)" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    if ($DaysSinceGoLive -lt 14) {
        Write-Host "Continue daily monitoring. Days remaining: $(14 - $DaysSinceGoLive)" -ForegroundColor Cyan
    }
} elseif ($scorePercent -ge 60) {
    $results.Verdict = "NEEDS ATTENTION"
    Write-Host "⚠ VERDICT: NEEDS ATTENTION" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host ""
    Write-Host "System stability is below target. Address issues promptly." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ACTION ITEMS:" -ForegroundColor Cyan
    Write-Host "  1. Review all failures and warnings" -ForegroundColor White
    Write-Host "  2. Create action plan for improvements" -ForegroundColor White
    Write-Host "  3. Increase monitoring frequency" -ForegroundColor White
    Write-Host "  4. Extend stabilization period if needed" -ForegroundColor White
    Write-Host ""
} else {
    $results.Verdict = "CRITICAL"
    Write-Host "✗ VERDICT: CRITICAL INSTABILITY" -ForegroundColor Red -BackgroundColor Black
    Write-Host ""
    Write-Host "System is NOT stable for production use!" -ForegroundColor Red
    Write-Host ""
    Write-Host "IMMEDIATE ACTION REQUIRED:" -ForegroundColor Red
    Write-Host "  1. Escalate to management" -ForegroundColor White
    Write-Host "  2. Consider rollback or intervention" -ForegroundColor White
    Write-Host "  3. Do NOT proceed with any new development" -ForegroundColor White
    Write-Host "  4. Focus exclusively on stabilization" -ForegroundColor White
    Write-Host ""
}

# Trend analysis (if historical data exists)
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TREND ANALYSIS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$historicalReports = Get-ChildItem -Filter "stability-report-*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 5

if ($historicalReports.Count -gt 1) {
    Write-Host "Recent Stability Scores:" -ForegroundColor Cyan
    foreach ($report in $historicalReports) {
        $data = Get-Content $report.FullName -Raw | ConvertFrom-Json
        $date = $data.Timestamp
        $score = $data.StabilityScore
        $verdict = $data.Verdict
        
        $color = switch ($verdict) {
            "EXCELLENT" { "Green" }
            "GOOD" { "Green" }
            "NEEDS ATTENTION" { "Yellow" }
            default { "Red" }
        }
        
        Write-Host "  $date - Score: $score/100 - $verdict" -ForegroundColor $color
    }
    Write-Host ""
    
    $latest = Get-Content $historicalReports[0].FullName -Raw | ConvertFrom-Json
    $previous = Get-Content $historicalReports[1].FullName -Raw | ConvertFrom-Json
    
    $scoreDelta = $latest.StabilityScore - $previous.StabilityScore
    
    if ($scoreDelta -gt 0) {
        Write-Host "Trend: ↗ IMPROVING (+$scoreDelta points)" -ForegroundColor Green
    } elseif ($scoreDelta -lt 0) {
        Write-Host "Trend: ↘ DEGRADING ($scoreDelta points)" -ForegroundColor Red
    } else {
        Write-Host "Trend: → STABLE (no change)" -ForegroundColor Cyan
    }
} else {
    Write-Host "Insufficient historical data for trend analysis" -ForegroundColor Gray
    Write-Host "  Run this script daily to build trend history" -ForegroundColor Gray
}

Write-Host ""

# Save results
$reportFile = "stability-report-$timestamp.json"
$results | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportFile

Write-Host "Report saved: $reportFile" -ForegroundColor Cyan

# Append to CSV for trending
$csvFile = "stability-tracking.csv"
if (-not (Test-Path $csvFile)) {
    Add-Content -Path $csvFile -Value "Timestamp,Day,Score,Verdict,CriticalFailures,Warnings"
}
$csvLine = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'),$DaysSinceGoLive,$($results.StabilityScore),$($results.Verdict),$($results.CriticalFailures.Count),$($results.Warnings.Count)"
Add-Content -Path $csvFile -Value $csvLine

Write-Host "Tracking data appended: $csvFile" -ForegroundColor Cyan
Write-Host ""

# Exit code based on verdict
if ($results.Verdict -eq "UNSTABLE" -or $results.Verdict -eq "CRITICAL") {
    exit 1
} else {
    exit 0
}
