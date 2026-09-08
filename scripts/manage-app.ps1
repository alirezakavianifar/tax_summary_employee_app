<#
.SYNOPSIS
    Tax Summary Application Management Script
.DESCRIPTION
    Comprehensive PowerShell tool to start, stop, restart, monitor, and check health
    for both the ASP.NET Core Backend API and the Next.js Frontend Application.
.PARAMETER Action
    Optional action to execute:
    - start / start-all: Start both backend and frontend services
    - stop / stop-all: Stop both backend and frontend services
    - restart / restart-all: Restart both services
    - status: Show current running status, PIDs, and listening ports
    - health: Run HTTP health checks against backend (/health) and frontend
    - start-backend / start-api: Start only the .NET API
    - start-frontend / start-web: Start only the Next.js app
    - stop-backend / stop-api: Stop only the .NET API
    - stop-frontend / stop-web: Stop only the Next.js app
    - restart-backend: Restart only the .NET API
    - restart-frontend: Restart only the Next.js app
    - open / open-frontend: Open frontend in default web browser
    - open-backend / open-swagger: Open backend Swagger UI in default web browser
.EXAMPLE
    .\scripts\manage-app.ps1
    (Launches interactive management menu)
.EXAMPLE
    .\scripts\manage-app.ps1 start
    .\scripts\manage-app.ps1 health
    .\scripts\manage-app.ps1 stop
#>

param (
    [Parameter(Position = 0, Mandatory = $false)]
    [ValidateSet("start", "start-all", "stop", "stop-all", "restart", "restart-all",
                 "status", "health", "start-backend", "start-api", "start-frontend", "start-web",
                 "stop-backend", "stop-api", "stop-frontend", "stop-web",
                 "restart-backend", "restart-frontend", "open", "open-frontend", "open-backend", "open-swagger", "help")]
    [string]$Action,

    [switch]$Help
)

$ErrorActionPreference = "Continue"

# Root & Subdirectory Paths
$ScriptDir   = $PSScriptRoot
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendDir  = Join-Path $ProjectRoot "Backend\TaxSummary.Api"
$FrontendDir = Join-Path $ProjectRoot "frontend"

# Standard Ports & URLs
$BackendHttpPort  = 5000
$BackendHttpsPort = 5001
$FrontendPort     = 3000

$BackendUrl  = "http://localhost:$BackendHttpPort"
$SwaggerUrl  = "http://localhost:$BackendHttpPort"
$HealthUrl   = "http://localhost:$BackendHttpPort/health"
$FrontendUrl = "http://localhost:$FrontendPort"

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------

function Write-Banner {
    Clear-Host
    Write-Host "=================================================================" -ForegroundColor DarkCyan
    Write-Host "       Tax Summary & Employee Management - Control Hub           " -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor DarkCyan
    Write-Host " Project Root: $ProjectRoot" -ForegroundColor Gray
    Write-Host " Backend:      $BackendUrl (Health: $HealthUrl)" -ForegroundColor Gray
    Write-Host " Frontend:     $FrontendUrl" -ForegroundColor Gray
    Write-Host "=================================================================" -ForegroundColor DarkCyan
    Write-Host ""
}

function Get-PortListener {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        return [PSCustomObject]@{
            Port        = $Port
            PID         = $conn.OwningProcess
            ProcessName = if ($proc) { $proc.ProcessName } else { "Unknown" }
            StartTime   = if ($proc -and $proc.StartTime) { $proc.StartTime.ToString("yyyy-MM-dd HH:mm:ss") } else { "N/A" }
        }
    }
    return $null
}

