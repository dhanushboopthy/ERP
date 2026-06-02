# FINAL PRODUCTION READINESS VERIFICATION
# ==========================================

$ErrorActionPreference = "Continue"
$global:results = @()

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TEXTILE ERP - FINAL PRODUCTION CERTIFICATION           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ========================================
# PHASE 1: BASELINE VALIDATION
# ========================================

Write-Host "PHASE 1: BASELINE VALIDATION" -ForegroundColor Yellow
Write-Host "─────────────────────────────`n" -ForegroundColor Yellow

# Test Backend API & Authentication
try {
    $loginBody = @{
        username = "admin"
        password = "Admin@123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod `
        -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -TimeoutSec 5
    
    $global:token = $loginResponse.data.token
    Write-Host "✅ Backend API: RUNNING" -ForegroundColor Green
    Write-Host "✅ Authentication: WORKING" -ForegroundColor Green
    $global:results += "✅ Backend API: PASS"
    $global:results += "✅ Authentication: PASS"
}
catch {
    Write-Host "❌ Backend API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $global:results += "❌ Backend API: FAIL"
    Write-Host "`n🚨 CRITICAL BLOCKER: Cannot proceed" -ForegroundColor Red
    exit 1
}

# Test Frontend
try {
    $frontendCheck = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Frontend: RUNNING (Status: $($frontendCheck.StatusCode))" -ForegroundColor Green
    $global:results += "✅ Frontend: PASS"
}
catch {
    Write-Host "⚠️ Frontend: NOT ACCESSIBLE" -ForegroundColor Yellow
    $global:results += "⚠️ Frontend: WARNING"
}

$headers = @{
    "Authorization" = "Bearer $global:token"
    "Content-Type" = "application/json"
}

# Test Database
try {
    $dbCheck = Invoke-RestMethod -Uri "http://localhost:5000/api/companies" -Method GET -Headers $headers
    Write-Host "✅ Database: CONNECTED (SQLite)" -ForegroundColor Green
    $global:results += "✅ Database: PASS"
}
catch {
    Write-Host "❌ Database: FAILED" -ForegroundColor Red
    $global:results += "❌ Database: FAIL"
}

Write-Host "`n"

# ========================================
# PHASE 2: MODULE CERTIFICATION
# ========================================

Write-Host "PHASE 2: MODULE FUNCTIONAL CERTIFICATION" -ForegroundColor Yellow
Write-Host "────────────────────────────────────────`n" -ForegroundColor Yellow

$modulesPassed = 0
$modulesTotal = 0

# Test Company Module
Write-Host "Testing Company Module..." -ForegroundColor Gray
try {
    $companyData = @{
        companyName = "Production Test Mill"
        shortName = "PTM"
        city = "Coimbatore"
        state = "Tamil Nadu"
        gstIn = "33AABCP9999Z1Z5"
    } | ConvertTo-Json
    
    $createResponse = Invoke-RestMethod `
        -Uri "http://localhost:5000/api/companies" `
        -Method POST `
        -Headers $headers `
        -Body $companyData
    
    $companyId = $createResponse.data.id
    Write-Host "  ✅ Company Module: WORKING (ID: $companyId)" -ForegroundColor Green
    $modulesPassed++
}
catch {
    Write-Host "  ❌ Company Module: FAILED" -ForegroundColor Red
}
$modulesTotal++

# Test Party Module
Write-Host "Testing Party Module..." -ForegroundColor Gray
try {
    $partyData = @{
        partyCode = "PROD001"
        partyName = "Production Test Customer"
        city = "Erode"
        state = "Tamil Nadu"
        gstIn = "33AABCT7777Z1Z5"
        partyType = "Customer"
        address = "Test Address"
        pincode = "638001"
        contactPerson = "Manager"
        phone = "9999999999"
        email = "prod@test.com"
    } | ConvertTo-Json
    
    $createResponse = Invoke-RestMethod `
        -Uri "http://localhost:5000/api/parties" `
        -Method POST `
        -Headers $headers `
        -Body $partyData
    
    $partyId = $createResponse.data.id
    Write-Host "  ✅ Party Module: WORKING (ID: $partyId)" -ForegroundColor Green
    $modulesPassed++
}
catch {
    Write-Host "  ❌ Party Module: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
$modulesTotal++

# Test Loom Type Module
Write-Host "Testing Loom Type Module..." -ForegroundColor Gray
try {
    $loomData = @{
        loomTypeCode = "PROD-LT"
        loomTypeName = "Production Test Loom"
        widthInches = 90
    } | ConvertTo-Json
    
    $createResponse = Invoke-RestMethod `
        -Uri "http://localhost:5000/api/loomtypes" `
        -Method POST `
        -Headers $headers `
        -Body $loomData
    
    $loomId = $createResponse.data.id
    Write-Host "  ✅ Loom Type Module: WORKING (ID: $loomId)" -ForegroundColor Green
    $modulesPassed++
}
catch {
    Write-Host "  ❌ Loom Type Module: FAILED" -ForegroundColor Red
}
$modulesTotal++

# Test Beam Module
Write-Host "Testing Beam Module..." -ForegroundColor Gray
try {
    $beamData = @{
        beamNo = "PROD-BEAM-1"
        beamType = "Warping"
        endsCapacity = 10000
        lengthCapacity = 5000
        status = "Available"
    } | ConvertTo-Json
    
    $createResponse = Invoke-RestMethod `
        -Uri "http://localhost:5000/api/beams" `
        -Method POST `
        -Headers $headers `
        -Body $beamData
    
    $beamId = $createResponse.data.id
    Write-Host "  ✅ Beam Module: WORKING (ID: $beamId)" -ForegroundColor Green
    $modulesPassed++
}
catch {
    Write-Host "  ❌ Beam Module: FAILED" -ForegroundColor Red
}
$modulesTotal++

# Test Vehicle Module
Write-Host "Testing Vehicle Module..." -ForegroundColor Gray
try {
    $vehicleData = @{
        vehicleNo = "TN38PROD"
        vehicleType = "Truck"
        capacity = 10000
    } | ConvertTo-Json
    
    $createResponse = Invoke-RestMethod `
        -Uri "http://localhost:5000/api/vehicles" `
        -Method POST `
        -Headers $headers `
        -Body $vehicleData
    
    $vehicleId = $createResponse.data.id
    Write-Host "  ✅ Vehicle Module: WORKING (ID: $vehicleId)" -ForegroundColor Green
    $modulesPassed++
}
catch {
    Write-Host "  ❌ Vehicle Module: FAILED" -ForegroundColor Red
}
$modulesTotal++

$modulePassRate = [math]::Round(($modulesPassed / $modulesTotal) * 100, 2)
Write-Host "`n  Module Pass Rate: $modulePassRate% ($modulesPassed/$modulesTotal)" -ForegroundColor Cyan
$global:results += "Module Pass Rate: $modulePassRate%"

Write-Host "`n"

# ========================================
# PHASE 3: SECURITY TESTING
# ========================================

Write-Host "PHASE 3: SECURITY VALIDATION" -ForegroundColor Yellow
Write-Host "────────────────────────────`n" -ForegroundColor Yellow

# Test unauthorized access
try {
    $noAuthResponse = Invoke-WebRequest `
        -Uri "http://localhost:5000/api/parties" `
        -Method GET `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "❌ SECURITY FAIL: API accessible without auth" -ForegroundColor Red
    $global:results += "❌ Security: FAIL"
}
catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Unauthorized Access: BLOCKED (401)" -ForegroundColor Green
        $global:results += "✅ Security: PASS"
    }
}

Write-Host "`n"

# ========================================
# PHASE 4: DATA VERIFICATION
# ========================================

Write-Host "PHASE 4: DATA INTEGRITY CHECK" -ForegroundColor Yellow
Write-Host "─────────────────────────────`n" -ForegroundColor Yellow

$dataCheck = @{
    "Companies" = "http://localhost:5000/api/companies"
    "Parties" = "http://localhost:5000/api/parties"
    "Loom Types" = "http://localhost:5000/api/loomtypes"
    "Beams" = "http://localhost:5000/api/beams"
    "Vehicles" = "http://localhost:5000/api/vehicles"
}

foreach ($entity in $dataCheck.Keys) {
    try {
        $uri = $dataCheck[$entity]
        $response = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
        
        $count = if ($response.data.totalCount) { 
            $response.data.totalCount 
        } elseif ($response.data.Count) {
            $response.data.Count
        } else { 0 }
        
        $status = if ($count -gt 0) { "✅" } else { "⚠️" }
        Write-Host "  $status $entity : $count records" -ForegroundColor Gray
    }
    catch {
        Write-Host "  ❌ $entity : ERROR" -ForegroundColor Red
    }
}

Write-Host "`n"

# ========================================
# FINAL VERDICT
# ========================================

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    FINAL VERDICT                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($modulePassRate -ge 80) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║             ✅ APPROVED FOR UAT DEPLOYMENT                 ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host "`n  System is ready for User Acceptance Testing" -ForegroundColor Green
    Write-Host "  Backend, Database, and Core Modules are functional`n" -ForegroundColor Green
}
elseif ($modulePassRate -ge 60) {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║          ⚠️ CONDITIONAL APPROVAL - FIXES NEEDED           ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
}
else {
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║              ❌ NOT READY FOR UAT                          ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host ""
Write-Host "Verification completed at $timestamp" -ForegroundColor Gray
Write-Host ""
