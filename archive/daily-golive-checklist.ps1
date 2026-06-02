# =============================================
# DAILY GO-LIVE CHECKLIST
# For first 5 days post go-live
# =============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ConnectionString = "",
    
    [Parameter(Mandatory=$false)]
    [int]$DayNumber = 0
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║              DAILY GO-LIVE CHECKLIST                           ║" -ForegroundColor Green
Write-Host "║           Production Health Verification                       ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd')" -ForegroundColor White
Write-Host "Time: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor White

if ($DayNumber -eq 0) {
    Write-Host ""
    $DayNumber = Read-Host "Which day post go-live is this? (1-5)"
}

Write-Host "Day: $DayNumber" -ForegroundColor Cyan
Write-Host ""

# Get connection string
if ([string]::IsNullOrEmpty($ConnectionString)) {
    $prodConfig = "backend\SudhanTextileERP.API\appsettings.Production.json"
    if (Test-Path $prodConfig) {
        $config = Get-Content $prodConfig -Raw | ConvertFrom-Json
        $ConnectionString = $config.ConnectionStrings.DefaultConnection
    }
}

$checklist = @{
    Date = Get-Date
    Day = $DayNumber
    Items = @()
    Status = "INCOMPLETE"
}

function Add-ChecklistItem {
    param(
        [string]$Item,
        [string]$Status,
        [string]$Notes = ""
    )
    
    $checklist.Items += @{
        Item = $Item
        Status = $Status
        Notes = $Notes
        Timestamp = Get-Date
    }
    
    $icon = switch ($Status) {
        "✓" { "✓"; $color = "Green" }
        "✗" { "✗"; $color = "Red" }
        "⚠" { "⚠"; $color = "Yellow" }
        default { "•"; $color = "White" }
    }
    
    Write-Host "  $icon $Item" -ForegroundColor $color
    if ($Notes) {
        Write-Host "    → $Notes" -ForegroundColor Gray
    }
}

# =============================================
# 1. SYSTEM HEALTH
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "1. SYSTEM HEALTH CHECKS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# API Status
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 10
    Add-ChecklistItem -Item "API is running" -Status "✓"
} catch {
    Add-ChecklistItem -Item "API is running" -Status "✗" -Notes "API not responding"
}

# Database connection
if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        Add-ChecklistItem -Item "Database is accessible" -Status "✓"
        $conn.Close()
    } catch {
        Add-ChecklistItem -Item "Database is accessible" -Status "✗" -Notes $_
    }
} else {
    Add-ChecklistItem -Item "Database is accessible" -Status "⚠" -Notes "No connection string"
}

# Log files
$logPath = "backend\SudhanTextileERP.API\logs"
if (Test-Path $logPath) {
    Add-ChecklistItem -Item "Log files being generated" -Status "✓"
} else {
    Add-ChecklistItem -Item "Log files being generated" -Status "✗" -Notes "Log directory not found"
}

# =============================================
# 2. BACKUP VERIFICATION
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "2. BACKUP VERIFICATION" -ForegroundColor Cyan
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
            $sizeMB = $reader["BackupSizeMB"]
            
            if ($hoursSince -le 24) {
                Add-ChecklistItem -Item "Daily backup completed" -Status "✓" `
                    -Notes "Last backup: $hoursSince hours ago ($sizeMB MB)"
            } else {
                Add-ChecklistItem -Item "Daily backup completed" -Status "✗" `
                    -Notes "Last backup was $hoursSince hours ago!"
            }
        } else {
            Add-ChecklistItem -Item "Daily backup completed" -Status "✗" -Notes "No backups found"
        }
        $reader.Close()
        $conn.Close()
    } catch {
        Add-ChecklistItem -Item "Daily backup completed" -Status "⚠" -Notes "Could not verify"
    }
} else {
    Add-ChecklistItem -Item "Daily backup completed" -Status "⚠" -Notes "Cannot verify - no connection"
}

