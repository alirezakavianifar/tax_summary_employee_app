using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Enums;

namespace TaxSummary.Application.Services.Reporting;

/// <summary>
/// Service interface for generating formatted export files (RTL Excel, PDF) from reporting data
/// </summary>
public interface IReportExportService
{
    Task<Result<byte[]>> ExportToExcelAsync(
        string reportTitle,
        string reportCode,
        List<ReportColumnMetadataDto> columns,
        List<Dictionary<string, object?>> rows,
        Dictionary<string, object?>? summaryAggregates,
        string? appliedFilterSummary,
        CancellationToken ct = default);

    Task<Result<byte[]>> ExportToPdfAsync(
        string reportTitle,
        string reportCode,
        List<ReportColumnMetadataDto> columns,
        List<Dictionary<string, object?>> rows,
        Dictionary<string, object?>? summaryAggregates,
        string? appliedFilterSummary,
        CancellationToken ct = default);
}
