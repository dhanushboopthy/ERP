# =============================================
# PHASE-2 READINESS ASSESSMENT
# Certify system stability for next phase
# =============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ConnectionString = "",
    
    [Parameter(Mandatory=$false)]
    [int]$DaysSinceGoLive = 0
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                                                                ║" -ForegroundColor Magenta
Write-Host "║            PHASE-2 READINESS ASSESSMENT                        ║" -ForegroundColor Magenta
Write-Host "║         Production Stability Certification                     ║" -ForegroundColor Magenta
Write-Host "║                                                                ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "Assessment Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host ""

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
        Write-Host "⚠ Cannot determine go-live date" -ForegroundColor Yellow
        $DaysSinceGoLive = Read-Host "Enter days since go-live"
    }
}

Write-Host "Days Since Go-Live: $DaysSinceGoLive days" -ForegroundColor Cyan
Write-Host "Required Stabilization: 14 days minimum" -ForegroundColor Gray
Write-Host ""

# Assessment results
$assessment = @{
    AssessmentDate = Get-Date
    DaysSinceGoLive = $DaysSinceGoLive
    Criteria = @()
    Score = 0
    MaxScore = 100
    Verdict = "UNKNOWN"
    BlockingIssues = @()
    Recommendations = @()
}

function Add-Criterion {
    param(
        [string]$Category,
        [string]$Criterion,
        [string]$Status,
        [string]$Evidence,
        [int]$Points,
        [bool]$Blocking = $false
    )
    
    $result = @{
        Category = $Category
        Criterion = $Criterion
        Status = $Status
        Evidence = $Evidence
        Points = $Points
        Blocking = $Blocking
    }
    
    $assessment.Criteria += $result
    
    if ($Status -eq "PASS") {
        $assessment.Score += $Points
    } elseif ($Status -eq "FAIL" -and $Blocking) {
        $assessment.BlockingIssues += $result
    }
    
    $color = switch ($Status) {
        "PASS" { "Green" }
        "FAIL" { if ($Blocking) { "Red" } else { "Yellow" } }
        default { "White" }
    }
    
    $icon = switch ($Status) {
        "PASS" { "✓" }
        "FAIL" { "✗" }
        default { "•" }
    }
    
    $blockingTag = if ($Blocking) { " [BLOCKING]" } else { "" }
    
    Write-Host "  $icon $Criterion`: " -NoNewline -ForegroundColor $color
    Write-Host "$Evidence$blockingTag" -ForegroundColor $color
}

# =============================================
# CRITERION 1: STABILIZATION PERIOD (15 pts)
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CRITERION 1: STABILIZATION PERIOD COMPLETE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($DaysSinceGoLive -ge 14) {
    Add-Criterion -Category "Time" -Criterion "14-Day Stabilization" -Status "PASS" `
        -Evidence "$DaysSinceGoLive days completed" -Points 15 -Blocking $true
} else {
    Add-Criterion -Category "Time" -Criterion "14-Day Stabilization" -Status "FAIL" `
        -Evidence "Only $DaysSinceGoLive days (need 14)" -Points 0 -Blocking $true
}

Write-Host ""

