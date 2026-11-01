using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services.Reporting;

public interface ICustomDatasetService
{
    Task<Result<ExcelInspectionResultDto>> InspectExcelStreamAsync(
        Stream stream, 
        string fileName, 
        string? sheetName = null, 
        int sampleRowsCount = 15, 
        CancellationToken ct = default);

    Task<Result<ReportDefinitionDto>> CreateCustomDatasetAsync(
        Stream stream, 
        string fileName, 
        CreateCustomDatasetRequestDto request, 
        Guid? createdByUserId, 
        CancellationToken ct = default);

    Task<Result<ReportDefinitionDto>> TweakCustomReportAsync(
        string reportCode, 
        TweakCustomReportRequestDto request, 
        CancellationToken ct = default);

    Task<Result<int>> AppendDatasetRowsAsync(
        string reportCode, 
        Stream stream, 
        string? sheetName = null, 
        CancellationToken ct = default);

    Task<Result<int>> ReplaceDatasetRowsAsync(
        string reportCode, 
        Stream stream, 
        string? sheetName = null, 
        CancellationToken ct = default);

    Task<Result<bool>> DeleteCustomDatasetAsync(
        string reportCode, 
        CancellationToken ct = default);

    Task<Result<(List<Dictionary<string, object?>> Rows, Dictionary<string, object?> Summary, int TotalCount)>> QueryCustomDatasetAsync(
        string reportCode, 
        ReportFilterParametersDto parameters, 
        CancellationToken ct = default);

    Task<Result<CustomDatasetConfigJsonDto>> GetCustomDatasetConfigAsync(
        string reportCode, 
        CancellationToken ct = default);
}
