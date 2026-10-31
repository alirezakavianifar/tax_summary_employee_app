# 01. Domain Layer Specification: Reporting & BI System

## 1. Domain Entities (`TaxSummary.Domain/Entities/Reporting/`)

### 1.1 `ReportDefinition`
Represents an authoritative report specification in the system (either an immutable system-seeded standard report or a customizable operational report).

```csharp
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.ValueObjects.Reporting;

namespace TaxSummary.Domain.Entities;

public class ReportDefinition
{
    public Guid Id { get; private set; }

    /// <summary>
    /// شناسه یکتای سیستمی گزارش (مانند: REP_PAYROLL_BUDGET_UTIL)
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// عنوان فارسی رسمی گزارش
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// شرح کاربردی و مخاطبان گزارش
    /// </summary>
    public string Description { get; private set; } = string.Empty;

    /// <summary>
    /// خاستگاه داده‌های گزارش (منابع انسانی، حقوق و دستمزد، استرداد مالیات، یا فرابخشی)
    /// </summary>
    public ReportDomainSource DomainSource { get; private set; }

    /// <summary>
    /// دسته‌بندی موضوعی گزارش (شاخص‌های مدیریتی، عملیاتی، مالی، انطباق و بازرسی)
    /// </summary>
    public ReportCategory Category { get; private set; }

    /// <summary>
    /// ساختار نمایشی گزارش (جدول جزئیات، ماتریس تجمیعی/پایوت، کارت شاخص)
    /// </summary>
    public ReportType Type { get; private set; }

    /// <summary>
    /// پیکربندی ستون‌ها، فیلترها و فرمول‌های محاسباتی در قالب JSON
    /// </summary>
    public string ConfigurationJson { get; private set; } = "{}";

    /// <summary>
    /// آیا گزارش از الگوهای استاندارد و غیرقابل حذف سامانه است؟
    /// </summary>
    public bool IsSystemReport { get; private set; }

    /// <summary>
    /// وضعیت فعال/غیرفعال بودن گزارش در پرتال
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// حداقل نقش لازم برای دسترسی به گزارش (مثلاً: Admin, Manager, Auditor)
    /// </summary>
    public string? RequiredRole { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public Guid? CreatedByUserId { get; private set; }
    public User? CreatedByUser { get; private set; }

    private ReportDefinition() { } // EF Core Constructor

    public static ReportDefinition Create(
        string code,
        string title,
        string description,
        ReportDomainSource source,
        ReportCategory category,
        ReportType type,
        string configurationJson,
        bool isSystemReport = false,
        string? requiredRole = null,
        Guid? createdByUserId = null)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("کد سیستمی گزارش نمی‌تواند خالی باشد.", nameof(code));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان گزارش نمی‌تواند خالی باشد.", nameof(title));

        if (string.IsNullOrWhiteSpace(configurationJson))
            throw new ArgumentException("پیکربندی ستون‌های گزارش الزامی است.", nameof(configurationJson));

        var cleanCode = code.Trim().ToUpperInvariant();
        if (!System.Text.RegularExpressions.Regex.IsMatch(cleanCode, @"^[A-Z0-9_]{3,64}$"))
            throw new ArgumentException("کد گزارش باید صرفاً شامل حروف لاتین، ارقام و خط زیر باشد (۳ تا ۶۴ کاراکتر).", nameof(code));

        return new ReportDefinition
        {
            Id = Guid.NewGuid(),
            Code = cleanCode,
            Title = title.Trim(),
            Description = description?.Trim() ?? string.Empty,
            DomainSource = source,
            Category = category,
            Type = type,
            ConfigurationJson = configurationJson.Trim(),
            IsSystemReport = isSystemReport,
            IsActive = true,
            RequiredRole = string.IsNullOrWhiteSpace(requiredRole) ? null : requiredRole.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = createdByUserId
        };
    }

    public void Update(string title, string description, string configurationJson, string? requiredRole)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان گزارش نمی‌تواند خالی باشد.", nameof(title));

        if (string.IsNullOrWhiteSpace(configurationJson))
            throw new ArgumentException("پیکربندی ستون‌های گزارش الزامی است.", nameof(configurationJson));

        Title = title.Trim();
        Description = description?.Trim() ?? string.Empty;
        ConfigurationJson = configurationJson.Trim();
        RequiredRole = string.IsNullOrWhiteSpace(requiredRole) ? null : requiredRole.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        // Guard: Prevent deactivating mission-critical system reports
        if (!isActive && IsSystemReport)
            throw new InvalidOperationException("امکان غیرفعال‌سازی گزارش‌های پایه سیستمی وجود ندارد.");

        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }
}
```

---

### 1.2 `SavedReportPreset`
Represents an individual user's customized filter and column preference preset for a given report (e.g. "فیلتر اختصاصی اضافه کار خرداد - اداره امور مالیاتی ۱ اهواز").

