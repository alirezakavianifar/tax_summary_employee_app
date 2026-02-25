## Plan: Payroll Processing Module Integration

**TL;DR:** Add a new, self-contained **Payroll Processing** module to the existing app. It integrates the three Streamlit workflows (overtime+welfare with rates, monetary overtime+welfare, half-percent bonus) as three backend processing endpoints. Each accepts multiple uploaded Excel files, enriches data by matching `شماره کارمند` against the existing employee DB, performs the Streamlit-equivalent calculations, and returns structured JSON results. The frontend gains a new `/payroll` top-level section with file upload, results tables, multi-sheet Excel download, and optional save to DB. Saved runs can be revisited via a history page.

---

**Steps**

**Domain Layer**

1. Create `PayrollRun` entity in `Backend/TaxSummary.Domain/Entities/` — fields: `Id` (Guid), `ProcessType` (string enum: `OvertimeWelfareRated` | `OvertimeWelfareMonetary` | `HalfPercentBonus`), `RunLabel` (string, user-provided name), `CreatedAt`, `CreatedByUserId`, serialized `ResultJson` (stores the full result for re-download), `RowCount` (int)
2. Create `IPayrollRepository` interface in `Backend/TaxSummary.Domain/Interfaces/` — `SaveRunAsync`, `GetRunsAsync`, `GetRunByIdAsync`, `DeleteRunAsync`

**Application Layer**

3. Create `DTOs/Payroll/` subfolder under `Backend/TaxSummary.Application/DTOs/` with:
   - `PayrollDetailRowDto` — `PersonnelNumber`, `EmployeeName`, `Department`, `OvertimeRate` / `WelfareRate` / `BonusRate`, `BaseAmount`, `CalculatedOvertimeAmount`, `CalculatedWelfareAmount` / `CalculatedBonusAmount` (nullable fields used per process type)
   - `PayrollGroupedRowDto` — `Department`, `EmployeeCount`, `BaseOvertimeSum`, `BaseWelfareSum`, `TotalOvertimeAmount`, `TotalWelfareAmount` / `TotalBonusSum`
   - `PayrollProcessResultDto` — `ProcessType`, `DetailRows: List<PayrollDetailRowDto>`, `GroupedRows: List<PayrollGroupedRowDto>`
   - `SavePayrollRunRequestDto` — `ProcessType`, `RunLabel`, `Result: PayrollProcessResultDto`
   - `PayrollRunSummaryDto` — `Id`, `ProcessType`, `RunLabel`, `RowCount`, `CreatedAt`

4. Create `IPayrollService` + `PayrollService` in `Backend/TaxSummary.Application/Services/` with methods:
   - `ProcessOvertimeWelfareRatedAsync(Stream ezafe, Stream refahi, Stream coefficients, Stream deptMapping)` → replicates the first Streamlit branch: outer-merge on `شماره کارمند`, left-join dept and coefficients on `اداره`, calculate `ceil(سرانه × نرخ)` for overtime and `ceil(سرانه × نرخ / 100)` for welfare, then enrich names/units from DB via `IEmployeeRepository`
   - `ProcessOvertimeWelfareMonetaryAsync(same 4 streams)` → replicates the third Streamlit branch (fixed `سرانه` without rate multiplication)
   - `ProcessHalfPercentBonusAsync(Stream nim, Stream coefficients, Stream deptMapping)` → replicates second Streamlit branch: merge on `شماره کارمند`, join dept → coefficients on `اداره`, group-sum `سرانه پاداش` per department
   - `ExportToExcelAsync(PayrollProcessResultDto result)` → returns `byte[]` for download
   - `SaveRunAsync(SavePayrollRunRequestDto dto, Guid userId)` → persists run
   - `GetRunsAsync()` / `GetRunByIdAsync(Guid id)` / `DeleteRunAsync(Guid id)`

**Infrastructure Layer**

