---
name: tax-deployment-packaging
description: >-
  Standards and procedures for offline Windows Server deployments and minimal update packaging for the Tax Summary Employee App. Use this skill whenever preparing production updates with build_deployment.ps1 (-UpdateOnly), managing offline SQLite and media preservation, configuring IIS/reverse proxy, or diagnosing service health with manage-app.ps1.
---

# Offline Deployment & Minimal Update Packaging Skill

This skill governs the production deployment pipelines, offline package building, minimal update generation, and service operations for the **Tax Summary Employee App** on Windows Server environments.

---

## 1. Deployment Topology & Offline Architecture

The application is deployed in isolated, intranet-only government environments without direct internet access:

```
Windows Server 2019 / 2022 (Offline Intranet)
├── Reverse Proxy / Firewall (IIS or Port Forwarding)
│     ↓
├── Frontend (Next.js 14 Standalone Build)
│     • Listening on: http://localhost:3000
│     • Embedded portable Node.js runtime (v20.x)
│     ↓
└── Backend API (ASP.NET Core 8 Web API)
      • Listening on: http://localhost:5000 (HTTP)
      • SQLite Database: taxsummary.db (Local File System)
      • Photos & Assets: uploads/photos/
```

---

## 2. Minimal Update Workflow (`-UpdateOnly`)

> [!IMPORTANT]
> As mandated by `AGENTS.md`, whenever source code modifications (backend or frontend) are made, you **must build only the minimal zipped update package** to prevent overwriting existing production data.

### Update Command:
```powershell
powershell -ExecutionPolicy Bypass -File .\build_deployment.ps1 -UpdateOnly
```

### Minimal Package Specifications:
- **Output Artifact**: `deployment_update.zip` (~3–4 MB compressed).
- **Contents**:
  - `backend/`: Updated `TaxSummary.Api.dll`, `TaxSummary.Application.dll`, `TaxSummary.Infrastructure.dll`, `TaxSummary.Domain.dll`, and compiled dependencies.
  - `frontend/`: Compiled `.next/standalone` files and updated static assets.
- **Excluded (Protected from Overwrite)**:
  - ❌ Runtimes: Node.js portable folder and .NET 8 host binaries.
  - ❌ Production Database: `taxsummary.db` (existing data is untouched).
  - ❌ User Assets: `uploads/photos/` and generated PDFs.

---

## 3. Full Deployment Package (First-Time Setup)

For fresh server installations where no prior environment exists:
```powershell
powershell -ExecutionPolicy Bypass -File .\build_deployment.ps1 -Zip
```
- Produces `deployment.zip` (~280 MB).
- Includes portable Node.js, self-contained .NET runtime, initial database schema, and launcher scripts (`START_ALL.bat`, `STOP_ALL.bat`).

---

## 4. Production Service Management & Health Verification

Always manage services via [`scripts/manage-app.ps1`](file:///e:/projects/tax_summary_employee_app/scripts/manage-app.ps1):

```powershell
# 1. Verify running status, PIDs, and active listening ports
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 status

# 2. Run HTTP health probes against Port 5000 and Port 3000
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 health

# 3. Clean restart both services if ports are locked
powershell -ExecutionPolicy Bypass -File .\scripts\manage-app.ps1 restart
```

### Health Probe Endpoints:
- Backend: `http://localhost:5000/health` (Returns HTTP 200 `Healthy` with SQLite connection status).
- Frontend: `http://localhost:3000` (Returns HTTP 200).

---

## 5. Deployment Update Application Protocol (On Server)

When an update is deployed to a production server:
1. Copy `deployment_update.zip` adjacent to the server's `deployment/` directory.
2. Stop active services: `.\deployment\STOP_ALL.bat`.
3. Extract and overwrite application binaries: `.\APPLY_UPDATE.bat`.
4. Start all services: `.\deployment\START_ALL.bat`.
5. Verify health: `.\scripts\manage-app.ps1 health`.
