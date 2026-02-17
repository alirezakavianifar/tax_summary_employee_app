# Offline Deployment Guide

## 1. Prerequisites
- **Target OS**: Windows x64 (Same as build environment)
- **Database**: SQLite (no installation required - included)
- **Node.js**: Included in the deployment package in the `node` folder (no installation required)

## 2. Database Setup
The database is now included in the deployment package as `taxsummary.db` (SQLite format).

**To use with existing data:**
1. On your development machine, the backend creates `taxsummary.db` automatically on first run.
2. After populating with data, copy `taxsummary.db` to the `backend` folder in the deployment package.
3. The backend will automatically use the existing database file.

**To start fresh:**
- Simply run the backend - it will create a new empty `taxsummary.db` file automatically.
- You can seed data using the `/seed` endpoint on the API if needed.

## 3. Backend Deployment
1. Double-click `START_BACKEND.bat` in the root deployment folder, OR
2. Navigate to the `backend` folder manually and run `TaxSummary.Api.exe`.
   - It will start listening on `http://localhost:5000`
   - The database file `taxsummary.db` will be created/used automatically in the `backend` folder.
   - You can configure ports in `backend/appsettings.json` or via environment variables (`ASPNETCORE_URLS`)

## 4. Frontend Deployment
1. Double-click `START_FRONTEND.bat` in the root deployment folder, OR
2. Navigate to `frontend\.next\standalone` and run:
   ```cmd
   ..\..\node\node.exe server.js
   ```
3. The frontend will be accessible at `http://localhost:3000`

**Note**: Make sure the backend is running first before starting the frontend.

## 5. Quick Start (Recommended)
Simply double-click `START_ALL.bat` in the root deployment folder to:
- Start the backend API (http://localhost:5000)
- Start the frontend web app (http://localhost:3000)

Both services will open in separate console windows for easy monitoring.
7
## 6. Connecting Frontend to Backend
- If the backend URL changes (e.g., not `localhost:5000`), you might need to update the frontend configuration.
- Since this is a built Next.js app, environment variables are baked in at build time for client-side code (`NEXT_PUBLIC_...`).
- **Critical**: If `NEXT_PUBLIC_API_URL` was used, it is hardcoded. You might need to rebuild if the API URL changes, OR use a reverse proxy (IIS/Nginx) to map `/api` to the backend.
  - *Recommendation*: Use IIS to reverse proxy both apps if possible.

## 6. Troubleshooting
- **Backend fails to start**: Check `logs` folder (if logging to file) or Event Viewer. Ens
- **Database issues**: If `taxsummary.db` is locked or corrupted, delete it and restart the backend to create a fresh one.ure correct .NET dependencies (though it is self-contained, some OS patches might be needed).
- **Frontend fails**: Check if `node_modules` are present (they should be in `standalone`).
