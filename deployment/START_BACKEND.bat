@echo off
REM Start the Tax Summary Backend API
REM Default port: 5000

cd /d "%~dp0backend"
echo Starting Tax Summary API...
echo Listening on: http://localhost:5000
echo.

TaxSummary.Api.exe

pause
