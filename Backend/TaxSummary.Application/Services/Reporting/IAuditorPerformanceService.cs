using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services.Reporting;

public interface IAuditorPerformanceService
{
    /// <summary>
    /// دریافت تمامی تعاریف شاخص‌های ارزیابی عملکرد حسابرسان
    /// </summary>
    Task<Result<List<AuditorPerformanceMetricDto>>> GetMetricDefinitionsAsync(bool includeInactive = false, CancellationToken ct = default);

    /// <summary>
    /// ایجاد یا به‌روزرسانی تعریف یک شاخص ارزیابی توسط مدیر سیستم
    /// </summary>
    Task<Result<AuditorPerformanceMetricDto>> SaveMetricDefinitionAsync(SaveAuditorMetricRequestDto request, CancellationToken ct = default);

    /// <summary>
    /// فعال یا غیرفعال‌سازی یک شاخص ارزیابی
    /// </summary>
    Task<Result<bool>> ToggleMetricStatusAsync(Guid id, bool isActive, CancellationToken ct = default);

    /// <summary>
    /// حذف تعریف یک شاخص
    /// </summary>
    Task<Result<bool>> DeleteMetricDefinitionAsync(Guid id, CancellationToken ct = default);

    /// <summary>
    /// ارزیابی و رتبه‌بندی حسابرسان بر اساس شاخص‌های فعال و اوزان تنظیمی مدیر
    /// </summary>
    Task<Result<List<AuditorScorecardDto>>> EvaluateAuditorsAsync(int? fiscalYear, string? officeName, CancellationToken ct = default);

    /// <summary>
    /// دریافت کارنامه جامع و مشخصات ۳۶۰ درجه عملکرد یک حسابرس
    /// </summary>
    Task<Result<Auditor360ProfileDto>> GetAuditor360ProfileAsync(string auditorName, int? fiscalYear, CancellationToken ct = default);

    /// <summary>
    /// شبیه‌سازی و پیش‌نمایش زنده اثر یک فرمول یا وزن جدید بر پرونده‌های پایگاه داده
    /// </summary>
    Task<Result<AuditorMetricsSimulationResultDto>> SimulateMetricAsync(SaveAuditorMetricRequestDto request, int? fiscalYear, CancellationToken ct = default);
}
