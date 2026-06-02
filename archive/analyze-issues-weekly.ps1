# =============================================
# WEEKLY ISSUE TREND ANALYSIS
# Root cause analysis and pattern detection
# =============================================

param(
    [Parameter(Mandatory=$false)]
    [int]$WeekNumber = 1,
    
    [Parameter(Mandatory=$false)]
    [string]$IssueLogFile = "production-issues-log.csv"
)

$ErrorActionPreference = "Continue"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║                                                                ║" -ForegroundColor Yellow
Write-Host "║           WEEKLY ISSUE TREND ANALYSIS                          ║" -ForegroundColor Yellow
Write-Host "║         Root Cause & Pattern Detection                         ║" -ForegroundColor Yellow
Write-Host "║                                                                ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""
Write-Host "Analysis Date: $(Get-Date -Format 'yyyy-MM-dd')" -ForegroundColor White
Write-Host "Week Number: $WeekNumber" -ForegroundColor Cyan
Write-Host ""

# Initialize analysis results
$analysis = @{
    Week = $WeekNumber
    AnalysisDate = Get-Date
    Issues = @()
    Summary = @{
        Total = 0
        ByPriority = @{ P1 = 0; P2 = 0; P3 = 0; P4 = 0 }
        ByCategory = @{}
        ByRootCause = @{ Training = 0; Process = 0; Configuration = 0; Code = 0; Unknown = 0 }
        Resolved = 0
        Pending = 0
    }
    Trends = @{
        MostCommonIssue = ""
        MostAffectedModule = ""
        PeakDay = ""
        RecurringIssues = @()
    }
    Recommendations = @()
}

# Check if issue log exists
if (-not (Test-Path $IssueLogFile)) {
    Write-Host "⚠ Issue log file not found: $IssueLogFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Creating template issue log file..." -ForegroundColor Cyan
    
    # Create template
    $template = @"
Timestamp,IssueID,ReportedBy,Severity,Module,Description,Status,AssignedTo,Resolution,RootCause,Category
"@
    $template | Out-File -FilePath $IssueLogFile
    
    Write-Host "✓ Template created: $IssueLogFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "Please log issues using this format:" -ForegroundColor Cyan
    Write-Host "  Severity: P1 (Critical), P2 (High), P3 (Medium), P4 (Low)" -ForegroundColor White
    Write-Host "  Status: Open, In Progress, Resolved, Closed" -ForegroundColor White
    Write-Host "  RootCause: Training, Process, Configuration, Code" -ForegroundColor White
    Write-Host "  Category: Login, Transaction, Report, Performance, etc." -ForegroundColor White
    Write-Host ""
    exit 0
}

# Load issues from CSV
Write-Host "Loading issues from: $IssueLogFile" -ForegroundColor Cyan

try {
    $issues = Import-Csv -Path $IssueLogFile
    
    if ($issues.Count -eq 0) {
        Write-Host "⚠ No issues logged yet" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "This is GOOD if system is stable!" -ForegroundColor Green
        Write-Host "Or issues may not be logged properly." -ForegroundColor Yellow
        Write-Host ""
        exit 0
    }
    
    Write-Host "✓ Loaded $($issues.Count) total issues" -ForegroundColor Green
    Write-Host ""
    
    # Filter for this week (last 7 days by default)
    $weekStart = (Get-Date).AddDays(-7)
    $weekIssues = $issues | Where-Object { 
        try {
            $issueDate = [DateTime]::Parse($_.Timestamp)
            $issueDate -ge $weekStart
        } catch {
            $false
        }
    }
    
    Write-Host "Issues this week (last 7 days): $($weekIssues.Count)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($weekIssues.Count -eq 0) {
        Write-Host "✓ No issues this week - System is stable!" -ForegroundColor Green
        Write-Host ""
        exit 0
    }
    
    $analysis.Issues = $weekIssues
    $analysis.Summary.Total = $weekIssues.Count
    
} catch {
    Write-Host "✗ Error loading issues: $_" -ForegroundColor Red
    exit 1
}

# =============================================
# 1. PRIORITY DISTRIBUTION
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "1. PRIORITY DISTRIBUTION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

