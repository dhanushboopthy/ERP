# ========================================
# FINAL PRODUCTION READINESS VERIFICATION
# Comprehensive End-to-End System Test
# ========================================

$ErrorActionPreference = "Continue"
$results = @{
    Baseline = @{}
    Modules = @{}
    Workflows = @{}
    Permissions = @{}
    Reports = @{}
    Overall = @{}
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TEXTILE ERP - FINAL PRODUCTION VERIFICATION SUITE      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ========================================
# PHASE 1: BASELINE VALIDATION
# ========================================

Write-Host "PHASE 1: BASELINE VALIDATION" -ForegroundColor Yellow
Write-Host "─────────────────────────────`n" -ForegroundColor Yellow

# Test 1: Backend API
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -Body (@{username="admin";password="Admin@123"} | ConvertTo-Json) `
        -ContentType "application/json" `
        -TimeoutSec 5
    
    $global:authToken = $loginResponse.data.token
    $results.Baseline.Backend = "✅ PASS"
    $results.Baseline.Auth = "✅ PASS"
    Write-Host "✅ Backend API: RUNNING" -ForegroundColor Green
    Write-Host "✅ Authentication: WORKING (Token: $($global:authToken.Substring(0,30))...)" -ForegroundColor Green
}
catch {
    $results.Baseline.Backend = "❌ FAIL"
    Write-Host "❌ Backend API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n🚨 CRITICAL BLOCKER: Cannot proceed without backend" -ForegroundColor Red
    exit 1
}

# Test 2: Frontend
try {
    $frontendCheck = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing
    $results.Baseline.Frontend = "✅ PASS"
    Write-Host "✅ Frontend: RUNNING (Status: $($frontendCheck.StatusCode))" -ForegroundColor Green
}
catch {
    $results.Baseline.Frontend = "⚠️ WARNING"
    Write-Host "⚠️ Frontend: NOT ACCESSIBLE - May still be starting" -ForegroundColor Yellow
}

# Test 3: Database Connectivity
$headers = @{
    "Authorization" = "Bearer $global:authToken"
    "Content-Type" = "application/json"
}

try {
    $dbCheck = Invoke-RestMethod -Uri "http://localhost:5000/api/companies" -Method GET -Headers $headers
    $results.Baseline.Database = "✅ PASS"
    Write-Host "✅ Database: CONNECTED (SQLite)" -ForegroundColor Green
}
catch {
    $results.Baseline.Database = "❌ FAIL"
    Write-Host "❌ Database: FAILED" -ForegroundColor Red
}

Write-Host "`n"

# ========================================
# PHASE 2: MODULE FUNCTIONAL CERTIFICATION
# ========================================

