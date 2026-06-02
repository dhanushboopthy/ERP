# ===================================================================
# PHASE-2 ENTRY VALIDATION SCRIPT
# ===================================================================
# Purpose: Validate all entry conditions before initiating Phase-2
# Usage: .\validate-phase2-entry.ps1
# Exit Code: 0 = APPROVED, 1 = BLOCKED
# ===================================================================

param(
    [switch]$Force  # Override warnings (NOT recommended)
)

$ErrorActionPreference = "Continue"
$script:BlockingIssues = @()
$script:Warnings = @()
$script:Passed = @()

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  PHASE-2 ENTRY VALIDATION - TEXTILE ERP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "Purpose: Verify all Phase-2 entry conditions are met" -ForegroundColor Gray
Write-Host ""

# ===================================================================
# CHECK 1: Phase-2 Readiness Certification Exists
# ===================================================================

Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "[CHECK 1] Phase-2 Readiness Certification" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$certificationFile = "PHASE2_READINESS_CERTIFICATION.md"
if (Test-Path $certificationFile) {
    Write-Host "✓ Certification file exists: $certificationFile" -ForegroundColor Green
    
    # Check if signed
    $certContent = Get-Content $certificationFile -Raw
    
    if ($certContent -match "Technical Lead.*\*\*Signature:\*\*\s*([^\n]+)" -and $Matches[1].Trim() -ne "_________________") {
        Write-Host "  ✓ Technical Lead signature found" -ForegroundColor Green
    } else {
        $script:BlockingIssues += "Technical Lead signature missing in certification"
        Write-Host "  ✗ Technical Lead signature MISSING" -ForegroundColor Red
    }
    
    if ($certContent -match "Business Owner.*\*\*Signature:\*\*\s*([^\n]+)" -and $Matches[1].Trim() -ne "_________________") {
        Write-Host "  ✓ Business Owner signature found" -ForegroundColor Green
    } else {
        $script:BlockingIssues += "Business Owner signature missing in certification"
        Write-Host "  ✗ Business Owner signature MISSING" -ForegroundColor Red
    }
    
    if ($certContent -match "Executive Sponsor.*\*\*Signature:\*\*\s*([^\n]+)" -and $Matches[1].Trim() -ne "_________________") {
        Write-Host "  ✓ Executive Sponsor signature found" -ForegroundColor Green
    } else {
        $script:BlockingIssues += "Executive Sponsor signature missing in certification"
        Write-Host "  ✗ Executive Sponsor signature MISSING" -ForegroundColor Red
    }
    
    # Check verdict
    if ($certContent -match "\[x\]\s*✓\s*APPROVE Phase-2 Development" -or 
        $certContent -match "\[X\]\s*✓\s*APPROVE Phase-2 Development") {
        Write-Host "  ✓ Phase-2 APPROVED" -ForegroundColor Green
        $script:Passed += "Phase-2 certification approved"
    } elseif ($certContent -match "\[x\]\s*⚠\s*CONDITIONAL APPROVAL" -or 
              $certContent -match "\[X\]\s*⚠\s*CONDITIONAL APPROVAL") {
        Write-Host "  ⚠ Phase-2 CONDITIONALLY APPROVED (review conditions)" -ForegroundColor Yellow
        $script:Warnings += "Conditional approval - review conditions"
    } else {
        $script:BlockingIssues += "Phase-2 not approved in certification document"
        Write-Host "  ✗ Phase-2 NOT APPROVED" -ForegroundColor Red
    }
    
} else {
    $script:BlockingIssues += "Phase-2 Readiness Certification file not found"
    Write-Host "✗ Certification file NOT FOUND: $certificationFile" -ForegroundColor Red
    Write-Host "  Run assess-phase2-readiness.ps1 first" -ForegroundColor Yellow
}

Write-Host ""

