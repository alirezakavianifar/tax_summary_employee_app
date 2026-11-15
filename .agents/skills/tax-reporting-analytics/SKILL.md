---
name: tax-reporting-analytics
description: >-
  Architecture, conventions, and operational patterns for the Reporting and Analytics Engine in the Tax Summary Employee App. Use this skill whenever adding, modifying, or querying standard reports, dynamic SQLite datasets (cd_ tables), Excel ingest/tweak flows, executive dashboards, or printable A4 tax reports.
---

# Tax Reporting & Analytics Engine Skill

This skill governs the design, implementation, and maintenance of the reporting infrastructure across the ASP.NET Core 8 Web API backend and Next.js 14 App Router frontend.

---

## 1. Reporting Architecture Overview

The reporting system operates across three distinct domains:

```
┌────────────────────────────────────────────────────────┐
│ 1. Standard Predefined Reports (Seeded & Audited)      │
│    • In-memory LINQ & EF Core projections              │
│    • Managed via ExecutiveReportingService             │
├────────────────────────────────────────────────────────┤
│ 2. Dynamic Custom Excel Datasets (cd_ SQLite Tables)   │
│    • Ad-hoc Excel ingestion with schema deduction      │
│    • Runtime dynamic DDL/DML via CustomDatasetService  │
├────────────────────────────────────────────────────────┤
│ 3. Executive KPI & Multi-View Dashboards               │
│    • Aggregations across 39,000+ operational records   │
│    • Real-time combined audit & decree KPIs            │
└────────────────────────────────────────────────────────┘
```

---

## 2. Dynamic Dataset Engine Guidelines

### A. Dynamic Table Naming & Isolation
- Custom tables uploaded from Excel **MUST ALWAYS** use the prefix `cd_` (Custom Dataset), e.g. `cd_REP_1405`, `cd_REP_2`.
- When deleting a report via `DeleteReportModal` / `CustomDatasetController.DeleteCustomReport`, the backend must drop the associated SQLite table:
  ```sql
  DROP TABLE IF EXISTS "cd_{reportCode}";
  ```

### B. Column Types & Aggregation
Standardized column data types supported by `ReportColumnMetadata`:
- `string`: Standard text fields, names, tracking numbers.
- `number`: Numeric counts, scores, integer metrics.
- `currency`: Monetary values in Rials (formatted via Persian currency separators, supports `hasAggregateSum`).
- `date`: Shamsi dates formatted via `formatIsoToJalali`.
- `badge`: Categorical statuses (e.g. "مختومه", "جاری", "تایید").
- `year`: Fiscal year integers (e.g. 1405).

### C. SQL Injection Prevention
- Dynamic queries against `cd_` tables MUST sanitize column names and use parameterized queries for all filter parameters:
  ```csharp
  var validColumns = config.Columns.Select(c => c.FieldName).ToHashSet(StringComparer.OrdinalIgnoreCase);
  if (!validColumns.Contains(cleanSortBy))
      throw new ArgumentException("Invalid sort column.");
  ```

---

## 3. Persian / Shamsi Date Protocols for Reporting

### A. Single Source of Truth
- Always use `frontend/lib/jalali.ts` for all Shamsi date operations.
- **Creation Date Stamping**:
  - `ReportDefinitionDto` contains `CreatedAt` (UTC `DateTime`).
  - Catalog cards and report headers must render the date using `formatIsoToJalali(report.createdAt, true)`.
  - Display with the `Calendar` icon from `lucide-react`.

### B. Report Print Letterhead Standards
Print layouts must strictly adhere to physical A4 landscape standards:
```tsx
<style jsx global>{`
  @media print {
    @page {
      size: A4 landscape !important;
      margin: 6mm 8mm !important;
    }
  }
`}</style>
```
The letterhead must display:
- Organization header: "سازمان امور مالیاتی کشور - اداره کل امور مالیاتی استان خوزستان"
- Report title and code: `reportDef.title` and `reportDef.code`
- Persian creation date: `تاریخ ایجاد گزارش: {formatIsoToJalali(reportDef.createdAt, true)}`
- Persian print date & time: `تاریخ چاپ: {toPersianDigits(new Date().toLocaleDateString('fa-IR'))}`

---

## 4. Time-To-Live (TTL) & Automatic Archiving Protocol

### A. Dual Enforcement Strategy
Reports can have an optional visibility duration (`ExpiresAt` / `ValidityDays`):
1. **Real-Time Query Filtering**:
   - In `ReportingRepository.GetAvailableReportsAsync`: non-admin queries filter `r.IsActive && (r.ExpiresAt == null || r.ExpiresAt > DateTime.UtcNow)`.
   - In `ExecutiveReportingService.ExecuteStandardReportAsync`: non-admin executions are rejected with a Persian message if `report.IsExpired`.
2. **Persistent Auto-Archival Sync**:
   - `_reportingRepository.ArchiveExpiredReportsAsync` automatically flags expired rows as `IsActive = 0`.

### B. Admin Lifecycle Oversight
- Administrators view expired reports under the `بایگانی / غیرفعال` tab (`selectedSource === -1`).
- Administrators can extend or renew the TTL via Tweak Studio (`ReportTweakDrawer.tsx`) or reactivate them.

---

## 5. Layer Synchronization Checklist

When modifying or adding report types or metadata:
1. **Domain**: `TaxSummary.Domain/Entities/Reporting/ReportDefinition.cs`
2. **DTO**: `TaxSummary.Application/DTOs/Reporting/ReportDefinitionDto.cs`
3. **AutoMapper Profile**: `TaxSummary.Application/Mapping/ReportingMappingProfile.cs`
4. **Service Manual Instantiations**: Check `CustomDatasetService.cs` (`CreateCustomDatasetAsync` and `TweakCustomReportAsync`)
5. **Frontend Types**: `frontend/types/reporting.ts` (`ReportDefinition`)
6. **Frontend UI Components**:
   - `frontend/app/reporting/standard/page.tsx` (Catalog cards & sorting)
   - `frontend/app/reporting/standard/[code]/page.tsx` (Execution view, filters, print letterhead)
   - `frontend/components/reporting/ExcelReportUploadModal.tsx` (Upload wizard)
   - `frontend/components/reporting/ReportTweakDrawer.tsx` (Column customization)