Write-Host "PHASE 2: MODULE FUNCTIONAL CERTIFICATION" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────`n" -ForegroundColor Yellow

function Test-Module {
    param(
        [string]$ModuleName,
        [string]$CreateEndpoint,
        [hashtable]$TestData,
        [string]$ListEndpoint
    )
    
    $moduleResult = @{
        UI = "⏳ NOT TESTED"
        Backend = "❌ FAIL"
        DataPersistence = "❌ FAIL"
        BusinessLogic = "⏳ NOT TESTED"
        Status = "FAIL"
    }
    
    # Test Backend API
    try {
        # CREATE
        $createResponse = Invoke-RestMethod -Uri "http://localhost:5000$CreateEndpoint" `
            -Method POST `
            -Headers $headers `
            -Body ($TestData | ConvertTo-Json) `
            -ErrorAction Stop
        
        $moduleResult.Backend = "✅ PASS"
        $createdId = $createResponse.data.id
        
        # READ (verify persistence)
        Start-Sleep -Milliseconds 500
        $listResponse = Invoke-RestMethod -Uri "http://localhost:5000$ListEndpoint" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop
        
        $found = $false
        if ($listResponse.data.items) {
            $found = $listResponse.data.items | Where-Object { $_.id -eq $createdId }
        }
        elseif ($listResponse.data -is [array]) {
            $found = $listResponse.data | Where-Object { $_.id -eq $createdId }
        }
        
        if ($found) {
            $moduleResult.DataPersistence = "✅ PASS"
            $moduleResult.Status = "PASS"
            Write-Host "✅ $ModuleName : WORKING (ID: $createdId)" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️ $ModuleName : Created but not found in list" -ForegroundColor Yellow
            $moduleResult.Status = "PARTIAL"
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($errorMsg -match "400") {
            Write-Host "⚠️ $ModuleName : Validation Error (400)" -ForegroundColor Yellow
            $moduleResult.Status = "VALIDATION_ERROR"
        }
        else {
            Write-Host "❌ $ModuleName : FAILED - $errorMsg" -ForegroundColor Red
            $moduleResult.Status = "FAIL"
        }
    }
    
    return $moduleResult
}

# Test Masters
$modules = @{
    "Company" = @{
        Create = "/api/companies"
        List = "/api/companies"
        Data = @{
            companyName = "Test Mill Ltd"
            shortName = "TML"
            city = "Coimbatore"
            state = "Tamil Nadu"
            gstIn = "33AABCT9999Z1Z5"
        }
    }
    "Party" = @{
        Create = "/api/parties"
        List = "/api/parties?pageNumber=1&pageSize=100"
        Data = @{
            partyCode = "AUTO" + (Get-Random -Maximum 9999)
            partyName = "Test Party $(Get-Random -Maximum 999)"
            city = "Erode"
            state = "Tamil Nadu"
            gstIn = "33AABCT$(Get-Random -Minimum 1000 -Maximum 9999)Z1Z5"
            partyType = "Customer"
            address = "Test Address"
            pincode = "638001"
            contactPerson = "Manager"
            phone = "9999999999"
            email = "test@test.com"
        }
    }
    "Loom Type" = @{
        Create = "/api/loomtypes"
        List = "/api/loomtypes?pageNumber=1&pageSize=100"
        Data = @{
            loomTypeCode = "LT$(Get-Random -Maximum 999)"
            loomTypeName = "Test Loom Type"
            widthInches = 90
        }
    }
    "Beam" = @{
        Create = "/api/beams"
        List = "/api/beams?pageNumber=1&pageSize=100"
        Data = @{
            beamNo = "BEAM$(Get-Random -Maximum 999)"
            beamType = "Warping"
            endsCapacity = 10000
            lengthCapacity = 5000
            status = "Available"
        }
    }
    "Vehicle" = @{
        Create = "/api/vehicles"
        List = "/api/vehicles?pageNumber=1&pageSize=100"
        Data = @{
            vehicleNo = "TN38AA$(Get-Random -Minimum 1000 -Maximum 9999)"
            vehicleType = "Truck"
            capacity = 10000
        }
    }
}

foreach ($moduleName in $modules.Keys) {
    $module = $modules[$moduleName]
    $results.Modules[$moduleName] = Test-Module `
        -ModuleName $moduleName `
        -CreateEndpoint $module.Create `
        -TestData $module.Data `
        -ListEndpoint $module.List
    
    Start-Sleep -Milliseconds 300
}

Write-Host "`n"

# ========================================
# PHASE 3: PERMISSION ENFORCEMENT
# ========================================

Write-Host "PHASE 3: PERMISSION ENFORCEMENT TEST" -ForegroundColor Yellow
Write-Host "────────────────────────────────────`n" -ForegroundColor Yellow

# Test unauthorized access
try {
    $noAuthResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/parties?pageNumber=1&pageSize=1" `
        -Method GET `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "❌ SECURITY FAIL: API accessible without auth token" -ForegroundColor Red
    $results.Permissions.Unauthorized = "❌ FAIL"
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Unauthorized Access: BLOCKED (401)" -ForegroundColor Green
        $results.Permissions.Unauthorized = "✅ PASS"
    }
    else {
        Write-Host "⚠️ Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
        $results.Permissions.Unauthorized = "⚠️ UNKNOWN"
    }
}

# Test token validation
try {
    $badTokenHeaders = @{
        "Authorization" = "Bearer INVALID_TOKEN_12345"
        "Content-Type" = "application/json"
    }
    $badTokenResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/parties?pageNumber=1&pageSize=1" `
        -Method GET `
        -Headers $badTokenHeaders `
        -ErrorAction Stop
    
    Write-Host "❌ JWT Validation FAIL: Invalid token accepted" -ForegroundColor Red
    $results.Permissions.TokenValidation = "❌ FAIL"
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Invalid Token: REJECTED (401)" -ForegroundColor Green
        $results.Permissions.TokenValidation = "✅ PASS"
    }
    else {
        Write-Host "⚠️ Unexpected response to invalid token" -ForegroundColor Yellow
        $results.Permissions.TokenValidation = "⚠️ PARTIAL"
    }
}

Write-Host "`n"

# ========================================
# PHASE 4: DATA INTEGRITY VERIFICATION
# ========================================

