# 02. Application Layer Specification: Reporting & BI System

## 1. Application Service Contracts (`TaxSummary.Application/Services/Reporting/`)

Following the established project architecture, all Application services return the standard `Result<T>` or `Result` type (`TaxSummary.Domain.Common.Result`) with descriptive Persian messages on failure.

### 1.1 `IExecutiveReportingService`
Handles the executive KPI dashboard, monthly trend series, standard report catalog, and parametric report execution:

```csharp
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Enums;

namespace TaxSummary.Application.Services.Reporting;

public interface IExecutiveReportingService
{
    /// <summary>
    /// دریافت داشبورد جامع شاخص‌های کلیدی عملکرد (KPI) با اعمال فیلتر سال مالی و دفاتر مجاز کاربر
    /// </summary>
    Task<Result<ExecutiveDashboardDto>> GetExecutiveDashboardOverviewAsync(
        DashboardFilterDto filter, 
        List<Guid>? userAssignedOfficeIds,
        CancellationToken ct = default);

    /// <summary>
    /// اجرای گزارش استاندارد بر اساس کد یکتا با صفحه‌بندی، مرتب‌سازی و محاسبه ردیف تجمیعی (جمع و میانگین)
    /// </summary>
    Task<Result<ReportExecutionResultDto>> ExecuteStandardReportAsync(
        string reportCode, 
        ReportFilterParametersDto parameters, 
        List<Guid>? userAssignedOfficeIds,
        CancellationToken ct = default);

    /// <summary>
    /// صدور فایل گزارش استاندارد به صورت بایت‌های اکسل (EPPlus RTL) یا پی‌دی‌اف
    /// </summary>
    Task<Result<byte[]>> ExportStandardReportAsync(
        string reportCode, 
        ReportFilterParametersDto parameters, 
        ExportFormat format, 
        List<Guid>? userAssignedOfficeIds,
        CancellationToken ct = default);

    /// <summary>
    /// فهرست گزارش‌های فعال و در دسترس کاربر بر اساس نقش سیستمی و منبع قلمرو
    /// </summary>
    Task<Result<List<ReportDefinitionDto>>> GetCatalogAsync(
        string? userRole, 
        ReportDomainSource? source = null, 
        CancellationToken ct = default);
}
```

---

### 1.2 `IReportBuilderEngine`
Dynamic query construction, expression tree filtering, grouping, and aggregations:

```csharp
namespace TaxSummary.Application.Services.Reporting;

public interface IReportBuilderEngine
{
    /// <summary>
    /// اجرای کوئری پویای طراحی‌شده توسط کاربر بر روی منبع داده هدف
    /// </summary>
    Task<Result<DynamicReportResultDto>> ExecuteDynamicQueryAsync(
        DynamicReportQueryRequestDto request, 
        List<Guid>? userAssignedOfficeIds,
        CancellationToken ct = default);

    /// <summary>
    /// صدور مستقیم نتیجه کوئری پویا در قالب فایل اکسل چندبرگی با فرمول
    /// </summary>
    Task<Result<byte[]>> ExportDynamicQueryAsync(
        DynamicReportQueryRequestDto request, 
        ExportFormat format, 
        List<Guid>? userAssignedOfficeIds,
        CancellationToken ct = default);

    /// <summary>
    /// دریافت متادیتای ستون‌های مجاز، نوع داده و عملگرهای فیلتر برای هر قلمرو سازمانی
    /// </summary>
    Task<Result<DynamicQueryMetadataDto>> GetQueryableSchemaMetadataAsync(
        ReportDomainSource source, 
        CancellationToken ct = default);
}
```

---

### 1.3 `ISavedReportsService`
Management of personal and office-shared filter presets:

