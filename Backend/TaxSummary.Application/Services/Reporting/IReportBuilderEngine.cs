using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Enums;

namespace TaxSummary.Application.Services.Reporting;

/// <summary>
/// Service contract for Dynamic Query Builder: expression trees, custom groupings, and ad-hoc aggregations
/// </summary>
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