5. Add **EPPlus** NuGet package to `Backend/TaxSummary.Infrastructure/TaxSummary.Infrastructure.csproj` (EPPlus supports RTL worksheets, per-cell formulas, number formats — equivalent to xlsxwriter used in the Streamlit app)
6. Create `PayrollExcelExportService` in `Backend/TaxSummary.Infrastructure/Services/` implementing `ExportToExcelAsync` — one worksheet per `Department` value, RTL via `worksheet.View.RightToLeft = true`, header rows with the red bold notice text (same as the Streamlit script), per-row Excel formulas for overtime/welfare columns (e.g. `=IF(F{r}="","",F{r}*D{r})`), SUM rows at bottom, and a summary block (سرانه / جمع سرانه) pulled from `GroupedRows`
7. Create `PayrollRepository` in `Backend/TaxSummary.Infrastructure/Repositories/` implementing `IPayrollRepository` via `TaxSummaryDbContext`
8. Add `DbSet<PayrollRun> PayrollRuns` to `Backend/TaxSummary.Infrastructure/Data/TaxSummaryDbContext.cs` and create a new EF Core migration
9. Register `IPayrollService → PayrollService`, `IPayrollRepository → PayrollRepository`, and `PayrollExcelExportService` in `Backend/TaxSummary.Infrastructure/DependencyInjection.cs`

**API Layer**

10. Create `PayrollController` in `Backend/TaxSummary.Api/Controllers/` with `[Authorize]` and routes under `/api/payroll`:
    - `POST /api/payroll/process` — accepts `multipart/form-data` with fields `processType` (string) and 3–4 file inputs; calls the correct service method; returns `PayrollProcessResultDto`
    - `POST /api/payroll/export` — accepts `PayrollProcessResultDto` body; calls `ExportToExcelAsync`; returns `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` file stream
    - `POST /api/payroll/runs` — saves a run; returns `PayrollRunSummaryDto`
    - `GET /api/payroll/runs` — lists all runs
    - `GET /api/payroll/runs/{id}` — returns the full `PayrollProcessResultDto` for re-download
    - `DELETE /api/payroll/runs/{id}` — deletes a run

**Frontend**

11. Create `frontend/lib/api/payroll.ts` with: `processPayroll(formData)`, `exportPayroll(result)`, `saveRun(dto)`, `getRuns()`, `getRunById(id)`, `deleteRun(id)` — all using the shared Axios client in `frontend/lib/api/client.ts`
12. Create `frontend/app/payroll/page.tsx` — the main payroll processing page:
    - Persian-labeled RTL process type dropdown (3 options, same labels as Streamlit)
    - Conditional file upload inputs that change based on selected process (4 files for overtime/welfare, 3 files for bonus)
    - "پردازش" (Process) button → POSTs to `/api/payroll/process`
    - On success: show **detailed table** (`PayrollDetailRowDto` list) and **grouped table** (`PayrollGroupedRowDto` list) below
    - "دانلود اکسل" button → POSTs result to `/api/payroll/export`, triggers file download
    - "ذخیره" button with a label input → POSTs to `saveRun`
13. Create `frontend/app/payroll/history/page.tsx` — lists saved runs with process type, label, date, row count; each row has re-download and delete buttons
14. Update the nav/sidebar component in `frontend/components/layout/` to add a **محاسبات حقوقی** link pointing to `/payroll` (shown for all authenticated roles, or gate to Admin/Manager per your preference)
15. Update `frontend/middleware.ts` to add `/payroll/:path*` to the protected route matcher

---

**Verification**

- Upload the same 4 sample Excel files as the Streamlit app; compare the `مبلغ اضافه کار` / `مبلغ رفاهی` values cell-by-cell between the downloaded Excel and the Streamlit output
- Verify DB enrichment: an employee present in both the uploaded file and the DB should show the DB `نام کارمند` and `واحد متبوع`
- Test all three process types end-to-end (process → table display → Excel download → save → history → re-download)
- Confirm the exported `.xlsx` opens RTL in Excel/LibreOffice with correct number formatting and working SUM formulas

---

**Decisions**

- **EPPlus over MiniExcelLibs for export**: MiniExcelLibs is used for import but has limited formatting; EPPlus supports RTL, formulas, and cell formats matching what the Streamlit `xlsxwriter` produced
- **Stateless processing + optional persist**: result JSON stored in `PayrollRun.ResultJson` (serialized `PayrollProcessResultDto`) avoids designing a normalized payroll schema while still enabling re-download history
- **DB enrichment**: personnel numbers from uploaded files matched against existing `Employee` records to pull canonical `FirstName`/`LastName` and `ServiceUnit`; unmatched rows use the name from the uploaded Excel
