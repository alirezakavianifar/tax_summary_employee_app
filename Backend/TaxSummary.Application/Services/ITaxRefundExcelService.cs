using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service interface for Tax Refund Excel import and export operations
/// </summary>
public interface ITaxRefundExcelService
{
    /// <summary>
    /// Imports a Tax Refund Case from an uploaded Excel (.xlsm or .xlsx) workbook
    /// </summary>
    Task<Result<Guid>> ImportFromExcelAsync(Stream stream, Guid currentUserId, CancellationToken ct = default);

    /// <summary>
    /// Exports a Tax Refund Case as a 9-sheet formatted Excel (.xlsx) workbook
    /// </summary>
    Task<Result<byte[]>> ExportToExcelAsync(Guid caseId, CancellationToken ct = default);
}
