# 06. Step-by-Step Implementation Roadmap: Reporting & BI System

## Phased Strategy & Operational Verification Protocol

To guarantee zero regression in existing operational modules (Employee Evaluation, Collaborative Payroll, and Tax Refunds), the implementation is structured into **8 sequential, verified phases**. Each phase is equipped with:
1. **Explicit Implementation Checklist** (files, classes, methods, and configurations).
2. **Automated & Manual Verification Suite** (exact commands, test code snippets, and expected outcomes).
3. **Quality Gate** (mandatory pass criteria before proceeding to the subsequent phase).

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Domain Entities, Enums & Repository Contracts                 │
│ └─► Quality Gate: `dotnet test` (Domain Unit Tests 100% Pass)          │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Infrastructure Layer — Database, EF Core & Standard Seed Data │
│ └─► Quality Gate: SQLite Schema Intact & 10 Standard Reports Seeded    │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 3: Application Layer — DTOs, AutoMapper & FluentValidators       │
│ └─► Quality Gate: AssertConfigurationIsValid() & Persian Validation Pass│
├────────────────────────────────────────────────────────────────────────┤
│ Phase 4: Application & Infrastructure Analytics Engine                 │
│ └─► Quality Gate: Multi-Tenant Office Scoping & Aggregate Accuracy     │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 5: EPPlus 7 RTL Excel & Printable PDF Export Engine              │
│ └─► Quality Gate: Programmatic Excel Verification (RTL, #,#0, =SUM())  │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 6: API Layer — REST Controllers, Security & Audit Ledger         │
│ └─► Quality Gate: 14 Endpoints Verified (401/403/200 & Audit Persistence)│
├────────────────────────────────────────────────────────────────────────┤
│ Phase 7: Frontend Presentation — Next.js 14 App Router & Visual UI     │
│ └─► Quality Gate: `npm run build` Green & Persian RTL DataGrid Active   │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 8: Final Deployment & Minimal Zipped Update Package              │
│ └─► Quality Gate: `build_deployment.ps1 -UpdateOnly` (~4 MB zip)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Domain Layer (Entities, Enums & Repository Interfaces)

### 1.1 Implementation Checklist
- [x] Create `TaxSummary.Domain/Enums/ReportingEnums.cs`:
  - `ReportDomainSource` (`HumanResources = 1`, `PayrollAndWelfare = 2`, `TaxRefunds = 3`, `CrossSystem = 4`)
  - `ReportCategory` (`ExecutiveKpi = 1`, `Operational = 2`, `Financial = 3`, `ComplianceAndAudit = 4`)
  - `ReportType` (`Tabular = 1`, `Pivot = 2`, `SummaryKpi = 3`)
  - `AggregationType` (`Count = 1`, `Sum = 2`, `Average = 3`, `Min = 4`, `Max = 5`)
  - `ExportFormat` (`Excel = 1`, `Pdf = 2`, `Csv = 3`)
- [x] Create `TaxSummary.Domain/Entities/Reporting/ReportDefinition.cs`:
  - Enforce uppercase alphanumeric code regex `^[A-Z0-9_]{3,64}$`.
  - Guard `SetActive(false)` against deactivating system-seeded reports (`IsSystemReport == true`).
  - Business method `Update(title, description, configurationJson, requiredRole)`.
- [x] Create `TaxSummary.Domain/Entities/Reporting/SavedReportPreset.cs`:
  - Enforce non-empty `PresetName` (max 128 chars) and non-empty `FilterCriteriaJson`.
  - Properties: `IsSharedWithOffice`, `OfficeId`, `VisibleColumnsJson`.
- [x] Create `TaxSummary.Domain/Entities/Reporting/ReportExecutionLog.cs`:
  - Non-negative execution duration and row count constraints via `Math.Max(0, ...)`.
  - Factory method `Record(...)` capturing client IP and applied filter summary.
- [x] Create Value Objects in `TaxSummary.Domain/ValueObjects/Reporting/`:
  - `ExecutiveKpiSnapshot.cs` (point-in-time cross-system metrics + computed budget utilization percentage).
  - `DepartmentBudgetVariance.cs` (department budget vs spent + overtime per capita).
  - `TaxSourceDistribution.cs` (refund breakdown per tax source code + delay compensation).
  - `ReportColumnDefinition.cs` (column name, Persian label, data type, alignment, aggregate flag).
- [x] Create Repository Interfaces in `TaxSummary.Domain/Interfaces/`:
  - `IReportingRepository.cs` (CRUD for definitions, presets, execution logs).
  - `IExecutiveAnalyticsRepository.cs` (Domain read models: KPI snapshots, department variances, tax distributions).

### 1.2 Verification & Testing Suite for Phase 1
- **Automated Tests**:
  Create `Backend/Tests/TaxSummary.Domain.Tests/Entities/ReportingTests.cs`:
  ```csharp
  [Fact]
  public void ReportDefinition_Create_NormalizesCodeToUppercase_AndSetsDefaults()
  {
      var report = ReportDefinition.Create("rep_test_code", "عنوان گزارش", "توضیحات",
          ReportDomainSource.PayrollAndWelfare, ReportCategory.Financial, ReportType.Tabular, "{}");

      Assert.Equal("REP_TEST_CODE", report.Code);
      Assert.True(report.IsActive);
      Assert.False(report.IsSystemReport);
  }

  [Fact]
  public void ReportDefinition_SetActive_ThrowsWhenSystemReportIsDeactivated()
  {
      var report = ReportDefinition.Create("REP_SYS", "گزارش پایه", "شرح",
          ReportDomainSource.PayrollAndWelfare, ReportCategory.Financial, ReportType.Tabular, "{}", isSystemReport: true);

      var ex = Assert.Throws<InvalidOperationException>(() => report.SetActive(false));
      Assert.Contains("پایه سیستمی", ex.Message);
  }

  [Theory]
  [InlineData("")]
  [InlineData("   ")]
  [InlineData("REP-WITH-DASH")]
  [InlineData("ab")]
  public void ReportDefinition_Create_ThrowsOnInvalidCode(string invalidCode)
  {
      Assert.Throws<ArgumentException>(() => ReportDefinition.Create(invalidCode, "عنوان", "شرح",
          ReportDomainSource.PayrollAndWelfare, ReportCategory.Financial, ReportType.Tabular, "{}"));
  }
  ```
- **Execution Command**:
  ```powershell
  dotnet build Backend\TaxSummary.Domain\TaxSummary.Domain.csproj
  dotnet test Backend\Tests\TaxSummary.Domain.Tests\TaxSummary.Domain.Tests.csproj
  ```
- **Quality Gate**: Zero build warnings; 100% test pass rate on domain validation rules.

---

## Phase 2: Infrastructure Layer (EF Core, Database Schema & Seed Data)

### 2.1 Implementation Checklist
- [x] Create EF Core Configuration classes in `TaxSummary.Infrastructure/Data/Configurations/`:
  - `ReportDefinitionConfiguration.cs`: Table `ReportDefinitions`, unique index on `Code`, foreign key to `User`.
  - `SavedReportPresetConfiguration.cs`: Table `SavedReportPresets`, foreign keys to `ReportDefinition` and `User` with cascade delete, composite index `IX_SavedReportPresets_User_Report`.
  - `ReportExecutionLogConfiguration.cs`: Table `ReportExecutionLogs`, indexes on `ExecutedAt`, `UserId`, `ReportCode`.
- [x] Update `TaxSummary.Infrastructure/Data/TaxSummaryDbContext.cs`:
  - Add `DbSet<ReportDefinition>`, `DbSet<SavedReportPreset>`, `DbSet<ReportExecutionLog>`.
  - Apply configurations in `OnModelCreating`.
- [x] Implement `TaxSummary.Infrastructure/Data/ReportingDataSeeder.cs`:
  - Pre-seed standard reports (`REP_PAYROLL_BUDGET_UTIL`, `REP_PAYROLL_LABOR_CAP`, `REP_REFUND_SOURCE_SUMMARY`, `REP_REFUND_INTEREST_LIABILITY`, `REP_EMPLOYEE_PERF_SUMMARY`) with serialized `ConfigurationJson`.
- [x] Hook `ReportingDataSeeder.SeedReportingAsync` into startup in `Program.cs` / `DbInitializer.cs`.

### 2.2 Verification & Testing Suite for Phase 2
- **Schema & Migration Verification**:
  1. Build Infrastructure:
     ```powershell
     dotnet build Backend\TaxSummary.Infrastructure\TaxSummary.Infrastructure.csproj
     ```
  2. Inspect SQLite schema via PowerShell:
     ```powershell
     python -c "import sqlite3; conn=sqlite3.connect('Backend/taxsummary.db'); cursor=conn.cursor(); cursor.execute(\"SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Report%';\"); print('Tables:', cursor.fetchall())"
     ```
     - Output must include `ReportDefinitions`, `SavedReportPresets`, `ReportExecutionLogs`.
  3. Validate Seed Data:
     ```powershell
     python -c "import sqlite3; conn=sqlite3.connect('Backend/taxsummary.db'); cursor=conn.cursor(); cursor.execute(\"SELECT Code, Title, IsSystemReport FROM ReportDefinitions;\"); print(cursor.fetchall())"
     ```
     - Output must verify that all standard reports are seeded with `IsSystemReport = 1`.
- **Quality Gate**: Tables, unique indexes, and seed records cleanly present in `taxsummary.db`.

---

## Phase 3: Application Layer (DTOs, AutoMapper & FluentValidators)

### 3.1 Implementation Checklist
- [x] Create DTOs under `TaxSummary.Application/DTOs/Reporting/`:
  - `DashboardFilterDto.cs`, `ExecutiveDashboardDto.cs`, `ExecutiveKpiMetricsDto.cs`, `MonthlyTrendPointDto.cs`, `TopDepartmentBudgetDto.cs`.
  - `ReportDefinitionDto.cs`, `ReportColumnMetadataDto.cs`, `ReportFilterParametersDto.cs`, `ReportExecutionResultDto.cs`.
  - `DynamicReportQueryRequestDto.cs`, `DynamicFilterConditionDto.cs`, `DynamicAggregateSpecDto.cs`, `DynamicReportResultDto.cs`, `DynamicQueryMetadataDto.cs`.
  - `SavedReportPresetDto.cs`, `SaveReportPresetRequestDto.cs`, `UpdateReportPresetRequestDto.cs`.
- [x] Create AutoMapper Profile in `TaxSummary.Application/Mapping/ReportingMappingProfile.cs`:
  - `ReportDefinition` ↔ `ReportDefinitionDto`.
  - `SavedReportPreset` ↔ `SavedReportPresetDto`.
  - Domain value objects (`ExecutiveKpiSnapshot`, `DepartmentBudgetVariance`, `TaxSourceDistribution`) ↔ Dashboard DTOs.
- [x] Create FluentValidation validators in `TaxSummary.Application/Validators/Reporting/`:
  - `ReportFilterParametersValidator.cs`: Regex validation for Shamsi dates (`^\d{4}/\d{2}/\d{2}$`), page size range 1 to 200.
  - `DynamicReportQueryRequestValidator.cs`: Max 30 selected fields, valid enum domain source, non-empty filter properties.
  - `SaveReportPresetRequestValidator.cs`: Non-empty preset name (max 128 chars), valid JSON validation.

### 3.2 Verification & Testing Suite for Phase 3
- **Automated Tests**:
  Create `Backend/Tests/TaxSummary.Application.Tests/Validators/ReportingValidatorTests.cs`:
  ```csharp
  [Fact]
  public void ReportFilterParametersValidator_RejectsInvalidShamsiDates()
  {
      var validator = new ReportFilterParametersValidator();
      var invalidParams = new ReportFilterParametersDto { ShamsiDateFrom = "1404-07-01", PageNumber = 1, PageSize = 50 };
      var result = validator.Validate(invalidParams);

      Assert.False(result.IsValid);
      Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("فرمت تاریخ"));
  }

  [Fact]
  public void AutoMapper_Configuration_IsValid()
  {
      var config = new MapperConfiguration(cfg => cfg.AddProfile<ReportingMappingProfile>());
      config.AssertConfigurationIsValid();
  }
  ```
- **Execution Command**:
  ```powershell
  dotnet build Backend\TaxSummary.Application\TaxSummary.Application.csproj
  dotnet test Backend\Tests\TaxSummary.Domain.Tests\TaxSummary.Domain.Tests.csproj
  ```
- **Quality Gate**: AutoMapper mapping verification passes with zero unmapped members; FluentValidators enforce Persian error rules.

---

## Phase 4: Analytics Engine & Office Scoping

### 4.1 Implementation Checklist
- [x] Implement `TaxSummary.Infrastructure/Repositories/ExecutiveAnalyticsRepository.cs`:
  - `GetExecutiveKpiSnapshotAsync`: Queries employee count, evaluations, approved budget vs spent, labor cap violations, active refunds, and delay interest.
  - `GetDepartmentBudgetVariancesAsync`: Department budget consumption, variance calculation, and average overtime per capita.
  - `GetTaxSourceDistributionsAsync`: Refund totals grouped by tax source type with Persian titles.
  - Multi-tenant office scoping: Injects `Where(d => officeIds.Contains(d.OfficeId))` when user is in `Manager` role.
- [x] Implement `TaxSummary.Infrastructure/Repositories/ReportingRepository.cs`:
  - Complete CRUD for `ReportDefinition`, `SavedReportPreset`, and `ReportExecutionLog`.
- [x] Implement `TaxSummary.Application/Services/Reporting/ExecutiveReportingService.cs`:
  - Result pattern integration (`Result<ExecutiveDashboardDto>`, `Result<ReportExecutionResultDto>`).
  - In-memory caching: `IMemoryCache` stores `ExecutiveDashboardDto` with a 5-minute sliding TTL.
- [x] Implement `TaxSummary.Application/Services/Reporting/ReportBuilderEngine.cs`:
  - Dynamic expression tree builder (`DynamicExpressionBuilder`) translating filter conditions to strongly-typed LINQ predicates.
- [x] Register all interfaces in `TaxSummary.Infrastructure/DependencyInjection.cs`.

### 4.2 Verification & Testing Suite for Phase 4
- **Verification Tests**:
  1. Office Scoping Verification:
     - Simulate `Manager` assigned to Office ID `A`: Verify returned department entries belong exclusively to Office `A`.
     - Simulate `Admin`: Verify returned department entries encompass the entire province.
  2. Dynamic Expression Tree Verification:
     - Test filtering on `OvertimeHours > 100` returns only records meeting the numeric threshold.
     - Test attempting to filter on an unapproved property string (e.g. `PasswordHash`) is safely ignored by the whitelist.
  3. Caching Hit Verification:
     - Execute `GetExecutiveDashboardOverviewAsync` twice in succession; verify second call completes in `< 5ms` from cache.
- **Execution Command**:
  ```powershell
  dotnet build Backend\TaxSummary.sln
  ```
- **Quality Gate**: Backend compiles with zero warnings; service methods return accurate metrics with enforced office boundaries.

---

## Phase 5: Export Engine (EPPlus 7 RTL Excel & PDF)

### 5.1 Implementation Checklist
- [x] Implement `TaxSummary.Infrastructure/Services/Reporting/ReportExportService.cs`:
  - RTL worksheet initialization: `worksheet.View.RightToLeft = true;`
  - Organization title block: "اداره کل امور مالیاتی استان خوزستان" + Report Title + Shamsi generation timestamp (`PersianCalendar`).
  - Applied filter parameters callout box in header.
  - Dark slate table header styling (`#1e293b`), white text, thin borders.
  - Cell formatting by data type: currency (`#,##0`), numbers, dates, badges.
  - Alternating zebra row striping (`#f8fafc`).
  - Native Excel summary formula row: `=SUM(B6:B{endRow})`.
  - Column auto-fit with minimum widths and freeze panes (`worksheet.View.FreezePanes(6, 1)`).

### 5.2 Verification & Testing Suite for Phase 5
- **Automated Export Verification**:
  Create verification test or script generating and inspecting an Excel byte array:
  ```powershell
  python -c "
  import openpyxl, io
  # Test generated Excel stream
  wb = openpyxl.load_workbook('sample_report.xlsx')
  ws = wb.active
  assert ws.sheet_view.rightToLeft == True, 'RTL flag is missing'
  assert 'اداره کل امور مالیاتی استان خوزستان' in str(ws['A1'].value), 'Header title missing'
  print('EPPlus RTL Excel export validated successfully.')
  "
  ```
- **Quality Gate**: Generated `.xlsx` files open natively in Excel / LibreOffice with right-to-left layout, proper fonts, and active `=SUM(...)` formulas.

---

## Phase 6: API Layer (REST Controllers, Security & Audit Ledger)

### 6.1 Implementation Checklist
- [x] Create Controllers under `TaxSummary.Api/Controllers/Reporting/`:
  - `ExecutiveReportingController.cs` (`dashboard`, `kpis`, `trends`, `departments`).
  - `StandardReportsController.cs` (`catalog`, `execute`, `export/excel`).
  - `ReportBuilderController.cs` (`metadata/{source}`, `query`, `export/excel`).
  - `SavedReportsController.cs` (`GET`, `POST`, `PUT`, `DELETE`).
- [x] Apply `[RequireModuleAccess("module_reporting")]` and action permission attributes:
  - `action_reporting_view_dashboard`, `action_reporting_standard_reports`, `action_reporting_builder`, `action_reporting_export`.
- [x] Implement Claims extraction helpers (`GetCurrentUserId()`, `GetUserAssignedOfficeIds()`).
- [x] Integrate execution tracking via `ReportExecutionLog` and `AuditLogService`.

### 6.2 Verification & Testing Suite for Phase 6
- **API Endpoint Verification**:
  1. Test 401 Unauthorized:
     ```powershell
     curl -i -X GET http://localhost:5000/api/reporting/executive/dashboard
     ```
     - Assert response status is `401 Unauthorized`.
  2. Test 403 Forbidden:
     - Execute `ReportBuilderController` request with an `Employee` JWT token → Assert response is `403 Forbidden`.
  3. Test 200 OK & Audit Persistence:
     - Execute standard report with valid `Manager` token → Assert `200 OK` with JSON payload.
     - Inspect `ReportExecutionLogs` table to verify row is recorded with non-negative duration and row count.
- **Execution Command**:
  ```powershell
  dotnet build Backend\TaxSummary.sln
  ```
- **Quality Gate**: All 14 API endpoints respond with correct HTTP status codes and Swagger documentation.

---

## Phase 7: Frontend Presentation (Next.js 14 App Router & Visual Dashboards)

### 7.1 Implementation Checklist
- [x] Create `frontend/types/reporting.ts` with complete TypeScript interfaces.
- [x] Create `frontend/lib/api/reporting.ts` client with Axios methods and automated blob downloads.
- [x] Register `ExecutiveReportingModule` in `frontend/lib/modules/portalRegistry.ts`:
  - Amber/Orange gradient, icon `BarChart3`, badge `هوش تجاری و نظارت`, 4 primary action buttons.
- [x] Update `frontend/middleware.ts` to include `/reporting/:path*` in protected route matchers.
- [x] Build UI Pages in `frontend/app/reporting/`:
  - `layout.tsx`: Secondary navigation header with 4 tabs and role check.
  - `page.tsx`: Executive KPI Dashboard (Hero stats, Budget utilization meter bar, Refund pipeline flow, Monthly trend curves).
  - `standard/page.tsx`: Filterable catalog of the 10 standard reports.
  - `standard/[code]/page.tsx`: Interactive filter panel, Shamsi date pickers, high-density RTL data grid, sticky summary row, pagination, and Excel export button.
  - `builder/page.tsx`: 5-step dynamic report builder.
  - `saved/page.tsx`: User presets manager with quick execution shortcuts.
- [x] Build Reusable Components in `frontend/components/reporting/`:
  - `KpiCard.tsx`, `TrendChart.tsx`, `DepartmentBarChart.tsx`, `ReportFilterBar.tsx`, `DynamicDataTable.tsx`, `ExportActionMenu.tsx`.

### 7.2 Verification & Testing Suite for Phase 7
- **Frontend Verification**:
  1. Production Build & Typecheck:
     ```powershell
     cd frontend
     npm run build
     ```
     - Assert zero TypeScript errors (`tsc`).
     - Assert all `/reporting` routes compile cleanly into static/server-rendered Next.js pages.
  2. Visual UI Verification:
     - Home Portal (`/`): Verify module card appears with Amber gradient and action buttons.
     - Secondary Navigation: Verify tabs (`داشبورد`, `گزارش‌های استاندارد`, `گزارش‌ساز پویا`, `الگوهای ذخیره شده`) navigate seamlessly.
     - DataGrid: Verify column sorting arrows toggle ascending/descending, pagination functions correctly, and summary row displays sums.
     - Excel Download: Click "دانلود اکسل", verify browser downloads valid `.xlsx` file.
- **Quality Gate**: Zero console errors, fully responsive Persian RTL layout.

---

## Phase 8: Final Deployment & Minimal Zipped Update Package

### 8.1 Implementation Checklist
- [x] Ensure all backend and frontend unit tests pass.
- [x] Build the minimal zipped update package from the repository root:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\build_deployment.ps1 -UpdateOnly
  ```
- [x] Verify `deployment_update.zip` is generated (~4 MB).
- [x] Verify that user database (`taxsummary.db`) and uploaded media are excluded to eliminate data loss risks.

### 8.2 Final Acceptance Checklist
- [x] Clean Architecture layer separation maintained across all 4 layers.
- [x] Zero external unvetted dependencies added.
- [x] Authentication & Role/Office scoping seamlessly integrated.
- [x] Full Persian RTL and Shamsi date compatibility.
- [x] Automated unit and build tests green across all layers.
- [x] Lightweight `deployment_update.zip` verified and ready for deployment.
