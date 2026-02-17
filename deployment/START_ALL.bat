@echo off
REM Start both Backend and Frontend services

echo.
echo ========================================
echo Tax Summary Application Starter
echo ========================================
echo.
echo This script will start both the backend API and frontend web app.
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to continue...
pause

REM Start backend in a new window
echo Starting Backend API...
start "Tax Summary Backend" cmd /k "cd /d "%~dp0backend" && TaxSummary.Api.exe"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start frontend in a new window
echo Starting Frontend Web App...
set "PATH=%~dp0node;%PATH%"
start "Tax Summary Frontend" cmd /k "cd /d "%~dp0frontend\.next\standalone" && "%~dp0node\node.exe" server.js"

echo.
echo Both services are starting. Check the respective console windows for status.
echo.
pause