```csharp
namespace TaxSummary.Domain.Entities;

public class SavedReportPreset
{
    public Guid Id { get; private set; }
    public Guid ReportDefinitionId { get; private set; }
    public ReportDefinition ReportDefinition { get; private set; } = null!;

    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    /// <summary>
    /// عنوان الگو یا پیش‌تنظیم ذخیره‌شده
    /// </summary>
    public string PresetName { get; private set; } = string.Empty;

    /// <summary>
    /// پارامترهای فیلتر انتخاب شده (بازه تاریخی، ادارات، وضعیت و ...) به صورت JSON
    /// </summary>
    public string FilterCriteriaJson { get; private set; } = "{}";

    /// <summary>
    /// فهرست فیلدها و ستون‌های سفارشی به صورت JSON (اختیاری)
    /// </summary>
    public string? VisibleColumnsJson { get; private set; }

    /// <summary>
    /// آیا این الگو با سایر روسای اداره متبوع به اشتراک گذاشته شده است؟
    /// </summary>
    public bool IsSharedWithOffice { get; private set; }

    /// <summary>
    /// شناسه اداره مربوط به اشتراک‌گذاری
    /// </summary>
    public Guid? OfficeId { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private SavedReportPreset() { }

    public static SavedReportPreset Create(
        Guid reportDefinitionId,
        Guid userId,
        string presetName,
        string filterCriteriaJson,
        string? visibleColumnsJson = null,
        bool isShared = false,
        Guid? officeId = null)
    {
        if (string.IsNullOrWhiteSpace(presetName))
            throw new ArgumentException("نام الگوی گزارش نمی‌تواند خالی باشد.", nameof(presetName));

        if (string.IsNullOrWhiteSpace(filterCriteriaJson))
            throw new ArgumentException("معیارهای فیلتر الزامی است.", nameof(filterCriteriaJson));

        return new SavedReportPreset
        {
            Id = Guid.NewGuid(),
            ReportDefinitionId = reportDefinitionId,
            UserId = userId,
            PresetName = presetName.Trim(),
            FilterCriteriaJson = filterCriteriaJson.Trim(),
            VisibleColumnsJson = string.IsNullOrWhiteSpace(visibleColumnsJson) ? null : visibleColumnsJson.Trim(),
            IsSharedWithOffice = isShared,
            OfficeId = officeId,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string presetName, string filterCriteriaJson, string? visibleColumnsJson, bool isShared)
    {
        if (string.IsNullOrWhiteSpace(presetName))
            throw new ArgumentException("نام الگوی گزارش نمی‌تواند خالی باشد.", nameof(presetName));

        if (string.IsNullOrWhiteSpace(filterCriteriaJson))
            throw new ArgumentException("معیارهای فیلتر الزامی است.", nameof(filterCriteriaJson));

        PresetName = presetName.Trim();
        FilterCriteriaJson = filterCriteriaJson.Trim();
        VisibleColumnsJson = string.IsNullOrWhiteSpace(visibleColumnsJson) ? null : visibleColumnsJson.Trim();
        IsSharedWithOffice = isShared;
        UpdatedAt = DateTime.UtcNow;
    }
}
```

---

### 1.3 `ReportExecutionLog`
Audit ledger capturing query execution durations, result row counts, applied filter parameters, export formats, and client IP addresses.

```csharp
namespace TaxSummary.Domain.Entities;

public class ReportExecutionLog
{
    public Guid Id { get; private set; }
    public Guid? ReportDefinitionId { get; private set; }
    public string ReportCode { get; private set; } = string.Empty;
    public Guid UserId { get; private set; }
    public string Username { get; private set; } = string.Empty;

    public DateTime ExecutedAt { get; private set; }
    public long ExecutionDurationMs { get; private set; }
    public int ResultRowCount { get; private set; }
    public string? AppliedFiltersSummary { get; private set; }
    public string? ExportFormat { get; private set; } // null, "Excel", "Pdf", "Csv"
    public string? ClientIpAddress { get; private set; }

    private ReportExecutionLog() { }

    public static ReportExecutionLog Record(
        Guid? reportDefinitionId,
        string reportCode,
        Guid userId,
        string username,
        long durationMs,
        int rowCount,
        string? filtersSummary,
        string? exportFormat = null,
        string? ipAddress = null)
    {
        return new ReportExecutionLog
        {
            Id = Guid.NewGuid(),
            ReportDefinitionId = reportDefinitionId,
            ReportCode = string.IsNullOrWhiteSpace(reportCode) ? "DYNAMIC_QUERY" : reportCode.Trim(),
            UserId = userId,
            Username = username?.Trim() ?? "unknown",
            ExecutedAt = DateTime.UtcNow,
            ExecutionDurationMs = Math.Max(0, durationMs),
            ResultRowCount = Math.Max(0, rowCount),
            AppliedFiltersSummary = filtersSummary?.Trim(),
            ExportFormat = exportFormat?.Trim(),
            ClientIpAddress = ipAddress?.Trim()
        };
    }
}
```

