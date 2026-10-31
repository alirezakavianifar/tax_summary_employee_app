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
    /// فهرست گزارش‌های فعال و در دسترس کاربر بر اساس نقش سیستمی و منبع قلمرو
    /// </summary>
    Task<Result<List<ReportDefinitionDto>>> GetCatalogAsync(
        string? userRole, 
        ReportDomainSource? source = null, 
        CancellationToken ct = default);
}