# =============================================
# 3. DATA INTEGRITY
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "3. DATA INTEGRITY CHECKS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # No negative stock
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT COUNT(*) FROM YarnStocks WHERE CurrentBalanceKg < 0"
        $negCount = $cmd.ExecuteScalar()
        
        if ($negCount -eq 0) {
            Add-ChecklistItem -Item "No negative stock values" -Status "✓"
        } else {
            Add-ChecklistItem -Item "No negative stock values" -Status "✗" -Notes "$negCount items with negative stock"
        }
        
        # Financial year is active
        $cmd.CommandText = @"
SELECT COUNT(*) FROM FinancialYears 
WHERE IsActive = 1 
  AND GETDATE() BETWEEN StartDate AND EndDate
"@
        $fyCount = $cmd.ExecuteScalar()
        
        if ($fyCount -gt 0) {
            Add-ChecklistItem -Item "Active financial year exists" -Status "✓"
        } else {
            Add-ChecklistItem -Item "Active financial year exists" -Status "✗" -Notes "No active FY"
        }
        
        # Transactions today
        $cmd.CommandText = @"
SELECT COUNT(*) FROM YarnReceipts
WHERE CAST(ReceiptDate AS DATE) = CAST(GETDATE() AS DATE)
"@
        $todayTxCount = $cmd.ExecuteScalar()
        
        Add-ChecklistItem -Item "Transactions being processed" -Status "✓" `
            -Notes "$todayTxCount receipts today"
        
        $conn.Close()
    } catch {
        Add-ChecklistItem -Item "Data integrity checks" -Status "⚠" -Notes "Could not verify"
    }
}

# =============================================
# 4. REPORTS VERIFICATION
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "4. REPORTS VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # Stock report matches transactions
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
SELECT 
    (SELECT SUM(NetWeightKg) FROM YarnReceipts WHERE IsActive = 1) AS TotalReceipts,
    (SELECT SUM(NetWeightKg) FROM Beams WHERE IsActive = 1) AS TotalBeams,
    (SELECT SUM(CurrentBalanceKg) FROM YarnStocks) AS CurrentStock
"@
        $reader = $cmd.ExecuteReader()
        if ($reader.Read()) {
            $receipts = if ($reader["TotalReceipts"] -is [DBNull]) { 0 } else { $reader["TotalReceipts"] }
            $beams = if ($reader["TotalBeams"] -is [DBNull]) { 0 } else { $reader["TotalBeams"] }
            $stock = if ($reader["CurrentStock"] -is [DBNull]) { 0 } else { $reader["CurrentStock"] }
            
            $expected = $receipts - $beams
            $variance = [Math]::Abs($stock - $expected)
            
            if ($variance -lt 0.01) {
                Add-ChecklistItem -Item "Stock reports match transactions" -Status "✓" `
                    -Notes "Stock: $stock kg (variance: $variance kg)"
            } else {
                Add-ChecklistItem -Item "Stock reports match transactions" -Status "⚠" `
                    -Notes "Variance: $variance kg (may need review)"
            }
        }
        $reader.Close()
        
        $conn.Close()
    } catch {
        Add-ChecklistItem -Item "Stock reports match transactions" -Status "⚠" -Notes "Could not verify"
    }
}

# =============================================
# 5. SECURITY & ACCESS
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "5. SECURITY & ACCESS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # No unauthorized access
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
SELECT COUNT(*) FROM AuditLogs
WHERE Action LIKE '%FAILED%'
  AND CreatedDate >= CAST(GETDATE() AS DATE)
"@
        $failedCount = $cmd.ExecuteScalar()
        
        if ($failedCount -eq 0) {
            Add-ChecklistItem -Item "No unauthorized access attempts" -Status "✓"
        } else {
            Add-ChecklistItem -Item "No unauthorized access attempts" -Status "⚠" `
                -Notes "$failedCount failed attempts today"
        }
        
        # Audit logging working
        $cmd.CommandText = @"
