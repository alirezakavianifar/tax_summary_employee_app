# Tax Summary Employee App — Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend](#backend)
   - [Technology Stack](#backend-technology-stack)
   - [Project Structure](#backend-project-structure)
   - [Domain Layer](#domain-layer)
   - [Application Layer](#application-layer)
   - [Infrastructure Layer](#infrastructure-layer)
   - [API Layer](#api-layer)
   - [Authentication & Authorization](#authentication--authorization)
   - [REST API Reference](#rest-api-reference)
   - [Configuration](#configuration)
4. [Frontend](#frontend)
   - [Technology Stack](#frontend-technology-stack)
   - [Project Structure](#frontend-project-structure)
   - [Routing & Pages](#routing--pages)
   - [Authentication Flow](#authentication-flow)
   - [API Client](#api-client)
   - [Components](#components)
5. [Payroll Processing Module](#payroll-processing-module)
   - [Overview](#payroll-overview)
   - [Process Types](#process-types)
   - [Backend Implementation](#payroll-backend-implementation)
   - [API Endpoints](#payroll-api-endpoints)
   - [Frontend Pages](#payroll-frontend-pages)
   - [Excel Export Format](#excel-export-format)
6. [Data Model](#data-model)
7. [Running the Application](#running-the-application)
8. [Deployment](#deployment)

---

## Overview

**Tax Summary Employee App** is a full-stack web application designed to manage, record, and review employee tax-related performance reports. It supports multi-role access (Admin, Manager, Employee), employee record management, performance capability tracking, administrative status tracking, photo uploads, Excel-based bulk data import, and a **Payroll Processing** module for automated overtime, welfare, and bonus calculations.

The UI is in **Persian (Farsi)** with RTL layout. The backend exposes a JSON REST API consumed by the Next.js frontend.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Next.js Frontend                     │
│  (React 18, TypeScript, Tailwind CSS, App Router)        │
│  Port: 3000                                              │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP / REST (JWT Bearer)
                         ▼
┌──────────────────────────────────────────────────────────┐
│               ASP.NET Core 8 Web API                     │
│  Port: 5000                                              │
│  Clean Architecture (Domain / Application /              │
│  Infrastructure / API)                                   │
└────────────────────────┬─────────────────────────────────┘
                         │ EF Core
                         ▼
┌──────────────────────────────────────────────────────────┐
│             SQLite Database (taxsummary.db)               │
└──────────────────────────────────────────────────────────┘
```

The backend follows **Clean Architecture** with strict layer separation. The frontend uses the **Next.js App Router** with a `lib/api` module as an HTTP client layer.

---

## Backend

### Backend Technology Stack

| Technology | Purpose |
|---|---|
| ASP.NET Core 8 | Web API framework |
| Entity Framework Core 8 | ORM |
| SQLite | Production database |
| In-Memory DB | Testing / development option |
| AutoMapper | DTO ↔ entity mapping |
| FluentValidation | Input validation |
| BCrypt.Net | Password hashing |
| JWT (HS256) | Authentication tokens |
| MiniExcelLibs | Excel file parsing (import) |
| EPPlus 7 | Excel file generation (export, RTL + formulas) |
| Swagger / OpenAPI | API documentation |

### Backend Project Structure

```
Backend/
├── TaxSummary.sln
├── TaxSummary.Api/            ← HTTP layer (controllers, middleware, startup)
├── TaxSummary.Application/    ← Business logic (services, DTOs, validators, mapping)
├── TaxSummary.Domain/         ← Core domain (entities, interfaces, value objects)
├── TaxSummary.Infrastructure/ ← Data access (EF Core, repositories, JWT, file storage)
└── Tests/
    └── TaxSummary.Domain.Tests/
```

---

### Domain Layer

**`TaxSummary.Domain`** — contains all business entities and contracts. No external dependencies.

#### Entities

##### `Employee`
The central entity. Fields:

| Field | Type | Description |
|---|---|---|
| `Id` | `Guid` | Primary key |
| `PersonnelNumber` | `string` | Unique employee identifier |
| `FirstName` / `LastName` | `string` | Full name |
| `Education` | `string` | Education level |
| `ServiceUnit` | `string` | Organisational unit |
| `NationalId` | `string?` | National ID (optional) |
| `CurrentPosition` | `string` | Current job title |
| `AppointmentPosition` | `string` | Position by letter of appointment |
| `PreviousExperienceYears` | `int` | Years of prior experience |
| `PhotoUrl` | `string?` | Relative URL to uploaded photo |
| `StatusDescription` | `string?` | Free-text status note |
| `UserId` | `Guid?` | Optional FK to a `User` account |
| `CreatedAt` / `UpdatedAt` | `DateTime` | Audit timestamps |

**Navigation properties:** `AdministrativeStatus`, `ICollection<PerformanceCapability>`, `User?`

---

##### `AdministrativeStatus`
One-to-one with `Employee`. Tracks time/attendance statistics:

| Field | Type | Description |
|---|---|---|
| `MissionDays` | `int` | Days on official mission |
| `SickLeaveDays` | `int` | Days of sick leave |
| `PaidLeaveDays` | `int` | Days of paid leave |
| `OvertimeHours` | `int` | Overtime hours worked |
| `DelayAndAbsenceHours` | `int` | Hours of delay or absence |
| `HourlyLeaveHours` | `int` | Hourly leave taken |

---

##### `PerformanceCapability`
One-to-many with `Employee`. Tracks tax-related performance per system role with both boolean flags and numerical (quantity + amount) fields:

| Capability | Fields |
|---|---|
| Tax Issue Detection | `_Quantity`, `_Amount` |
| Tax Evasion Detection | `_Quantity`, `_Amount` |
| Company Identification | `_Quantity`, `_Amount`, `_UndetectedQuantity` |
| Value Added Recognition | `_Quantity`, `_Amount`, `_UndetectedQuantity` |
| Jobs | `_Quantity`, `_Amount`, `_UndetectedQuantity` |
| Other | `_Quantity`, `_Amount`, `_UndetectedQuantity` |
| Referred or Executed | `_Quantity`, `_Amount` |

Additional field: `SystemRole` (string) — the role the record applies to.

---

##### `User`
Authentication entity:

| Field | Type | Description |
|---|---|---|
| `Id` | `Guid` | Primary key |
| `Username` | `string` | Unique login name |
| `Email` | `string` | Unique email |
| `PasswordHash` | `string` | BCrypt hash |
| `Role` | `string` | `Admin`, `Manager`, or `Employee` |
| `IsActive` | `bool` | Account status |
| `FailedLoginAttempts` | `int` | Tracks brute force |
| `LockoutEnd` | `DateTime?` | Account lockout expiry |
| `EmployeeId` | `Guid?` | Optional FK to `Employee` |

##### `RefreshToken`
Stores refresh tokens tied to a `User`. Fields: `Token`, `ExpiresAt`, `CreatedAt`, `RevokedAt`, `IpAddress`, `UserAgent`.

---

##### `PayrollRun`
Persists a completed payroll processing run for history and re-download. Fields:

| Field | Type | Description |
|---|---|---|
| `Id` | `Guid` | Primary key |
| `ProcessType` | `string` | One of the three process type constants |
| `RunLabel` | `string` | User-provided name for this run |
| `CreatedAt` | `DateTime` | UTC creation timestamp |
| `CreatedByUserId` | `Guid` | FK to the `User` who ran the calculation |
| `ResultJson` | `string` | Full `PayrollProcessResultDto` serialised as JSON |
| `RowCount` | `int` | Number of detail rows (for display in history list) |

**Navigation property:** `CreatedBy` (`User?`)

##### `PayrollProcessType` (constants)
Static class with string constants and validation helper:
- `OvertimeWelfareRated` — overtime + welfare with rate multiplication
- `OvertimeWelfareMonetary` — overtime + welfare with fixed monetary سرانه
- `HalfPercentBonus` — half-percent bonus aggregation per department

---

#### Interfaces (Contracts)

| Interface | Description |
|---|---|
| `IEmployeeRepository` | CRUD + search for `Employee` |
| `IUserRepository` | CRUD for `User` and `RefreshToken` |
| `IPayrollRepository` | `SaveRunAsync`, `GetRunsAsync`, `GetRunByIdAsync`, `DeleteRunAsync` |
| `IUnitOfWork` | Transaction boundary |
| `IJwtTokenService` | Access & refresh token generation |
| `IPasswordHasher` | BCrypt hash/verify |

#### Value Objects

- `PersonnelNumber` — encapsulates validation of a personnel number string.
- `CapabilityMetrics` — groups quantity + amount + undetected values for a capability.

---

### Application Layer

**`TaxSummary.Application`** — orchestrates use cases via services, DTOs, AutoMapper profiles, and FluentValidation validators.

#### Services

| Service | Interface | Responsibility |
|---|---|---|
| `AuthService` | `IAuthService` | Login, register, refresh token, get current user |
| `EmployeeReportService` | `IEmployeeReportService` | Full CRUD for employee reports, pagination, search, photo management |
| `UserService` | `IUserService` | Admin user management (list, get, update, delete) |
| `ExcelSeedService` | `IExcelSeedService` | Bulk employee import from `.xlsx` files |
| `PayrollService` | `IPayrollService` | Three payroll processing workflows + run persistence |
| `PayrollExcelExportService` | `IPayrollExcelExportService` | Multi-sheet RTL Excel export via EPPlus |

#### Key DTOs

| DTO | Direction | Purpose |
|---|---|---|
| `CreateEmployeeReportDto` | Request | Create new employee with all sub-entities |
| `UpdateEmployeeReportDto` | Request | Update existing employee report |
| `EmployeeReportDto` | Response | Full employee report including status & capabilities |
| `EmployeeDto` | Response | Summary row for lists/pagination |
| `AdministrativeStatusDto` | Nested | Administrative attendance data |
| `PerformanceCapabilityDto` | Nested | Performance metrics per system role |
| `PhotoUploadResponseDto` | Response | Returns `photoUrl` after upload |
| `LoginRequestDto` / `LoginResponseDto` | Auth | Credentials in, JWT + user info out |
| `RegisterRequestDto` | Auth | New user registration payload |
| `UpdateUserRequestDto` | Request | Admin update of a user |
| `PayrollDetailRowDto` | Response | Single employee row in a payroll result |
| `PayrollGroupedRowDto` | Response | Aggregated per-department totals |
| `PayrollProcessResultDto` | Response | Full result: process type + detail rows + grouped rows |
| `SavePayrollRunRequestDto` | Request | Persist a completed run with label |
| `PayrollRunSummaryDto` | Response | Summary row for the history list |

#### Validation

FluentValidation validators are provided for `CreateEmployeeReportDto` and photo uploads (`PhotoUploadValidator`).

---

### Infrastructure Layer

**`TaxSummary.Infrastructure`** — all side-effectful implementations (database, files, JWT, password).

#### DbContext

`TaxSummaryDbContext` (EF Core) manages:
- `Employees`, `AdministrativeStatuses`, `PerformanceCapabilities`, `Users`, `RefreshTokens`, `PayrollRuns`

**Database**: SQLite (`taxsummary.db` alongside the API binary) by default. Supports an in-memory database for testing via the `UseInMemoryDatabase` connection string flag.

**Migrations**: The `AddPayrollRun` migration adds the `PayrollRuns` table.

#### Repositories

- `EmployeeRepository` — implements `IEmployeeRepository`. Provides paginated queries, search by name/personnel number, and eager-loading of related entities.
- `UserRepository` — implements `IUserRepository`. Manages users and refresh token records.
- `PayrollRepository` — implements `IPayrollRepository`. Stores and retrieves `PayrollRun` records ordered by creation date.

#### Services (Infrastructure)

| Service | Description |
|---|---|
| `JwtTokenService` | Generates HS256 access tokens (60 min expiry) and opaque refresh tokens (7-day expiry) |
| `PasswordHasher` | BCrypt hash generation and verification |
| `FileStorageService` | Saves employee photos under `wwwroot/uploads/employee-photos/` |
| `ExcelSeedService` | Parses `.xlsx` worksheets and bulk-inserts employees via `IUnitOfWork` |
| `PayrollService` | Implements the three payroll workflows using MiniExcelLibs for parsing and `IEmployeeRepository` for DB enrichment of names/units |
| `PayrollExcelExportService` | Generates multi-sheet RTL Excel workbooks via EPPlus — one sheet per department, red bold header notice, per-row Excel formulas for overtime/welfare columns, SUM footer rows, and a summary block pulled from grouped rows |

---

### API Layer

**`TaxSummary.Api`** — the ASP.NET Core host project.

#### Middleware

`ExceptionHandlingMiddleware` — global unhandled exception handler. Returns structured JSON error responses.

#### Program.cs Bootstrap

- JSON serialization: camelCase, relaxed Unicode escaping.
- JWT Bearer authentication with token extraction from both `Authorization` header and `accessToken` cookie.
- CORS configured from `appsettings.json` `Cors:AllowedOrigins`.
- Static files served from `wwwroot/` for uploaded photos.
- Swagger UI enabled (`/swagger`).
- DB migration + seed on startup via `DbInitializer`.

---

### Authentication & Authorization

- **JWT Bearer (HS256)** — access token valid for **60 minutes**.
- **Refresh tokens** — HTTP-only cookie (`refreshToken`), valid for **7 days**. Auto-rotation on every refresh call.
- **Account lockout** — after `MaxFailedAttempts` (default 5) consecutive failed logins.
- **Roles**: `Admin`, `Manager`, `Employee`.
  - `[Authorize(Roles = "Admin")]` restricts user management endpoints.
  - `[Authorize]` (any authenticated role) restricts employee report endpoints.
  - `[AllowAnonymous]` on login and register endpoints.

---

### REST API Reference

#### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Login, returns `accessToken` + sets refresh cookie |
| `POST` | `/api/auth/register` | Admin | Create a new user |
| `POST` | `/api/auth/refresh` | Public (cookie) | Rotate refresh token, return new access token |
| `POST` | `/api/auth/logout` | Authenticated | Revoke current refresh token |
| `GET` | `/api/auth/me` | Authenticated | Return current user info |

#### Employee Reports — `/api/employeereports`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/employeereports/{employeeId}` | Authenticated | Get full report by employee GUID |
| `GET` | `/api/employeereports/by-personnel-number/{number}` | Authenticated | Get full report by personnel number |
| `GET` | `/api/employeereports` | Authenticated | Paginated employee list (supports `page`, `pageSize`, `search`) |
| `POST` | `/api/employeereports` | Authenticated | Create new employee report |
| `PUT` | `/api/employeereports/{employeeId}` | Authenticated | Update existing employee report |
| `DELETE` | `/api/employeereports/{employeeId}` | Authenticated | Delete employee record |
| `POST` | `/api/employeereports/{employeeId}/photo` | Authenticated | Upload employee photo (`multipart/form-data`) |

#### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users` | Admin | List all users |
| `GET` | `/api/users/{id}` | Admin | Get user by ID |
| `POST` | `/api/users` | Admin | Create user |
| `PUT` | `/api/users/{id}` | Admin | Update user (email, role, active, linked employee) |
| `DELETE` | `/api/users/{id}` | Admin | Delete user |

#### Seed — `/api/seed`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/seed/import-excel` | Admin | Bulk import employees from `.xlsx` file |

#### Payroll — `/api/payroll`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payroll/process` | Authenticated | Process uploaded Excel files; returns `PayrollProcessResultDto`. Accepts `multipart/form-data` with `processType` field and file fields (`ezafe`, `refahi`, `coefficients`, `deptMapping` for overtime types; `nim`, `coefficients`, `deptMapping` for bonus type) |
| `POST` | `/api/payroll/export` | Authenticated | Accepts `PayrollProcessResultDto` body; returns `.xlsx` file download |
| `POST` | `/api/payroll/runs` | Authenticated | Save a completed run; returns `PayrollRunSummaryDto` |
| `GET` | `/api/payroll/runs` | Authenticated | List all saved runs (most recent first) |
| `GET` | `/api/payroll/runs/{id}` | Authenticated | Get full `PayrollProcessResultDto` for a saved run |
| `DELETE` | `/api/payroll/runs/{id}` | Authenticated | Delete a saved run |

---

### Configuration

Key values in `appsettings.json`:

```json
{
  "Urls": "http://0.0.0.0:5000",
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=./taxsummary.db"
  },
  "JwtSettings": {
    "SecretKey": "<min 32 chars>",
    "Issuer": "TaxSummaryApi",
    "Audience": "TaxSummaryClient",
    "AccessTokenExpirationMinutes": 60,
    "RefreshTokenExpirationDays": 7
  },
  "Authentication": {
    "MaxFailedAttempts": 5
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000", "..."]
  },
  "FileStorage": {
    "EmployeePhotosPath": "wwwroot/uploads/employee-photos",
    "MaxFileSizeInMB": 5,
    "AllowedExtensions": [".jpg", ".jpeg", ".png", ".gif"]
  }
}
```

---

## Frontend

### Frontend Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | React framework + routing |
| React 18 | UI library |
| TypeScript 5 | Type safety |
| Tailwind CSS 3 | Utility-first styling |
| Axios | HTTP requests |
| React Hook Form + Zod | Form management + validation |
| TanStack React Query 5 | Server state caching |
| js-cookie | Cookie access in the browser |
| Lucide React | Icon set |

---

### Frontend Project Structure

```
frontend/
├── middleware.ts              ← Route protection (Next.js Edge Middleware)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── app/
│   ├── layout.tsx             ← Root layout (AuthProvider, global fonts/styles)
│   ├── page.tsx               ← Root redirect → /reports
│   ├── globals.css
│   ├── login/                 ← Login page
│   ├── about/                 ← Static about page
│   ├── reports/
│   │   ├── page.tsx           ← Employee list with search + pagination
│   │   ├── create/page.tsx    ← Create new employee report form
│   │   ├── search/            ← Search by personnel number
│   │   └── [id]/page.tsx     ← View/edit individual employee report
│   ├── admin/
│   │   └── users/             ← Admin user management
│   └── payroll/
│       ├── page.tsx           ← Payroll processing form + results tables
│       └── history/
│           └── page.tsx       ← Saved payroll run history
├── components/
│   ├── PhotoUpload.tsx        ← Reusable photo upload widget
│   ├── ProtectedRoute.tsx     ← Role-based route guard
│   └── layout/                ← Shared nav/header/sidebar components
├── contexts/
│   └── AuthContext.tsx        ← Global auth state (token, user, login/logout)
├── lib/
│   └── api/
│       ├── config.ts          ← Dynamic API base URL resolution
│       ├── client.ts          ← Axios instance with auth interceptors
│       ├── auth.ts            ← Auth API calls
│       ├── reports.ts         ← Employee report API calls
│       ├── users.ts           ← User management API calls
│       ├── payroll.ts         ← Payroll processing + history API calls
│       └── types.ts           ← Shared TypeScript types
├── types/
│   └── auth.ts                ← Auth-specific types
└── public/
    └── fonts/
```

---

### Routing & Pages

#### `/login`
- Public page. Submits credentials to `POST /api/auth/login`.
- On success, stores `accessToken` in `localStorage` + `accessToken` cookie, then redirects to `/reports`.

#### `/reports`
- **Protected** (any authenticated role).
- Paginated employee list with debounced search.
- Supports Excel file import (`POST /api/seed/import-excel`).
- Each row links to an individual report page.

#### `/reports/create`
- Create a new employee report. Full form including:
  - Employee personal details
  - Administrative status (leave, overtime)
  - Performance capabilities (one or more system roles)
  - Optional photo upload
- Uses `POST /api/employeereports` then `POST /api/employeereports/{id}/photo`.

#### `/reports/[id]`
- View and edit a full employee report by GUID.
- Uses `GET /api/employeereports/{id}` and `PUT /api/employeereports/{id}`.

#### `/reports/search`
- Search by personnel number via `GET /api/employeereports/by-personnel-number/{number}`.

#### `/admin/users`
- **Protected** (Admin role only).
- List, create, edit, and delete system users.
- Calls `/api/users` endpoints.

#### `/about`
- Static informational page.

#### `/payroll`
- **Protected** (any authenticated role).
- RTL form with a Persian-labelled dropdown to select the process type.
- Conditional file upload inputs — 4 files for overtime/welfare types, 3 files for bonus type.
- "پردازش" button posts to `POST /api/payroll/process` and shows the result.
- On success: a **detail table** (`PayrollDetailRowDto` rows) and a **grouped table** (`PayrollGroupedRowDto` rows) are rendered below.
- **دانلود اکسل** button posts the result to `POST /api/payroll/export` and triggers a browser file download.
- **ذخیره** button with a label input posts to `POST /api/payroll/runs` to persist the run.

#### `/payroll/history`
- **Protected** (any authenticated role).
- Lists all saved payroll runs: label, process type (Persian label), row count, creation date.
- Each row has a **re-download** button (fetches the full result then exports to Excel) and a **حذف** (delete) button.

---

### Authentication Flow

```
Browser                        AuthContext               Backend
  │                                 │                       │
  │──── Enter credentials ─────────►│                       │
  │                                 │─── POST /auth/login ──►│
  │                                 │◄──── accessToken ──────│
  │                                 │    (+ refreshToken     │
  │                                 │       in cookie)       │
  │                                 │                        │
  │◄── Stored in localStorage ──────│                        │
  │    + accessToken cookie         │                        │
  │                                 │                        │
  │  [55-minute timer fires]        │                        │
  │                                 │── POST /auth/refresh ──►│
  │                                 │◄── new accessToken ─────│
  │                                 │                        │
  │  [App reload / new tab]         │                        │
  │                                 │── GET /auth/me ────────►│
  │                                 │◄── user info ───────────│
  │                                 │  (validates token)      │
```

Key behaviors:
- Token auto-refreshes every **55 minutes** via `setInterval` in `AuthContext`.
- On app load, the stored token is verified with `GET /api/auth/me` before trusted.
- If validation fails, a refresh is attempted; if that fails too, the user is logged out.
- `ProtectedRoute` component wraps pages that require specific roles; redirects to `/login` if unauthorized.
- Next.js Edge Middleware (`middleware.ts`) provides a second layer of redirect protection for `/reports/**`, `/admin/**`, and `/payroll/**`.

---

### API Client

**`lib/api/client.ts`** — shared Axios instance:
- Attaches `Authorization: Bearer <token>` header from `localStorage` on every request.
- On 401 responses, attempts one token refresh via `POST /api/auth/refresh`, then retries the original request.
- On second 401 (refresh failed), clears auth state and redirects to `/login`.

**`lib/api/config.ts`** — dynamic base URL:
- Uses `NEXT_PUBLIC_API_URL` environment variable if set to a non-localhost value.
- Otherwise uses `http://<current-hostname>:5000` so the app works on any LAN IP without reconfiguration.

---

### Components

#### `ProtectedRoute`
Wraps page content. Accepts optional `requiredRoles: string[]`. Renders nothing (or a loader) while auth state is resolving; redirects to `/login` if unauthenticated or to a 403 page if role is insufficient.

#### `PhotoUpload`
Reusable file input with preview. Accepts `onFileSelect: (file: File) => void`. Validates type and size client-side before upload.

#### Layout Components (`components/layout/`)
Shared navigation bar and sidebar used across protected pages. Show current user's name, role badge, and logout button.

---

## Payroll Processing Module

### Payroll Overview

The Payroll Processing module is a self-contained feature that replicates three Excel-based Streamlit workflows as backend processing endpoints. Uploaded Excel files are parsed on the server, merged and enriched with canonical employee names and service units from the existing employee database, and returned as structured JSON. The frontend renders the result in sortable tables and offers a one-click multi-sheet Excel download.

Processed runs can optionally be saved to the database and re-downloaded later from the history page.

### Process Types

| Constant | Persian label | Input files | Description |
|---|---|---|---|
| `OvertimeWelfareRated` | ادغام و محاسبه اضافه کار و رفاهی | ezafe, refahi, coefficients, deptMapping | Outer-merge overtime + welfare on `شماره کارمند`, left-join dept + coefficients, calculate `ceil(سرانه × نرخ)` for overtime and `ceil(سرانه × نرخ / 100)` for welfare |
| `OvertimeWelfareMonetary` | اضافه کار و رفاهی مبلغی | ezafe, refahi, coefficients, deptMapping | Same merge logic but the `سرانه` values are treated as fixed monetary amounts (no rate multiplication) |
| `HalfPercentBonus` | پردازش نیم درصد و تجمیع پاداش | nim, coefficients, deptMapping | Merge nim file on `شماره کارمند`, join dept → coefficients on `اداره`, group-sum `سرانه پاداش` per department |

### Payroll Backend Implementation

**Domain**
- `PayrollRun` entity — persists a saved run with serialised result JSON.
- `PayrollProcessType` — static constants and `IsValid()` helper.
- `IPayrollRepository` — four async methods: `SaveRunAsync`, `GetRunsAsync`, `GetRunByIdAsync`, `DeleteRunAsync`.

**Application**
- `IPayrollService` — declares the three `ProcessXxxAsync` methods plus persistence methods (`SaveRunAsync`, `GetRunsAsync`, `GetRunByIdAsync`, `DeleteRunAsync`).
- `IPayrollExcelExportService` — declares `ExportToExcelAsync(PayrollProcessResultDto) → byte[]`.
- DTOs in `Application/DTOs/Payroll/`: `PayrollDetailRowDto`, `PayrollGroupedRowDto`, `PayrollProcessResultDto`, `SavePayrollRunRequestDto`, `PayrollRunSummaryDto`.

**Infrastructure**
- `PayrollService` — concrete implementation using **MiniExcelLibs** for `.xls`/`.xlsx` parsing, `IEmployeeRepository.GetAllAsync()` for DB enrichment, and `IPayrollRepository` + `IUnitOfWork` for persistence.
- `PayrollExcelExportService` — generates workbooks using **EPPlus 7**:
  - One worksheet per unique department value.
  - `worksheet.View.RightToLeft = true` for RTL display.
  - Red-bold multi-line header notice merged across A1:L4.
  - Column headers at row 5; data from row 6.
  - Columns for user-input hours/percentages are left blank.
  - Per-row Excel formulas: `=IF(F{r}="","",F{r}*D{r})` (مبلغ اضافه) and `=IF(G{r}="","",G{r}*E{r}/100)` (مبلغ رفاهی).
  - `SUM` formula rows at the bottom of each data block.
  - Summary block (سرانه / جمع سرانه) pulled from grouped rows at columns M–N.
- `PayrollRepository` — EF Core implementation ordered by `CreatedAt DESC`.
- All services and repositories registered in `DependencyInjection.cs`.

### Payroll API Endpoints

See [REST API Reference — Payroll](#payroll----apiPayroll) above.

### Payroll Frontend Pages

See [Routing & Pages — /payroll](#payroll) above.

`lib/api/payroll.ts` exports:
- TypeScript interfaces: `PayrollDetailRowDto`, `PayrollGroupedRowDto`, `PayrollProcessResultDto`, `SavePayrollRunRequestDto`, `PayrollRunSummaryDto`.
- `PROCESS_TYPE_LABELS` map for rendering Persian labels from process type constants.
- `payrollApi` object: `processPayroll(FormData)`, `exportPayroll(result)`, `saveRun(dto)`, `getRuns()`, `getRunById(id)`, `deleteRun(id)`.

### Excel Export Format

| Feature | Detail |
|---|---|
| Sheet layout | One sheet per department, sheet name truncated to 31 chars |
| Direction | RTL (`worksheet.View.RightToLeft = true`) |
| Header notice | Red, bold, word-wrapped, merged A1:L4 (three-line Persian warning text) |
| Number format | `#,##0` applied to all numeric columns |
| Formulas | `=IF(F{r}="","",F{r}*D{r})` and `=IF(G{r}="","",G{r}*E{r}/100)` for overtime/welfare |
| SUM rows | Bold SUM formula at the bottom of each department sheet |
| Summary block | Per-department سرانه and جمع سرانه values at columns M–N |
| Bonus sheets | Column D (مبلغ پاداش) left blank for user entry; SUM at bottom; جمع سرانه پاداش at F1:F2 |

---

## Data Model

```
User ─────────────────────────────┐
 │ (1:0..1)                       │
 ▼                                 │
Employee ──────────────────────────┘
 │ (1:0..1)
 ├──► AdministrativeStatus
 │
 └──► PerformanceCapability (1:many)
         (one per SystemRole)

User
 ├──► RefreshToken (1:many)
 └──► PayrollRun (1:many, via CreatedByUserId)
```

---

## Running the Application

### Backend

```bash
cd Backend/TaxSummary.Api
dotnet run
# API available at http://localhost:5000
# Swagger UI at http://localhost:5000/swagger
```

The SQLite database file is auto-created and migrated on first run by `DbInitializer`.

### Frontend

```bash
cd frontend
npm install
npm run dev
# UI available at http://localhost:3000
```

### Environment Variables (Frontend)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://<hostname>:5000` | Backend API base URL |

---

## Deployment

The `deployment/` directory contains a self-contained deployment package:

```
deployment/
├── START_ALL.bat          ← Starts both backend and frontend
├── START_BACKEND.bat      ← Starts the .NET backend
├── START_FRONTEND.bat     ← Starts the Node.js frontend server
├── backend/               ← Published .NET binaries + SQLite DB
│   ├── appsettings.json
│   └── wwwroot/           ← Uploaded photos served statically
├── frontend/              ← Next.js standalone build
│   ├── server.js
│   └── public/
├── node/                  ← Portable Node.js runtime
└── install_guide.md
```

The deployment is designed for **offline / LAN installation** — it bundles its own Node.js runtime so no internet access is required on the target machine. The frontend auto-discovers the backend using the browser's current hostname, so deploying to any IP address works without reconfiguration.
