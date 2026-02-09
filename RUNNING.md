# How to Run the Application

This guide explains how to start both the Backend (dotnet API) and the Frontend (Next.js Application).

## Prerequisites
- **.NET 8.0 SDK** (for the backend)
- **Node.js** (v18 or higher recommended) (for the frontend)
- **SQL Server Express** (If configured to use SQL Server, ensure it's running)

## 1. Running the Backend

The backend is an ASP.NET Core Web API.

1. Open a terminal in the root of the project.
2. Navigate to the API project directory:
   ```powershell
   cd Backend/TaxSummary.Api
   ```
3. Run the application:
   ```powershell
   dotnet run
   ```

**Expected output:**
The application will start and listen on:
- `https://localhost:5001`
- `http://localhost:5000`

You can verify it's running by visiting `https://localhost:5001/swagger` in your browser to see the API documentation.

## 2. Running the Frontend

The frontend is a Next.js application.

1. Open a **new** terminal window in the root of the project.
2. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
3. Install dependencies (if you haven't already):
   ```powershell
   npm install
   ```
4. Start the development server:
   ```powershell
   npm run dev
   ```

**Expected output:**
The application will start and listen on:
- `http://localhost:3000`

Open your browser and navigate to `http://localhost:3000` to view the application.

## Troubleshooting

### Port Conflicts
If you see an error like `EADDRINUSE`, it means the port is already taken.

**To kill a process on a specific port (e.g., 3000):**
```powershell
# Find and kill process on port 3000
$port = 3000
$pidToKill = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($pidToKill) { Stop-Process -Id $pidToKill -Force }
```

**Common Ports:**
- Frontend: 3000, 3001, etc.
- Backend: 5000, 5001, 5002

### Database Connection
Ensure your connection string in `Backend/TaxSummary.Api/appsettings.json` (or `appsettings.Development.json`) points to a valid database instance if you are not using an InMemory database.