foreach ($issue in $weekIssues) {
    $severity = $issue.Severity
    if ($severity -match "P1|Critical") {
        $analysis.Summary.ByPriority.P1++
    } elseif ($severity -match "P2|High") {
        $analysis.Summary.ByPriority.P2++
    } elseif ($severity -match "P3|Medium") {
        $analysis.Summary.ByPriority.P3++
    } elseif ($severity -match "P4|Low") {
        $analysis.Summary.ByPriority.P4++
    }
}

Write-Host "  P1 (Critical): $($analysis.Summary.ByPriority.P1)" -ForegroundColor $(if ($analysis.Summary.ByPriority.P1 -gt 0) { "Red" } else { "Green" })
Write-Host "  P2 (High):     $($analysis.Summary.ByPriority.P2)" -ForegroundColor $(if ($analysis.Summary.ByPriority.P2 -gt 3) { "Yellow" } else { "White" })
Write-Host "  P3 (Medium):   $($analysis.Summary.ByPriority.P3)" -ForegroundColor White
Write-Host "  P4 (Low):      $($analysis.Summary.ByPriority.P4)" -ForegroundColor Gray
Write-Host ""

if ($analysis.Summary.ByPriority.P1 -gt 0) {
    Write-Host "⚠ CRITICAL: $($analysis.Summary.ByPriority.P1) P1 issues this week!" -ForegroundColor Red
    Write-Host "  All P1 issues must be resolved before Phase-2" -ForegroundColor Yellow
    Write-Host ""
}

# =============================================
# 2. CATEGORY BREAKDOWN
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "2. CATEGORY BREAKDOWN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$categoryGroups = $weekIssues | Group-Object -Property Category
foreach ($group in $categoryGroups) {
    $categoryName = if ([string]::IsNullOrEmpty($group.Name)) { "Uncategorized" } else { $group.Name }
    $analysis.Summary.ByCategory[$categoryName] = $group.Count
    Write-Host "  $categoryName`: $($group.Count) issues" -ForegroundColor White
}

Write-Host ""

$topCategory = ($analysis.Summary.ByCategory.GetEnumerator() | Sort-Object -Property Value -Descending | Select-Object -First 1)
if ($topCategory) {
    $analysis.Trends.MostAffectedModule = $topCategory.Key
    Write-Host "Most Affected Area: $($topCategory.Key) ($($topCategory.Value) issues)" -ForegroundColor Yellow
    Write-Host ""
}

# =============================================
# 3. ROOT CAUSE ANALYSIS
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "3. ROOT CAUSE ANALYSIS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

foreach ($issue in $weekIssues) {
    $rootCause = $issue.RootCause
    if ($rootCause -match "Training|User Error") {
        $analysis.Summary.ByRootCause.Training++
    } elseif ($rootCause -match "Process|Workflow") {
        $analysis.Summary.ByRootCause.Process++
    } elseif ($rootCause -match "Config|Setting") {
        $analysis.Summary.ByRootCause.Configuration++
    } elseif ($rootCause -match "Code|Bug|System") {
        $analysis.Summary.ByRootCause.Code++
    } else {
        $analysis.Summary.ByRootCause.Unknown++
    }
}

Write-Host "  Training Issues:      $($analysis.Summary.ByRootCause.Training)" -ForegroundColor White
Write-Host "  Process Issues:       $($analysis.Summary.ByRootCause.Process)" -ForegroundColor White
Write-Host "  Configuration Issues: $($analysis.Summary.ByRootCause.Configuration)" -ForegroundColor White
Write-Host "  Code Issues:          $($analysis.Summary.ByRootCause.Code)" -ForegroundColor $(if ($analysis.Summary.ByRootCause.Code -gt 0) { "Yellow" } else { "White" })
Write-Host "  Unknown/Not Set:      $($analysis.Summary.ByRootCause.Unknown)" -ForegroundColor Gray
Write-Host ""

# Root cause recommendations
if ($analysis.Summary.ByRootCause.Training -gt $analysis.Summary.Total * 0.4) {
    $analysis.Recommendations += "High training-related issues ($($analysis.Summary.ByRootCause.Training)). Schedule additional user training sessions."
    Write-Host "⚠ Recommendation: Schedule additional user training" -ForegroundColor Yellow
    Write-Host "  $($analysis.Summary.ByRootCause.Training) issues are training-related" -ForegroundColor White
    Write-Host ""
}

