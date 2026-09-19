@echo off
setlocal enabledelayedexpansion
title Tax Summary - Apply Update

echo ========================================================
echo   Tax Summary Application Update Installer
echo ========================================================
echo.

REM 1. Stop running processes
echo [1/3] Stopping running services...
taskkill /F /IM TaxSummary.Api.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM 2. Determine target deployment folder
set "TARGET="

if exist "%~dp0..\node\node.exe" (
    set "TARGET=%~dp0.."
) else if exist "%~dp0..\deployment\backend" (
    set "TARGET=%~dp0..\deployment"
) else if exist "%~dp0..\backend" (
    set "TARGET=%~dp0.."
) else if exist "%~dp0backend" (
    set "TARGET=%~dp0"
) else (
    echo [NOTICE] Target deployment directory not automatically detected.
    echo Please enter the path to your deployment folder below
    echo (for example: C:\Users\alkav\Desktop\deployment\deployment)
    set /p "TARGET=Deployment path: "
)

REM Remove surrounding quotes if user entered them
set TARGET=!TARGET:"=!
REM Remove trailing backslash if present
if "!TARGET:~-1!"=="\" set "TARGET=!TARGET:~0,-1!"

if not exist "!TARGET!\backend" (
    echo [ERROR] Target directory "!TARGET!" does not contain a backend folder.
    echo Please verify the path.
    pause
    exit /b 1
)

echo.
echo Target deployment folder: "!TARGET!"
echo.

REM Normalize source path
set "SOURCE=%~dp0"
if "!SOURCE:~-1!"=="\" set "SOURCE=!SOURCE:~0,-1!"

if /i "!SOURCE!"=="!TARGET!" (
    echo Update files are already located directly inside the deployment folder.
    echo No file copying required.
    goto :finish
)

echo [2/3] Copying updated files to "!TARGET!"...

REM Copy Backend binaries
echo - Updating Backend binaries...
robocopy "!SOURCE!\backend" "!TARGET!\backend" /E /R:1 /W:1 /NFL /NDL /NJH /NJS >nul
if errorlevel 8 (
    echo   Fallback copying backend using xcopy...
    xcopy /Y /E /H /I "!SOURCE!\backend\*" "!TARGET!\backend\" >nul
)

REM Copy Frontend application files (including .next and BUILD_ID)
echo - Updating Frontend files (including .next and BUILD_ID)...
robocopy "!SOURCE!\frontend" "!TARGET!\frontend" /E /R:1 /W:1 /NFL /NDL /NJH /NJS >nul
if errorlevel 8 (
    echo   Fallback copying frontend using xcopy...
    xcopy /Y /E /H /I "!SOURCE!\frontend\*" "!TARGET!\frontend\" >nul
)

REM Verify BUILD_ID was copied successfully
if exist "!TARGET!\frontend\.next\BUILD_ID" (
    echo   [OK] Frontend .next\BUILD_ID verified.
) else (
    echo   [WARNING] .next\BUILD_ID not detected. Copying directly...
    xcopy /Y /E /H /I "!SOURCE!\frontend\.next\*" "!TARGET!\frontend\.next\" >nul
)

REM Copy launcher batch files
if exist "!SOURCE!\START_ALL.bat" copy /Y "!SOURCE!\START_*.bat" "!TARGET!\" >nul

:finish
echo.
echo [3/3] Update applied successfully!
echo ========================================================
echo You can now restart the application using START_ALL.bat
echo located in "!TARGET!".
echo.
echo NOTE: On client browsers, press Ctrl + F5 (or Ctrl + Shift + R)
echo to force reload the newest scripts and clear old cache.
echo ========================================================
echo.
pause
