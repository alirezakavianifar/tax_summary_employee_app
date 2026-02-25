param (
    [Parameter(Mandatory=$true)]
    [int]$Port
)

Write-Host "Searching for process on port $Port..." -ForegroundColor Cyan

# Find the Process ID (PID) using the port
$connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1

if ($null -eq $connection) {
    Write-Host "No process found listening on port $Port." -ForegroundColor Yellow
    exit
}

$pidToKill = $connection.OwningProcess
$process = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue

if ($null -eq $process) {
    Write-Host "Found PID $pidToKill but could not retrieve process details." -ForegroundColor Red
    exit
}

Write-Host "Found process: $($process.ProcessName) (PID: $pidToKill)" -ForegroundColor Green
Write-Host "Attempting to kill process..." -ForegroundColor Cyan

try {
    Stop-Process -Id $pidToKill -Force
    Write-Host "Successfully killed process on port $Port." -ForegroundColor Green
}
catch {
    Write-Host "Failed to kill process: $($_.Exception.Message)" -ForegroundColor Red
}
