@echo off
REM ══════════════════════════════════════════════════════════════════════════════════════
REM  Sudhan Textile ERP - Development Environment Launcher
REM  Starts both Frontend (Next.js) and Backend (.NET API) concurrently
REM ══════════════════════════════════════════════════════════════════════════════════════

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════════╗
echo ║                    SUDHAN TEXTILE ERP - ULTRA ENTERPRISE                         ║
echo ║                         Development Environment Launcher                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════════╝
echo.
echo Starting Backend and Frontend servers...
echo.

REM Check if backend directory exists
if not exist "%~dp0backend\SudhanTextileERP.API" (
    echo ❌ ERROR: Backend directory not found!
    echo Expected: %~dp0backend\SudhanTextileERP.API
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "%~dp0frontend" (
    echo ❌ ERROR: Frontend directory not found!
    echo Expected: %~dp0frontend
    pause
    exit /b 1
)

REM Start Backend (.NET API) in a new terminal window
echo [1/2] Starting Backend API Server (.NET)...
start "ERP Backend API" cmd /k "cd /d %~dp0backend\SudhanTextileERP.API && echo ═══════════════════════════════════════════════════════════════ && echo  BACKEND API SERVER - .NET Core && echo  Environment: Development && echo  Port: 5000 && echo ═══════════════════════════════════════════════════════════════ && echo. && set ASPNETCORE_ENVIRONMENT=Development && dotnet run --launch-profile http"

REM Wait 5 seconds before starting frontend
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start Frontend (Next.js) in a new terminal window
echo [2/2] Starting Frontend Server (Next.js)...
start "ERP Frontend" cmd /k "cd /d %~dp0frontend && echo ═══════════════════════════════════════════════════════════════ && echo  FRONTEND SERVER - Next.js && echo  Port: 3000 && echo ═══════════════════════════════════════════════════════════════ && echo. && npm run dev"

echo.
echo ✅ Both servers are starting in separate windows...
echo.
echo 📌 Backend API:  http://localhost:5000
echo 📌 Frontend UI:  http://localhost:3000
echo 📌 Swagger Docs: http://localhost:5000/swagger
echo.
echo ⚠️  Wait ~10 seconds for both servers to fully start
echo.
echo Press any key to close this launcher window (servers will continue running)...
pause >nul
