using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Enums;

namespace TaxSummary.Application.Services.Reporting;

/// <summary>
/// Service contract for Executive KPI Dashboard, standard report catalog, and parametric report execution
/// </summary>
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
    /// فهرست گزارش‌های فعال و در دسترس کاربر بر اساس نقش سیستمی و منبع قلمرو (با امکان نمایش بایگانی برای مدیر)
    /// </summary>
    Task<Result<List<ReportDefinitionDto>>> GetCatalogAsync(
        string? userRole, 
        ReportDomainSource? source = null, 
        bool includeInactive = false,
        CancellationToken ct = default);

    /// <summary>
    /// تغییر وضعیت فعال یا بایگانی گزارش توسط مدیر سامانه
    /// </summary>
    Task<Result<bool>> ToggleReportStatusAsync(
        string reportCode, 
        bool? explicitStatus = null, 
        string? userRole = null, 
        CancellationToken ct = default);

    /// <summary>
    /// حذف کامل گزارش و جداول پایگاه داده مرتبط
    /// </summary>
    Task<Result<bool>> DeleteReportAsync(
        string reportCode, 
        string? userRole = null, 
        CancellationToken ct = default);

    /// <summary>
    /// دریافت داشبورد مدیریتی شاخص‌های کلیدی عملکرد (KPI) برای یک گزارش استاندارد خاص
    /// </summary>
    Task<Result<ReportExecutiveKpiDto>> GetStandardReportKpiOverviewAsync(
        string reportCode, 
        List<Guid>? userAssignedOfficeIds, 
        CancellationToken ct = default);

    /// <summary>
    /// دریافت داشبورد تلفیقی شاخص‌های کلیدی عملکرد استان (ترکیب حسابرسی پرونده‌های سنیم و قرارهای دادرسی)
    /// </summary>
    Task<Result<ReportExecutiveKpiDto>> GetCombinedExecutiveKpiOverviewAsync(
        List<Guid>? userAssignedOfficeIds = null, 
        CancellationToken ct = default);
}