```csharp
namespace TaxSummary.Application.Services.Reporting;

public interface ISavedReportsService
{
    Task<Result<List<SavedReportPresetDto>>> GetUserPresetsAsync(
        Guid userId, 
        Guid? reportDefinitionId = null, 
        CancellationToken ct = default);

    Task<Result<SavedReportPresetDto>> SavePresetAsync(
        SaveReportPresetRequestDto request, 
        Guid userId, 
        CancellationToken ct = default);

    Task<Result<bool>> UpdatePresetAsync(
        Guid id, 
        UpdateReportPresetRequestDto request, 
        Guid userId, 
        CancellationToken ct = default);

    Task<Result<bool>> DeletePresetAsync(
        Guid id, 
        Guid userId, 
        CancellationToken ct = default);
}
```

---

## 2. Dynamic Expression Tree Engine (`ReportBuilderEngine.cs`)

The dynamic query builder translates user filter rules into strongly-typed LINQ `Expression<Func<T, bool>>` trees at runtime without using raw strings or reflection risks.

### Expression Builder Pattern:
```csharp
public static class DynamicExpressionBuilder
{
    public static Expression<Func<T, bool>> BuildFilterPredicate<T>(
        List<DynamicFilterConditionDto> filters,
        Dictionary<string, string> fieldTypeMap)
    {
        var parameter = Expression.Parameter(typeof(T), "x");
        Expression? combinedBody = null;

        foreach (var filter in filters)
        {
            if (!fieldTypeMap.TryGetValue(filter.FieldName, out var expectedType))
                continue; // Whitelist security guard: ignore unapproved fields

            var property = Expression.Property(parameter, filter.FieldName);
            var condition = BuildComparisonExpression(property, filter.Operator, filter.Value, filter.SecondValue, expectedType);

            combinedBody = combinedBody == null 
                ? condition 
                : Expression.AndAlso(combinedBody, condition);
        }

        if (combinedBody == null)
            return Expression.Lambda<Func<T, bool>>(Expression.Constant(true), parameter);

        return Expression.Lambda<Func<T, bool>>(combinedBody, parameter);
    }

    private static Expression BuildComparisonExpression(
        MemberExpression property, 
        string op, 
        string value, 
        string? secondValue, 
        string type)
    {
        // Safe conversion of scalar values
        object parsedValue = type switch
        {
            "number" or "currency" => decimal.Parse(value, CultureInfo.InvariantCulture),
            "date" => DateTime.Parse(value, CultureInfo.InvariantCulture),
            "bool" => bool.Parse(value),
            _ => value.Trim()
        };

        var constant = Expression.Constant(parsedValue, property.Type);

        return op.ToLowerInvariant() switch
        {
            "equals" => Expression.Equal(property, constant),
            "notequals" => Expression.NotEqual(property, constant),
            "greaterthan" => Expression.GreaterThan(property, constant),
            "greaterthanorequal" => Expression.GreaterThanOrEqual(property, constant),
            "lessthan" => Expression.LessThan(property, constant),
            "lessthanorequal" => Expression.LessThanOrEqual(property, constant),
            "contains" when type == "string" => Expression.Call(
                property, 
                typeof(string).GetMethod("Contains", new[] { typeof(string) })!, 
                constant),
            "startswith" when type == "string" => Expression.Call(
                property, 
                typeof(string).GetMethod("StartsWith", new[] { typeof(string) })!, 
                constant),
            _ => Expression.Equal(property, constant)
        };
    }
}
```

---

## 3. Data Transfer Objects (DTOs) (`TaxSummary.Application/DTOs/Reporting/`)

### 3.1 Executive Dashboard Overview DTOs