# ===================================================================
# CHECK 2: No Unresolved P1/P2 Issues
# ===================================================================

Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "[CHECK 2] Production Issues Status" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$issueLogFile = "production-issues-log.csv"
if (Test-Path $issueLogFile) {
    try {
        $issues = Import-Csv $issueLogFile
        
        $unresolvedP1 = $issues | Where-Object { $_.Priority -eq "P1" -and $_.Status -ne "Resolved" }
        $unresolvedP2 = $issues | Where-Object { $_.Priority -eq "P2" -and $_.Status -ne "Resolved" }
        
        if ($unresolvedP1.Count -eq 0) {
            Write-Host "✓ No unresolved P1 (Critical) issues" -ForegroundColor Green
            $script:Passed += "Zero P1 issues"
        } else {
            $script:BlockingIssues += "Unresolved P1 issues: $($unresolvedP1.Count)"
            Write-Host "✗ Unresolved P1 issues: $($unresolvedP1.Count)" -ForegroundColor Red
            foreach ($issue in $unresolvedP1 | Select-Object -First 5) {
                Write-Host "  - [$($issue.IssueID)] $($issue.Description)" -ForegroundColor Red
            }
        }
        
        if ($unresolvedP2.Count -eq 0) {
            Write-Host "✓ No unresolved P2 (High) issues" -ForegroundColor Green
            $script:Passed += "Zero P2 issues"
        } elseif ($unresolvedP2.Count -le 2) {
            Write-Host "⚠ Unresolved P2 issues: $($unresolvedP2.Count) (acceptable if < 3)" -ForegroundColor Yellow
            $script:Warnings += "P2 issues present: $($unresolvedP2.Count)"
        } else {
            $script:BlockingIssues += "Too many unresolved P2 issues: $($unresolvedP2.Count)"
            Write-Host "✗ Unresolved P2 issues: $($unresolvedP2.Count) (max allowed: 2)" -ForegroundColor Red
        }
        
    } catch {
        $script:Warnings += "Could not parse issue log"
        Write-Host "⚠ Could not parse issue log: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Issue log not found (assuming zero issues)" -ForegroundColor Yellow
    $script:Warnings += "Issue log file not found"
}

Write-Host ""

# ===================================================================
# CHECK 3: Stabilization Score ≥ 85 for Last 7 Days
# ===================================================================

Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "[CHECK 3] Stabilization Score Trend" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$stabilityTrackingFile = "stability-tracking.csv"
if (Test-Path $stabilityTrackingFile) {
    try {
        $stabilityData = Import-Csv $stabilityTrackingFile | Sort-Object Date -Descending
        $last7Days = $stabilityData | Select-Object -First 7
        
        if ($last7Days.Count -ge 7) {
            $avgScore = ($last7Days | Measure-Object -Property TotalScore -Average).Average
            $minScore = ($last7Days | Measure-Object -Property TotalScore -Minimum).Minimum
            
            Write-Host "  Last 7 days average score: $([math]::Round($avgScore, 1))/100" -ForegroundColor Cyan
            Write-Host "  Minimum score (last 7 days): $minScore/100" -ForegroundColor Cyan
            
            if ($avgScore -ge 85 -and $minScore -ge 80) {
                Write-Host "✓ Stability score meets Phase-2 requirements" -ForegroundColor Green
                $script:Passed += "Stability score ≥ 85"
            } elseif ($avgScore -ge 80) {
                Write-Host "⚠ Stability score borderline (85+ recommended)" -ForegroundColor Yellow
                $script:Warnings += "Stability score below 85 (current: $([math]::Round($avgScore, 1)))"
            } else {
                $script:BlockingIssues += "Stability score too low: $([math]::Round($avgScore, 1))"
                Write-Host "✗ Stability score TOO LOW (avg: $([math]::Round($avgScore, 1)), min required: 85)" -ForegroundColor Red
            }
        } else {
            Write-Host "⚠ Less than 7 days of stability data available" -ForegroundColor Yellow
            $script:Warnings += "Insufficient stability data (< 7 days)"
        }
        
    } catch {
        $script:Warnings += "Could not parse stability tracking data"
        Write-Host "⚠ Could not parse stability data: $_" -ForegroundColor Yellow
    }
} else {
    $script:Warnings += "Stability tracking file not found"
    Write-Host "⚠ Stability tracking file not found" -ForegroundColor Yellow
    Write-Host "  Run verify-stability.ps1 for at least 7 days" -ForegroundColor Yellow
}

Write-Host ""

# ===================================================================
# CHECK 4: Production System Stable
# ===================================================================

Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "[CHECK 4] Production System Health" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Check if production is running
$apiUrl = "https://localhost:7001/health"  # Adjust to your production URL
try {
    $response = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 5 -SkipCertificateCheck -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Production API is responding (HTTP 200)" -ForegroundColor Green
        $script:Passed += "Production API healthy"
    } else {
        $script:Warnings += "Production API returned status: $($response.StatusCode)"
        Write-Host "⚠ Production API returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    $script:Warnings += "Could not reach production API"
    Write-Host "⚠ Could not reach production API: $_" -ForegroundColor Yellow
    Write-Host "  (This is OK if validating in dev environment)" -ForegroundColor Gray
}

# Check for recent crashes/errors in logs
$logPath = "backend\SudhanTextileERP.API\logs"
if (Test-Path $logPath) {
    $recentLogs = Get-ChildItem $logPath -Filter "*.log" | 
                  Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-1) } |
                  Sort-Object LastWriteTime -Descending |
                  Select-Object -First 1
    
    if ($recentLogs) {
        $errorCount = (Select-String -Path $recentLogs.FullName -Pattern "ERROR|FATAL" -CaseSensitive:$false).Count
        
        if ($errorCount -eq 0) {
            Write-Host "✓ No errors in last 24 hours of logs" -ForegroundColor Green
            $script:Passed += "Clean error logs"
        } elseif ($errorCount -le 5) {
            Write-Host "⚠ Minor errors in logs: $errorCount (acceptable if handled)" -ForegroundColor Yellow
            $script:Warnings += "Minor errors in logs: $errorCount"
        } else {
            $script:BlockingIssues += "High error count in logs: $errorCount"
            Write-Host "✗ High error count in logs: $errorCount" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠ No recent log files found" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Log directory not found" -ForegroundColor Yellow
}

Write-Host ""

# ===================================================================
# CHECK 5: Performance Baseline Established
# ===================================================================

Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "[CHECK 5] Performance Baseline" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

$baselineFile = "performance-baseline.json"
if (Test-Path $baselineFile) {
    Write-Host "✓ Performance baseline file exists" -ForegroundColor Green
    
    try {
        $baseline = Get-Content $baselineFile | ConvertFrom-Json
        
        if ($baseline.api.averageResponseTime) {
            Write-Host "  ✓ API baseline: $($baseline.api.averageResponseTime)ms average" -ForegroundColor Green
        }
        
        if ($baseline.database.currentSizeMB) {
            Write-Host "  ✓ Database baseline: $($baseline.database.currentSizeMB)MB" -ForegroundColor Green
        }
        
        $script:Passed += "Performance baseline established"
        
    } catch {
        $script:Warnings += "Could not parse performance baseline"
        Write-Host "⚠ Could not parse baseline file: $_" -ForegroundColor Yellow
    }
} else {
    $script:Warnings += "Performance baseline not established"
    Write-Host "⚠ Performance baseline file not found" -ForegroundColor Yellow
    Write-Host "  Run measure-performance.ps1 -EstablishBaseline" -ForegroundColor Yellow
}

Write-Host ""

# ===================================================================
# CHECK 6: Data Integrity Verification
# ===================================================================

Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "[CHECK 6] Data Integrity (Zero Tolerance)" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Check latest stability report for data integrity
$latestStabilityReport = Get-ChildItem "stability-report-*.json" -ErrorAction SilentlyContinue | 
                         Sort-Object LastWriteTime -Descending | 
                         Select-Object -First 1

if ($latestStabilityReport) {
    try {
        $stability = Get-Content $latestStabilityReport.FullName | ConvertFrom-Json
        
        if ($stability.dataIntegrity.negativeStockCount -eq 0) {
            Write-Host "✓ Zero negative stock items" -ForegroundColor Green
            $script:Passed += "Zero negative stock"
        } else {
            $script:BlockingIssues += "Negative stock items found: $($stability.dataIntegrity.negativeStockCount)"
            Write-Host "✗ Negative stock items: $($stability.dataIntegrity.negativeStockCount)" -ForegroundColor Red
        }
        
        if ($stability.dataIntegrity.orphanedRecords -eq 0) {
            Write-Host "✓ Zero orphaned records" -ForegroundColor Green
            $script:Passed += "Zero orphaned records"
        } else {
            $script:Warnings += "Orphaned records found: $($stability.dataIntegrity.orphanedRecords)"
            Write-Host "⚠ Orphaned records: $($stability.dataIntegrity.orphanedRecords)" -ForegroundColor Yellow
        }
        
        if ($stability.dataIntegrity.duplicateDocNumbers -eq 0) {
            Write-Host "✓ Zero duplicate document numbers" -ForegroundColor Green
            $script:Passed += "Zero duplicate doc numbers"
        } else {
            $script:BlockingIssues += "Duplicate document numbers: $($stability.dataIntegrity.duplicateDocNumbers)"
            Write-Host "✗ Duplicate document numbers: $($stability.dataIntegrity.duplicateDocNumbers)" -ForegroundColor Red
        }
        
    } catch {
        $script:Warnings += "Could not parse stability report"
        Write-Host "⚠ Could not parse stability report: $_" -ForegroundColor Yellow
    }
} else {
    $script:Warnings += "No stability report found"
    Write-Host "⚠ No stability report found - cannot verify data integrity" -ForegroundColor Yellow
}

Write-Host ""

# ===================================================================
# CHECK 7: Environment Readiness
# ===================================================================

Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "[CHECK 7] Development Environment Readiness" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Check for appsettings for different environments
$environments = @("Development", "Staging", "Production")
$foundEnvs = @()

foreach ($env in $environments) {
    $configFile = "backend\SudhanTextileERP.API\appsettings.$env.json"
    if (Test-Path $configFile) {
        Write-Host "  ✓ $env configuration exists" -ForegroundColor Green
        $foundEnvs += $env
    } else {
        Write-Host "  ✗ $env configuration MISSING" -ForegroundColor Red
        $script:Warnings += "$env configuration file missing"
    }
}

if ($foundEnvs.Contains("Development") -and $foundEnvs.Contains("Production")) {
    Write-Host "✓ Minimum environments configured (Dev + Prod)" -ForegroundColor Green
    $script:Passed += "Environment separation ready"
} else {
    $script:Warnings += "Environment separation incomplete"
    Write-Host "⚠ Environment separation incomplete" -ForegroundColor Yellow
}

Write-Host ""

# ===================================================================
# CHECK 8: Backup Status
# ===================================================================

Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "[CHECK 8] Recent Backup Verification" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Check for recent backup in logs
$backupTrackingFile = "backup-tracking.csv"
if (Test-Path $backupTrackingFile) {
    try {
        $backups = Import-Csv $backupTrackingFile | 
                   Where-Object { $_.Status -eq "Success" } | 
                   Sort-Object Date -Descending | 
                   Select-Object -First 1
        
        if ($backups) {
            $lastBackupDate = [DateTime]::Parse($backups.Date)
            $hoursSinceBackup = ((Get-Date) - $lastBackupDate).TotalHours
            
            if ($hoursSinceBackup -le 24) {
                Write-Host "✓ Recent backup found ($(([math]::Round($hoursSinceBackup, 1))) hours ago)" -ForegroundColor Green
                $script:Passed += "Recent backup verified"
            } elseif ($hoursSinceBackup -le 48) {
                Write-Host "⚠ Last backup was $([math]::Round($hoursSinceBackup, 1)) hours ago" -ForegroundColor Yellow
                $script:Warnings += "Backup older than 24 hours"
            } else {
                $script:BlockingIssues += "No recent backup (last: $([math]::Round($hoursSinceBackup, 1)) hours ago)"
                Write-Host "✗ Last backup was $([math]::Round($hoursSinceBackup, 1)) hours ago (TOO OLD)" -ForegroundColor Red
            }
        } else {
            $script:Warnings += "No successful backups found"
            Write-Host "⚠ No successful backups found in tracking file" -ForegroundColor Yellow
        }
    } catch {
        $script:Warnings += "Could not parse backup tracking"
        Write-Host "⚠ Could not parse backup tracking: $_" -ForegroundColor Yellow
    }
} else {
    $script:Warnings += "Backup tracking file not found"
    Write-Host "⚠ Backup tracking file not found" -ForegroundColor Yellow
}

Write-Host ""

# ===================================================================
# FINAL VERDICT
# ===================================================================

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  FINAL VERDICT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checks Passed: $($script:Passed.Count)" -ForegroundColor Green
Write-Host "Warnings: $($script:Warnings.Count)" -ForegroundColor Yellow
Write-Host "Blocking Issues: $($script:BlockingIssues.Count)" -ForegroundColor Red
Write-Host ""

if ($script:BlockingIssues.Count -eq 0) {
    if ($script:Warnings.Count -eq 0) {
        Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                                                           ║" -ForegroundColor Green
        Write-Host "║   ✓ PHASE-2 ENTRY APPROVED                                ║" -ForegroundColor Green
        Write-Host "║                                                           ║" -ForegroundColor Green
        Write-Host "║   All entry conditions met.                               ║" -ForegroundColor Green
        Write-Host "║   You may proceed with Phase-2 development.               ║" -ForegroundColor Green
        Write-Host "║                                                           ║" -ForegroundColor Green
        Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
        
        $verdict = "APPROVED"
        $exitCode = 0
        
    } elseif ($script:Warnings.Count -le 3) {
        Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "║   ⚠ PHASE-2 ENTRY APPROVED (WITH WARNINGS)                ║" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "║   Minor warnings detected but not blocking.               ║" -ForegroundColor Yellow
        Write-Host "║   Proceed with caution and address warnings soon.         ║" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
        
        $verdict = "APPROVED_WITH_WARNINGS"
        $exitCode = 0
        
    } else {
        Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "║   ⚠ CONDITIONAL APPROVAL                                  ║" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "║   Multiple warnings detected.                             ║" -ForegroundColor Yellow
        Write-Host "║   Review and address warnings before proceeding.          ║" -ForegroundColor Yellow
        Write-Host "║                                                           ║" -ForegroundColor Yellow
        Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
        
        $verdict = "CONDITIONAL"
        $exitCode = if ($Force) { 0 } else { 1 }
    }
} else {
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                                                           ║" -ForegroundColor Red
    Write-Host "║   ✗ PHASE-2 ENTRY BLOCKED                                 ║" -ForegroundColor Red
    Write-Host "║                                                           ║" -ForegroundColor Red
    Write-Host "║   Critical issues must be resolved before Phase-2.        ║" -ForegroundColor Red
    Write-Host "║   DO NOT PROCEED.                                         ║" -ForegroundColor Red
    Write-Host "║                                                           ║" -ForegroundColor Red
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Red
    
    $verdict = "BLOCKED"
    $exitCode = 1
}

Write-Host ""

# Show blocking issues
if ($script:BlockingIssues.Count -gt 0) {
    Write-Host "BLOCKING ISSUES:" -ForegroundColor Red
    foreach ($issue in $script:BlockingIssues) {
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
# CREATE VALIDATION RECORD
# ===================================================================

$validationRecord = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    verdict = $verdict
    passed = $script:Passed.Count
    warnings = $script:Warnings.Count
    blocking = $script:BlockingIssues.Count
    blockingIssues = $script:BlockingIssues
    warningList = $script:Warnings
    passedChecks = $script:Passed
}

$validationFile = "phase2-entry-validation-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$validationRecord | ConvertTo-Json -Depth 5 | Out-File $validationFile -Encoding UTF8

Write-Host "Validation record saved: $validationFile" -ForegroundColor Cyan
Write-Host ""

# ===================================================================
# NEXT STEPS
# ===================================================================

if ($verdict -eq "APPROVED" -or $verdict -eq "APPROVED_WITH_WARNINGS") {
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Review Phase-2 Sprint Plan" -ForegroundColor White
    Write-Host "2. Set up DEV/STAGING environments if not already done" -ForegroundColor White
    Write-Host "3. Review Feature Flag Matrix" -ForegroundColor White
    Write-Host "4. Prepare first release (Track A enhancements)" -ForegroundColor White
    Write-Host "5. Follow change control procedures for ALL changes" -ForegroundColor White
    Write-Host ""
    Write-Host "REMEMBER:" -ForegroundColor Yellow
    Write-Host "  • Production is READ-ONLY" -ForegroundColor Yellow
    Write-Host "  • ALL development in DEV/STAGING" -ForegroundColor Yellow
    Write-Host "  • Feature flags for risky changes" -ForegroundColor Yellow
    Write-Host "  • STABILITY > FEATURES" -ForegroundColor Yellow
    Write-Host ""
}

if ($verdict -eq "BLOCKED" -or $verdict -eq "CONDITIONAL") {
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Red
    Write-Host "REQUIRED ACTIONS:" -ForegroundColor Red
    Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Resolve all blocking issues listed above" -ForegroundColor White
    Write-Host "2. Address warnings" -ForegroundColor White
    Write-Host "3. Re-run this validation script" -ForegroundColor White
    Write-Host "4. DO NOT proceed with Phase-2 until APPROVED" -ForegroundColor White
    Write-Host ""
}

exit $exitCode
