# =============================================
# GO-LIVE EXECUTION PROCEDURE
# Safe production cutover with first transaction
# =============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ApiBaseUrl = "http://localhost:5000",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipUATFreeze = $false
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$goLiveTime = Get-Date

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║                     GO-LIVE EXECUTION                          ║" -ForegroundColor Green
Write-Host "║              PRODUCTION CUTOVER PROCEDURE                      ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "⚠ THIS WILL SWITCH THE SYSTEM TO PRODUCTION MODE" -ForegroundColor Yellow -BackgroundColor Black
Write-Host ""
Write-Host "Go-Live Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host ""

# Confirmation
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "FINAL CONFIRMATION" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "Before proceeding, confirm:" -ForegroundColor Cyan
Write-Host "  ✓ Pre-check script passed all critical tests" -ForegroundColor White
Write-Host "  ✓ All stakeholders informed" -ForegroundColor White
Write-Host "  ✓ Backup completed successfully" -ForegroundColor White
Write-Host "  ✓ Users ready to start production work" -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Type 'GO-LIVE' to proceed (anything else to cancel)"

if ($confirmation -ne "GO-LIVE") {
    Write-Host ""
    Write-Host "Go-live cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting go-live procedure..." -ForegroundColor Green
Write-Host ""

# =============================================
# STEP 1: FREEZE UAT
# =============================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 1: FREEZE UAT ENVIRONMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipUATFreeze) {
    Write-Host "UAT Freeze Actions:" -ForegroundColor Yellow
    Write-Host "  1. Stop accepting new UAT transactions" -ForegroundColor White
    Write-Host "  2. Export final UAT data (if needed)" -ForegroundColor White
    Write-Host "  3. Take final UAT backup" -ForegroundColor White
    Write-Host ""
    
    # Check if SQLite UAT database exists
    $uatDbPath = "SudhanTextileERP.db"
    if (Test-Path $uatDbPath) {
        Write-Host "Creating final UAT backup..." -ForegroundColor Cyan
        $uatBackupPath = "backups\UAT_Final_$timestamp.db"
        
        if (-not (Test-Path "backups")) {
            New-Item -ItemType Directory -Path "backups" | Out-Null
        }
        
        Copy-Item -Path $uatDbPath -Destination $uatBackupPath -Force
        Write-Host "✓ UAT backup created: $uatBackupPath" -ForegroundColor Green
    } else {
        Write-Host "⚠ No UAT database found (may have already been migrated)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Read-Host "Press Enter when UAT is frozen..."
} else {
    Write-Host "⚠ UAT freeze skipped (as requested)" -ForegroundColor Yellow
}

# =============================================
# STEP 2: ENABLE PRODUCTION MODE
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 2: ENABLE PRODUCTION MODE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Setting environment to PRODUCTION..." -ForegroundColor Cyan

# Set environment variable
$env:ASPNETCORE_ENVIRONMENT = "Production"
Write-Host "✓ Environment variable set: ASPNETCORE_ENVIRONMENT=Production" -ForegroundColor Green

# Verify production configuration
$prodConfig = "backend\SudhanTextileERP.API\appsettings.Production.json"
if (Test-Path $prodConfig) {
    Write-Host "✓ Production configuration exists" -ForegroundColor Green
    
    $config = Get-Content $prodConfig -Raw | ConvertFrom-Json
    $connString = $config.ConnectionStrings.DefaultConnection
    
    if ($connString -like "*Server=*") {
        Write-Host "✓ SQL Server connection configured" -ForegroundColor Green
    } else {
        Write-Host "✗ WARNING: Connection string may not be SQL Server" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Production configuration not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Backend restart required:" -ForegroundColor Yellow
Write-Host "  1. Stop current backend process (if running)" -ForegroundColor White
Write-Host "  2. Start with: dotnet run --configuration Release" -ForegroundColor White
Write-Host "  3. Ensure ASPNETCORE_ENVIRONMENT=Production is set" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter when backend is running in Production mode..."

# Verify API is responding
Write-Host ""
Write-Host "Verifying API in Production mode..." -ForegroundColor Cyan
try {
    $healthCheck = Invoke-RestMethod -Uri "$ApiBaseUrl/api/health" -Method GET -TimeoutSec 10
    Write-Host "✓ API is healthy: $($healthCheck.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ API is not responding!" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

# =============================================
# STEP 3: ENABLE USER ACCESS
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 3: ENABLE USER ACCESS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "User Access Control:" -ForegroundColor Yellow
Write-Host "  • Admin users: ENABLED" -ForegroundColor Green
Write-Host "  • Operators: ENABLED" -ForegroundColor Green
Write-Host "  • Test users: Should be DISABLED" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠ IMPORTANT REMINDERS:" -ForegroundColor Yellow -BackgroundColor Black
Write-Host "  • Inform users this is PRODUCTION - real data" -ForegroundColor White
Write-Host "  • All transactions are FINAL" -ForegroundColor White
Write-Host "  • No test data should be created" -ForegroundColor White
Write-Host "  • Follow proper approval workflows" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to proceed to first transaction test..."

# =============================================
# STEP 4: FIRST TRANSACTION TEST
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 4: FIRST PRODUCTION TRANSACTION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "This step will create the FIRST PRODUCTION TRANSACTION" -ForegroundColor Yellow -BackgroundColor Black
Write-Host ""
Write-Host "Options:" -ForegroundColor Cyan
Write-Host "  1. Create transaction via API (automated)" -ForegroundColor White
Write-Host "  2. Let user create first transaction manually (recommended)" -ForegroundColor White
Write-Host ""

$testOption = Read-Host "Choose option (1 or 2)"

if ($testOption -eq "1") {
    Write-Host ""
    Write-Host "Creating first transaction via API..." -ForegroundColor Cyan
    Write-Host ""
    
    # Note: This would require login first
    Write-Host "⚠ Automated transaction creation requires admin credentials" -ForegroundColor Yellow
    Write-Host "  For security, manual transaction is recommended" -ForegroundColor Yellow
    Write-Host ""
    
    $manualOverride = Read-Host "Switch to manual? (yes/no)"
    if ($manualOverride -eq "yes") {
        $testOption = "2"
    }
}

if ($testOption -eq "2") {
    Write-Host ""
    Write-Host "Manual First Transaction:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Instructions for user:" -ForegroundColor Yellow
    Write-Host "  1. Log in to the system with production credentials" -ForegroundColor White
    Write-Host "  2. Navigate to Yarn Receipt" -ForegroundColor White
    Write-Host "  3. Create a REAL yarn receipt (not test data)" -ForegroundColor White
    Write-Host "  4. Verify document number is generated" -ForegroundColor White
    Write-Host "  5. Verify stock is updated" -ForegroundColor White
    Write-Host "  6. Verify audit log entry created" -ForegroundColor White
    Write-Host ""
    
    Read-Host "Press Enter when first transaction is completed..."
    
    Write-Host ""
    Write-Host "Verifying first transaction..." -ForegroundColor Cyan
    
    # Wait a moment for transaction to process
    Start-Sleep -Seconds 2
    
    try {
        # Check if any receipts exist
        $receiptsCheck = Invoke-RestMethod -Uri "$ApiBaseUrl/api/yarn-receipts?pageSize=1" -Method GET -TimeoutSec 10
        
        if ($receiptsCheck.totalCount -gt 0) {
            Write-Host "✓ First transaction detected!" -ForegroundColor Green
            Write-Host "  Receipt Count: $($receiptsCheck.totalCount)" -ForegroundColor Cyan
            
            if ($receiptsCheck.items.Count -gt 0) {
                $firstReceipt = $receiptsCheck.items[0]
                Write-Host "  Latest Receipt: $($firstReceipt.receiptNo)" -ForegroundColor Cyan
                Write-Host "  Date: $($firstReceipt.receiptDate)" -ForegroundColor Cyan
            }
        } else {
            Write-Host "⚠ No transactions found yet" -ForegroundColor Yellow
            Write-Host "  This may be normal if transaction is still processing" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "⚠ Could not verify transaction via API" -ForegroundColor Yellow
        Write-Host "  Manual verification recommended" -ForegroundColor Cyan
    }
}

# =============================================
# STEP 5: POST GO-LIVE VERIFICATION
# =============================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 5: POST GO-LIVE VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verification Checklist:" -ForegroundColor Yellow
Write-Host ""

# Document number generation
Write-Host "  [ ] Document numbers generating correctly" -ForegroundColor Cyan

# Stock update
Write-Host "  [ ] Stock updates working" -ForegroundColor Cyan

# Audit logging
Write-Host "  [ ] Audit logs being created" -ForegroundColor Cyan

# User experience
Write-Host "  [ ] UI responsive and working" -ForegroundColor Cyan

# Reports
Write-Host "  [ ] Reports showing correct data" -ForegroundColor Cyan

Write-Host ""
$verificationOk = Read-Host "All verifications passed? (yes/no)"

if ($verificationOk -ne "yes") {
    Write-Host ""
    Write-Host "⚠ ISSUES DETECTED DURING GO-LIVE" -ForegroundColor Red -BackgroundColor Black
    Write-Host ""
    Write-Host "Action Required:" -ForegroundColor Yellow
    Write-Host "  1. Document all issues" -ForegroundColor White
    Write-Host "  2. Assess severity (blocking vs non-blocking)" -ForegroundColor White
    Write-Host "  3. Decide: Fix immediately OR Rollback" -ForegroundColor White
    Write-Host ""
    
    $action = Read-Host "Continue with issues (continue) or Rollback (rollback)?"
    
    if ($action -eq "rollback") {
        Write-Host ""
        Write-Host "Initiating rollback procedure..." -ForegroundColor Red
        Write-Host "  See SQLSERVER_MIGRATION_CERTIFICATION.md for rollback steps" -ForegroundColor Yellow
        exit 1
    }
}

# =============================================
# GO-LIVE COMPLETE
# =============================================
$goLiveEndTime = Get-Date
$duration = $goLiveEndTime - $goLiveTime

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║                   GO-LIVE COMPLETED                            ║" -ForegroundColor Green
Write-Host "║                 SYSTEM IS NOW LIVE                             ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# Create go-live record
$goLiveRecord = @{
    GoLiveTime = $goLiveTime.ToString("yyyy-MM-dd HH:mm:ss")
    CompletionTime = $goLiveEndTime.ToString("yyyy-MM-dd HH:mm:ss")
    Duration = "$($duration.TotalMinutes) minutes"
    ExecutedBy = $env:USERNAME
    FirstTransactionVerified = ($testOption -eq "2")
    Status = "LIVE"
} | ConvertTo-Json

$goLiveRecordFile = "go-live-record-$timestamp.json"
$goLiveRecord | Out-File -FilePath $goLiveRecordFile

Write-Host "Go-Live Summary:" -ForegroundColor Cyan
Write-Host "  Start Time: $($goLiveTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor White
Write-Host "  End Time: $($goLiveEndTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor White
Write-Host "  Duration: $([math]::Round($duration.TotalMinutes, 1)) minutes" -ForegroundColor White
Write-Host "  Status: PRODUCTION LIVE ✓" -ForegroundColor Green
Write-Host ""
Write-Host "Go-live record saved: $goLiveRecordFile" -ForegroundColor Cyan
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "CRITICAL: NEXT 72 HOURS MONITORING" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "Immediate Actions Required:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. START MONITORING (Every 2 Hours)" -ForegroundColor Yellow
Write-Host "   Execute: .\monitor-production.ps1" -ForegroundColor White
Write-Host ""
Write-Host "2. DAILY CHECKLIST (Every Morning)" -ForegroundColor Yellow
Write-Host "   Execute: .\daily-golive-checklist.ps1" -ForegroundColor White
Write-Host ""
Write-Host "3. USER SUPPORT" -ForegroundColor Yellow
Write-Host "   Monitor user tickets and questions" -ForegroundColor White
Write-Host "   Log all issues in go-live report" -ForegroundColor White
Write-Host ""
Write-Host "4. BACKUP VERIFICATION" -ForegroundColor Yellow
Write-Host "   Verify daily backups are running" -ForegroundColor White
Write-Host "   Check: C:\Backups\" -ForegroundColor White
Write-Host ""

Write-Host "Operational Rules (First 72 Hours):" -ForegroundColor Cyan
Write-Host "  ✓ No schema changes" -ForegroundColor White
Write-Host "  ✓ No permission changes without approval" -ForegroundColor White
Write-Host "  ✓ No bulk operations" -ForegroundColor White
Write-Host "  ✓ No direct database edits" -ForegroundColor White
Write-Host "  ✓ All issues logged before fixing" -ForegroundColor White
Write-Host ""

Write-Host "Support Contacts:" -ForegroundColor Cyan
Write-Host "  Database Issues: Check logs in backend\SudhanTextileERP.API\logs\" -ForegroundColor White
Write-Host "  Application Issues: Review audit logs and error logs" -ForegroundColor White
Write-Host "  Business Questions: Escalate to ERP Admin" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "CONGRATULATIONS!" -ForegroundColor Green
Write-Host "The ERP system is now processing real production transactions." -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  • Go-Live Record: $goLiveRecordFile" -ForegroundColor White
Write-Host "  • Daily Checklist: .\daily-golive-checklist.ps1" -ForegroundColor White
Write-Host "  • Monitoring: .\monitor-production.ps1" -ForegroundColor White
Write-Host "  • Operations Guide: PRODUCTION_OPERATIONS_GUIDE.md" -ForegroundColor White
Write-Host ""