```csharp
namespace TaxSummary.Application.DTOs.Reporting;

public class DashboardFilterDto
{
    public int? FiscalYear { get; set; }
    public Guid? PayrollCycleId { get; set; }
    public Guid? OfficeId { get; set; }
}

public class ExecutiveDashboardDto
{
    public ExecutiveKpiMetricsDto KpiMetrics { get; set; } = new();
    public List<MonthlyTrendPointDto> MonthlyTrends { get; set; } = new();
    public List<TopDepartmentBudgetDto> TopDepartmentBudgets { get; set; } = new();
    public List<TaxSourceDistributionDto> TaxSourceRefundDistribution { get; set; } = new();
    public List<RecentAuditActivityDto> RecentAuditActivities { get; set; } = new();
}

public class ExecutiveKpiMetricsDto
{
    // HR & Evaluation
    public int TotalEmployeesActive { get; set; }
    public int TotalEvaluationsRecorded { get; set; }
    public decimal TotalEvasionIdentifiedAmount { get; set; }

    // Payroll & Overtime
    public decimal CurrentMonthApprovedBudget { get; set; }
    public decimal CurrentMonthActualSpent { get; set; }
    public decimal BudgetUtilizationPercentage { get; set; }
    public int TotalOvertimeHoursRecorded { get; set; }
    public int LaborCapViolationsCount { get; set; }

    // Tax Refunds (Articles 242 & 243)
    public int ActiveRefundCasesCount { get; set; }
    public decimal TotalRefundClaimedAmount { get; set; }
    public decimal TotalRefundApprovedAmount { get; set; }
    public decimal TotalDelayInterestPaid { get; set; }
    public double AverageProcessingDays { get; set; }
}

public class MonthlyTrendPointDto
{
    public string MonthNameShamsi { get; set; } = string.Empty; // e.g. "فروردین ۱۴۰۴"
    public decimal OvertimeAmount { get; set; }
    public decimal WelfareAmount { get; set; }
    public decimal RefundAmount { get; set; }
}

public class TopDepartmentBudgetDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public decimal AllocatedBudget { get; set; }
    public decimal ConsumedAmount { get; set; }
    public decimal Variance { get; set; }
    public bool HasViolation { get; set; }
    public int EmployeeCount { get; set; }
    public decimal AverageOvertimePerCapita { get; set; }
}

public class TaxSourceDistributionDto
{
    public string TaxSourceCode { get; set; } = string.Empty;
    public string TaxSourcePersianTitle { get; set; } = string.Empty;
    public int CaseCount { get; set; }
    public decimal TotalApprovedRefundAmount { get; set; }
    public decimal TotalDelayInterestAmount { get; set; }
}

public class RecentAuditActivityDto
{
    public string Action { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string ShamsiTimestamp { get; set; } = string.Empty;
}
```

### 3.2 Standard Reports DTOs

```csharp
namespace TaxSummary.Application.DTOs.Reporting;

public class ReportDefinitionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ReportDomainSource DomainSource { get; set; }
    public ReportCategory Category { get; set; }
    public ReportType Type { get; set; }
    public bool IsSystemReport { get; set; }
    public string? RequiredRole { get; set; }
    public List<ReportColumnMetadataDto> Columns { get; set; } = new();
}

public class ReportFilterParametersDto
{
    public string? ShamsiDateFrom { get; set; }
    public string? ShamsiDateTo { get; set; }
    public Guid? OfficeId { get; set; }
    public string? Department { get; set; }
    public Guid? PayrollCycleId { get; set; }
    public string? CaseStatus { get; set; }
    public string? TaxSourceCode { get; set; }
    public string? SearchTerm { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; }
}

public class ReportExecutionResultDto
{
    public string ReportCode { get; set; } = string.Empty;
    public string ReportTitle { get; set; } = string.Empty;
    public DateTime ExecutedAt { get; set; }
    public List<ReportColumnMetadataDto> Columns { get; set; } = new();
    public List<Dictionary<string, object?>> Rows { get; set; } = new();
    public Dictionary<string, object?> SummaryAggregates { get; set; } = new(); // Dynamic Sums/Averages
    public int TotalRowCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalRowCount / PageSize);
}

public class ReportColumnMetadataDto
{
    public string FieldName { get; set; } = string.Empty;
    public string PersianLabel { get; set; } = string.Empty;
    public string DataType { get; set; } = "string"; // "string", "number", "currency", "date", "badge"
    public bool IsVisible { get; set; } = true;
    public bool IsSortable { get; set; } = true;
    public bool HasAggregateSum { get; set; }
    public string Alignment { get; set; } = "right";
}
```

