@echo off
REM ========================================================
REM Build Tax Summary Deployment Package
REM ========================================================

echo.
echo ========================================================
echo   Tax Summary Package Builder
echo ========================================================
echo   [1] Full Offline Deployment (~284 MB, first-time setup)
echo   [2] Lightweight Update Package (~9 MB, updates existing server)
echo ========================================================
echo.

if "%~1"=="" (
    set /p choice="Select build mode [1 or 2, default: 2]: "
) else (
    goto :run_with_args
)

if "%choice%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build_deployment.ps1"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build_deployment.ps1" -UpdateOnly
)
goto :end

:run_with_args
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build_deployment.ps1" %*

:end
echo.
pause
