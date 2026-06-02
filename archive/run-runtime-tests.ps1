# ========================================
# TEXTILE ERP - END-TO-END RUNTIME TEST SUITE
# ========================================

$ErrorActionPreference = "Continue"
$global:authToken = ""
$global:testResults = @()

function Write-TestResult {
    param($TestName, $Status, $Details)
    $result = [PSCustomObject]@{
        Test = $TestName
        Status = $Status
        Details = $Details
        Timestamp = Get-Date -Format "HH:mm:ss"
    }
    $global:testResults += $result
    
    $color = switch($Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "SKIP" { "Yellow" }
        default { "White" }
    }
    
    Write-Host "[$Status] $TestName - $Details" -ForegroundColor $color
}

function Invoke-APITest {
    param($Method, $Endpoint, $Body = $null, $Description)
    
    $headers = @{
        "Authorization" = "Bearer $global:authToken"
        "Content-Type" = "application/json"
    }
    
    try {
        $params = @{
            Uri = "http://localhost:5000$Endpoint"
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        Write-TestResult $Description "PASS" "Status: Success"
        return $response
    }
    catch {
        Write-TestResult $Description "FAIL" "Error: $($_.Exception.Message)"
        return $null
    }
}

# ========================================
# TEST 1: AUTHENTICATION
# ========================================

Write-Host "`n========== TEST 1: AUTHENTICATION ==========`n" -ForegroundColor Cyan

$loginBody = @{
    username = "admin"
    password = "Admin@123"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
    $global:authToken = $response.data.token
    Write-TestResult "Admin Login" "PASS" "Token received, Role: $($response.data.user.roleName)"
}
catch {
    Write-TestResult "Admin Login" "FAIL" $_.Exception.Message
    Write-Host "CRITICAL: Cannot proceed without authentication" -ForegroundColor Red
    exit 1
}

# ========================================
# TEST 2: MASTER DATA CRUD
# ========================================

Write-Host "`n========== TEST 2: MASTER DATA CRUD ==========`n" -ForegroundColor Cyan

# 2.1 Company Master
$companyData = @{
    companyName = "Sudhan Textile Mills Pvt Ltd"
    shortName = "STMPL"
    addressLine1 = "123 Industrial Estate"
    city = "Erode"
    state = "Tamil Nadu"
    stateCode = "33"
    pincode = "638001"
    country = "India"
    phone = "0424-2345678"
    email = "info@sudhantextile.com"
    gstIn = "33AABCS1234A1Z5"
    pan = "AABCS1234A"
    bankName = "State Bank of India"
    bankAccountNo = "38574950238"
    bankIFSC = "SBIN0001234"
}

$company = Invoke-APITest "POST" "/api/companies" $companyData "Create Company Master"
$global:companyId = $company.data.id

# 2.2 Party Master (already created, create more)
$parties = @(
    @{ partyCode = "TST002"; partyName = "Raja Spinning Mills"; city = "Coimbatore"; gstIn = "33AABCR5678B1Z5"; partyType = "Supplier" },
    @{ partyCode = "TST003"; partyName = "Kumar Textiles"; city = "Tirupur"; gstIn = "33AABCK9012C1Z5"; partyType = "Customer" }
)

foreach ($partyData in $parties) {
    $partyData.address = "Industrial Area"
    $partyData.state = "Tamil Nadu"
    $partyData.pincode = "638001"
    $partyData.contactPerson = "Manager"
    $partyData.phone = "9876543210"
    $partyData.email = "contact@example.com"
    
    $party = Invoke-APITest "POST" "/api/parties" $partyData "Create Party: $($partyData.partyName)"
}

# 2.3 Yarn Count Master
$yarnCounts = @(
    @{ countCode = "30s 2/100"; countDescription = "30s Double 100 Ply"; ply = 2 },
    @{ countCode = "40s 2/100"; countDescription = "40s Double 100 Ply"; ply = 2 },
    @{ countCode = "60s 2/80"; countDescription = "60s Double 80 Ply"; ply = 2 }
)

foreach ($yarnCount in $yarnCounts) {
    $yarn = Invoke-APITest "POST" "/api/yarncounts" $yarnCount "Create Yarn Count: $($yarnCount.countCode)"
    if ($yarnCount.countCode -eq "30s 2/100") {
        $global:yarnCountId = $yarn.data.id
    }
}

# 2.4 Loom Type Master
$loomTypes = @(
    @{ loomTypeCode = "LT190"; loomTypeName = "Rapier 190cm"; widthInches = 75 },
    @{ loomTypeCode = "LT230"; loomTypeName = "Air Jet 230cm"; widthInches = 90 }
)

foreach ($loomType in $loomTypes) {
    $loom = Invoke-APITest "POST" "/api/loomtypes" $loomType "Create Loom Type: $($loomType.loomTypeName)"
    if ($loomType.loomTypeCode -eq "LT190") {
        $global:loomTypeId = $loom.data.id
    }
}

# 2.5 Beam Master
$beams = @()
for ($i = 1; $i -le 10; $i++) {
    $beamData = @{
        beamNo = "BEAM$($i.ToString('000'))"
        beamType = "Warping"
        endsCapacity = 10000
        lengthCapacity = 5000
        status = "Available"
        currentLocation = "Warehouse"
    }
    $beam = Invoke-APITest "POST" "/api/beams" $beamData "Create Beam: $($beamData.beamNo)"
    if ($i -le 5) {
        $beams += $beam.data.id
    }
}
$global:beamIds = $beams

# 2.6 Vehicle Master
$vehicleData = @{
    vehicleNo = "TN38AB1234"
    vehicleType = "Truck"
    capacity = 10000
    ownerName = "Transport Services"
}
$vehicle = Invoke-APITest "POST" "/api/vehicles" $vehicleData "Create Vehicle: $($vehicleData.vehicleNo)"
$global:vehicleId = $vehicle.data.id

# ========================================
# TEST 3: VERIFY MASTER DATA
# ========================================

Write-Host "`n========== TEST 3: VERIFY MASTER DATA ==========`n" -ForegroundColor Cyan

$masterChecks = @{
    "/api/companies" = "Companies"
    "/api/parties?pageNumber=1&pageSize=100" = "Parties"
    "/api/yarncounts?pageNumber=1&pageSize=100" = "Yarn Counts"
    "/api/loomtypes?pageNumber=1&pageSize=100" = "Loom Types"
    "/api/beams?pageNumber=1&pageSize=100" = "Beams"
    "/api/vehicles?pageNumber=1&pageSize=100" = "Vehicles"
}

foreach ($endpoint in $masterChecks.Keys) {
    $response = Invoke-APITest "GET" $endpoint $null "Verify $($masterChecks[$endpoint])"
    if ($response) {
        $count = if ($response.data.items) { $response.data.items.Count } elseif ($response.data.totalCount) { $response.data.totalCount } else { $response.data.Count }
        Write-Host "  → Found $count record(s)" -ForegroundColor Gray
    }
}

# ========================================
# TEST 4: YARN RECEIPT → STOCK CREATION
# ========================================

Write-Host "`n========== TEST 4: YARN RECEIPT WORKFLOW ==========`n" -ForegroundColor Cyan

# Get party ID
$partiesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/parties?pageNumber=1&pageSize=1" -Method GET -Headers @{ Authorization = "Bearer $global:authToken" }
$partyId = $partiesResponse.data.items[0].id

$yarnReceiptData = @{
    receiptDate = (Get-Date).ToString("yyyy-MM-dd")
    partyId = $partyId
    vehicleId = $global:vehicleId
    vehicleNo = "TN38AB1234"
    driverName = "Kumar"
    remarks = "Test Receipt"
    details = @(
        @{
            yarnCountId = $global:yarnCountId
            lotNo = "LOT001"
            bagNo = "B001"
            grossWeight = 100.5
            tareWeight = 0.5
            coneCount = 20
            ratePerKg = 250.50
        }
    )
}

$yarnReceipt = Invoke-APITest "POST" "/api/yarnreceipts" $yarnReceiptData "Create Yarn Receipt"
$global:yarnReceiptId = $yarnReceipt.data.id

# Verify stock creation
Start-Sleep -Seconds 1
Write-Host "`n  Checking if yarn stock was created automatically..." -ForegroundColor Gray
# Note: Need to implement stock API endpoint verification

# ========================================
# SUMMARY
# ========================================

Write-Host "`n========== TEST SUMMARY ==========`n" -ForegroundColor Cyan

$passCount = ($global:testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($global:testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$skipCount = ($global:testResults | Where-Object { $_.Status -eq "SKIP" }).Count
$totalCount = $global:testResults.Count

Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host "Skipped: $skipCount" -ForegroundColor Yellow

$passRate = [math]::Round(($passCount / $totalCount) * 100, 2)
Write-Host "`nPass Rate: $passRate%" -ForegroundColor $(if($passRate -ge 90) { "Green" } elseif($passRate -ge 70) { "Yellow" } else { "Red" })

Write-Host "`n========== DETAILED RESULTS ==========`n" -ForegroundColor Cyan
$global:testResults | Format-Table -Auto Timestamp, Status, Test, Details

# Export results
$global:testResults | Export-Csv -Path "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv" -NoTypeInformation
Write-Host "`nResults exported to CSV file" -ForegroundColor Green
