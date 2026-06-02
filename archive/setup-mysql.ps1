# Quick Setup Script - Hostinger MySQL Connection

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sudhan Textile ERP - MySQL Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to API project
Set-Location "backend\SudhanTextileERP.API"

# Step 1: Check if packages are restored
Write-Host "[1/5] Restoring NuGet packages..." -ForegroundColor Yellow
dotnet restore
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Packages restored successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Package restore failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Prompt for MySQL credentials
Write-Host "[2/5] MySQL Configuration" -ForegroundColor Yellow
Write-Host "Please enter your Hostinger MySQL credentials:" -ForegroundColor White
Write-Host ""

$dbHost = Read-Host "Database Host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "Database Port (default: 3306)"
if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "3306" }

$dbName = Read-Host "Database Name (e.g., u244866688_sudhan_erp)"
$dbUser = Read-Host "Database Username (e.g., u244866688_erpuser)"
$dbPassword = Read-Host "Database Password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

# Build connection string
$connectionString = "Server=$dbHost;Port=$dbPort;Database=$dbName;Uid=$dbUser;Pwd=$dbPasswordPlain;SslMode=Preferred;"

Write-Host ""
Write-Host "✓ MySQL credentials configured" -ForegroundColor Green

# Step 3: Update appsettings.json
Write-Host ""
Write-Host "[3/5] Updating configuration files..." -ForegroundColor Yellow

# Read appsettings.json
$appsettingsPath = "appsettings.json"
$appsettings = Get-Content $appsettingsPath -Raw | ConvertFrom-Json

# Update connection string
$appsettings.ConnectionStrings.DefaultConnection = $connectionString

# Save updated appsettings.json
$appsettings | ConvertTo-Json -Depth 10 | Set-Content $appsettingsPath

Write-Host "✓ appsettings.json updated" -ForegroundColor Green

# Update appsettings.Production.json
$appsettingsProdPath = "appsettings.Production.json"
if (Test-Path $appsettingsProdPath) {
    $appsettingsProd = Get-Content $appsettingsProdPath -Raw | ConvertFrom-Json
    $appsettingsProd.ConnectionStrings.DefaultConnection = $connectionString
    $appsettingsProd | ConvertTo-Json -Depth 10 | Set-Content $appsettingsProdPath
    Write-Host "✓ appsettings.Production.json updated" -ForegroundColor Green
}

# Step 4: Test database connection
Write-Host ""
Write-Host "[4/5] Testing database connection..." -ForegroundColor Yellow

try {
    # Build the project first
    dotnet build --configuration Release --no-restore
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Project built successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Build failed" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Connection configuration appears valid" -ForegroundColor Green
} catch {
    Write-Host "✗ Connection test failed: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Run migrations
Write-Host ""
Write-Host "[5/5] Creating database schema..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Do you want to create the database tables now? (Y/N)" -ForegroundColor Cyan
$createDb = Read-Host

if ($createDb -eq 'Y' -or $createDb -eq 'y') {
    Write-Host "Creating migration..." -ForegroundColor Yellow
    
    # Remove old migrations if switching from SQLite
    if (Test-Path "Migrations") {
        Write-Host "Removing old migrations..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "Migrations"
    }
    
    # Create new migration
    dotnet ef migrations add InitialMySQLMigration --context ApplicationDbContext
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Migration created" -ForegroundColor Green
        
        Write-Host "Applying migration to database..." -ForegroundColor Yellow
        dotnet ef database update --context ApplicationDbContext
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Database schema created successfully!" -ForegroundColor Green
        } else {
            Write-Host "✗ Migration failed. Please check the error messages above." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✗ Migration creation failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠ Skipping database creation. Run 'dotnet ef database update' manually when ready." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "1. Run the application: dotnet run" -ForegroundColor Gray
Write-Host "2. The app will seed initial data automatically" -ForegroundColor Gray
Write-Host "3. Access Swagger UI at: http://localhost:5000/swagger" -ForegroundColor Gray
Write-Host "4. Default admin credentials:" -ForegroundColor Gray
Write-Host "   Username: admin" -ForegroundColor Gray
Write-Host "   Password: Admin@123" -ForegroundColor Gray
Write-Host ""
Write-Host "For production deployment, see: MYSQL_MIGRATION_COMPLETE_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
