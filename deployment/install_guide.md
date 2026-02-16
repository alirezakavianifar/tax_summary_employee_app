# Offline Deployment Guide

## 1. Prerequisites
- **Target OS**: Windows x64 (Same as build environment)
- **Database**: SQL Server (Standard/Enterprise/Express)
- **Node.js**: Required for Frontend.
  - Download `node.exe` (Standalone/Binary) from [nodejs.org](https://nodejs.org/) if you cannot run the installer.
  - Add it to PATH or place it in the `frontend` folder.

## 2. Database Setup
1. On your development machine, backup your database to a `.bak` file or generate a full SQL script.
2. Copy the `.bak` or `.sql` file to the server.
3. Restore the database or run the script on the server's SQL Server instance.
4. Update the connection string:
   - Open `backend/appsettings.json` (or `appsettings.Production.json`).
   - Edit `ConnectionStrings:DefaultConnection` to point to the server's database.

## 3. Backend Deployment
1. Navigate to the `backend` folder.
2. Run `TaxSummary.Api.exe`.
   - It will start listening on the configured ports (usually `http://localhost:5000`).
   - You can configure ports in `appsettings.json` or via environment variables (`ASPNETCORE_URLS`).

## 4. Frontend Deployment
1. Navigate to the `frontend` folder.
2. Ensure `node` is available.
3. Open `server.js` and checking if port configuration is needed (default is 3000).
4. Run:
   ```cmd
   node server.js
   ```
5. The frontend should be accessible at `http://localhost:3000`.

## 5. Connecting Frontend to Backend
- If the backend URL changes (e.g., not `localhost:5000`), you might need to update the frontend configuration.
- Since this is a built Next.js app, environment variables are baked in at build time for client-side code (`NEXT_PUBLIC_...`).
- **Critical**: If `NEXT_PUBLIC_API_URL` was used, it is hardcoded. You might need to rebuild if the API URL changes, OR use a reverse proxy (IIS/Nginx) to map `/api` to the backend.
  - *Recommendation*: Use IIS to reverse proxy both apps if possible.

## 6. Troubleshooting
- **Backend fails to start**: Check `logs` folder (if logging to file) or Event Viewer. Ensure correct .NET dependencies (though it is self-contained, some OS patches might be needed).
- **Frontend fails**: Check if `node_modules` are present (they should be in `standalone`).