# =============================================
# CRITERION 2: ISSUE RESOLUTION (25 pts)
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CRITERION 2: ISSUE RESOLUTION STATUS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$issueLogFile = "production-issues-log.csv"
if (Test-Path $issueLogFile) {
    try {
        $issues = Import-Csv -Path $issueLogFile
        
        $p1Issues = $issues | Where-Object { $_.Severity -match "P1|Critical" }
        $p2Issues = $issues | Where-Object { $_.Severity -match "P2|High" }
        
        # P1 Issues
        if ($p1Issues.Count -eq 0) {
            Add-Criterion -Category "Issues" -Criterion "No P1 Issues" -Status "PASS" `
                -Evidence "Zero critical issues logged" -Points 10 -Blocking $false
        } else {
            $unresolvedP1 = $p1Issues | Where-Object { $_.Status -notmatch "Resolved|Closed" }
            if ($unresolvedP1.Count -eq 0) {
                Add-Criterion -Category "Issues" -Criterion "All P1 Resolved" -Status "PASS" `
                    -Evidence "$($p1Issues.Count) critical issues, all resolved" -Points 10 -Blocking $true
            } else {
                Add-Criterion -Category "Issues" -Criterion "All P1 Resolved" -Status "FAIL" `
                    -Evidence "$($unresolvedP1.Count) P1 issues UNRESOLVED!" -Points 0 -Blocking $true
            }
        }
        
        # P2 Issues
        if ($p2Issues.Count -eq 0) {
            Add-Criterion -Category "Issues" -Criterion "No P2 Issues" -Status "PASS" `
                -Evidence "Zero high-priority issues" -Points 10 -Blocking $false
        } else {
            $unresolvedP2 = $p2Issues | Where-Object { $_.Status -notmatch "Resolved|Closed" }
            $p2ResolutionRate = if ($p2Issues.Count -gt 0) { (($p2Issues.Count - $unresolvedP2.Count) / $p2Issues.Count) * 100 } else { 0 }
            
            if ($p2ResolutionRate -ge 90) {
                Add-Criterion -Category "Issues" -Criterion "P2 Resolution Rate" -Status "PASS" `
                    -Evidence "$([Math]::Round($p2ResolutionRate, 1))% resolved" -Points 10 -Blocking $true
            } elseif ($p2ResolutionRate -ge 75) {
                Add-Criterion -Category "Issues" -Criterion "P2 Resolution Rate" -Status "PASS" `
                    -Evidence "$([Math]::Round($p2ResolutionRate, 1))% resolved (acceptable)" -Points 5 -Blocking $false
            } else {
                Add-Criterion -Category "Issues" -Criterion "P2 Resolution Rate" -Status "FAIL" `
                    -Evidence "$([Math]::Round($p2ResolutionRate, 1))% resolved (too low)" -Points 0 -Blocking $true
            }
        }
        
        # Overall issue volume
        $totalIssues = $issues.Count
        if ($totalIssues -le 20) {
            Add-Criterion -Category "Issues" -Criterion "Total Issue Volume" -Status "PASS" `
                -Evidence "$totalIssues total issues (low)" -Points 5 -Blocking $false
        } elseif ($totalIssues -le 50) {
            Add-Criterion -Category "Issues" -Criterion "Total Issue Volume" -Status "PASS" `
                -Evidence "$totalIssues total issues (moderate)" -Points 3 -Blocking $false
        } else {
            Add-Criterion -Category "Issues" -Criterion "Total Issue Volume" -Status "FAIL" `
                -Evidence "$totalIssues total issues (high)" -Points 0 -Blocking $false
        }
        
    } catch {
        Add-Criterion -Category "Issues" -Criterion "Issue Log Analysis" -Status "FAIL" `
            -Evidence "Cannot analyze issue log" -Points 0 -Blocking $false
    }
} else {
    Write-Host "⚠ No issue log found. Assuming zero issues (good)" -ForegroundColor Yellow
    Add-Criterion -Category "Issues" -Criterion "Issue Log" -Status "PASS" `
        -Evidence "No issues logged (system stable)" -Points 25 -Blocking $false
}

Write-Host ""

# =============================================
# CRITERION 3: DATA INTEGRITY (20 pts)
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CRITERION 3: DATA INTEGRITY VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # Zero negative stock
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT COUNT(*) FROM YarnStocks WHERE CurrentBalanceKg < 0"
        $negCount = $cmd.ExecuteScalar()
        
        if ($negCount -eq 0) {
            Add-Criterion -Category "Data" -Criterion "Zero Negative Stock" -Status "PASS" `
                -Evidence "No negative stock violations" -Points 10 -Blocking $true
        } else {
            Add-Criterion -Category "Data" -Criterion "Zero Negative Stock" -Status "FAIL" `
                -Evidence "$negCount negative stock items!" -Points 0 -Blocking $true
        }
        
        # Stock reconciliation
        $cmd.CommandText = @"
SELECT ABS(
    (SELECT ISNULL(SUM(NetWeightKg), 0) FROM YarnReceipts WHERE IsActive = 1) -
    (SELECT ISNULL(SUM(NetWeightKg), 0) FROM Beams WHERE IsActive = 1) -
    (SELECT ISNULL(SUM(CurrentBalanceKg), 0) FROM YarnStocks)
) AS Variance
"@
        $variance = $cmd.ExecuteScalar()
        
        if ($variance -lt 0.1) {
            Add-Criterion -Category "Data" -Criterion "Stock Reconciliation" -Status "PASS" `
                -Evidence "Variance: $([Math]::Round($variance, 4)) kg" -Points 10 -Blocking $true
        } else {
            Add-Criterion -Category "Data" -Criterion "Stock Reconciliation" -Status "FAIL" `
                -Evidence "Variance: $([Math]::Round($variance, 4)) kg (too high)" -Points 0 -Blocking $true
        }
        
        $conn.Close()
    } catch {
        Add-Criterion -Category "Data" -Criterion "Data Integrity" -Status "FAIL" `
            -Evidence "Cannot verify: $_" -Points 0 -Blocking $true
    }
}

Write-Host ""

# =============================================
# CRITERION 4: SYSTEM STABILITY (15 pts)
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CRITERION 4: SYSTEM STABILITY METRICS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check stability reports
$stabilityReports = Get-ChildItem -Filter "stability-report-*.json" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 7

if ($stabilityReports.Count -ge 5) {
    $recentScores = @()
    foreach ($report in $stabilityReports | Select-Object -First 7) {
        $data = Get-Content $report.FullName -Raw | ConvertFrom-Json
        $recentScores += $data.StabilityScore
    }
    
    $avgScore = ($recentScores | Measure-Object -Average).Average
    $minScore = ($recentScores | Measure-Object -Minimum).Minimum
    
    if ($avgScore -ge 90 -and $minScore -ge 85) {
        Add-Criterion -Category "Stability" -Criterion "Stability Score Trend" -Status "PASS" `
            -Evidence "Avg: $([Math]::Round($avgScore, 1))/100, Min: $minScore/100" -Points 15 -Blocking $false
    } elseif ($avgScore -ge 80 -and $minScore -ge 70) {
        Add-Criterion -Category "Stability" -Criterion "Stability Score Trend" -Status "PASS" `
            -Evidence "Avg: $([Math]::Round($avgScore, 1))/100 (acceptable)" -Points 10 -Blocking $false
    } else {
        Add-Criterion -Category "Stability" -Criterion "Stability Score Trend" -Status "FAIL" `
            -Evidence "Avg: $([Math]::Round($avgScore, 1))/100 (too low)" -Points 0 -Blocking $false
    }
} else {
    Write-Host "⚠ Insufficient stability reports (need 5+)" -ForegroundColor Yellow
    Add-Criterion -Category "Stability" -Criterion "Stability History" -Status "FAIL" `
        -Evidence "Only $($stabilityReports.Count) reports available" -Points 0 -Blocking $false
}

Write-Host ""

# =============================================
# CRITERION 5: BACKUP & RECOVERY (10 pts)
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CRITERION 5: BACKUP & RECOVERY READINESS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
SELECT 
    COUNT(*) AS BackupCount,
    MIN(DATEDIFF(HOUR, backup_finish_date, GETDATE())) AS OldestBackupHours
FROM msdb.dbo.backupset
WHERE database_name = DB_NAME()
    AND type = 'D'
    AND backup_finish_date >= DATEADD(DAY, -14, GETDATE())
"@
        $reader = $cmd.ExecuteReader()
        if ($reader.Read()) {
            $backupCount = $reader["BackupCount"]
            $oldestHours = if ($reader["OldestBackupHours"] -is [DBNull]) { 999 } else { $reader["OldestBackupHours"] }
            
            if ($backupCount -ge 14 -and $oldestHours -le 24) {
                Add-Criterion -Category "Backup" -Criterion "Backup Consistency" -Status "PASS" `
                    -Evidence "$backupCount backups in 14 days" -Points 10 -Blocking $false
            } elseif ($backupCount -ge 10) {
                Add-Criterion -Category "Backup" -Criterion "Backup Consistency" -Status "PASS" `
                    -Evidence "$backupCount backups (acceptable)" -Points 5 -Blocking $false
            } else {
                Add-Criterion -Category "Backup" -Criterion "Backup Consistency" -Status "FAIL" `
                    -Evidence "Only $backupCount backups in 14 days" -Points 0 -Blocking $false
            }
        }
        $reader.Close()
        $conn.Close()
    } catch {
        Add-Criterion -Category "Backup" -Criterion "Backup Verification" -Status "FAIL" `
            -Evidence "Cannot verify backups" -Points 0 -Blocking $false
    }
}

Write-Host ""

# =============================================
# CRITERION 6: USER ADOPTION (10 pts)
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CRITERION 6: USER ADOPTION & CONFIDENCE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not [string]::IsNullOrEmpty($ConnectionString)) {
    try {
        $conn = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
        $conn.Open()
        
        # Active users
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = @"
SELECT 
    (SELECT COUNT(*) FROM Users WHERE IsActive = 1) AS TotalUsers,
    (SELECT COUNT(DISTINCT UserId) FROM AuditLogs WHERE CreatedDate >= DATEADD(DAY, -7, GETDATE())) AS ActiveUsers
"@
        $reader = $cmd.ExecuteReader()
        if ($reader.Read()) {
            $totalUsers = $reader["TotalUsers"]
            $activeUsers = $reader["ActiveUsers"]
            
            $adoptionRate = if ($totalUsers -gt 0) { ($activeUsers / $totalUsers) * 100 } else { 0 }
            
            if ($adoptionRate -ge 80) {
                Add-Criterion -Category "Users" -Criterion "User Adoption Rate" -Status "PASS" `
                    -Evidence "$([Math]::Round($adoptionRate, 1))% ($activeUsers/$totalUsers active)" -Points 10 -Blocking $false
            } elseif ($adoptionRate -ge 60) {
                Add-Criterion -Category "Users" -Criterion "User Adoption Rate" -Status "PASS" `
                    -Evidence "$([Math]::Round($adoptionRate, 1))% (acceptable)" -Points 5 -Blocking $false
            } else {
                Add-Criterion -Category "Users" -Criterion "User Adoption Rate" -Status "FAIL" `
                    -Evidence "$([Math]::Round($adoptionRate, 1))% (too low)" -Points 0 -Blocking $false
            }
        }
        $reader.Close()
        $conn.Close()
    } catch {
        Add-Criterion -Category "Users" -Criterion "User Adoption" -Status "FAIL" `
            -Evidence "Cannot measure adoption" -Points 0 -Blocking $false
    }
}

Write-Host ""

# =============================================
# CRITERION 7: PERFORMANCE BASELINE (5 pts)
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "CRITERION 7: PERFORMANCE BASELINE ESTABLISHED" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baselineFile = "performance-baseline.json"
if (Test-Path $baselineFile) {
    Add-Criterion -Category "Performance" -Criterion "Baseline Established" -Status "PASS" `
        -Evidence "Baseline documented" -Points 5 -Blocking $false
} else {
    Add-Criterion -Category "Performance" -Criterion "Baseline Established" -Status "FAIL" `
        -Evidence "No baseline documented" -Points 0 -Blocking $false
    $assessment.Recommendations += "Establish performance baseline using measure-performance.ps1 -EstablishBaseline"
}

Write-Host ""

# =============================================
# FINAL VERDICT
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "PHASE-2 READINESS ASSESSMENT" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$scorePercent = [Math]::Round(($assessment.Score / $assessment.MaxScore) * 100, 1)

Write-Host "Overall Score: $($assessment.Score) / $($assessment.MaxScore) ($scorePercent%)" -ForegroundColor Cyan
Write-Host ""

$passCount = ($assessment.Criteria | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($assessment.Criteria | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCriteria = $assessment.Criteria.Count

Write-Host "Criteria Results:" -ForegroundColor White
Write-Host "  Passed: $passCount / $totalCriteria" -ForegroundColor Green
Write-Host "  Failed: $failCount / $totalCriteria" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "White" })
Write-Host ""

# Check for blocking issues
if ($assessment.BlockingIssues.Count -gt 0) {
    $assessment.Verdict = "NOT READY - BLOCKING ISSUES"
    Write-Host "✗ VERDICT: NOT READY FOR PHASE-2" -ForegroundColor Red -BackgroundColor Black
    Write-Host ""
    Write-Host "BLOCKING ISSUES:" -ForegroundColor Red
    foreach ($issue in $assessment.BlockingIssues) {
        Write-Host "  ✗ $($issue.Criterion): $($issue.Evidence)" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "REQUIRED ACTIONS:" -ForegroundColor Yellow
    Write-Host "  1. Resolve ALL blocking issues above" -ForegroundColor White
    Write-Host "  2. Re-run this assessment" -ForegroundColor White
    Write-Host "  3. DO NOT proceed with Phase-2 development" -ForegroundColor White
    Write-Host ""
} elseif ($scorePercent -ge 90) {
    $assessment.Verdict = "READY - EXCELLENT"
    Write-Host "✓ VERDICT: READY FOR PHASE-2 (EXCELLENT)" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "System has demonstrated:" -ForegroundColor Green
    Write-Host "  ✓ Stable operations for 14+ days" -ForegroundColor White
    Write-Host "  ✓ Zero data corruption" -ForegroundColor White
    Write-Host "  ✓ Reliable backups" -ForegroundColor White
    Write-Host "  ✓ User confidence" -ForegroundColor White
    Write-Host "  ✓ Predictable performance" -ForegroundColor White
    Write-Host ""
    Write-Host "PHASE-2 DEVELOPMENT CAN COMMENCE" -ForegroundColor Green
    Write-Host ""
} elseif ($scorePercent -ge 75) {
    $assessment.Verdict = "READY - CONDITIONAL"
    Write-Host "✓ VERDICT: READY FOR PHASE-2 (CONDITIONAL)" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host ""
    Write-Host "System is stable enough for Phase-2, but:" -ForegroundColor Yellow
    Write-Host "  • Address minor issues during Phase-2" -ForegroundColor White
    Write-Host "  • Maintain enhanced monitoring" -ForegroundColor White
    Write-Host "  • Limit Phase-2 scope initially" -ForegroundColor White
    Write-Host ""
    Write-Host "PROCEED WITH CAUTION" -ForegroundColor Yellow
    Write-Host ""
} else {
    $assessment.Verdict = "NOT READY - LOW SCORE"
    Write-Host "✗ VERDICT: NOT READY FOR PHASE-2" -ForegroundColor Red -BackgroundColor Black
    Write-Host ""
    Write-Host "Score too low for Phase-2 readiness" -ForegroundColor Red
    Write-Host "  • Continue stabilization efforts" -ForegroundColor White
    Write-Host "  • Address identified issues" -ForegroundColor White
    Write-Host "  • Re-assess in 1 week" -ForegroundColor White
    Write-Host ""
}

# =============================================
# RECOMMENDATIONS
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($assessment.Recommendations.Count -gt 0) {
    $i = 1
    foreach ($rec in $assessment.Recommendations) {
        Write-Host "  $i. $rec" -ForegroundColor Yellow
        $i++
    }
    Write-Host ""
}

if ($assessment.Verdict -match "READY") {
    Write-Host "Phase-2 Development Guidelines:" -ForegroundColor Cyan
    Write-Host "  1. Start with Category A (Safe Enhancements)" -ForegroundColor White
    Write-Host "  2. NO schema changes for first 30 days" -ForegroundColor White
    Write-Host "  3. Test all changes in development first" -ForegroundColor White
    Write-Host "  4. Deploy during off-hours only" -ForegroundColor White
    Write-Host "  5. Maintain daily monitoring" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "Before Phase-2 Can Start:" -ForegroundColor Yellow
    Write-Host "  1. Achieve 90+ stability score for 3 consecutive days" -ForegroundColor White
    Write-Host "  2. Resolve all P1 and P2 issues" -ForegroundColor White
    Write-Host "  3. Verify data integrity is perfect" -ForegroundColor White
    Write-Host "  4. Get business sign-off on stability" -ForegroundColor White
    Write-Host ""
}

# =============================================
# SAVE ASSESSMENT
# =============================================
$assessmentFile = "phase2-readiness-$timestamp.json"
$assessment | ConvertTo-Json -Depth 10 | Out-File -FilePath $assessmentFile

Write-Host "Assessment saved: $assessmentFile" -ForegroundColor Cyan
Write-Host ""

# Create certification if ready
if ($assessment.Verdict -match "READY") {
    $certFile = "PHASE2_READINESS_CERTIFICATION.md"
    $cert = @"
# PHASE-2 READINESS CERTIFICATION

**Certification Date**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Days Since Go-Live**: $DaysSinceGoLive days  
**Assessment Score**: $($assessment.Score) / $($assessment.MaxScore) ($scorePercent%)

---

## CERTIFICATION STATEMENT

This is to certify that the **Sudhan Textile ERP** system has successfully completed the 14-day stabilization period and has demonstrated:

✓ **Operational Stability**: System has run without critical failures  
✓ **Data Integrity**: Zero data corruption, negative stock violations, or reconciliation errors  
✓ **User Adoption**: Users are actively using the system with confidence  
✓ **Backup & Recovery**: Consistent daily backups with verified recovery capability  
✓ **Performance Baseline**: Documented performance targets and capacity planning  

---

## ASSESSMENT RESULTS

| Criterion | Status | Evidence |
|-----------|--------|----------|
$(foreach ($c in $assessment.Criteria) { "| $($c.Criterion) | $($c.Status) | $($c.Evidence) |`n" })

---

## VERDICT

**$($assessment.Verdict)**

The system is CERTIFIED READY for Phase-2 development with the following conditions:

1. Maintain daily stability monitoring
2. No schema changes for first 30 days of Phase-2
3. All Phase-2 deployments must be tested in development
4. Deploy during off-hours with rollback plan
5. Continue weekly issue trend analysis

---

## PHASE-2 AUTHORIZATION

**Technical Lead**: ________________  
**Signature**: ________________  
**Date**: $(Get-Date -Format 'yyyy-MM-dd')

**Business Owner**: ________________  
**Signature**: ________________  
**Date**: $(Get-Date -Format 'yyyy-MM-dd')

**Executive Sponsor**: ________________  
**Signature**: ________________  
**Date**: $(Get-Date -Format 'yyyy-MM-dd')

---

**This certification is valid for 90 days from issue date.**
**Re-certification required if major incidents occur.**
"@
    
    $cert | Out-File -FilePath $certFile
    Write-Host "✓ Certification created: $certFile" -ForegroundColor Green
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""

# Exit code
if ($assessment.BlockingIssues.Count -gt 0) {
    exit 1
} else {
    exit 0
}