function Stop-PortProcess {
    param(
        [int]$Port,
        [string]$ServiceName
    )
    $listener = Get-PortListener -Port $Port
    if ($null -ne $listener) {
        Write-Host "Stopping $ServiceName (Port $Port, PID: $($listener.PID), Process: $($listener.ProcessName))..." -ForegroundColor Yellow
        try {
            Stop-Process -Id $listener.PID -Force -ErrorAction Stop
            Start-Sleep -Milliseconds 600
            # Double check
            $verify = Get-PortListener -Port $Port
            if ($null -eq $verify) {
                Write-Host "  [OK] Successfully terminated $ServiceName (PID: $($listener.PID))." -ForegroundColor Green
            } else {
                Write-Host "  [WARN] Process still holding port $Port. Forcing taskkill..." -ForegroundColor Yellow
                taskkill /F /PID $listener.PID /T | Out-Null
            }
        }
        catch {
            Write-Host "  [ERROR] Failed to stop PID $($listener.PID): $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  [INFO] $ServiceName is not listening on port $Port." -ForegroundColor DarkGray
    }
}

function Start-BackendService {
    Write-Host "--- Starting Backend API (.NET 8) ---" -ForegroundColor Cyan
    
    $existing = Get-PortListener -Port $BackendHttpPort
    if ($null -ne $existing) {
        Write-Host "  [WARN] Backend is already running on port $BackendHttpPort (PID: $($existing.PID))." -ForegroundColor Yellow
        return
    }

    if (-not (Test-Path $BackendDir)) {
        Write-Host "  [ERROR] Backend directory not found at '$BackendDir'!" -ForegroundColor Red
        return
    }

    $cmd = "cd '$BackendDir'; Write-Host 'Starting Tax Summary Backend API...' -ForegroundColor Green; dotnet run --launch-profile http"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $cmd -WorkingDirectory $BackendDir

    Write-Host "  Backend process launched in separate window." -ForegroundColor Green
    Write-Host "  Waiting for service to bind to port $BackendHttpPort..." -ForegroundColor Gray
    
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Milliseconds 800
        $listener = Get-PortListener -Port $BackendHttpPort
        if ($null -ne $listener) {
            Write-Host "  [OK] Backend API is listening on port $BackendHttpPort (PID: $($listener.PID))." -ForegroundColor Green
            return
        }
    }
    Write-Host "  [INFO] Backend is still booting up. Check the spawned window for build/startup logs." -ForegroundColor Yellow
}

function Start-FrontendService {
    Write-Host "--- Starting Frontend (Next.js 14) ---" -ForegroundColor Cyan

    $existing = Get-PortListener -Port $FrontendPort
    if ($null -ne $existing) {
        Write-Host "  [WARN] Frontend is already running on port $FrontendPort (PID: $($existing.PID))." -ForegroundColor Yellow
        return
    }

    if (-not (Test-Path $FrontendDir)) {
        Write-Host "  [ERROR] Frontend directory not found at '$FrontendDir'!" -ForegroundColor Red
        return
    }

    $cmd = "cd '$FrontendDir'; Write-Host 'Starting Next.js Frontend Server...' -ForegroundColor Green; npm run dev"
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $cmd -WorkingDirectory $FrontendDir

    Write-Host "  Frontend process launched in separate window." -ForegroundColor Green
    Write-Host "  Waiting for service to bind to port $FrontendPort..." -ForegroundColor Gray
    
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Milliseconds 800
        $listener = Get-PortListener -Port $FrontendPort
        if ($null -ne $listener) {
            Write-Host "  [OK] Frontend is listening on port $FrontendPort (PID: $($listener.PID))." -ForegroundColor Green
            return
        }
    }
    Write-Host "  [INFO] Frontend is compiling dev bundles. Check the spawned window for output." -ForegroundColor Yellow
}

function Stop-BackendService {
    Write-Host "--- Stopping Backend API ---" -ForegroundColor Cyan
    Stop-PortProcess -Port $BackendHttpPort -ServiceName "Backend API (HTTP)"
    Stop-PortProcess -Port $BackendHttpsPort -ServiceName "Backend API (HTTPS)"
}

function Stop-FrontendService {
    Write-Host "--- Stopping Frontend App ---" -ForegroundColor Cyan
    Stop-PortProcess -Port $FrontendPort -ServiceName "Frontend Web App"
}