### 3.3 Dynamic Query & Preset DTOs

```csharp
namespace TaxSummary.Application.DTOs.Reporting;

public class DynamicReportQueryRequestDto
{
    public ReportDomainSource DomainSource { get; set; }
    public List<string> SelectedFields { get; set; } = new();
    public List<DynamicFilterConditionDto> Filters { get; set; } = new();
    public string? GroupByField { get; set; }
    public List<DynamicAggregateSpecDto> Aggregates { get; set; } = new();
    public string? SortField { get; set; }
    public bool SortDescending { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class DynamicFilterConditionDto
{
    public string FieldName { get; set; } = string.Empty;
    public string Operator { get; set; } = "equals";
    public string Value { get; set; } = string.Empty;
    public string? SecondValue { get; set; }
}

public class DynamicAggregateSpecDto
{
    public string FieldName { get; set; } = string.Empty;
    public AggregationType Function { get; set; }
    public string Alias { get; set; } = string.Empty;
}

public class DynamicReportResultDto
{
    public List<ReportColumnMetadataDto> Columns { get; set; } = new();
    public List<Dictionary<string, object?>> Rows { get; set; } = new();
    public Dictionary<string, object?> GlobalAggregates { get; set; } = new();
    public int TotalRows { get; set; }
}

public class SavedReportPresetDto
{
    public Guid Id { get; set; }
    public Guid ReportDefinitionId { get; set; }
    public string ReportCode { get; set; } = string.Empty;
    public string PresetName { get; set; } = string.Empty;
    public string FilterCriteriaJson { get; set; } = "{}";
    public string? VisibleColumnsJson { get; set; }
    public bool IsSharedWithOffice { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SaveReportPresetRequestDto
{
    public Guid ReportDefinitionId { get; set; }
    public string PresetName { get; set; } = string.Empty;
    public string FilterCriteriaJson { get; set; } = "{}";
    public string? VisibleColumnsJson { get; set; }
    public bool IsSharedWithOffice { get; set; }
}

public class UpdateReportPresetRequestDto
{
    public string PresetName { get; set; } = string.Empty;
    public string FilterCriteriaJson { get; set; } = "{}";
    public string? VisibleColumnsJson { get; set; }
    public bool IsSharedWithOffice { get; set; }
}
```

---

## 4. Query Specification for the 10 Standard Reports