if ($analysis.Summary.ByRootCause.Process -gt $analysis.Summary.Total * 0.3) {
    $analysis.Recommendations += "Multiple process issues ($($analysis.Summary.ByRootCause.Process)). Review and update business workflows."
    Write-Host "⚠ Recommendation: Review business processes" -ForegroundColor Yellow
    Write-Host "  $($analysis.Summary.ByRootCause.Process) issues indicate process gaps" -ForegroundColor White
    Write-Host ""
}

if ($analysis.Summary.ByRootCause.Code -gt 0) {
    $analysis.Recommendations += "Code issues found ($($analysis.Summary.ByRootCause.Code)). Prioritize bug fixes before Phase-2."
    Write-Host "⚠ Recommendation: Fix code issues before Phase-2" -ForegroundColor Yellow
    Write-Host "  $($analysis.Summary.ByRootCause.Code) bugs detected" -ForegroundColor White
    Write-Host ""
}

if ($analysis.Summary.ByRootCause.Unknown -gt $analysis.Summary.Total * 0.3) {
    $analysis.Recommendations += "Many issues without root cause ($($analysis.Summary.ByRootCause.Unknown)). Improve issue logging discipline."
    Write-Host "⚠ Recommendation: Improve issue documentation" -ForegroundColor Yellow
    Write-Host "  $($analysis.Summary.ByRootCause.Unknown) issues lack root cause analysis" -ForegroundColor White
    Write-Host ""
}

# =============================================
# 4. RESOLUTION STATUS
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "4. RESOLUTION STATUS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$resolved = $weekIssues | Where-Object { $_.Status -match "Resolved|Closed" }
$pending = $weekIssues | Where-Object { $_.Status -match "Open|In Progress" }

$analysis.Summary.Resolved = $resolved.Count
$analysis.Summary.Pending = $pending.Count

$resolutionRate = if ($weekIssues.Count -gt 0) { [Math]::Round(($resolved.Count / $weekIssues.Count) * 100, 1) } else { 0 }

Write-Host "  Resolved: $($resolved.Count)" -ForegroundColor Green
Write-Host "  Pending:  $($pending.Count)" -ForegroundColor $(if ($pending.Count -gt 5) { "Yellow" } else { "White" })
Write-Host ""
Write-Host "  Resolution Rate: $resolutionRate%" -ForegroundColor $(if ($resolutionRate -ge 80) { "Green" } elseif ($resolutionRate -ge 60) { "Yellow" } else { "Red" })
Write-Host ""

if ($pending.Count -gt 0) {
    Write-Host "Pending Issues:" -ForegroundColor Cyan
    foreach ($issue in $pending | Select-Object -First 5) {
        $severity = $issue.Severity
        $color = if ($severity -match "P1|Critical") { "Red" } elseif ($severity -match "P2|High") { "Yellow" } else { "White" }
        Write-Host "  [$severity] $($issue.Description) (Assigned: $($issue.AssignedTo))" -ForegroundColor $color
    }
    if ($pending.Count -gt 5) {
        Write-Host "  ... and $($pending.Count - 5) more" -ForegroundColor Gray
    }
    Write-Host ""
}

# =============================================
# 5. RECURRING ISSUES
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "5. RECURRING ISSUE DETECTION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Look for similar descriptions
$descriptionGroups = $weekIssues | Group-Object -Property { 
    # Simple keyword extraction (first 3 words)
    $words = $_.Description -split '\s+' | Select-Object -First 3
    $words -join ' '
}

$recurring = $descriptionGroups | Where-Object { $_.Count -gt 1 } | Sort-Object -Property Count -Descending

if ($recurring.Count -gt 0) {
    Write-Host "Recurring Issues Detected:" -ForegroundColor Yellow
    foreach ($pattern in $recurring | Select-Object -First 5) {
        Write-Host "  $($pattern.Count)x: $($pattern.Name)..." -ForegroundColor White
        $analysis.Trends.RecurringIssues += "$($pattern.Count)x: $($pattern.Name)"
    }
    Write-Host ""
    $analysis.Recommendations += "Recurring issues detected. Investigate systemic root causes."
} else {
    Write-Host "✓ No obvious recurring patterns detected" -ForegroundColor Green
    Write-Host ""
}

