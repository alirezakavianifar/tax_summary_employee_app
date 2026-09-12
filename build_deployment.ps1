<#
.SYNOPSIS
    Builds offline deployment packages for Windows x64.
.DESCRIPTION
    Supports two modes:
    1. Full (default):
       Publishes a complete, self-contained offline deployment (~284 MB) including
       .NET 8 runtime, portable Node.js runtime, standalone Next.js frontend, database,
       and launcher scripts. Required for first-time server setup.
    2. UpdateOnly (-UpdateOnly):
       Publishes an ultra-lightweight update package (~9 MB uncompressed, ~3 MB zipped)
       containing ONLY modified application binaries (TaxSummary DLLs/exe/Resources)
       and Next.js standalone build. Excludes Node.js, system runtimes, database, and
       photo uploads so existing production data is never overwritten.
.PARAMETER OutputDir
    Destination directory. Defaults to 'deployment' for Full, and 'deployment_update' for UpdateOnly.
.PARAMETER UpdateOnly
    Builds only application code changes for existing deployments.
.PARAMETER IncludeNodeModules
    In UpdateOnly mode, also bundles frontend node_modules (adds ~17 MB).
.PARAMETER Zip
    Creates a compressed .zip file of the output package. Always enabled by default for UpdateOnly.
#>

param(
    [string]$OutputDir = "",
    [switch]$UpdateOnly,
    [switch]$IncludeNodeModules,
    [switch]$Zip
)

$ErrorActionPreference = "Stop"

# Resolve default output directory
if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    if ($UpdateOnly) {
        $OutputDir = Join-Path $PSScriptRoot "deployment_update"
    } else {
        $OutputDir = Join-Path $PSScriptRoot "deployment"
    }
}

$backendOut = Join-Path $OutputDir "backend"
$frontendOut = Join-Path $OutputDir "frontend"
$nodeOut = Join-Path $OutputDir "node"

Write-Host "========================================================" -ForegroundColor Green
if ($UpdateOnly) {
    Write-Host " Building Lightweight Tax Summary Update Package" -ForegroundColor Green
    Write-Host " Mode: UPDATE ONLY (App code changes only)" -ForegroundColor Cyan
} else {
    Write-Host " Building Fresh Full Tax Summary Deployment Package" -ForegroundColor Green
    Write-Host " Mode: FULL (Self-contained, includes runtimes)" -ForegroundColor Cyan
}
Write-Host " Target Output: $OutputDir" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green

# 1. Stop any background API process that could lock DLLs
Write-Host "`n[1/5] Ensuring no running backend process locks DLLs..." -ForegroundColor Cyan
Stop-Process -Name TaxSummary.Api -Force -ErrorAction SilentlyContinue

