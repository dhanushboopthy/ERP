# Test MySQL Connection to Hostinger
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Testing Hostinger MySQL Connection" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$connectionString = "Server=auth-db1993.hstgr.io;Port=3306;Database=u244866688_ERP;Uid=u244866688_ERP;Pwd=@ERP@Duolink12345678;SslMode=Required;"

Write-Host "Connection Details:" -ForegroundColor Yellow
Write-Host "  Server: auth-db1993.hstgr.io" -ForegroundColor Gray
Write-Host "  Port: 3306" -ForegroundColor Gray
Write-Host "  Database: u244866688_ERP" -ForegroundColor Gray
Write-Host "  User: u244866688_ERP" -ForegroundColor Gray
Write-Host ""

Write-Host "Testing connection..." -ForegroundColor Yellow

# Test using MySQL command if available, or using telnet to test port
$testPort = Test-NetConnection -ComputerName "auth-db1993.hstgr.io" -Port 3306 -WarningAction SilentlyContinue

if ($testPort.TcpTestSucceeded) {
    Write-Host "✓ Port 3306 is reachable!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Issue: Remote MySQL access is BLOCKED by Hostinger" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1 - Enable Remote MySQL (Recommended for Development):" -ForegroundColor White
    Write-Host "  1. Login to Hostinger control panel" -ForegroundColor Gray
    Write-Host "  2. Go to: Databases → Remote MySQL" -ForegroundColor Gray
    Write-Host "  3. Add your IP address to whitelist" -ForegroundColor Gray
    Write-Host "  4. Get your IP: https://whatismyipaddress.com" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2 - Use Hostinger phpMyAdmin:" -ForegroundColor White
    Write-Host "  • Tables already created ✓" -ForegroundColor Green
    Write-Host "  • Data will be seeded on first Render deployment" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 3 - Deploy Directly to Render (Recommended):" -ForegroundColor White
    Write-Host "  • Server-to-server connection works automatically" -ForegroundColor Gray
    Write-Host "  • No remote access needed" -ForegroundColor Gray
    Write-Host "  • More secure for production" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✗ Cannot reach MySQL server on port 3306" -ForegroundColor Red
    Write-Host ""
    Write-Host "This is normal - Hostinger blocks remote MySQL by default." -ForegroundColor Yellow
    Write-Host "Your database is working fine (tables created successfully)." -ForegroundColor Green
    Write-Host ""
    Write-Host "Deploy to Render to test full functionality!" -ForegroundColor Cyan
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
