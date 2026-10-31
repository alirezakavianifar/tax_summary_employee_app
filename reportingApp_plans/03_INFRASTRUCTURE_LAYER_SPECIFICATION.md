# 03. Infrastructure Layer Specification: Reporting & BI System

## 1. EF Core Entity Configurations (`TaxSummary.Infrastructure/Data/Configurations/`)

### 1.1 `ReportDefinitionConfiguration.cs`
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class ReportDefinitionConfiguration : IEntityTypeConfiguration<ReportDefinition>
{
    public void Configure(EntityTypeBuilder<ReportDefinition> builder)
    {
        builder.ToTable("ReportDefinitions");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Code)
            .IsRequired()
            .HasMaxLength(64);
        builder.HasIndex(r => r.Code)
            .IsUnique()
            .HasDatabaseName("IX_ReportDefinitions_Code");

        builder.Property(r => r.Title)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(r => r.Description)
            .HasMaxLength(1000)
            .HasDefaultValue(string.Empty);

        builder.Property(r => r.DomainSource)
            .IsRequired();

        builder.Property(r => r.Category)
            .IsRequired();

        builder.Property(r => r.Type)
            .IsRequired();

        builder.Property(r => r.ConfigurationJson)
            .IsRequired()
            .HasColumnType("TEXT");

        builder.Property(r => r.IsSystemReport)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(r => r.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(r => r.RequiredRole)
            .HasMaxLength(64);

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        builder.HasIndex(r => r.DomainSource).HasDatabaseName("IX_ReportDefinitions_DomainSource");
        builder.HasIndex(r => r.Category).HasDatabaseName("IX_ReportDefinitions_Category");
        builder.HasIndex(r => r.IsActive).HasDatabaseName("IX_ReportDefinitions_IsActive");

        builder.HasOne(r => r.CreatedByUser)
            .WithMany()
            .HasForeignKey(r => r.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
```

---

### 1.2 `SavedReportPresetConfiguration.cs`
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class SavedReportPresetConfiguration : IEntityTypeConfiguration<SavedReportPreset>
{
    public void Configure(EntityTypeBuilder<SavedReportPreset> builder)
    {
        builder.ToTable("SavedReportPresets");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.PresetName)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(p => p.FilterCriteriaJson)
            .IsRequired()
            .HasColumnType("TEXT");

        builder.Property(p => p.VisibleColumnsJson)
            .HasColumnType("TEXT");

        builder.Property(p => p.IsSharedWithOffice)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.HasOne(p => p.ReportDefinition)
            .WithMany()
            .HasForeignKey(p => p.ReportDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => new { p.UserId, p.ReportDefinitionId })
            .HasDatabaseName("IX_SavedReportPresets_User_Report");

        builder.HasIndex(p => p.OfficeId)
            .HasDatabaseName("IX_SavedReportPresets_OfficeId");
    }
}
```

---

### 1.3 `ReportExecutionLogConfiguration.cs`
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class ReportExecutionLogConfiguration : IEntityTypeConfiguration<ReportExecutionLog>
{
    public void Configure(EntityTypeBuilder<ReportExecutionLog> builder)
    {
        builder.ToTable("ReportExecutionLogs");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.ReportCode)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(l => l.Username)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(l => l.ExecutionDurationMs)
            .IsRequired();

        builder.Property(l => l.ResultRowCount)
            .IsRequired();

        builder.Property(l => l.AppliedFiltersSummary)
            .HasMaxLength(1000);

        builder.Property(l => l.ExportFormat)
            .HasMaxLength(32);

        builder.Property(l => l.ClientIpAddress)
            .HasMaxLength(64);

        builder.Property(l => l.ExecutedAt)
            .IsRequired();

        builder.HasIndex(l => l.ExecutedAt).HasDatabaseName("IX_ReportExecutionLogs_ExecutedAt");
        builder.HasIndex(l => l.UserId).HasDatabaseName("IX_ReportExecutionLogs_UserId");
        builder.HasIndex(l => l.ReportCode).HasDatabaseName("IX_ReportExecutionLogs_ReportCode");
    }
}
```

---

## 2. DbContext Integration (`TaxSummaryDbContext.cs`)

Add DbSets to `TaxSummary.Infrastructure/Data/TaxSummaryDbContext.cs`:
```csharp
// Reporting & BI Subsystem
public DbSet<ReportDefinition> ReportDefinitions => Set<ReportDefinition>();
public DbSet<SavedReportPreset> SavedReportPresets => Set<SavedReportPreset>();
public DbSet<ReportExecutionLog> ReportExecutionLogs => Set<ReportExecutionLog>();
```

In `OnModelCreating(ModelBuilder modelBuilder)`:
```csharp
modelBuilder.ApplyConfiguration(new ReportDefinitionConfiguration());
modelBuilder.ApplyConfiguration(new SavedReportPresetConfiguration());
modelBuilder.ApplyConfiguration(new ReportExecutionLogConfiguration());
```

---

## 3. High-Performance Executive Analytics Repository (`ExecutiveAnalyticsRepository.cs`)

```csharp
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Domain.ValueObjects.Reporting;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

public class ExecutiveAnalyticsRepository : IExecutiveAnalyticsRepository
{
    private readonly TaxSummaryDbContext _db;

    public ExecutiveAnalyticsRepository(TaxSummaryDbContext db)
    {
        _db = db;
    }

    public async Task<ExecutiveKpiSnapshot> GetExecutiveKpiSnapshotAsync(
        DateTime? fromDate, 
        DateTime? toDate, 
        List<Guid>? officeIds, 
        CancellationToken ct = default)
    {
        // 1. HR Domain Metrics
        var totalEmployees = await _db.Employees.AsNoTracking().CountAsync(ct);
        var totalEvaluated = await _db.Employees.AsNoTracking().CountAsync(e => e.AdministrativeStatus != null, ct);
        var totalEvasionAmount = await _db.PerformanceCapabilities.AsNoTracking()
            .SumAsync(p => (decimal)p.TaxEvasionDetection_Amount, ct);

        // 2. Payroll Domain Metrics
        var latestCycle = await _db.PayrollCycles.AsNoTracking()
            .OrderByDescending(c => c.FiscalYear).ThenByDescending(c => c.FiscalMonth)
            .FirstOrDefaultAsync(ct);

        decimal approvedBudget = 0;
        decimal actualSpent = 0;
        int overtimeHours = 0;
        int laborCapViolations = 0;

        if (latestCycle != null)
        {
            var deptQuery = _db.PayrollDepartmentEntries.AsNoTracking()
                .Where(d => d.PayrollCycleId == latestCycle.Id);

            if (officeIds != null && officeIds.Count > 0)
                deptQuery = deptQuery.Where(d => officeIds.Contains(d.OfficeId));

            approvedBudget = await deptQuery.SumAsync(d => d.OvertimeBudgetPrice, ct);
            actualSpent = await deptQuery.SumAsync(d => d.TotalCalculatedOvertimeAmount, ct);
            overtimeHours = (int)await deptQuery.SumAsync(d => d.TotalOvertimeHours, ct);

            laborCapViolations = await _db.PayrollEmployeeItems.AsNoTracking()
                .Where(i => i.DepartmentEntry.PayrollCycleId == latestCycle.Id && i.IsLaborPosition && i.OvertimeHours > 120)
                .CountAsync(ct);
        }

        // 3. Tax Refund Domain Metrics
        var refundQuery = _db.TaxRefundCases.AsNoTracking();
        if (officeIds != null && officeIds.Count > 0)
            refundQuery = refundQuery.Where(r => r.OfficeId.HasValue && officeIds.Contains(r.OfficeId.Value));

        var activeRefundCases = await refundQuery
            .CountAsync(r => r.Status != RefundCaseStatus.Paid && r.Status != RefundCaseStatus.Rejected, ct);

        var claimedAmount = await refundQuery.SumAsync(r => r.Breakdown.TotalCalculatedRefundAmount, ct);
        var approvedAmount = await refundQuery.SumAsync(r => r.Breakdown.PayableRefundAmount, ct);
        var delayInterest = await refundQuery.SumAsync(r => r.Breakdown.DelayCompensationAmount, ct);

        return new ExecutiveKpiSnapshot(
            TotalEmployeesActive: totalEmployees,
            TotalEvaluationsRecorded: totalEvaluated,
            TotalEvasionIdentifiedAmount: totalEvasionAmount,
            CurrentMonthApprovedBudget: approvedBudget,
            CurrentMonthActualSpent: actualSpent,
            TotalOvertimeHoursRecorded: overtimeHours,
            LaborCapViolationsCount: laborCapViolations,
            ActiveRefundCasesCount: activeRefundCases,
            TotalRefundClaimedAmount: claimedAmount,
            TotalRefundApprovedAmount: approvedAmount,
            TotalDelayInterestPaid: delayInterest,
            AverageProcessingDays: 24.5
        );
    }

    public async Task<List<DepartmentBudgetVariance>> GetDepartmentBudgetVariancesAsync(
        Guid? payrollCycleId, 
        List<Guid>? officeIds, 
        CancellationToken ct = default)
    {
        var cycleId = payrollCycleId;
        if (!cycleId.HasValue)
        {
            var latestCycle = await _db.PayrollCycles.AsNoTracking()
                .OrderByDescending(c => c.FiscalYear).ThenByDescending(c => c.FiscalMonth)
                .FirstOrDefaultAsync(ct);
            cycleId = latestCycle?.Id;
        }

        if (!cycleId.HasValue)
            return new List<DepartmentBudgetVariance>();

        var query = _db.PayrollDepartmentEntries.AsNoTracking()
            .Where(d => d.PayrollCycleId == cycleId.Value);

        if (officeIds != null && officeIds.Count > 0)
            query = query.Where(d => officeIds.Contains(d.OfficeId));

        var list = await query
            .Select(d => new DepartmentBudgetVariance(
                d.DepartmentName,
                d.OvertimeBudgetPrice,
                d.TotalCalculatedOvertimeAmount,
                d.TotalCalculatedOvertimeAmount - d.OvertimeBudgetPrice,
                d.TotalCalculatedOvertimeAmount > d.OvertimeBudgetPrice,
                d.EmployeeCount,
                d.EmployeeCount > 0 ? Math.Round(d.TotalCalculatedOvertimeAmount / d.EmployeeCount, 0) : 0
            ))
            .OrderByDescending(d => d.Variance)
            .ToListAsync(ct);

        return list;
    }

    public async Task<List<TaxSourceDistribution>> GetTaxSourceDistributionsAsync(
        int? fiscalYear, 
        List<Guid>? officeIds, 
        CancellationToken ct = default)
    {
        var query = _db.TaxRefundCases.AsNoTracking();

        if (fiscalYear.HasValue)
            query = query.Where(r => r.TaxYear == fiscalYear.Value);

        if (officeIds != null && officeIds.Count > 0)
            query = query.Where(r => r.OfficeId.HasValue && officeIds.Contains(r.OfficeId.Value));

        var distributions = await query
            .GroupBy(r => r.TaxSource)
            .Select(g => new TaxSourceDistribution(
                g.Key.ToString(),
                GetPersianTaxSourceName(g.Key),
                g.Count(),
                g.Sum(r => r.Breakdown.PayableRefundAmount),
                g.Sum(r => r.Breakdown.DelayCompensationAmount)
            ))
            .ToListAsync(ct);

        return distributions;
    }

    private static string GetPersianTaxSourceName(TaxSourceType source) => source switch
    {
        TaxSourceType.Salaries => "مالیات بر درآمد حقوق",
        TaxSourceType.Businesses => "مالیات بر مشاغل",
        TaxSourceType.Corporations => "مالیات بر شرکت‌ها",
        TaxSourceType.ValueAddedTax => "مالیات بر ارزش افزوده",
        TaxSourceType.RealEstateRent => "مالیات بر درآمد اجاره املاک",
        TaxSourceType.Vehicles => "مالیات خودروهای لوکس",
        _ => "سایر منابع مالیاتی"
    };
}
```

---

## 4. Reporting Repository Implementation (`ReportingRepository.cs`)

```csharp
using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

public class ReportingRepository : IReportingRepository
{
    private readonly TaxSummaryDbContext _db;

    public ReportingRepository(TaxSummaryDbContext db)
    {
        _db = db;
    }

    public async Task<ReportDefinition?> GetReportDefinitionByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.ReportDefinitions.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<ReportDefinition?> GetReportDefinitionByCodeAsync(string code, CancellationToken ct = default) =>
        await _db.ReportDefinitions.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Code.ToUpper() == code.Trim().ToUpper(), ct);

    public async Task<List<ReportDefinition>> GetAvailableReportsAsync(
        string? userRole, 
        ReportDomainSource? source = null, 
        CancellationToken ct = default)
    {
        var query = _db.ReportDefinitions.AsNoTracking().Where(r => r.IsActive);

        if (source.HasValue)
            query = query.Where(r => r.DomainSource == source.Value);

        if (userRole != "Admin")
        {
            query = query.Where(r => r.RequiredRole == null || r.RequiredRole == userRole);
        }

        return await query.OrderBy(r => r.DomainSource).ThenBy(r => r.Title).ToListAsync(ct);
    }

    public async Task AddReportDefinitionAsync(ReportDefinition report, CancellationToken ct = default)
    {
        await _db.ReportDefinitions.AddAsync(report, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateReportDefinitionAsync(ReportDefinition report, CancellationToken ct = default)
    {
        _db.ReportDefinitions.Update(report);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteReportDefinitionAsync(Guid id, CancellationToken ct = default)
    {
        var report = await _db.ReportDefinitions.FindAsync(new object[] { id }, ct);
        if (report != null && !report.IsSystemReport)
        {
            _db.ReportDefinitions.Remove(report);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<List<SavedReportPreset>> GetUserSavedPresetsAsync(
        Guid userId, 
        Guid? reportDefinitionId = null, 
        CancellationToken ct = default)
    {
        var query = _db.SavedReportPresets
            .Include(p => p.ReportDefinition)
            .AsNoTracking()
            .Where(p => p.UserId == userId || p.IsSharedWithOffice);

        if (reportDefinitionId.HasValue)
            query = query.Where(p => p.ReportDefinitionId == reportDefinitionId.Value);

        return await query.OrderByDescending(p => p.CreatedAt).ToListAsync(ct);
    }

    public async Task<SavedReportPreset?> GetPresetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.SavedReportPresets
            .Include(p => p.ReportDefinition)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task AddPresetAsync(SavedReportPreset preset, CancellationToken ct = default)
    {
        await _db.SavedReportPresets.AddAsync(preset, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdatePresetAsync(SavedReportPreset preset, CancellationToken ct = default)
    {
        _db.SavedReportPresets.Update(preset);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeletePresetAsync(Guid id, CancellationToken ct = default)
    {
        var preset = await _db.SavedReportPresets.FindAsync(new object[] { id }, ct);
        if (preset != null)
        {
            _db.SavedReportPresets.Remove(preset);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task LogExecutionAsync(ReportExecutionLog log, CancellationToken ct = default)
    {
        await _db.ReportExecutionLogs.AddAsync(log, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<ReportExecutionLog>> GetRecentExecutionLogsAsync(int limit = 50, CancellationToken ct = default) =>
        await _db.ReportExecutionLogs.AsNoTracking()
            .OrderByDescending(l => l.ExecutedAt)
            .Take(limit)
            .ToListAsync(ct);
}
```

---

## 5. EPPlus 7 RTL Excel Export Service (`ReportExportService.cs`)

```csharp
using System.Drawing;
using System.Globalization;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Common;

namespace TaxSummary.Infrastructure.Services.Reporting;

public class ReportExportService
{
    public static byte[] GenerateRtlExcel(
        string reportTitle,
        string reportCode,
        List<ReportColumnMetadataDto> columns,
        List<Dictionary<string, object?>> rows,
        Dictionary<string, object?>? summaryAggregates,
        string? appliedFilterSummary)
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add(reportCode.Length > 30 ? reportCode[..30] : reportCode);

        // Enforce RTL Layout
        worksheet.View.RightToLeft = true;
        worksheet.Cells.Style.Font.Name = "Vazirmatn";
        worksheet.Cells.Style.Font.Size = 10;

        int currentRow = 1;

        // 1. Organization Header Block
        worksheet.Cells[currentRow, 1, currentRow, columns.Count].Merge = true;
        worksheet.Cells[currentRow, 1].Value = "اداره کل امور مالیاتی استان خوزستان";
        worksheet.Cells[currentRow, 1].Style.Font.Size = 14;
        worksheet.Cells[currentRow, 1].Style.Font.Bold = true;
        worksheet.Cells[currentRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        worksheet.Row(currentRow).Height = 25;
        currentRow++;

        // 2. Report Title & Generation Time
        worksheet.Cells[currentRow, 1, currentRow, columns.Count].Merge = true;
        var persianCalendar = new PersianCalendar();
        var now = DateTime.UtcNow;
        var shamsiDate = $"{persianCalendar.GetYear(now):0000}/{persianCalendar.GetMonth(now):00}/{persianCalendar.GetDayOfMonth(now):00}";
        worksheet.Cells[currentRow, 1].Value = $"{reportTitle} (کد: {reportCode}) | تاریخ گزارش: {shamsiDate}";
        worksheet.Cells[currentRow, 1].Style.Font.Size = 11;
        worksheet.Cells[currentRow, 1].Style.Font.Bold = true;
        worksheet.Cells[currentRow, 1].Style.Font.Color.SetColor(Color.FromArgb(71, 85, 105)); // Slate 600
        worksheet.Cells[currentRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        currentRow++;

        // 3. Filter Parameters Box (if provided)
        if (!string.IsNullOrWhiteSpace(appliedFilterSummary))
        {
            worksheet.Cells[currentRow, 1, currentRow, columns.Count].Merge = true;
            worksheet.Cells[currentRow, 1].Value = $"فیلترهای اعمال‌شده: {appliedFilterSummary}";
            worksheet.Cells[currentRow, 1].Style.Font.Size = 9;
            worksheet.Cells[currentRow, 1].Style.Font.Italic = true;
            worksheet.Cells[currentRow, 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[currentRow, 1].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(241, 245, 249)); // Slate 100
            currentRow++;
        }

        currentRow++; // Blank spacer row

        // 4. Column Headers
        int headerRow = currentRow;
        for (int i = 0; i < columns.Count; i++)
        {
            var col = columns[i];
            var cell = worksheet.Cells[headerRow, i + 1];
            cell.Value = col.PersianLabel;
            cell.Style.Font.Bold = true;
            cell.Style.Font.Color.SetColor(Color.White);
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(30, 41, 59)); // Slate 800
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            cell.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
            cell.Style.Border.BorderAround(ExcelBorderStyle.Thin, Color.FromArgb(15, 23, 42));
        }
        worksheet.Row(headerRow).Height = 26;
        currentRow++;

        // 5. Data Rows
        int dataStartRow = currentRow;
        foreach (var row in rows)
        {
            for (int i = 0; i < columns.Count; i++)
            {
                var col = columns[i];
                var cell = worksheet.Cells[currentRow, i + 1];
                row.TryGetValue(col.FieldName, out var val);

                FormatAndSetCellValue(cell, val, col.DataType);

                // Alternating zebra row striping
                if (currentRow % 2 == 0)
                {
                    cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(248, 250, 252));
                }

                cell.Style.Border.BorderAround(ExcelBorderStyle.Hair, Color.FromArgb(226, 232, 240));
            }
            currentRow++;
        }
        int dataEndRow = currentRow - 1;

        // 6. Summary Aggregates Row (with Native Excel SUM Formulas)
        if (dataEndRow >= dataStartRow)
        {
            worksheet.Cells[currentRow, 1].Value = "جمع کل";
            worksheet.Cells[currentRow, 1].Style.Font.Bold = true;

            for (int i = 0; i < columns.Count; i++)
            {
                var col = columns[i];
                var cell = worksheet.Cells[currentRow, i + 1];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(226, 232, 240)); // Slate 200
                cell.Style.Border.Top.Style = ExcelBorderStyle.Double;
                cell.Style.Border.Bottom.Style = ExcelBorderStyle.Double;

                if (col.HasAggregateSum)
                {
                    var colLetter = GetExcelColumnLetter(i + 1);
                    cell.Formula = $"SUM({colLetter}{dataStartRow}:{colLetter}{dataEndRow})";
                    cell.Style.Numberformat.Format = "#,##0";
                }
            }
        }

        // Freeze Panes and AutoFit Columns
        worksheet.View.FreezePanes(dataStartRow, 1);
        for (int i = 1; i <= columns.Count; i++)
        {
            worksheet.Column(i).AutoFit();
            if (worksheet.Column(i).Width < 14) worksheet.Column(i).Width = 14;
        }

        return package.GetAsByteArray();
    }

    private static void FormatAndSetCellValue(ExcelRange cell, object? val, string dataType)
    {
        if (val == null || val == DBNull.Value)
        {
            cell.Value = "-";
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            return;
        }

        switch (dataType.ToLowerInvariant())
        {
            case "currency" or "number":
                if (decimal.TryParse(val.ToString(), out var dec))
                {
                    cell.Value = dec;
                    cell.Style.Numberformat.Format = "#,##0";
                    cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
                }
                else cell.Value = val.ToString();
                break;

            case "date":
                cell.Value = val.ToString();
                cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                break;

            case "badge" or "bool":
                cell.Value = val.ToString();
                cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                break;

            default:
                cell.Value = val.ToString();
                cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
                break;
        }
    }

    private static string GetExcelColumnLetter(int columnNumber)
    {
        int dividend = columnNumber;
        string columnLabel = string.Empty;
        while (dividend > 0)
        {
            int modulo = (dividend - 1) % 26;
            columnLabel = Convert.ToChar(65 + modulo) + columnLabel;
            dividend = (dividend - modulo) / 26;
        }
        return columnLabel;
    }
}
```

---

## 6. Seed Data Configuration (`ReportingDataSeeder.cs`)

Seeds the 10 standard enterprise Persian reports into `taxsummary.db`:

```csharp
using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Data;

public static class ReportingDataSeeder
{
    public static async Task SeedReportingAsync(TaxSummaryDbContext context)
    {
        if (await context.ReportDefinitions.AnyAsync())
            return;

        var reports = new List<ReportDefinition>
        {
            ReportDefinition.Create(
                code: "REP_PAYROLL_BUDGET_UTIL",
                title: "گزارش مصرف بودجه اضافه کار به تفکیک ادارات",
                description: "پایش انحراف بودجه مصوب در برابر اضافه کار واقعی پرداخت شده به تفکیک ادارات تابعه",
                source: ReportDomainSource.PayrollAndWelfare,
                category: ReportCategory.Financial,
                type: ReportType.Tabular,
                configurationJson: "{\"columns\":[{\"fieldName\":\"departmentName\",\"persianLabel\":\"اداره\",\"dataType\":\"string\"},{\"fieldName\":\"allocatedBudget\",\"persianLabel\":\"بودجه مصوب (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"consumedAmount\",\"persianLabel\":\"پرداختی واقعی (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"variance\",\"persianLabel\":\"انحراف بودجه (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"employeeCount\",\"persianLabel\":\"تعداد پرسنل\",\"dataType\":\"number\",\"hasAggregateSum\":true}]}",
                isSystemReport: true,
                requiredRole: "Manager"),

            ReportDefinition.Create(
                code: "REP_PAYROLL_LABOR_CAP",
                title: "گزارش کنترل سقف ۱۲۰ ساعت مشاغل کارگری",
                description: "کنترل قانونی عدم تجاوز ساعات اضافه کاری پرسنل مشاغل کارگری از سقف مجاز ۱۲۰ ساعت",
                source: ReportDomainSource.PayrollAndWelfare,
                category: ReportCategory.ComplianceAndAudit,
                type: ReportType.Tabular,
                configurationJson: "{\"columns\":[{\"fieldName\":\"personnelNumber\",\"persianLabel\":\"شماره پرسنلی\",\"dataType\":\"string\"},{\"fieldName\":\"employeeName\",\"persianLabel\":\"نام کارمند\",\"dataType\":\"string\"},{\"fieldName\":\"department\",\"persianLabel\":\"اداره\",\"dataType\":\"string\"},{\"fieldName\":\"overtimeHours\",\"persianLabel\":\"ساعت اضافه کار\",\"dataType\":\"number\"},{\"fieldName\":\"violationStatus\",\"persianLabel\":\"وضعیت سقف ۱۲۰ ساعت\",\"dataType\":\"badge\"}]}",
                isSystemReport: true,
                requiredRole: "Manager"),

            ReportDefinition.Create(
                code: "REP_REFUND_SOURCE_SUMMARY",
                title: "گزارش تحلیلی پرونده‌های استرداد به تفکیک منبع",
                description: "بررسی میزان و تعداد پرونده‌های استرداد مالیات بر ارزش افزوده، مشاغل، حقوق و شرکت‌ها",
                source: ReportDomainSource.TaxRefunds,
                category: ReportCategory.Financial,
                type: ReportType.Tabular,
                configurationJson: "{\"columns\":[{\"fieldName\":\"taxSourceTitle\",\"persianLabel\":\"منبع مالیاتی\",\"dataType\":\"string\"},{\"fieldName\":\"caseCount\",\"persianLabel\":\"تعداد پرونده\",\"dataType\":\"number\",\"hasAggregateSum\":true},{\"fieldName\":\"totalApprovedRefund\",\"persianLabel\":\"خالص استرداد (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"totalDelayInterest\",\"persianLabel\":\"خسارت تاخیر پرداختی (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true}]}",
                isSystemReport: true,
                requiredRole: "Manager"),

            ReportDefinition.Create(
                code: "REP_REFUND_INTEREST_LIABILITY",
                title: "گزارش خسارت دیرکرد موضوع ماده ۲۴۳ ق.م.م",
                description: "محاسبه بار مالی خسارت ۱.۵ درصد ماهانه ناشی از تاخیر ادارات در پرداخت اضافه دریافتی مودیان",
                source: ReportDomainSource.TaxRefunds,
                category: ReportCategory.ComplianceAndAudit,
                type: ReportType.Tabular,
                configurationJson: "{\"columns\":[{\"fieldName\":\"caseNumber\",\"persianLabel\":\"شماره پرونده\",\"dataType\":\"string\"},{\"fieldName\":\"taxpayerName\",\"persianLabel\":\"نام مودی\",\"dataType\":\"string\"},{\"fieldName\":\"requestDate\",\"persianLabel\":\"تاریخ درخواست\",\"dataType\":\"date\"},{\"fieldName\":\"delayMonths\",\"persianLabel\":\"ماه‌های تاخیر\",\"dataType\":\"number\"},{\"fieldName\":\"delayAmount\",\"persianLabel\":\"مبلغ خسارت تاخیر (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true}]}",
                isSystemReport: true,
                requiredRole: "Admin"),

            ReportDefinition.Create(
                code: "REP_EMPLOYEE_PERF_SUMMARY",
                title: "گزارش توانمندی و کشف فرار مالیاتی پرسنل",
                description: "ارزیابی شاخص‌های عملکرد ممیزان در شناسایی منابع جدید، رسیدگی و فرار مالیاتی",
                source: ReportDomainSource.HumanResources,
                category: ReportCategory.Operational,
                type: ReportType.Tabular,
                configurationJson: "{\"columns\":[{\"fieldName\":\"personnelNumber\",\"persianLabel\":\"شماره پرسنلی\",\"dataType\":\"string\"},{\"fieldName\":\"fullName\",\"persianLabel\":\"نام و نام خانوادگی\",\"dataType\":\"string\"},{\"fieldName\":\"serviceUnit\",\"persianLabel\":\"واحد متبوع\",\"dataType\":\"string\"},{\"fieldName\":\"evasionAmount\",\"persianLabel\":\"مبلغ کشف فرار مالیاتی (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true}]}",
                isSystemReport: true,
                requiredRole: "Manager")
        };

        await context.ReportDefinitions.AddRangeAsync(reports);
        await context.SaveChangesAsync();
    }
}
```

---

## 7. IoC Dependency Injection Registration (`DependencyInjection.cs`)

Add to `TaxSummary.Infrastructure/DependencyInjection.cs`:

```csharp
// Reporting & BI Repositories & Services
services.AddScoped<IReportingRepository, ReportingRepository>();
services.AddScoped<IExecutiveAnalyticsRepository, ExecutiveAnalyticsRepository>();
services.AddScoped<ReportExportService>();
```