# ==============================================================================
# MODE A: LIGHTWEIGHT UPDATE ONLY
# ==============================================================================
if ($UpdateOnly) {
    # 2. Prepare clean update directory
    Write-Host "`n[2/5] Preparing clean update directory structure..." -ForegroundColor Cyan
    if (Test-Path $OutputDir) {
        Remove-Item -Recurse -Force $OutputDir -ErrorAction SilentlyContinue
    }
    New-Item -ItemType Directory -Path $backendOut -Force | Out-Null
    New-Item -ItemType Directory -Path $frontendOut -Force | Out-Null

    # 3. Build Backend (Release)
    Write-Host "`n[3/5] Building .NET 8 Backend application binaries..." -ForegroundColor Cyan
    $backendProject = Join-Path $PSScriptRoot "Backend\TaxSummary.Api\TaxSummary.Api.csproj"
    dotnet build $backendProject -c Release

    $releaseBin = Join-Path $PSScriptRoot "Backend\TaxSummary.Api\bin\Release\net8.0"
    $appFiles = Get-ChildItem -Path "$releaseBin\*" -Include "TaxSummary*.dll", "TaxSummary*.exe", "TaxSummary*.json" -File
    foreach ($f in $appFiles) {
        Copy-Item $f.FullName -Destination $backendOut -Force
    }

    # Copy Resources folder (position mappings Excel, etc.)
    $resourcesSource = Join-Path $releaseBin "Resources"
    if (Test-Path $resourcesSource) {
        $destResources = Join-Path $backendOut "Resources"
        New-Item -ItemType Directory -Path $destResources -Force | Out-Null
        Copy-Item "$resourcesSource\*" -Destination $destResources -Recurse -Force
    }

    # 4. Build Next.js Frontend (Standalone)
    Write-Host "`n[4/5] Building Next.js Frontend in Standalone Mode..." -ForegroundColor Cyan
    $frontendDir = Join-Path $PSScriptRoot "frontend"
    Push-Location $frontendDir
    try {
        Remove-Item -Recurse -Force (Join-Path $frontendDir ".next") -ErrorAction SilentlyContinue
        npm run build
    } finally {
        Pop-Location
    }

    $standaloneDir = Join-Path $frontendDir ".next\standalone"
    if (-not (Test-Path $standaloneDir)) {
        throw "Standalone build directory not found at $standaloneDir."
    }

    # Copy server.js & package.json
    Copy-Item (Join-Path $standaloneDir "server.js") -Destination $frontendOut -Force
    if (Test-Path (Join-Path $standaloneDir "package.json")) {
        Copy-Item (Join-Path $standaloneDir "package.json") -Destination $frontendOut -Force
    }

    # Copy compiled server files
    $standaloneNext = Join-Path $standaloneDir ".next"
    $destNext = Join-Path $frontendOut ".next"
    New-Item -ItemType Directory -Path $destNext -Force | Out-Null
    Copy-Item "$standaloneNext\*" -Destination $destNext -Recurse -Force

    # Copy static assets into .next/static
    $staticSource = Join-Path $frontendDir ".next\static"
    $staticDest = Join-Path $destNext "static"
    New-Item -ItemType Directory -Path $staticDest -Force | Out-Null
    Copy-Item "$staticSource\*" -Destination $staticDest -Recurse -Force

    # Copy public assets
    $publicSource = Join-Path $frontendDir "public"
    $publicDest = Join-Path $frontendOut "public"
    New-Item -ItemType Directory -Path $publicDest -Force | Out-Null
    Copy-Item "$publicSource\*" -Destination $publicDest -Recurse -Force

    # Clean compiler cache
    Remove-Item -Recurse -Force (Join-Path $destNext "cache") -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force (Join-Path $destNext "standalone") -ErrorAction SilentlyContinue

    # Standalone node_modules (minimal runtime dependencies ~17 MB) is required by server.js
    Write-Host "Including standalone frontend node_modules..." -ForegroundColor Gray
    $nmSource = Join-Path $standaloneDir "node_modules"
    if (Test-Path $nmSource) {
        Copy-Item $nmSource -Destination (Join-Path $frontendOut "node_modules") -Recurse -Force
    }

    # 5. Create APPLY_UPDATE.bat helper in update folder
    Write-Host "`n[5/5] Generating update installer script..." -ForegroundColor Cyan
    $applyBatContent = @"
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
if exist "%~dp0..\deployment\backend" (
    set "TARGET=%~dp0..\deployment"
) else if exist "%~dp0backend" (
    set "TARGET=%~dp0"
) else (
    echo [ERROR] Target deployment directory not found.
    echo Please ensure this folder is placed alongside 'deployment'
    echo or enter the deployment directory path below:
    set /p "TARGET=Enter path to deployment folder: "
)

if not exist "!TARGET!\backend" (
    echo [ERROR] Invalid target directory: "!TARGET!"
    pause
    exit /b 1
)

echo [2/3] Updating files in !TARGET!...
echo Updating Backend binaries (preserves database and employee photos)...
xcopy /Y /E "%~dp0backend\*" "!TARGET!\backend\" >nul

echo Updating Frontend application files...
xcopy /Y /E "%~dp0frontend\*" "!TARGET!\frontend\" >nul

echo.
echo [3/3] Update applied successfully!
echo ========================================================
echo You can now restart the application using START_ALL.bat
echo located in "!TARGET!".
echo ========================================================
echo.
pause
"@
    Set-Content -Path (Join-Path $OutputDir "APPLY_UPDATE.bat") -Value $applyBatContent -Encoding ASCII

    # Create zip archive (always for UpdateOnly or when -Zip requested)
    $zipPath = "$OutputDir.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Write-Host "Creating compressed archive ($zipPath)..." -ForegroundColor Cyan
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($OutputDir, $zipPath)

    $rawSize = (Get-ChildItem -Path $OutputDir -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $zipSize = (Get-Item $zipPath).Length

    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host " SUCCESS: Update Package Created!" -ForegroundColor Green
    Write-Host " Uncompressed Size : $([Math]::Round($rawSize / 1MB, 2)) MB" -ForegroundColor Yellow
    Write-Host " Compressed ZIP    : $([Math]::Round($zipSize / 1MB, 2)) MB -> $zipPath" -ForegroundColor Yellow
    Write-Host " How to deploy to production:" -ForegroundColor White
    Write-Host "   1. Copy '$zipPath' to your production server."
    Write-Host "   2. Extract it next to your existing 'deployment' folder."
    Write-Host "   3. Run 'APPLY_UPDATE.bat' inside the extracted update folder."
    Write-Host "   4. Start services using 'START_ALL.bat' in the deployment folder."
    Write-Host "========================================================" -ForegroundColor Green
    return
}

# ==============================================================================
# MODE B: FULL DEPLOYMENT PACKAGE
# ==============================================================================

# 2. Create Target Directory
Write-Host "`n[2/6] Preparing output directory structure..." -ForegroundColor Cyan
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# 3. Publish .NET 8 Backend (Self-Contained Windows x64)
Write-Host "`n[3/6] Publishing .NET 8 Backend (Win-x64 Self-Contained)..." -ForegroundColor Cyan
$backendProject = Join-Path $PSScriptRoot "Backend\TaxSummary.Api\TaxSummary.Api.csproj"
dotnet publish $backendProject `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=false `
    -o $backendOut

# Ensure appsettings.json has production LAN configuration (http://0.0.0.0:5000)
$appsettingsPath = Join-Path $backendOut "appsettings.json"
if (Test-Path $appsettingsPath) {
    $json = Get-Content $appsettingsPath -Raw | ConvertFrom-Json
    $json.Urls = "http://0.0.0.0:5000"
    $json | ConvertTo-Json -Depth 10 | Set-Content $appsettingsPath -Encoding UTF8
}

# Preserve or copy existing SQLite database if present
$existingDb = Join-Path $PSScriptRoot "deployment\backend\taxsummary.db"
$targetDb = Join-Path $backendOut "taxsummary.db"
if ((Test-Path $existingDb) -and -not (Test-Path $targetDb)) {
    Write-Host "Copying existing database file to new deployment..." -ForegroundColor Gray
    Copy-Item $existingDb $targetDb -Force
}

# Clean any archive files that may have been in wwwroot
Get-ChildItem -Path (Join-Path $backendOut "wwwroot") -Include *.rar, *.zip -Recurse -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# 4. Build Next.js Frontend (Standalone)
Write-Host "`n[4/6] Building Next.js Frontend in Standalone Mode..." -ForegroundColor Cyan
$frontendDir = Join-Path $PSScriptRoot "frontend"
Push-Location $frontendDir
try {
    Remove-Item -Recurse -Force (Join-Path $frontendDir ".next") -ErrorAction SilentlyContinue
    npm run build
} finally {
    Pop-Location
}

# 5. Assemble Standalone Frontend
Write-Host "`n[5/6] Assembling standalone frontend package..." -ForegroundColor Cyan
$standaloneDir = Join-Path $frontendDir ".next\standalone"

if (-not (Test-Path $standaloneDir)) {
    throw "Standalone build directory was not found at $standaloneDir. Ensure output: 'standalone' is enabled in next.config.js."
}

# Clean old destination files to avoid stale or nested artifacts
Remove-Item -Recurse -Force (Join-Path $frontendOut ".next") -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force (Join-Path $frontendOut "public") -ErrorAction SilentlyContinue

# Copy standalone directory contents into frontend destination
New-Item -ItemType Directory -Path $frontendOut -Force | Out-Null
Copy-Item "$standaloneDir\*" -Destination $frontendOut -Recurse -Force

# Next.js standalone requires static and public assets copied manually:
$staticSource = Join-Path $frontendDir ".next\static"
$staticDest = Join-Path $frontendOut ".next\static"
New-Item -ItemType Directory -Path $staticDest -Force | Out-Null
Copy-Item "$staticSource\*" -Destination $staticDest -Recurse -Force

$publicSource = Join-Path $frontendDir "public"
$publicDest = Join-Path $frontendOut "public"
New-Item -ItemType Directory -Path $publicDest -Force | Out-Null
Copy-Item "$publicSource\*" -Destination $publicDest -Recurse -Force

# Remove compiler cache and nested standalone to keep package compact
Remove-Item -Recurse -Force (Join-Path $frontendOut ".next\cache") -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force (Join-Path $frontendOut ".next\standalone") -ErrorAction SilentlyContinue

# 6. Copy Portable Node runtime and starter scripts
Write-Host "`n[6/6] Copying portable Node runtime and launcher scripts..." -ForegroundColor Cyan
$existingNode = Join-Path $PSScriptRoot "deployment\node"
if ((Test-Path $existingNode) -and ($OutputDir -ne (Join-Path $PSScriptRoot "deployment"))) {
    Copy-Item $existingNode -Destination $nodeOut -Recurse -Force
}

# Copy starter batch files & docs if building to a new target
$distFiles = @("START_ALL.bat", "START_BACKEND.bat", "START_FRONTEND.bat", "install_guide.md")
foreach ($b in $distFiles) {
    $src = Join-Path $PSScriptRoot "deployment\$b"
    $dst = Join-Path $OutputDir $b
    if ((Test-Path $src) -and ($src -ne $dst)) {
        Copy-Item $src -Destination $dst -Force
    }
}

if ($Zip) {
    $zipPath = "$OutputDir.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Write-Host "`nCreating full compressed archive ($zipPath)..." -ForegroundColor Cyan
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($OutputDir, $zipPath)
}

$rawSize = (Get-ChildItem -Path $OutputDir -Recurse -File | Measure-Object -Property Length -Sum).Sum

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " SUCCESS: Fresh Full Deployment Package Created!" -ForegroundColor Green
Write-Host " Uncompressed Size : $([Math]::Round($rawSize / 1MB, 2)) MB" -ForegroundColor Yellow
Write-Host " Location          : $OutputDir" -ForegroundColor Yellow
Write-Host " Instructions:" -ForegroundColor White
Write-Host "   1. Copy the '$OutputDir' folder to your production server."
Write-Host "   2. Double-click 'START_ALL.bat' to run both Backend (:5000) and Frontend (:3000)."
Write-Host "========================================================" -ForegroundColor Green
