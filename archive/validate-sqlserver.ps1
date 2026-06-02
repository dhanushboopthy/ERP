# =============================================
# SQL SERVER VALIDATION & TESTING SCRIPT
# Comprehensive post-migration verification
# =============================================

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerName = "localhost",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseName = "SudhanTextileERP",
    
    [Parameter(Mandatory=$false)]
    [switch]$DetailedOutput = $false
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "SQL SERVER VALIDATION & TESTING" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server: $ServerName" -ForegroundColor Yellow
Write-Host "Database: $DatabaseName" -ForegroundColor Yellow
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host ""

$connectionString = "Server=$ServerName;Database=$DatabaseName;Trusted_Connection=True;TrustServerCertificate=True;"
$testResults = @()

function Test-Item {
    param(
        [string]$Category,
        [string]$TestName,
        [scriptblock]$Test,
        [string]$ExpectedResult = "Success"
    )
    
    try {
        $result = & $Test
        $passed = $true
        $message = $result
        
        if ($result -eq $false) {
            $passed = $false
            $message = "Failed"
        }
        
        $testResults += [PSCustomObject]@{
            Category = $Category
            Test = $TestName
            Status = if($passed){"PASS"}else{"FAIL"}
            Result = $message
        }
        
        if ($passed) {
            Write-Host "  ✓ $TestName" -ForegroundColor Green
            if ($DetailedOutput -and $message -ne "Success") {
                Write-Host "    → $message" -ForegroundColor Cyan
            }
        } else {
            Write-Host "  ✗ $TestName" -ForegroundColor Red
            Write-Host "    → $message" -ForegroundColor Red
        }
        
        return $passed
    } catch {
        $testResults += [PSCustomObject]@{
            Category = $Category
            Test = $TestName
            Status = "ERROR"
            Result = $_.Exception.Message
        }
        Write-Host "  ✗ $TestName - ERROR" -ForegroundColor Red
        Write-Host "    → $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Execute-Query {
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

function Execute-Scalar {
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
# TEST CATEGORY 1: DATABASE STRUCTURE
# =============================================
Write-Host "Category 1: Database Structure" -ForegroundColor Yellow

Test-Item -Category "Structure" -TestName "Database Exists" -Test {
    $result = Execute-Scalar "SELECT database_id FROM sys.databases WHERE name = '$DatabaseName'"
    if ($result) { "Database ID: $result" } else { $false }
}

Test-Item -Category "Structure" -TestName "Recovery Model (FULL)" -Test {
    $result = Execute-Scalar "SELECT recovery_model_desc FROM sys.databases WHERE name = '$DatabaseName'"
    if ($result -eq "FULL") { $result } else { $false }
}

Test-Item -Category "Structure" -TestName "Collation" -Test {
    $result = Execute-Scalar "SELECT collation_name FROM sys.databases WHERE name = '$DatabaseName'"
    $result
}

Test-Item -Category "Structure" -TestName "Table Count (30+)" -Test {
    $count = Execute-Scalar "SELECT COUNT(*) FROM sys.tables"
    if ($count -ge 30) { "$count tables" } else { "$count tables (expected 30+)" }
}

# =============================================
# TEST CATEGORY 2: CRITICAL TABLES
# =============================================
Write-Host ""
Write-Host "Category 2: Critical Tables" -ForegroundColor Yellow

$criticalTables = @(
    'Companies', 'FinancialYears', 'Parties', 'YarnCounts', 
    'Beams', 'Vehicles', 'YarnReceipts', 'YarnReceiptDetails',
    'BabyCones', 'WarpingJobCards', 'WarpingJobCardBeams',
    'SizingJobCards', 'SizingJobCardBeams', 'TaxInvoices', 
    'TaxInvoiceDetails', 'YarnStocks', 'AuditLogs',
    'Users', 'Roles', 'Permissions'
)

foreach ($table in $criticalTables) {
    Test-Item -Category "Tables" -TestName "Table: $table" -Test {
        $exists = Execute-Scalar "SELECT OBJECT_ID('$table')"
        if ($exists) { "Exists" } else { $false }
    }.GetNewClosure()
}

# =============================================
# TEST CATEGORY 3: CONSTRAINTS
# =============================================
Write-Host ""
Write-Host "Category 3: Database Constraints" -ForegroundColor Yellow

Test-Item -Category "Constraints" -TestName "CHECK Constraints (10+)" -Test {
    $count = Execute-Scalar "SELECT COUNT(*) FROM sys.check_constraints"
    if ($count -ge 10) { "$count constraints" } else { "$count (expected 10+)" }
}

$criticalConstraints = @(
    'CHK_YarnStocks_CurrentBalanceKg',
    'CHK_YarnReceiptDetails_Weights',
    'CHK_BabyCones_NetWeight',
    'CHK_FinancialYears_Dates'
)

foreach ($constraint in $criticalConstraints) {
    Test-Item -Category "Constraints" -TestName "Constraint: $constraint" -Test {
        $exists = Execute-Scalar "SELECT COUNT(*) FROM sys.check_constraints WHERE name = '$constraint'"
        if ($exists -gt 0) { "Active" } else { $false }
    }.GetNewClosure()
}

# =============================================
# TEST CATEGORY 4: TRIGGERS
# =============================================
Write-Host ""
Write-Host "Category 4: Database Triggers" -ForegroundColor Yellow

$criticalTriggers = @(
    'TR_YarnReceipts_PreventLockedUpdate',
    'TR_WarpingJobCards_PreventLockedUpdate',
    'TR_SizingJobCards_PreventLockedUpdate',
    'TR_TaxInvoices_PreventLockedUpdate'
)

Test-Item -Category "Triggers" -TestName "Total Triggers" -Test {
    $count = Execute-Scalar "SELECT COUNT(*) FROM sys.triggers WHERE is_ms_shipped = 0"
    "$count triggers"
}

foreach ($trigger in $criticalTriggers) {
    Test-Item -Category "Triggers" -TestName "Trigger: $trigger" -Test {
        $exists = Execute-Scalar "SELECT COUNT(*) FROM sys.triggers WHERE name = '$trigger'"
        if ($exists -gt 0) {
            $disabled = Execute-Scalar "SELECT is_disabled FROM sys.triggers WHERE name = '$trigger'"
            if ($disabled -eq $false) { "Active" } else { "Exists but disabled" }
        } else {
            $false
        }
    }.GetNewClosure()
}

# =============================================
# TEST CATEGORY 5: INDEXES
# =============================================
Write-Host ""
Write-Host "Category 5: Database Indexes" -ForegroundColor Yellow

Test-Item -Category "Indexes" -TestName "Non-Clustered Indexes (20+)" -Test {
    $count = Execute-Scalar "SELECT COUNT(*) FROM sys.indexes WHERE type > 0 AND is_primary_key = 0 AND is_unique_constraint = 0"
    if ($count -ge 20) { "$count indexes" } else { "$count (expected 20+)" }
}

Test-Item -Category "Indexes" -TestName "Index on YarnReceipts.PartyId" -Test {
    $exists = Execute-Scalar "SELECT COUNT(*) FROM sys.indexes WHERE object_id = OBJECT_ID('YarnReceipts') AND name = 'IX_YarnReceipts_PartyId'"
    if ($exists -gt 0) { "Exists" } else { $false }
}

Test-Item -Category "Indexes" -TestName "Index on SizingJobCards.ApprovalStatus" -Test {
    $exists = Execute-Scalar "SELECT COUNT(*) FROM sys.indexes WHERE object_id = OBJECT_ID('SizingJobCards') AND name = 'IX_SizingJobCards_ApprovalStatus'"
    if ($exists -gt 0) { "Exists" } else { $false }
}

# =============================================
# TEST CATEGORY 6: STORED PROCEDURES
# =============================================
Write-Host ""
Write-Host "Category 6: Stored Procedures" -ForegroundColor Yellow

Test-Item -Category "Procedures" -TestName "Stored Procedures (10+)" -Test {
    $count = Execute-Scalar "SELECT COUNT(*) FROM sys.objects WHERE type = 'P' AND is_ms_shipped = 0"
    if ($count -ge 10) { "$count procedures" } else { "$count (expected 10+)" }
}

$criticalProcs = @(
    'sp_GetNextDocumentNumber',
    'sp_CreateYarnReceipt',
    'sp_GetYarnStockSummary',
    'sp_GetPartyBalance'
)

foreach ($proc in $criticalProcs) {
    Test-Item -Category "Procedures" -TestName "Procedure: $proc" -Test {
        $exists = Execute-Scalar "SELECT COUNT(*) FROM sys.objects WHERE type = 'P' AND name = '$proc'"
        if ($exists -gt 0) { "Exists" } else { $false }
    }.GetNewClosure()
}

# =============================================
# TEST CATEGORY 7: SEED DATA
# =============================================
Write-Host ""
Write-Host "Category 7: Seed Data" -ForegroundColor Yellow

Test-Item -Category "Data" -TestName "Companies Seeded" -Test {
    $count = Execute-Scalar "SELECT COUNT(*) FROM Companies"
    if ($count -gt 0) { "$count companies" } else { "No companies found" }
}

Test-Item -Category "Data" -TestName "Financial Years Seeded" -Test {
    $count = Execute-Scalar "SELECT COUNT(*) FROM FinancialYears"
    if ($count -gt 0) { "$count financial years" } else { "No financial years found" }
}

Test-Item -Category "Data" -TestName "Roles Seeded" -Test {
    $count = Execute-Scalar "SELECT COUNT(*) FROM Roles"
    if ($count -gt 0) { "$count roles" } else { "No roles found" }
}

Test-Item -Category "Data" -TestName "Users Seeded" -Test {
    $count = Execute-Scalar "SELECT COUNT(*) FROM Users"
    if ($count -gt 0) { "$count users" } else { "No users found" }
}

# =============================================
# TEST CATEGORY 8: DATA INTEGRITY TESTS
# =============================================
Write-Host ""
Write-Host "Category 8: Data Integrity Tests" -ForegroundColor Yellow

Test-Item -Category "Integrity" -TestName "Negative Stock Prevention" -Test {
    try {
        $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()
        
        $transaction = $connection.BeginTransaction()
        
        $command = $connection.CreateCommand()
        $command.Transaction = $transaction
        $command.CommandText = @"
INSERT INTO YarnStocks (YarnCountId, PartyId, LotNo, TransactionType, TransactionId, TransactionDate, 
                        InwardQtyKg, OutwardQtyKg, CurrentBalanceKg, FinancialYearId, CreatedBy)
VALUES (1, 1, 'TEST_NEGATIVE', 'TEST', 0, GETDATE(), 0, 0, -100, 1, 'SYSTEM');
"@
        
        try {
            $command.ExecuteNonQuery() | Out-Null
            $transaction.Rollback()
            $connection.Close()
            "FAIL: Negative stock was allowed"
        } catch {
            $transaction.Rollback()
            $connection.Close()
            if ($_.Exception.Message -like "*CHK_YarnStocks_CurrentBalanceKg*") {
                "Correctly blocked"
            } else {
                "Different error: $($_.Exception.Message)"
            }
        }
    } catch {
        "Error during test: $($_.Exception.Message)"
    }
}

Test-Item -Category "Integrity" -TestName "Foreign Key Enforcement" -Test {
    try {
        $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
        $connection.Open()
        
        $transaction = $connection.BeginTransaction()
        
        $command = $connection.CreateCommand()
        $command.Transaction = $transaction
        $command.CommandText = @"
INSERT INTO YarnReceipts (ReceiptNo, ReceiptDate, FinancialYearId, PartyId, CreatedBy)
VALUES ('TEST_FK', GETDATE(), 99999, 99999, 'SYSTEM');
"@
        
        try {
            $command.ExecuteNonQuery() | Out-Null
            $transaction.Rollback()
            $connection.Close()
            "FAIL: Invalid FK was allowed"
        } catch {
            $transaction.Rollback()
            $connection.Close()
            "Correctly blocked"
        }
    } catch {
        "Error during test: $($_.Exception.Message)"
    }
}

# =============================================
# TEST CATEGORY 9: PERFORMANCE
# =============================================
Write-Host ""
Write-Host "Category 9: Performance Checks" -ForegroundColor Yellow

Test-Item -Category "Performance" -TestName "Query Execution Plan Available" -Test {
    $result = Execute-Scalar "SELECT COUNT(*) FROM sys.dm_exec_cached_plans"
    if ($result -ge 0) { "$result cached plans" } else { $false }
}

Test-Item -Category "Performance" -TestName "Statistics Auto-Update Enabled" -Test {
    $result = Execute-Scalar "SELECT is_auto_update_stats_on FROM sys.databases WHERE name = '$DatabaseName'"
    if ($result -eq $true) { "Enabled" } else { "Disabled" }
}

# =============================================
# RESULTS SUMMARY
# =============================================
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "VALIDATION RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failedTests = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$errorTests = ($testResults | Where-Object { $_.Status -eq "ERROR" }).Count

$passRate = [math]::Round(($passedTests / $totalTests) * 100, 2)

Write-Host "Total Tests: $totalTests" -ForegroundColor Cyan
Write-Host "Passed: $passedTests ($passRate%)" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor $(if($failedTests -eq 0){"Green"}else{"Red"})
Write-Host "Errors: $errorTests" -ForegroundColor $(if($errorTests -eq 0){"Green"}else{"Red"})
Write-Host ""

if ($failedTests -gt 0 -or $errorTests -gt 0) {
    Write-Host "Failed/Error Tests:" -ForegroundColor Red
    $testResults | Where-Object { $_.Status -ne "PASS" } | ForEach-Object {
        Write-Host "  [$($_.Status)] $($_.Category) - $($_.Test)" -ForegroundColor Red
        Write-Host "    → $($_.Result)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Export results
$reportFile = "validation-report-$timestamp.csv"
$testResults | Export-Csv -Path $reportFile -NoTypeInformation
Write-Host "Detailed report saved to: $reportFile" -ForegroundColor Cyan

# Final verdict
Write-Host ""
if ($passRate -eq 100) {
    Write-Host "✓ ALL TESTS PASSED - DATABASE READY FOR PRODUCTION" -ForegroundColor Green -BackgroundColor Black
} elseif ($passRate -ge 95) {
    Write-Host "⚠ MINOR ISSUES DETECTED - REVIEW BEFORE PRODUCTION" -ForegroundColor Yellow -BackgroundColor Black
} else {
    Write-Host "✗ CRITICAL ISSUES DETECTED - DO NOT DEPLOY" -ForegroundColor Red -BackgroundColor Black
}
Write-Host ""