function Show-Status {
    Write-Host "========================== SERVICE STATUS ==========================" -ForegroundColor Cyan
    
    $backendHttp = Get-PortListener -Port $BackendHttpPort
    $backendHttps = Get-PortListener -Port $BackendHttpsPort
    $frontend = Get-PortListener -Port $FrontendPort

    $rows = @()

    if ($backendHttp) {
        $rows += [PSCustomObject]@{
            Service = "Backend API (HTTP)"
            Port    = $BackendHttpPort
            PID     = $backendHttp.PID
            Process = $backendHttp.ProcessName
            Status  = "RUNNING"
        }
    } else {
        $rows += [PSCustomObject]@{
            Service = "Backend API (HTTP)"
            Port    = $BackendHttpPort
            PID     = "-"
            Process = "-"
            Status  = "STOPPED"
        }
    }

    if ($backendHttps) {
        $rows += [PSCustomObject]@{
            Service = "Backend API (HTTPS)"
            Port    = $BackendHttpsPort
            PID     = $backendHttps.PID
            Process = $backendHttps.ProcessName
            Status  = "RUNNING"
        }
    }

    if ($frontend) {
        $rows += [PSCustomObject]@{
            Service = "Frontend (Next.js)"
            Port    = $FrontendPort
            PID     = $frontend.PID
            Process = $frontend.ProcessName
            Status  = "RUNNING"
        }
    } else {
        $rows += [PSCustomObject]@{
            Service = "Frontend (Next.js)"
            Port    = $FrontendPort
            PID     = "-"
            Process = "-"
            Status  = "STOPPED"
        }
    }

    $rows | Format-Table -AutoSize
    Write-Host ""
}

function Check-Health {
    Write-Host "======================= HEALTH CHECK PROBES ========================" -ForegroundColor Cyan
    
    # 1. Backend Probe
    Write-Host -NoNewline "Probing Backend API Health ($HealthUrl)... "
    $backendAlive = $false
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $resp = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
        $sw.Stop()
        
        $body = $resp.Content.Trim()
        if ($resp.StatusCode -eq 200) {
            Write-Host "[HEALTHY]" -ForegroundColor Green -NoNewline
            Write-Host " ($($sw.ElapsedMilliseconds) ms)" -ForegroundColor Gray
            Write-Host "   HTTP Status: 200 OK" -ForegroundColor DarkGreen
            Write-Host "   Health Probe Output: $body" -ForegroundColor DarkGreen
            $backendAlive = $true
        } else {
            Write-Host "[DEGRADED - HTTP $($resp.StatusCode)]" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "[OFFLINE / UNHEALTHY]" -ForegroundColor Red
        Write-Host "   Details: $($_.Exception.Message)" -ForegroundColor DarkRed
    }

    # 2. Frontend Probe
    Write-Host ""
    Write-Host -NoNewline "Probing Frontend App ($FrontendUrl)... "
    $frontendAlive = $false
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $resp = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
        $sw.Stop()
        
        if ($resp.StatusCode -eq 200) {
            Write-Host "[HEALTHY / ONLINE]" -ForegroundColor Green -NoNewline
            Write-Host " ($($sw.ElapsedMilliseconds) ms)" -ForegroundColor Gray
            Write-Host "   HTTP Status: 200 OK" -ForegroundColor DarkGreen
            $frontendAlive = $true
        } else {
            Write-Host "[RESPONDING - HTTP $($resp.StatusCode)]" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "[OFFLINE]" -ForegroundColor Red
        Write-Host "   Details: $($_.Exception.Message)" -ForegroundColor DarkRed
    }

    Write-Host ""
    Write-Host "--- Quick Links ---" -ForegroundColor Cyan
    Write-Host "  Frontend Home:     $FrontendUrl" -ForegroundColor $(if ($frontendAlive) { "Green" } else { "DarkGray" })
    Write-Host "  Tax Refund Hub:    $FrontendUrl/refunds" -ForegroundColor $(if ($frontendAlive) { "Green" } else { "DarkGray" })
    Write-Host "  Payroll Cycles:    $FrontendUrl/payroll" -ForegroundColor $(if ($frontendAlive) { "Green" } else { "DarkGray" })
    Write-Host "  Swagger UI Docs:   $BackendUrl" -ForegroundColor $(if ($backendAlive) { "Green" } else { "DarkGray" })
    Write-Host "====================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Open-BrowserTarget {
    param([string]$TargetUrl)
    Write-Host "Opening $TargetUrl in default browser..." -ForegroundColor Cyan
    Start-Process $TargetUrl
}

# ------------------------------------------------------------------------------
# Action Execution Handler
# ------------------------------------------------------------------------------