---

## 2. Domain Enums (`TaxSummary.Domain/Enums/ReportingEnums.cs`)

```csharp
namespace TaxSummary.Domain.Enums;

/// <summary>
/// قلمرو سازمانی و منبع پایگاه داده گزارش
/// </summary>
public enum ReportDomainSource
{
    HumanResources = 1,     // پرسنل، ارزیابی شایستگی، سوابق اداری، کشف فرار مالیاتی
    PayrollAndWelfare = 2,  // حقوق و اضافه کار، سرانه رفاهی، سقف ۱۲۰ ساعت کارگری، بودجه ادارات
    TaxRefunds = 3,         // پرونده‌های استرداد مواد ۲۴۲ و ۲۴۳ ق.م.م، قبوض پرداختی، خسارت تاخیر
    CrossSystem = 4         // تلفیقی و فرابخشی (مقایسه بهره‌وری، اضافه کار و عملکرد شعب)
}

/// <summary>
/// سطح مدیریتی و هدف گزارش
/// </summary>
public enum ReportCategory
{
    ExecutiveKpi = 1,       // شاخص‌های کلیدی عملکرد و داشبورد مدیر کل و معاونین
    Operational = 2,        // گزارش‌های اجرایی روزانه و پیگیری کارتابل‌ها
    Financial = 3,          // تحلیل مصرف بودجه، انحرافات و تعهدات مالی
    ComplianceAndAudit = 4  // نظارت، کنترل سقف‌های قانونی، گلوگاه‌ها و ممیزی رویدادها
}

/// <summary>
/// قالب ساختاری خروجی گزارش
/// </summary>
public enum ReportType
{
    Tabular = 1,            // جدول مشروح رکوردها با امکان مرتب‌سازی و صفحه‌بندی
    Pivot = 2,              // ماتریس تجمیعی با گروه‌بندی چندسطحی (مانند به تفکیک اداره و ماه)
    SummaryKpi = 3          // کارت شاخص تک‌عددی یا مقایسه‌ای با دوره قبل
}

/// <summary>
/// توابع تجمیع محاسباتی
/// </summary>
public enum AggregationType
{
    Count = 1,
    Sum = 2,
    Average = 3,
    Min = 4,
    Max = 5
}

/// <summary>
/// قالب‌های مجاز صدور خروجی
/// </summary>
public enum ExportFormat
{
    Excel = 1,  // مایکروسافت اکسل چندبرگی استاندارد با فونت راست به چپ و فرمول
    Pdf = 2,    // پی‌دی‌اف رسمی قطع A4 با نشان اداری و کادر امضا
    Csv = 3     // فایل متن جداشده با ویرگول مناسب تحلیل آماری
}
```

---

## 3. Domain Value Objects & Read Models (`TaxSummary.Domain/ValueObjects/Reporting/`)

In adherence to Clean Architecture, domain repository interfaces return strongly-typed Domain Models and Value Objects instead of Application-layer DTOs.

### 3.1 `ExecutiveKpiSnapshot`
Encapsulates a point-in-time calculation of key operational metrics across the three core domains:

```csharp
namespace TaxSummary.Domain.ValueObjects.Reporting;

public record ExecutiveKpiSnapshot(
    // HR & Evaluation Domain
    int TotalEmployeesActive,
    int TotalEvaluationsRecorded,
    decimal TotalEvasionIdentifiedAmount,

    // Payroll Domain
    decimal CurrentMonthApprovedBudget,
    decimal CurrentMonthActualSpent,
    int TotalOvertimeHoursRecorded,
    int LaborCapViolationsCount,

    // Tax Refund Domain
    int ActiveRefundCasesCount,
    decimal TotalRefundClaimedAmount,
    decimal TotalRefundApprovedAmount,
    decimal TotalDelayInterestPaid,
    double AverageProcessingDays
)
{
    public decimal BudgetUtilizationPercentage => CurrentMonthApprovedBudget > 0
        ? Math.Round((CurrentMonthActualSpent / CurrentMonthApprovedBudget) * 100, 1)
        : 0;
}
```

### 3.2 `DepartmentBudgetVariance`
Represents the financial position of a department in a payroll cycle:

```csharp
namespace TaxSummary.Domain.ValueObjects.Reporting;

public record DepartmentBudgetVariance(
    string DepartmentName,
    decimal AllocatedBudget,
    decimal ConsumedAmount,
    decimal Variance,
    bool HasViolation,
    int EmployeeCount,
    decimal AverageOvertimePerCapita
);
```

