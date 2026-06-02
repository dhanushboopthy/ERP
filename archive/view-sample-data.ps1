# =============================================
# VIEW SAMPLE DATA - Sudhan Textile ERP
# Shows all loaded master and transactional data
# =============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   SUDHAN TEXTILE ERP - SAMPLE DATA" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$apiUrl = "http://localhost:5000/api"

# Function to display data in a nice format
function Show-Data {
    param(
        [string]$Title,
        [string]$Endpoint,
        [array]$Properties
    )
    
    Write-Host "`n--- $Title ---" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$apiUrl/$Endpoint" -Method Get
        
        if ($response -is [array]) {
            $data = $response
        }
        elseif ($response.PSObject.Properties.Name -contains 'data') {
            $data = $response.data
        }
        elseif ($response.PSObject.Properties.Name -contains 'items') {
            $data = $response.items
        }
        else {
            $data = $response
        }
        
        if ($data -and ($data -is [array]) -and $data.Count -gt 0) {
            Write-Host "Total Records: $($data.Count)" -ForegroundColor Green
            $data | Select-Object -Property $Properties | Format-Table -AutoSize
        }
        elseif ($data) {
            Write-Host "Total Records: 1" -ForegroundColor Green
            $data | Select-Object -Property $Properties | Format-List
        }
        else {
            Write-Host "No data found" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Check if API is running
Write-Host "Checking if API is running at $apiUrl..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 5
    Write-Host "✓ API is running" -ForegroundColor Green
}
catch {
    Write-Host "✗ API is not running. Please start the backend first:" -ForegroundColor Red
    Write-Host "  cd backend\SudhanTextileERP.API" -ForegroundColor Yellow
    Write-Host "  dotnet run`n" -ForegroundColor Yellow
    exit
}

# Master Data
Write-Host "`n==================== MASTER DATA ====================" -ForegroundColor Cyan

Show-Data -Title "COMPANIES" `
    -Endpoint "companies" `
    -Properties @("Id", "CompanyName", "City", "GSTIN", "Phone", "Email")

Show-Data -Title "PARTIES (Vendors/Customers)" `
    -Endpoint "parties" `
    -Properties @("Id", "PartyCode", "PartyName", "PartyType", "City", "Mobile", "CreditLimit")

Show-Data -Title "YARN COUNTS" `
    -Endpoint "yarncounts" `
    -Properties @("Id", "CountCode", "CountDescription", "Ply", "IsActive")

Show-Data -Title "LOOM TYPES" `
    -Endpoint "loomtypes" `
    -Properties @("Id", "LoomTypeCode", "LoomTypeName", "WidthInches", "IsActive")

Show-Data -Title "BEAMS" `
    -Endpoint "beams" `
    -Properties @("Id", "BeamNo", "BeamType", "Status", "TareWeight")

Show-Data -Title "VEHICLES" `
    -Endpoint "vehicles" `
    -Properties @("Id", "VehicleNo", "VehicleType", "DriverName", "DriverPhone")

# Transactional Data
Write-Host "`n================ TRANSACTIONAL DATA =================" -ForegroundColor Cyan

Show-Data -Title "YARN RECEIPTS" `
    -Endpoint "yarnreceipts" `
    -Properties @("Id", "DCNo", "ReceiptDate", "PartyName", "TotalWeight", "TotalAmount")

Show-Data -Title "BABY CONES" `
    -Endpoint "babycones" `
    -Properties @("Id", "BabyConeDate", "CountCode", "TotalCones", "GrossWeight", "NetWeight")

Show-Data -Title "WARPING JOB CARDS" `
    -Endpoint "warpingjobcards" `
    -Properties @("Id", "JobCardNo", "JobCardDate", "SetLength", "TotalBeams", "TotalWeight")

Show-Data -Title "SIZING JOB CARDS" `
    -Endpoint "sizingjobcards" `
    -Properties @("Id", "JobCardNo", "JobCardDate", "PartyName", "LoomType", "TotalBeams", "Status")

Show-Data -Title "YARN RETURNS" `
    -Endpoint "yarnreturns" `
    -Properties @("Id", "DCNo", "DCDate", "PartyName", "ReturnType", "TotalWeight")

Show-Data -Title "YARN DELIVERIES" `
    -Endpoint "yarndeliveries" `
    -Properties @("Id", "DCNo", "DeliveryDate", "PartyName", "TotalWeight", "Status")

Show-Data -Title "TAX INVOICES" `
    -Endpoint "taxinvoices" `
    -Properties @("Id", "InvoiceNo", "InvoiceDate", "PartyName", "TotalAmount", "CGST", "SGST")

# Users
Write-Host "`n======================= USERS =======================" -ForegroundColor Cyan

Show-Data -Title "SYSTEM USERS" `
    -Endpoint "users" `
    -Properties @("Id", "Username", "FullName", "Email", "RoleName", "IsActive")

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Data viewing complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Note: The seed data from database/02_SeedData.sql is what's currently loaded." -ForegroundColor Yellow
Write-Host "This includes basic roles, users, and company information.`n" -ForegroundColor Yellow