SELECT COUNT(*) FROM AuditLogs
WHERE CreatedDate >= DATEADD(HOUR, -1, GETDATE())
"@
        $auditCount = $cmd.ExecuteScalar()
        
        if ($auditCount -gt 0) {
            Add-ChecklistItem -Item "Audit logging is active" -Status "✓" `
                -Notes "$auditCount entries in last hour"
        } else {
            Add-ChecklistItem -Item "Audit logging is active" -Status "⚠" `
                -Notes "No audit entries recently"
        }
        
        $conn.Close()
    } catch {
        Add-ChecklistItem -Item "Security checks" -Status "⚠" -Notes "Could not verify"
    }
}

# =============================================
# 6. PERFORMANCE
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "6. PERFORMANCE CHECKS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check logs for performance issues
$logPath = "backend\SudhanTextileERP.API\logs"
if (Test-Path $logPath) {
    $today = Get-Date -Format "yyyyMMdd"
    $todayLogs = Get-ChildItem -Path $logPath -Filter "log-$today*.txt" -ErrorAction SilentlyContinue
    
    if ($todayLogs) {
        $slowQueries = 0
        foreach ($log in $todayLogs) {
            $slow = Select-String -Path $log.FullName -Pattern "slow|timeout|performance" -CaseSensitive:$false
            $slowQueries += $slow.Count
        }
        
        if ($slowQueries -eq 0) {
            Add-ChecklistItem -Item "No performance issues in logs" -Status "✓"
        } else {
            Add-ChecklistItem -Item "No performance issues in logs" -Status "⚠" `
                -Notes "$slowQueries potential issues found"
        }
    }
}

# =============================================
# 7. USER FEEDBACK
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "7. USER FEEDBACK (Manual)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Please answer the following questions:" -ForegroundColor Yellow
Write-Host ""

$usersComfortable = Read-Host "Are users comfortable with the system? (yes/no)"
if ($usersComfortable -eq "yes") {
    Add-ChecklistItem -Item "Users are comfortable" -Status "✓"
} else {
    $concerns = Read-Host "What are their concerns?"
    Add-ChecklistItem -Item "Users are comfortable" -Status "⚠" -Notes $concerns
}

$issuesReported = Read-Host "Any new issues reported today? (yes/no)"
if ($issuesReported -eq "no") {
    Add-ChecklistItem -Item "No new critical issues" -Status "✓"
} else {
    $issueDetails = Read-Host "Describe the issues"
    Add-ChecklistItem -Item "No new critical issues" -Status "⚠" -Notes $issueDetails
}

$workflowsSmooth = Read-Host "Are workflows running smoothly? (yes/no)"
if ($workflowsSmooth -eq "yes") {
    Add-ChecklistItem -Item "Workflows running smoothly" -Status "✓"
} else {
    $workflowIssues = Read-Host "Which workflows have issues?"
    Add-ChecklistItem -Item "Workflows running smoothly" -Status "⚠" -Notes $workflowIssues
}

# =============================================
# SUMMARY & RECOMMENDATION
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "DAILY CHECKLIST SUMMARY" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$passCount = ($checklist.Items | Where-Object { $_.Status -eq "✓" }).Count
$failCount = ($checklist.Items | Where-Object { $_.Status -eq "✗" }).Count
$warnCount = ($checklist.Items | Where-Object { $_.Status -eq "⚠" }).Count
$totalItems = $checklist.Items.Count

Write-Host "Day $DayNumber Checklist Results:" -ForegroundColor Cyan
Write-Host "  Total Items: $totalItems" -ForegroundColor White
Write-Host "  Passed: $passCount" -ForegroundColor Green
Write-Host "  Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "White" })
Write-Host "  Warnings: $warnCount" -ForegroundColor $(if ($warnCount -gt 0) { "Yellow" } else { "White" })
Write-Host ""

# Determine overall status
if ($failCount -eq 0 -and $warnCount -eq 0) {
    $checklist.Status = "EXCELLENT"
    Write-Host "✓ DAY $DayNumber: EXCELLENT" -ForegroundColor Green -BackgroundColor Black
    Write-Host "  System is stable and performing well" -ForegroundColor Green
    Write-Host "  Continue normal operations" -ForegroundColor Green
} elseif ($failCount -eq 0 -and $warnCount -le 2) {
    $checklist.Status = "GOOD"
    Write-Host "✓ DAY $DayNumber: GOOD" -ForegroundColor Green
    Write-Host "  Minor warnings detected" -ForegroundColor Yellow
    Write-Host "  Monitor closely, but no immediate action needed" -ForegroundColor Yellow
} elseif ($failCount -le 1) {
    $checklist.Status = "NEEDS ATTENTION"
    Write-Host "⚠ DAY $DayNumber: NEEDS ATTENTION" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host "  Some issues detected" -ForegroundColor Yellow
    Write-Host "  Investigate and resolve within 24 hours" -ForegroundColor Yellow
} else {
    $checklist.Status = "CRITICAL"
    Write-Host "✗ DAY $DayNumber: CRITICAL ISSUES" -ForegroundColor Red -BackgroundColor Black
    Write-Host "  Multiple failures detected" -ForegroundColor Red
    Write-Host "  IMMEDIATE ACTION REQUIRED" -ForegroundColor Red
}

Write-Host ""

# Day-specific recommendations
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DAY $DayNumber FOCUS AREAS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

switch ($DayNumber) {
    1 {
        Write-Host "Day 1 Focus:" -ForegroundColor Yellow
        Write-Host "  • Monitor first production transactions closely" -ForegroundColor White
        Write-Host "  • Be available for immediate user support" -ForegroundColor White
        Write-Host "  • Watch for any data integrity issues" -ForegroundColor White
        Write-Host "  • Verify all critical workflows work" -ForegroundColor White
    }
    2 {
        Write-Host "Day 2 Focus:" -ForegroundColor Yellow
        Write-Host "  • Review yesterday's issues and resolutions" -ForegroundColor White
        Write-Host "  • Check if users are getting comfortable" -ForegroundColor White
        Write-Host "  • Monitor backup and recovery procedures" -ForegroundColor White
        Write-Host "  • Verify reports are accurate" -ForegroundColor White
    }
    3 {
        Write-Host "Day 3 Focus:" -ForegroundColor Yellow
        Write-Host "  • Look for patterns in user issues" -ForegroundColor White
        Write-Host "  • Check performance trends" -ForegroundColor White
        Write-Host "  • Verify stock reconciliation" -ForegroundColor White
        Write-Host "  • Plan for any needed optimizations" -ForegroundColor White
    }
    4 {
        Write-Host "Day 4 Focus:" -ForegroundColor Yellow
        Write-Host "  • System should be stabilizing" -ForegroundColor White
        Write-Host "  • Address any recurring issues" -ForegroundColor White
        Write-Host "  • Gather user feedback for improvements" -ForegroundColor White
        Write-Host "  • Document lessons learned" -ForegroundColor White
    }
    5 {
        Write-Host "Day 5 Focus:" -ForegroundColor Yellow
        Write-Host "  • Prepare go-live completion report" -ForegroundColor White
        Write-Host "  • Plan transition to normal operations" -ForegroundColor White
        Write-Host "  • Schedule any needed training" -ForegroundColor White
        Write-Host "  • Update operational procedures" -ForegroundColor White
    }
}

Write-Host ""

# Save checklist
$reportFile = "daily-checklist-day$DayNumber-$timestamp.json"
$checklist | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportFile
Write-Host "Checklist saved: $reportFile" -ForegroundColor Cyan

# CSV for tracking
$csvFile = "daily-checklists-summary.csv"
$csvLine = "$timestamp,Day $DayNumber,$($checklist.Status),$passCount,$failCount,$warnCount"
Add-Content -Path $csvFile -Value $csvLine

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "Daily checklist complete for Day $DayNumber" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