### 3.3 `TaxSourceDistribution`
Represents the proportion of refund activity by tax source:

```csharp
namespace TaxSummary.Domain.ValueObjects.Reporting;

public record TaxSourceDistribution(
    string TaxSourceCode,
    string TaxSourcePersianTitle,
    int CaseCount,
    decimal TotalApprovedRefundAmount,
    decimal TotalDelayInterestAmount
);
```

### 3.4 `ReportColumnDefinition` (Value Object)
Describes a column layout within a report configuration:

```csharp
namespace TaxSummary.Domain.ValueObjects.Reporting;

public record ReportColumnDefinition(
    string FieldName,
    string PersianLabel,
    string DataType, // "string", "number", "currency", "date", "badge"
    bool IsVisible = true,
    bool IsSortable = true,
    bool HasAggregateSum = false,
    string Alignment = "right"
);
```

---

## 4. Domain Interfaces (`TaxSummary.Domain/Interfaces/`)

### 4.1 `IReportingRepository`
Persistence and query contract for reporting entities:

```csharp
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;

namespace TaxSummary.Domain.Interfaces;

public interface IReportingRepository
{
    // Report Definitions
    Task<ReportDefinition?> GetReportDefinitionByIdAsync(Guid id, CancellationToken ct = default);
    Task<ReportDefinition?> GetReportDefinitionByCodeAsync(string code, CancellationToken ct = default);
    Task<List<ReportDefinition>> GetAvailableReportsAsync(string? userRole, ReportDomainSource? source = null, CancellationToken ct = default);
    Task AddReportDefinitionAsync(ReportDefinition report, CancellationToken ct = default);
    Task UpdateReportDefinitionAsync(ReportDefinition report, CancellationToken ct = default);
    Task DeleteReportDefinitionAsync(Guid id, CancellationToken ct = default);

    // Saved User Presets
    Task<List<SavedReportPreset>> GetUserSavedPresetsAsync(Guid userId, Guid? reportDefinitionId = null, CancellationToken ct = default);
    Task<SavedReportPreset?> GetPresetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddPresetAsync(SavedReportPreset preset, CancellationToken ct = default);
    Task UpdatePresetAsync(SavedReportPreset preset, CancellationToken ct = default);
    Task DeletePresetAsync(Guid id, CancellationToken ct = default);

    // Execution Logs
    Task LogExecutionAsync(ReportExecutionLog log, CancellationToken ct = default);
    Task<List<ReportExecutionLog>> GetRecentExecutionLogsAsync(int limit = 50, CancellationToken ct = default);
}
```

### 4.2 `IExecutiveAnalyticsRepository`
High-performance compiled aggregation contract querying the active SQLite operational tables:

```csharp
using TaxSummary.Domain.ValueObjects.Reporting;

namespace TaxSummary.Domain.Interfaces;

public interface IExecutiveAnalyticsRepository
{
    Task<ExecutiveKpiSnapshot> GetExecutiveKpiSnapshotAsync(
        DateTime? fromDate, 
        DateTime? toDate, 
        List<Guid>? officeIds, 
        CancellationToken ct = default);

    Task<List<DepartmentBudgetVariance>> GetDepartmentBudgetVariancesAsync(
        Guid? payrollCycleId, 
        List<Guid>? officeIds, 
        CancellationToken ct = default);

    Task<List<TaxSourceDistribution>> GetTaxSourceDistributionsAsync(
        int? fiscalYear, 
        List<Guid>? officeIds, 
        CancellationToken ct = default);
}
```

---

## 5. Domain Invariants & Rules Matrix

| Entity | Field | Rule / Invariant | Validation Exception |
|---|---|---|---|
| `ReportDefinition` | `Code` | Mandatory, uppercase alphanumeric + underscore (`^[A-Z0-9_]{3,64}$`), unique. | `ArgumentException("کد گزارش باید...")` |
| `ReportDefinition` | `Title` | Mandatory, non-empty, max 256 characters. | `ArgumentException("عنوان گزارش...")` |
| `ReportDefinition` | `IsActive` | Cannot be deactivated if `IsSystemReport == true`. | `InvalidOperationException("امکان غیرفعال‌سازی...")` |
| `SavedReportPreset`| `PresetName` | Mandatory, trimmed, max 128 characters. | `ArgumentException("نام الگو...")` |
| `SavedReportPreset`| `FilterCriteriaJson` | Mandatory, valid non-empty JSON string. | `ArgumentException("معیارهای فیلتر...")` |
| `ReportExecutionLog`| `ExecutionDurationMs` | Must be non-negative integer (`>= 0`). | Handled by `Math.Max(0, durationMs)` |
| `ReportExecutionLog`| `ResultRowCount` | Must be non-negative integer (`>= 0`). | Handled by `Math.Max(0, rowCount)` |
