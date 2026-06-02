@echo off
REM ══════════════════════════════════════════════════════════════════════════════════════
REM  Sudhan Textile ERP - Production Install Script
REM  Run this ONCE on the server/PC to build and prepare for production use.
REM ══════════════════════════════════════════════════════════════════════════════════════

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║              SUDHAN TEXTILE ERP - PRODUCTION SETUP                               ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.

REM ── 1. Get this machine's LAN IP ─────────────────────────────────────────────────────
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set LAN_IP=%%a
    goto :got_ip
)
:got_ip
set LAN_IP=%LAN_IP: =%
echo [INFO] Detected LAN IP: %LAN_IP%
echo.

REM ── 2. Build Frontend ────────────────────────────────────────────────────────────────
echo [1/3] Building frontend (this takes 1-2 minutes)...
cd /d "%~dp0frontend"

REM Write production .env
(
  echo NEXT_PUBLIC_API_URL=http://%LAN_IP%:5000
) > .env.production

call npm install
call npm run build

if errorlevel 1 (
    echo.
    echo ERROR: Frontend build failed. Check Node.js is installed ^(node --version^).
    pause
    exit /b 1
)
echo [OK] Frontend built.
echo.

REM ── 3. Generate a strong JWT secret ──────────────────────────────────────────────────
echo [2/3] Generating secure JWT key...
for /f %%i in ('powershell -command "[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))"') do set JWT_SECRET=%%i
echo [OK] JWT secret: %JWT_SECRET%
echo.

REM ── 4. Write production appsettings ──────────────────────────────────────────────────
echo [3/3] Writing backend production config...
cd /d "%~dp0backend\SudhanTextileERP.API"

(
  echo {
  echo   "Logging": {
  echo     "LogLevel": {
  echo       "Default": "Warning",
  echo       "Microsoft.AspNetCore": "Warning"
  echo     }
  echo   },
  echo   "AllowedHosts": "*",
  echo   "ConnectionStrings": {
  echo     "DefaultConnection": "Data Source=%~dp0backend\SudhanTextileERP.API\SudhanTextileERP.db",
  echo     "DatabaseProvider": "SQLite"
  echo   },
  echo   "JwtSettings": {
  echo     "SecretKey": "%JWT_SECRET%",
  echo     "Issuer": "SudhanTextileERP",
  echo     "Audience": "SudhanTextileERPUsers",
  echo     "ExpiryMinutes": 480
  echo   },
  echo   "CorsSettings": {
  echo     "AllowedOrigins": ["http://localhost:3000", "http://%LAN_IP%:3000"]
  echo   },
  echo   "Security": {
  echo     "RequireHttps": false,
  echo     "EnableRateLimiting": true,
  echo     "MaxLoginAttempts": 10,
  echo     "LockoutDurationMinutes": 5,
  echo     "ForcePasswordChangeOnFirstLogin": false
  echo   }
  echo }
) > appsettings.Production.json

echo [OK] Production config written.
echo.

REM ── 5. Open Windows Firewall ports ───────────────────────────────────────────────────
echo Opening firewall ports 3000 and 5000...
netsh advfirewall firewall add rule name="ERP Frontend (3000)" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
netsh advfirewall firewall add rule name="ERP Backend  (5000)" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
echo [OK] Firewall rules added.
echo.

echo ══════════════════════════════════════════════════════════════════════════════════
echo  SETUP COMPLETE!
echo.
echo  To START the ERP, run:  start-production.bat
echo.
echo  Staff access URL:  http://%LAN_IP%:3000
echo  (Share this URL with all staff on the same WiFi/LAN)
echo ══════════════════════════════════════════════════════════════════════════════════
echo.
pause