function Execute-Action {
    param([string]$SelectedAction)

    switch -Regex ($SelectedAction.ToLower()) {
        "^(start|start-all)$" {
            Start-BackendService
            Start-FrontendService
            Write-Host ""
            Show-Status
            Check-Health
        }
        "^(stop|stop-all)$" {
            Stop-BackendService
            Stop-FrontendService
            Write-Host ""
            Show-Status
        }
        "^(restart|restart-all)$" {
            Stop-BackendService
            Stop-FrontendService
            Start-Sleep -Seconds 1
            Start-BackendService
            Start-FrontendService
            Write-Host ""
            Show-Status
            Check-Health
        }
        "^(status|info)$" {
            Show-Status
        }
        "^(health|probe)$" {
            Show-Status
            Check-Health
        }
        "^(start-backend|start-api)$" {
            Start-BackendService
            Show-Status
        }
        "^(stop-backend|stop-api)$" {
            Stop-BackendService
            Show-Status
        }
        "^restart-backend$" {
            Stop-BackendService
            Start-Sleep -Seconds 1
            Start-BackendService
            Show-Status
        }
        "^(start-frontend|start-web)$" {
            Start-FrontendService
            Show-Status
        }
        "^(stop-frontend|stop-web)$" {
            Stop-FrontendService
            Show-Status
        }
        "^restart-frontend$" {
            Stop-FrontendService
            Start-Sleep -Seconds 1
            Start-FrontendService
            Show-Status
        }
        "^(open|open-frontend)$" {
            Open-BrowserTarget -TargetUrl $FrontendUrl
        }
        "^(open-backend|open-swagger)$" {
            Open-BrowserTarget -TargetUrl $BackendUrl
        }
        "^help$" {
            Get-Help $PSCommandPath
        }
        Default {
            Write-Host "Unknown action: '$SelectedAction'. Run with 'help' for usage." -ForegroundColor Red
        }
    }
}

# ------------------------------------------------------------------------------
# Main Dispatcher
# ------------------------------------------------------------------------------

if ($Help) {
    Get-Help $PSCommandPath
    exit 0
}

if (-not [string]::IsNullOrWhiteSpace($Action)) {
    Execute-Action -SelectedAction $Action
    exit 0
}

# Interactive Menu Loop
do {
    Write-Banner
    Show-Status

    Write-Host "Select an option:" -ForegroundColor White
    Write-Host "  [1] Start Full Application (Backend + Frontend)" -ForegroundColor Green
    Write-Host "  [2] Start Backend API only (.NET 8)" -ForegroundColor Green
    Write-Host "  [3] Start Frontend only (Next.js 14)" -ForegroundColor Green
    Write-Host "  -------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  [4] Stop Full Application" -ForegroundColor Yellow
    Write-Host "  [5] Stop Backend API only" -ForegroundColor Yellow
    Write-Host "  [6] Stop Frontend only" -ForegroundColor Yellow
    Write-Host "  -------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  [7] Restart Full Application" -ForegroundColor Cyan
    Write-Host "  [8] Restart Backend API only" -ForegroundColor Cyan
    Write-Host "  [9] Restart Frontend only" -ForegroundColor Cyan
    Write-Host "  -------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  [H] Run Health Probes & Connectivity Test" -ForegroundColor Magenta
    Write-Host "  [W] Open Frontend in Web Browser ($FrontendUrl)" -ForegroundColor White
    Write-Host "  [S] Open Backend Swagger UI ($BackendUrl)" -ForegroundColor White
    Write-Host "  -------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  [Q] Exit Control Hub" -ForegroundColor Red
    Write-Host ""
    
    $choice = Read-Host "Enter selection"
    Write-Host ""

    switch ($choice.Trim().ToUpper()) {
        "1" { Execute-Action "start" }
        "2" { Execute-Action "start-backend" }
        "3" { Execute-Action "start-frontend" }
        "4" { Execute-Action "stop" }
        "5" { Execute-Action "stop-backend" }
        "6" { Execute-Action "stop-frontend" }
        "7" { Execute-Action "restart" }
        "8" { Execute-Action "restart-backend" }
        "9" { Execute-Action "restart-frontend" }
        "H" { Execute-Action "health" }
        "W" { Execute-Action "open-frontend" }
        "S" { Execute-Action "open-backend" }
        "Q" { 
            Write-Host "Goodbye!" -ForegroundColor Cyan
            break 
        }
        Default { 
            Write-Host "Invalid selection. Please try again." -ForegroundColor Red 
        }
    }

    if ($choice.Trim().ToUpper() -ne "Q") {
        Write-Host ""
        Write-Host "Press Enter to continue..." -ForegroundColor Gray
        [void][System.Console]::ReadLine()
    }

} while ($choice.Trim().ToUpper() -ne "Q")
