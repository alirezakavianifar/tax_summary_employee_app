---
name: tax-service-ops
description: >-
  Operational runbook for managing, monitoring, and checking the health of the Tax Summary Backend API (.NET 8) and Frontend (Next.js 14) services using scripts/manage-app.ps1. Use this skill whenever starting, stopping, restarting, or diagnosing service health, port conflicts (5000/3000), or locked process binaries during development and deployment.
---

# Service Operations & Application Lifecycle Skill

This skill governs the runtime operations, dual-service management, port monitoring, and health verification for both the ASP.NET Core 8 Web API backend and Next.js 14 frontend.

---

## 1. Runtime Architecture & Standard Ports

```
┌────────────────────────────────────────────────────────┐
│                   Local Environment                    │
├───────────────────────┬────────────────────────────────┤
│ Backend (.NET 8 API)  │ Port 5000 (HTTP), 5001 (HTTPS) │
│                       │ Health: http://localhost:5000/health │
│                       │ Swagger: http://localhost:5000 │
├───────────────────────┼────────────────────────────────┤
│ Frontend (Next.js 14) │ Port 3000 (HTTP)               │
│                       │ App Root: http://localhost:3000│
└───────────────────────┴────────────────────────────────┘
```

---

## 2. The Operational Engine: `scripts/manage-app.ps1`

> [!IMPORTANT]
> Always execute lifecycle commands via [`scripts/manage-app.ps1`](file:///e:/projects/tax_summary_employee_app/scripts/manage-app.ps1). Do not improvise raw `netstat`, ad-hoc `kill-port`, or background shell tasks, as `manage-app.ps1` contains built-in safety safeguards against terminating critical system processes.

### Core CLI Actions

All commands should be executed from the repository root:

```powershell
# Check running status, listening ports, and PIDs
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 status

# Run HTTP health check probes against backend and frontend
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 health

# Start both backend and frontend in detached processes
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 start

# Stop both services cleanly
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 stop

# Restart both services (stops, verifies port release, and restarts)
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 restart
```

### Component-Specific Controls

```powershell
# Manage only the .NET API
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 start-backend
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 stop-backend
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 restart-backend

# Manage only the Next.js Frontend
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 start-frontend
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 stop-frontend
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 restart-frontend
```

---

## 3. Operational Protocols & Workflows

### A. Pre-Deployment & Binary Lock Prevention
Before building an update package or running `build_deployment.ps1 -UpdateOnly`:
1. Verify whether running services are locking binaries:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 status
   ```
2. If the backend is running, stop it to prevent `dotnet publish` or file-copy failures:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 stop-backend
   ```
3. After the build completes, restart services:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 start-backend
   ```

### B. Post-Change Health Verification
After making modifications to controllers, services, or frontend routes:
1. Run the health check:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 health
   ```
2. Interpret the response:
   - **`[OK] Backend API is Healthy (HTTP 200)`**: Database connection to `taxsummary.db` is operational and endpoints are responsive.
   - **`[ERROR] Backend returned HTTP 500`**: Database migration missing, SQLite file locked, or DI registration failure in `Program.cs`.
   - **`[WARN] Port 5000 not listening`**: The .NET process crashed on startup. Inspect `Backend/TaxSummary.Api/build_log.txt` or start backend in a visible window to read exception stack traces.

---

## 4. Troubleshooting & Safety Protections

### Protected Process Guardrail
`manage-app.ps1` inspects the process holding a port before issuing any termination signals. It will **strictly refuse** to terminate:
- System services (`System`, `Idle`, `svchost`, `w3wp`, `inetinfo`)
- Any process matching `*portfolio*`

If a port conflict occurs with a protected system service, do not attempt manual force-killing. Instead, adjust the port configuration in `appsettings.json` or inform the user.

### Port Clearance Verification
When `manage-app.ps1 stop` is executed, it:
1. Attempts clean process shutdown.
2. Waits 600ms and re-queries `Get-NetTCPConnection`.
3. If the port remains bound, it automatically issues a targeted tree termination (`taskkill /F /PID <PID> /T`).