| Report Code | Domain & Category | Primary Table / Join | Projected Columns & Formats | Bottom Summary Aggregation |
|---|---|---|---|---|
| `REP_PAYROLL_BUDGET_UTIL` | Payroll / Financial | `PayrollDepartmentEntries` ⋈ `PayrollCycles` | اداره, بودجه مصوب (ریال), اضافه کار پرداختی (ریال), انحراف (ریال), درصد مصرف, تعداد پرسنل | جمع کل بودجه, جمع کل پرداختی, جمع انحراف |
| `REP_PAYROLL_LABOR_CAP` | Payroll / Compliance | `PayrollEmployeeItems` ⋈ `DepartmentEntries` WHERE `IsLaborPosition` | شماره پرسنلی, نام کارمند, اداره, ساعات اضافه کار, وضعیت رعایت سقف ۱۲۰ ساعت, مبلغ اضافه | تعداد کل کارگران, تعداد موارد اضافه کار غیرمجاز (>120h) |
| `REP_PAYROLL_MONTHLY_DEPT` | Payroll / Operational | `PayrollEmployeeItems` ⋈ `Employees` | کد پرسنلی, نام, اداره, نرخ اضافه, ساعت اضافه, مبلغ اضافه, نرخ رفاهی, درصد رفاهی, مبلغ رفاهی, کل | جمع کل ساعات, جمع مبلغ اضافه, جمع رفاهی, جمع نهایی |
| `REP_REFUND_SOURCE_SUMMARY` | Tax Refund / Financial | `RefundableReceiptAllocations` ⋈ `TaxRefundCases` | منبع مالیاتی, تعداد پرونده, جمع اضافه پرداختی (ریال), جمع بدهی کسر شده, خالص استرداد | جمع کل اضافه پرداختی, جمع کل استرداد قطعی |
| `REP_REFUND_INTEREST_LIABILITY` | Tax Refund / Compliance | `TaxRefundCases` WHERE `DelayCompensationAmount > 0` | شماره پرونده, نام مودی, تاریخ درخواست, تاریخ قطعیت, ماه‌های تاخیر, خسارت ۱.۵٪ ماهانه (ریال) | تعداد پرونده‌های مشمول خسارت, جمع کل خسارت تاخیر پرداختی |
| `REP_REFUND_WORKFLOW_BOTTLENECK` | Tax Refund / Operational | `TaxRefundCases` ⋈ `AuditLogs` | شماره پرونده, مرحله جاری, نام مسئول کارتابل, روزهای توقف در مرحله, وضعیت هشدار | میانگین روزهای رسیدگی در کل استان |
| `REP_EMPLOYEE_PERF_SUMMARY` | HR / Operational | `Employees` ⋈ `PerformanceCapabilities` | شماره پرسنلی, نام کارمند, اداره متبوع, مبلغ کشف فرار مالیاتی (ریال), پرونده‌های ارجاعی | جمع کل مبالغ کشف فرار مالیاتی |
| `REP_EMPLOYEE_ATTENDANCE_LEAVE` | HR / Compliance | `Employees` ⋈ `AdministrativeStatuses` | نام و نام خانوادگی, شماره پرسنلی, اداره, روزهای ماموریت, مرخصی استعلاجی, غیبت/تاخیر (ساعت) | میانگین روزهای ماموریت, جمع کل ساعات غیبت |
| `REP_EXECUTIVE_CROSS_DEPT_KPI` | Cross-System / Executive | `Offices` ⋈ `PayrollDept` ⋈ `RefundCases` | نام اداره کل/ناحیه, تعداد پرسنل, سرانه اضافه کار, انحراف بودجه, تعداد پرونده استرداد, امتیاز رتبه | ارزیابی تطبیقی و رتبه‌بندی کیفی شعب استان |
| `REP_AUDIT_SECURITY_LOGS` | Audit / Compliance | `AuditLogs` ⋈ `Users` | زمان رویداد (شمسی), کاربر, نقش, آدرس IP, نوع عملیات, ماژول هدف, شرح تغییرات | تعداد کل دسترسی‌ها و اصلاحات حساس اسناد |

---

## 5. AutoMapper Mapping Profile (`ReportingMappingProfile.cs`)

```csharp
using AutoMapper;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.ValueObjects.Reporting;

namespace TaxSummary.Application.Mapping;

public class ReportingMappingProfile : Profile
{
    public ReportingMappingProfile()
    {
        CreateMap<ReportDefinition, ReportDefinitionDto>()
            .ForMember(dest => dest.Columns, opt => opt.Ignore()); // Deserialized from ConfigurationJson

        CreateMap<SavedReportPreset, SavedReportPresetDto>()
            .ForMember(dest => dest.ReportCode, opt => opt.MapFrom(src => src.ReportDefinition.Code));

        CreateMap<ExecutiveKpiSnapshot, ExecutiveKpiMetricsDto>();

        CreateMap<DepartmentBudgetVariance, TopDepartmentBudgetDto>();

        CreateMap<TaxSourceDistribution, TaxSourceDistributionDto>();
    }
}
```

---

## 6. FluentValidation Implementation with Persian Messages

