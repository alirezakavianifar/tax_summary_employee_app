<#
.SYNOPSIS
    Automated Chrome DevTools Daemon for Headless Browser Verification
.DESCRIPTION
    Launches Google Chrome with remote debugging enabled and synchronizes the
    DevToolsActivePort file to the default user profile directory so that Antigravity's
    Chrome DevTools MCP server and browser subagents can connect reliably.
.PARAMETER Action
    Action to perform: 'start' (default), 'stop', 'status'
.PARAMETER Headless
    Whether to run Chrome in headless mode (default: $true). Set to $false for visible window.
.PARAMETER Port
    Remote debugging port. Default is 0 (dynamic port assigned by Chromium).
.PARAMETER TargetUrl
    Initial URL to navigate to (default: http://localhost:3000).
.EXAMPLE
    .\scripts\start-browser-daemon.ps1
.EXAMPLE
    .\scripts\start-browser-daemon.ps1 -Action status
.EXAMPLE
    .\scripts\start-browser-daemon.ps1 -Action stop
#>

param (
    [Parameter(Position = 0, Mandatory = $false)]
    [ValidateSet("start", "stop", "status")]
    [string]$Action = "start",

    [Parameter(Mandatory = $false)]
    [bool]$Headless = $true,

    [Parameter(Mandatory = $false)]
    [int]$Port = 0,

    [Parameter(Mandatory = $false)]
    [string]$TargetUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Continue"

$ChromeExe = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $ChromeExe)) {
    $ChromeExe = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}
if (-not (Test-Path $ChromeExe)) {
    Write-Error "Google Chrome executable was not found on this system."
    exit 1
}

$DefaultUserDataDir = [System.IO.Path]::Combine($env:LOCALAPPDATA, "Google\Chrome\User Data")
$DevToolsProfileDir = [System.IO.Path]::Combine($env:LOCALAPPDATA, "Google\Chrome\DevToolsProfile")

$SrcPortFile = [System.IO.Path]::Combine($DevToolsProfileDir, "DevToolsActivePort")
$DstPortFile = [System.IO.Path]::Combine($DefaultUserDataDir, "DevToolsActivePort")

if ($Action -eq "stop") {
    Write-Host "Stopping all Chrome instances and cleaning DevTools port files..." -ForegroundColor Yellow
    Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
    Remove-Item $SrcPortFile -Force -ErrorAction SilentlyContinue
    Remove-Item $DstPortFile -Force -ErrorAction SilentlyContinue
    Write-Host "Chrome stopped and port files cleaned." -ForegroundColor Green
    exit 0
}

if ($Action -eq "status") {
    $procs = Get-Process chrome -ErrorAction SilentlyContinue
    Write-Host "Running Chrome processes: $($procs.Count)"
    if (Test-Path $DstPortFile) {
        $lines = Get-Content $DstPortFile
        $p = $lines[0].Trim()
        Write-Host "DevToolsActivePort: $p" -ForegroundColor Cyan
        try {
            $ver = Invoke-RestMethod "http://127.0.0.1:$p/json/version" -TimeoutSec 3
            Write-Host "DevTools API: Online ($($ver.Browser))" -ForegroundColor Green
        } catch {
            Write-Host "DevTools API: Not responding on port $p" -ForegroundColor Red
        }
    } else {
        Write-Host "DevToolsActivePort file does not exist." -ForegroundColor Yellow
    }
    exit 0
}

# --- Action: start ---
Write-Host "Preparing Chrome DevTools daemon..." -ForegroundColor Cyan

# Terminate existing orphan Chrome processes (e.g. background services)
Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Ensure profile directories exist and remove stale port files
if (-not (Test-Path $DevToolsProfileDir)) { New-Item -ItemType Directory -Path $DevToolsProfileDir -Force | Out-Null }
if (-not (Test-Path $DefaultUserDataDir)) { New-Item -ItemType Directory -Path $DefaultUserDataDir -Force | Out-Null }

Remove-Item $SrcPortFile -Force -ErrorAction SilentlyContinue
Remove-Item $DstPortFile -Force -ErrorAction SilentlyContinue

# Build command-line arguments
$argList = @(
    "--remote-debugging-port=$Port",
    "--user-data-dir=`"$DevToolsProfileDir`"",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check"
)

if ($Headless) {
    $argList += "--headless=new"
}

$argList += $TargetUrl

Write-Host "Launching Chrome with remote debugging..." -ForegroundColor Cyan
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $ChromeExe
$psi.Arguments = $argList -join " "
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true

$proc = [System.Diagnostics.Process]::Start($psi)
Write-Host "Chrome started (PID: $($proc.Id))" -ForegroundColor Green

# Wait up to 10 seconds for DevToolsActivePort to be written
$found = $false
for ($i = 0; $i -lt 20; $i++) {
    if (Test-Path $SrcPortFile) {
        $found = $true
        break
    }
    Start-Sleep -Milliseconds 500
}

if (-not $found) {
    Write-Error "DevToolsActivePort was not created by Chrome within 10 seconds."
    exit 1
}

# Read port and sync to default User Data dir
$portContent = Get-Content $SrcPortFile
$activePort = $portContent[0].Trim()
Copy-Item $SrcPortFile $DstPortFile -Force
Write-Host "DevTools port successfully synchronized to: $activePort" -ForegroundColor Green

# Verify endpoint responsiveness
try {
    $ver = Invoke-RestMethod "http://127.0.0.1:$activePort/json/version" -TimeoutSec 5
    Write-Host "Chrome DevTools Protocol ready: $($ver.Browser)" -ForegroundColor Green
    Write-Host "WebSocket Debugger URL: $($ver.webSocketDebuggerUrl)" -ForegroundColor Gray
} catch {
    Write-Warning "Could not query /json/version endpoint: $($_.Exception.Message)"
}

Write-Host "Entering daemon synchronization loop. Press Ctrl+C to terminate..." -ForegroundColor Cyan

# Keep process alive and continuously ensure port file synchronization
while (-not $proc.HasExited) {
    if (Test-Path $SrcPortFile) {
        Copy-Item $SrcPortFile $DstPortFile -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 3
}

Write-Host "Chrome process exited with code: $($proc.ExitCode)" -ForegroundColor Yellow
Remove-Item $DstPortFile -Force -ErrorAction SilentlyContinue
