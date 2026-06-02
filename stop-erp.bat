@echo off
REM ══════════════════════════════════════════════════════════════════════════════════════
REM  Sudhan Textile ERP - Stop All Servers
REM  Stops both Frontend and Backend servers
REM ══════════════════════════════════════════════════════════════════════════════════════

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                        STOPPING SUDHAN TEXTILE ERP SERVERS                       ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.

REM Kill Node.js processes (Frontend)
echo Stopping Frontend (Node.js)...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend stopped
) else (
    echo ⚠️  No Frontend process found
)

REM Kill .NET processes (Backend)
echo Stopping Backend (.NET)...
taskkill /F /IM dotnet.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend stopped
) else (
    echo ⚠️  No Backend process found
)

echo.
echo All servers stopped.
echo.
pause
