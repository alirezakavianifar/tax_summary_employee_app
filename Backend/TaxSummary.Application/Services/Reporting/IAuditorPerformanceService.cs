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
    /// ارزیابی و رتبه‌بندی حسابرسان بر اساس شاخص‌های فعال و اوزان تنظیمی مدیر (پشتیبانی از پایگاه داده و فایل‌های اکسل بارگذاری‌شده)
    /// </summary>
    Task<Result<List<AuditorScorecardDto>>> EvaluateAuditorsAsync(int? fiscalYear, string? officeName, string? reportCode = null, CancellationToken ct = default);

    /// <summary>
    /// دریافت کارنامه جامع و مشخصات ۳۶۰ درجه عملکرد یک حسابرس
    /// </summary>
    Task<Result<Auditor360ProfileDto>> GetAuditor360ProfileAsync(string auditorName, int? fiscalYear = null, string? reportCode = null, CancellationToken ct = default);

    /// <summary>
    /// شبیه‌سازی و پیش‌نمایش زنده اثر یک فرمول یا وزن جدید بر پرونده‌های پایگاه داده یا گزارش اکسل
    /// </summary>
    Task<Result<AuditorMetricsSimulationResultDto>> SimulateMetricAsync(SaveAuditorMetricRequestDto request, int? fiscalYear = null, string? reportCode = null, CancellationToken ct = default);

    /// <summary>
    /// دریافت فهرست منابع داده ارزیابی حسابرسی (پایگاه داده اصلی و گزارش‌های اکسل بارگذاری‌شده)
    /// </summary>
    Task<Result<List<AuditDataSourceDto>>> GetAuditReportSourcesAsync(CancellationToken ct = default);

    /// <summary>
    /// دریافت پیکربندی فعال قواعد و ماتریس اوزان امتیازی دستورالعمل ارزیابی عملکرد (SRS)
    /// </summary>
    Task<Result<SrsRuleSetConfigDto>> GetSrsRuleConfigurationAsync(CancellationToken ct = default);

    /// <summary>
    /// ذخیره و به‌روزرسانی قواعد و ماتریس اوزان امتیازی دستورالعمل ارزیابی عملکرد توسط مدیر
    /// </summary>
    Task<Result<SrsRuleSetConfigDto>> SaveSrsRuleConfigurationAsync(SaveSrsRuleConfigRequestDto request, CancellationToken ct = default);

    /// <summary>
    /// بازیابی مقادیر پیش‌فرض مصوب بخشنامه ارزیابی عملکرد (SRS v1.0)
    /// </summary>
    Task<Result<SrsRuleSetConfigDto>> ResetSrsRuleConfigurationAsync(CancellationToken ct = default);

    /// <summary>
    /// ارزیابی و رتبه‌بندی استانی کلیه حسابرسان بر اساس قواعد دستورالعمل ارزیابی عملکرد (SRS)
    /// </summary>
    Task<Result<List<SrsEmployeeScorecardDto>>> EvaluateAuditorsSrsAsync(int? fiscalYear, string? officeName, string? reportCode = null, CancellationToken ct = default);

    /// <summary>
    /// دریافت کارنامه تفصیلی و ریزامتیازات ماتریسی ۸ در ۷ یک حسابرس بر اساس دستورالعمل ارزیابی عملکرد
    /// </summary>
    Task<Result<SrsEmployeeScorecardDto>> GetAuditorSrsScorecardAsync(string auditorName, int? fiscalYear = null, string? reportCode = null, CancellationToken ct = default);

    /// <summary>
    /// همگام‌سازی پرونده‌های ۳۰۰ پرونده مهم و ۱۰۰ پرونده از فایل اکسل سنیم در پایگاه داده
    /// </summary>
    Task<Result<int>> Sync300CasesFromExcelAsync(string? customExcelPath = null, CancellationToken ct = default);
}
