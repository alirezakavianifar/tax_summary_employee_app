using TaxSummary.Application.DTOs.Payroll;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service for exporting payroll results to Excel
/// </summary>
public interface IPayrollExcelExportService
{
    /// <summary>
    /// Generate a multi-sheet Excel workbook from a payroll result.
    /// Returns the raw bytes of the .xlsx file.
    /// </summary>
    Task<byte[]> ExportToExcelAsync(
        PayrollProcessResultDto result,
        CancellationToken cancellationToken = default);
}
