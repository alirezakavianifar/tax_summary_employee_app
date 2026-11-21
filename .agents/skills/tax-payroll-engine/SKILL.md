---
name: tax-payroll-engine
description: >-
  Architectural rules, lifecycle stages, budget caps, and Excel export protocols for the Collaborative Payroll and Overtime Processing module. Use this skill whenever modifying payroll cycles, department budget caps, 120-hour labor limit validations, EPPlus RTL Excel generation, or office submission workflows.
---

# Collaborative Payroll & Overtime Processing Engine Skill

This skill governs the business rules, lifecycle transitions, department budget ceilings, and Excel generation protocols for the **Collaborative Payroll & Overtime Processing** module (`/payroll`) across the ASP.NET Core 8 Web API backend and Next.js 14 App Router frontend.

---

## 1. Domain Overview & Cycle Lifecycle

The collaborative payroll engine allows central administration to initiate a monthly payroll cycle, distribute budget allocations across tax offices and departments, enforce statutory labor ceilings, and collect validated submissions:

```
PayrollCycle Initiated (Draft)
  ↓ Central Admin opens submission window
OpenForSubmission
  ↓ Tax Offices submit overtime & welfare allocations per department
UnderReview
  ↓ Deputy / General Director approves departmental allocations
Finalized
  ↓ Archive & Export
Archived (EPPlus Multi-Sheet Live Formula Excel Output)
```

### Cycle Status (`PayrollCycleStatus.cs`)
- `Draft`: Initial setup by admin; budgets and parameters can be modified.
- `OpenForSubmission`: Offices can input and submit overtime/welfare for their personnel.
- `UnderReview`: Submissions locked; deputy/finance department verifies figures against office ceilings.
- `Finalized`: Approved by General Director; calculations locked; payments executed.
- `Archived`: Historical record; strictly read-only.

### Department Entry Status (`PayrollDepartmentStatus.cs`)
- `Pending` $\rightarrow$ `Draft` $\rightarrow$ `Submitted` $\rightarrow$ `DeputyApproved` $\rightarrow$ `Approved` (or `Rejected`).

---

## 2. Statutory Limits & Departmental Budget Caps

The payroll engine enforces statutory Iranian Labor Law caps and administrative rules defined in `PayrollBusinessRules.cs`:

```csharp
public static class PayrollBusinessRules
{
    public const double MaxWelfarePercentage = 100.0;
    public const double MaxOvertimeHoursStandard = 175.0; // Statutory civil service limit
    public const double MaxOvertimeHoursLabor = 120.0;    // Statutory Iranian Labor Code limit (ماده ۵۹ قانون کار)
    public const double MinOvertimeHoursThreshold = 30.0; // Fractional hours 1-29 are disallowed
    public const double MinWelfarePercentageThreshold = 30.0;
}
```

### Mandatory Business Invariants
1. **120-Hour Labor Limit (سقف قانون کار)**: Any employee under a labor contract (کارگری / مشمول قانون کار) cannot exceed **120 overtime hours per month**. The system must reject submissions exceeding 120 hours with a Persian validation error.
2. **Departmental Budget Cap (سقف اعتباری اداره)**: Each `PayrollDepartmentEntry` has an allocated budget cap (`BudgetCapAmount` / `AllocatedHours`). The total sum of overtime hours and welfare percentages assigned to employees in that department must **never exceed the approved ceiling**.
3. **Threshold Rules**: Discretionary small hours (1 to 29 hours) are restricted to prevent micro-allocations; employees receive either 0 or $\ge 30$ hours unless granted an administrative exception.

---

## 3. Position Tiers & Allocation Matrix

Staff allocations are grouped into three distinct hierarchical tiers (`PositionTier.cs`):
- `GroupHead` (`رئیس / سرپرست گروه`): Supervisory management; higher allocation ceilings.
- `SeniorExpert` (`کارشناس ارشد`): Lead auditors and senior technical staff.
- `OtherStaff` (`سایر کارکنان`): General audit and administrative personnel.

---

## 4. Excel Ingestion & EPPlus 7 Export Protocol

### Ingestion & Security
- When importing personnel hours or initial department rosters from Excel workbooks:
  - Sanitize all strings using `FormulaInjectionSanitizer` to prevent CSV/Excel Formula Injection attacks (`=`, `@`, `+`, `-`).
  - Validate national IDs, personnel numbers, and amounts against active employee records in `taxsummary.db`.

### Multi-Sheet RTL Excel Generation (`IPayrollExcelExportService`)
- Output workbooks generated via **EPPlus 7** must conform to:
  - **RTL View**: Set `worksheet.View.RightToLeft = true` across all generated worksheets.
  - **Live Formulas**: Use native Excel formulas (`SUM`, `AVERAGE`, `IF`) for department totals and grand totals rather than static pre-computed numbers, allowing finance officers to review formula links.
  - **Number Formatting**: Apply `#,##0` number format for Rials and `0.0` for hours.
  - **Typography**: Header styling with theme-matched fills, bold text, and thin borders.

---

## 5. API Endpoints & Frontend Architecture

### Backend Controllers:
- `PayrollCyclesController.cs` (`/api/payrollcycles`):
  - `GET /api/payrollcycles/active`: Fetches the currently open cycle for the user's assigned office.
  - `POST /api/payrollcycles/{id}/submit-department`: Submits an office department's allocation for review.
  - `POST /api/payrollcycles/{id}/approve`: Approves a cycle or department entry (Admin / Deputy only).
  - `GET /api/payrollcycles/{id}/export-excel`: Streams the generated EPPlus Excel workbook.

### Frontend Pages (`frontend/app/payroll/`):
- `page.tsx`: Dashboard displaying current active cycles, office submission progress bars, and budget burn rates.
- `cycles/[id]/page.tsx`: Departmental entry sheet with real-time budget ceiling indicators (green/yellow/red).
- `SendToOfficesModal.tsx`: Admin modal for opening submissions and setting office deadlines.