# =============================================
# 6. DAILY DISTRIBUTION
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "6. DAILY DISTRIBUTION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$dailyGroups = $weekIssues | Group-Object -Property { 
    try {
        ([DateTime]::Parse($_.Timestamp)).ToString("yyyy-MM-dd")
    } catch {
        "Unknown"
    }
} | Sort-Object -Property Name

Write-Host "Issues per day:" -ForegroundColor White
foreach ($day in $dailyGroups) {
    $bar = "█" * $day.Count
    Write-Host "  $($day.Name): $bar ($($day.Count))" -ForegroundColor Cyan
}
Write-Host ""

$peakDay = $dailyGroups | Sort-Object -Property Count -Descending | Select-Object -First 1
if ($peakDay) {
    $analysis.Trends.PeakDay = "$($peakDay.Name) ($($peakDay.Count) issues)"
    Write-Host "Peak Issue Day: $($peakDay.Name) with $($peakDay.Count) issues" -ForegroundColor Yellow
    Write-Host ""
}

# =============================================
# 7. RESPONSE TIME ANALYSIS
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "7. RESPONSE TIME ANALYSIS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$p1Issues = $weekIssues | Where-Object { $_.Severity -match "P1|Critical" }
$p2Issues = $weekIssues | Where-Object { $_.Severity -match "P2|High" }

if ($p1Issues.Count -gt 0) {
    $p1Resolved = $p1Issues | Where-Object { $_.Status -match "Resolved|Closed" }
    $p1Rate = [Math]::Round(($p1Resolved.Count / $p1Issues.Count) * 100, 1)
    
    Write-Host "  P1 Issues:" -ForegroundColor Red
    Write-Host "    Total: $($p1Issues.Count)" -ForegroundColor White
    Write-Host "    Resolved: $($p1Resolved.Count) ($p1Rate%)" -ForegroundColor $(if ($p1Rate -eq 100) { "Green" } else { "Red" })
    
    if ($p1Rate -lt 100) {
        Write-Host "    ⚠ NOT ALL P1 ISSUES RESOLVED!" -ForegroundColor Red
        $analysis.Recommendations += "Critical P1 issues remain unresolved. These MUST be fixed before Phase-2."
    }
    Write-Host ""
}

if ($p2Issues.Count -gt 0) {
    $p2Resolved = $p2Issues | Where-Object { $_.Status -match "Resolved|Closed" }
    $p2Rate = [Math]::Round(($p2Resolved.Count / $p2Issues.Count) * 100, 1)
    
    Write-Host "  P2 Issues:" -ForegroundColor Yellow
    Write-Host "    Total: $($p2Issues.Count)" -ForegroundColor White
    Write-Host "    Resolved: $($p2Resolved.Count) ($p2Rate%)" -ForegroundColor $(if ($p2Rate -ge 80) { "Green" } elseif ($p2Rate -ge 60) { "Yellow" } else { "Red" })
    Write-Host ""
}

# =============================================
# WEEK SUMMARY & VERDICT
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "WEEK $WeekNumber SUMMARY" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "Total Issues: $($analysis.Summary.Total)" -ForegroundColor Cyan
Write-Host "Resolution Rate: $resolutionRate%" -ForegroundColor $(if ($resolutionRate -ge 80) { "Green" } else { "Yellow" })
Write-Host ""

# Determine week verdict
$verdict = "UNKNOWN"
if ($analysis.Summary.ByPriority.P1 -gt 0 -and $analysis.Summary.Resolved -lt $analysis.Summary.Total) {
    $verdict = "CRITICAL"
    Write-Host "⚠ VERDICT: CRITICAL ISSUES OUTSTANDING" -ForegroundColor Red -BackgroundColor Black
    Write-Host "  Unresolved P1 issues block Phase-2 readiness" -ForegroundColor Red
} elseif ($analysis.Summary.Total -eq 0) {
    $verdict = "EXCELLENT"
    Write-Host "✓ VERDICT: EXCELLENT - NO ISSUES THIS WEEK" -ForegroundColor Green -BackgroundColor Black
    Write-Host "  System is highly stable" -ForegroundColor Green
} elseif ($analysis.Summary.Total -le 5 -and $resolutionRate -ge 80) {
    $verdict = "GOOD"
    Write-Host "✓ VERDICT: GOOD STABILITY" -ForegroundColor Green
    Write-Host "  Low issue count with high resolution rate" -ForegroundColor Green
} elseif ($analysis.Summary.Total -le 10 -and $resolutionRate -ge 60) {
    $verdict = "ACCEPTABLE"
    Write-Host "✓ VERDICT: ACCEPTABLE" -ForegroundColor Yellow
    Write-Host "  Moderate issues, continue monitoring" -ForegroundColor Yellow
} else {
    $verdict = "NEEDS IMPROVEMENT"
    Write-Host "⚠ VERDICT: NEEDS IMPROVEMENT" -ForegroundColor Yellow -BackgroundColor Black
    Write-Host "  High issue volume or low resolution rate" -ForegroundColor Yellow
}

