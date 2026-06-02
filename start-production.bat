@echo off
REM ══════════════════════════════════════════════════════════════════════════════════════
REM  Sudhan Textile ERP - Production Launcher
REM  Run AFTER install-production.bat has been run once.
REM ══════════════════════════════════════════════════════════════════════════════════════

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                    SUDHAN TEXTILE ERP - STARTING                                 ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.

REM ── Start Backend ────────────────────────────────────────────────────────────────────
echo [1/2] Starting Backend API...
start "ERP Backend" cmd /k "cd /d %~dp0backend\SudhanTextileERP.API && set ASPNETCORE_ENVIRONMENT=Production && dotnet run --launch-profile http"

echo Waiting for backend to initialise (8 seconds)...
timeout /t 8 /nobreak >nul

REM ── Start Frontend ───────────────────────────────────────────────────────────────────
echo [2/2] Starting Frontend...
start "ERP Frontend" cmd /k "cd /d %~dp0frontend && npm run start"

echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set LAN_IP=%%a
    goto :show
)
:show
set LAN_IP=%LAN_IP: =%

echo ══════════════════════════════════════════════════════════════════════════════════
echo  ERP IS RUNNING
echo.
echo  This PC (admin):   http://localhost:3000
echo  Other staff (LAN): http://%LAN_IP%:3000
echo ══════════════════════════════════════════════════════════════════════════════════
echo.
echo To STOP the ERP, run stop-erp.bat or close both server windows.
echo.
pause