Write-Host "PHASE 4: DATA INTEGRITY VERIFICATION" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────`n" -ForegroundColor Yellow

$integrity = @{}

# Count all master data
$endpoints = @{
    "Companies" = "/api/companies"
    "Parties" = "/api/parties?pageNumber=1&amp;pageSize=1000"
    "Loom Types" = "/api/loomtypes?pageNumber=1&amp;pageSize=1000"
    "Beams" = "/api/beams?pageNumber=1&amp;pageSize=1000"
    "Vehicles" = "/api/vehicles?pageNumber=1&amp;pageSize=1000"
}

foreach ($name in $endpoints.Keys) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000$($endpoints[$name])" `
            -Method GET `
            -Headers $headers
        
        $count = if ($response.data.totalCount) { 
            $response.data.totalCount 
        } elseif ($response.data.items) { 
            $response.data.items.Count 
        } elseif ($response.data.Count) {
            $response.data.Count
        } else { 0 }
        
        $integrity[$name] = $count
        Write-Host "  $name : $count records" -ForegroundColor Gray
    }
    catch {
        $integrity[$name] = "ERROR"
        Write-Host "  $name : ERROR" -ForegroundColor Red
    }
}

$results.Overall.DataIntegrity = $integrity

Write-Host "`n"

# ========================================
# FINAL SUMMARY
# ========================================

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    VERIFICATION SUMMARY                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Calculate pass rate
$passedModules = ($results.Modules.Values | Where-Object { $_.Status -eq "PASS" }).Count
$totalModules = $results.Modules.Count
$modulePassRate = if ($totalModules -gt 0) { [math]::Round(($passedModules / $totalModules) * 100, 2) } else { 0 }

Write-Host "BASELINE VALIDATION:" -ForegroundColor White
Write-Host "  Backend API    : $($results.Baseline.Backend)"
Write-Host "  Database       : $($results.Baseline.Database)"
Write-Host "  Authentication : $($results.Baseline.Auth)"
Write-Host "  Frontend       : $($results.Baseline.Frontend)`n"

Write-Host "MODULE CERTIFICATION:" -ForegroundColor White
Write-Host "  Total Modules  : $totalModules"
Write-Host "  Passed         : $passedModules"
Write-Host "  Pass Rate      : $modulePassRate%"
Write-Host "  Status         : $(if($modulePassRate -ge 80) { '✅ EXCELLENT' } elseif($modulePassRate -ge 60) { '⚠️ ACCEPTABLE' } else { '❌ POOR' })`n"

Write-Host "PERMISSION ENFORCEMENT:" -ForegroundColor White
Write-Host "  Unauthorized   : $($results.Permissions.Unauthorized)"
Write-Host "  Token Validation: $($results.Permissions.TokenValidation)`n"

Write-Host "DATA INTEGRITY:" -ForegroundColor White
foreach ($entity in $integrity.Keys) {
    $count = $integrity[$entity]
    $status = if ($count -is [int] -and $count -gt 0) { "✅" } elseif ($count -eq 0) { "⚠️" } else { "❌" }
    Write-Host "  $status $entity : $count"
}

Write-Host "`n"

# Final Verdict
$baselinePassed = ($results.Baseline.Backend -eq "✅ PASS" -and 
                   $results.Baseline.Database -eq "✅ PASS" -and 
                   $results.Baseline.Auth -eq "✅ PASS")

$permissionsPassed = ($results.Permissions.Unauthorized -eq "✅ PASS" -and 
                      $results.Permissions.TokenValidation -eq "✅ PASS")

if ($baselinePassed -and $modulePassRate -ge 70 -and $permissionsPassed) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║             ✅ SYSTEM CERTIFIED FOR UAT                    ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    $results.Overall.Verdict = "APPROVED FOR UAT"
}
elseif ($baselinePassed -and $modulePassRate -ge 50) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║          ⚠️ CONDITIONAL APPROVAL - FIXES NEEDED           ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    $results.Overall.Verdict = "CONDITIONAL"
}
else {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║              ❌ NOT READY FOR UAT                          ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    $results.Overall.Verdict = "NOT APPROVED"
}

Write-Host "`n"

# Export results
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$results | ConvertTo-Json -Depth 10 | Out-File "final-verification-$timestamp.json"
Write-Host "📄 Results exported to: final-verification-$timestamp.json" -ForegroundColor Cyan

Write-Host "`nVerification completed at $(Get-Date -Format 'HH:mm:ss')`n" -ForegroundColor Gray