Write-Host ""

# =============================================
# RECOMMENDATIONS
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($analysis.Recommendations.Count -gt 0) {
    $i = 1
    foreach ($rec in $analysis.Recommendations) {
        Write-Host "  $i. $rec" -ForegroundColor Yellow
        $i++
    }
} else {
    Write-Host "✓ No specific recommendations. System is operating well." -ForegroundColor Green
}

Write-Host ""

# =============================================
# SAVE REPORT
# =============================================
$reportFile = "weekly-analysis-week$WeekNumber-$timestamp.json"
$analysis | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportFile

Write-Host "Analysis saved: $reportFile" -ForegroundColor Cyan

# Create summary CSV
$csvFile = "weekly-analysis-summary.csv"
if (-not (Test-Path $csvFile)) {
    Add-Content -Path $csvFile -Value "Week,Date,TotalIssues,P1,P2,P3,P4,Resolved,ResolutionRate,Verdict"
}
$csvLine = "$WeekNumber,$(Get-Date -Format 'yyyy-MM-dd'),$($analysis.Summary.Total),$($analysis.Summary.ByPriority.P1),$($analysis.Summary.ByPriority.P2),$($analysis.Summary.ByPriority.P3),$($analysis.Summary.ByPriority.P4),$($analysis.Summary.Resolved),$resolutionRate%,$verdict"
Add-Content -Path $csvFile -Value $csvLine

Write-Host "Summary updated: $csvFile" -ForegroundColor Cyan
Write-Host ""

# =============================================
# PHASE-2 READINESS CHECK
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "PHASE-2 READINESS CHECK" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

$readyForPhase2 = $true

# Check 1: No unresolved P1 issues
if ($analysis.Summary.ByPriority.P1 -gt 0) {
    $unresolvedP1 = ($p1Issues | Where-Object { $_.Status -notmatch "Resolved|Closed" }).Count
    if ($unresolvedP1 -gt 0) {
        Write-Host "✗ Unresolved P1 Issues: $unresolvedP1" -ForegroundColor Red
        $readyForPhase2 = $false
    } else {
        Write-Host "✓ All P1 Issues Resolved" -ForegroundColor Green
    }
} else {
    Write-Host "✓ No P1 Issues This Week" -ForegroundColor Green
}

# Check 2: Acceptable resolution rate
if ($resolutionRate -ge 70) {
    Write-Host "✓ Resolution Rate Acceptable: $resolutionRate%" -ForegroundColor Green
} else {
    Write-Host "✗ Resolution Rate Too Low: $resolutionRate%" -ForegroundColor Red
    $readyForPhase2 = $false
}

# Check 3: No systemic code issues
if ($analysis.Summary.ByRootCause.Code -le 2) {
    Write-Host "✓ Code Issues Minimal: $($analysis.Summary.ByRootCause.Code)" -ForegroundColor Green
} else {
    Write-Host "⚠ Multiple Code Issues: $($analysis.Summary.ByRootCause.Code)" -ForegroundColor Yellow
    Write-Host "  Address before Phase-2" -ForegroundColor Yellow
}

Write-Host ""

if ($readyForPhase2) {
    Write-Host "✓ PHASE-2 READINESS: ACCEPTABLE" -ForegroundColor Green
    Write-Host "  Issue trends do not block Phase-2" -ForegroundColor Green
} else {
    Write-Host "✗ PHASE-2 READINESS: NOT READY" -ForegroundColor Red
    Write-Host "  Resolve critical issues before Phase-2" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""

exit 0
