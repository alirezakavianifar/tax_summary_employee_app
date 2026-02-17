@echo off
REM Start the Tax Summary Frontend (Next.js)
REM Default port: 3000
REM Note: Make sure the backend is running first

setlocal enabledelayedexpansion
cd /d "%~dp0frontend\.next\standalone"

REM Add node to PATH
set "PATH=%~dp0..\node;%PATH%"

echo.
echo Starting Tax Summary Frontend...
echo Listening on: http://localhost:3000
echo Make sure the backend is running on http://localhost:5000
echo.

node server.js

pause