### 6.1 `ReportFilterParametersValidator.cs`
```csharp
using FluentValidation;
using TaxSummary.Application.DTOs.Reporting;

namespace TaxSummary.Application.Validators.Reporting;

public class ReportFilterParametersValidator : AbstractValidator<ReportFilterParametersDto>
{
    public ReportFilterParametersValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("شماره صفحه باید بزرگتر از صفر باشد.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 200).WithMessage("تعداد سطر در هر صفحه باید بین ۱ تا ۲۰۰ باشد.");

        When(x => !string.IsNullOrWhiteSpace(x.ShamsiDateFrom), () =>
        {
            RuleFor(x => x.ShamsiDateFrom)
                .Matches(@"^\d{4}/\d{2}/\d{2}$")
                .WithMessage("فرمت تاریخ شروع نامعتبر است. الگوی مجاز: ۱۴۰۴/۰۷/۰۱");
        });

        When(x => !string.IsNullOrWhiteSpace(x.ShamsiDateTo), () =>
        {
            RuleFor(x => x.ShamsiDateTo)
                .Matches(@"^\d{4}/\d{2}/\d{2}$")
                .WithMessage("فرمت تاریخ پایان نامعتبر است. الگوی مجاز: ۱۴۰۴/۰۷/۳۰");
        });
    }
}
```

### 6.2 `DynamicReportQueryRequestValidator.cs`
```csharp
using FluentValidation;
using TaxSummary.Application.DTOs.Reporting;

namespace TaxSummary.Application.Validators.Reporting;

public class DynamicReportQueryRequestValidator : AbstractValidator<DynamicReportQueryRequestDto>
{
    public DynamicReportQueryRequestValidator()
    {
        RuleFor(x => x.DomainSource)
            .IsInEnum().WithMessage("منبع داده انتخاب‌شده نامعتبر است.");

        RuleFor(x => x.SelectedFields)
            .NotEmpty().WithMessage("حداقل یک ستون برای نمایش در گزارش باید انتخاب گردد.")
            .Must(fields => fields.Count <= 30).WithMessage("حداکثر ۳۰ ستون به صورت همزمان قابل انتخاب است.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 500).WithMessage("تعداد سطر در گزارش پویا حداکثر ۵۰۰ سطر می‌باشد.");

        RuleForEach(x => x.Filters).ChildRules(filter =>
        {
            filter.RuleFor(f => f.FieldName).NotEmpty().WithMessage("فیلد مورد نظر جهت فیلتر الزامی است.");
            filter.RuleFor(f => f.Operator).NotEmpty().WithMessage("عملگر مقایسه‌ای الزامی است.");
        });
    }
}
```

### 6.3 `SaveReportPresetRequestValidator.cs`
```csharp
using FluentValidation;
using TaxSummary.Application.DTOs.Reporting;

namespace TaxSummary.Application.Validators.Reporting;

public class SaveReportPresetRequestValidator : AbstractValidator<SaveReportPresetRequestDto>
{
    public SaveReportPresetRequestValidator()
    {
        RuleFor(x => x.ReportDefinitionId)
            .NotEmpty().WithMessage("شناسه گزارش پایه الزامی است.");

        RuleFor(x => x.PresetName)
            .NotEmpty().WithMessage("عنوان الگوی ذخیره‌شده نمی‌تواند خالی باشد.")
            .MaximumLength(128).WithMessage("عنوان الگو حداکثر می‌تواند ۱۲۸ کاراکتر باشد.");

        RuleFor(x => x.FilterCriteriaJson)
            .NotEmpty().WithMessage("پارامترهای فیلتر الزامی است.")
            .Must(IsValidJson).WithMessage("ساختار پارامترهای فیلتر معتبر نمی‌باشد.");
    }

    private static bool IsValidJson(string json)
    {
        try { System.Text.Json.JsonDocument.Parse(json); return true; }
        catch { return false; }
    }
}
```
