using TaxSummary.Application.DTOs.Payroll;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service for payroll processing operations
/// </summary>
public interface IPayrollService
{
    /// <summary>
    /// Process "اضافه کار و رفاهی با نرخ" — outer-merge overtime+welfare on شماره کارمند,
    /// left-join dept+coefficients, calculate ceil(سرانه × نرخ) for overtime
    /// and ceil(سرانه × نرخ / 100) for welfare.
    /// </summary>
    Task<PayrollProcessResultDto> ProcessOvertimeWelfareRatedAsync(
        Stream ezafe,
        Stream refahi,
        Stream coefficients,
        Stream deptMapping,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Process "اضافه کار و رفاهی مبلغی" — same merge logic but without rate multiplication
    /// (fixed سرانه values used directly).
    /// </summary>
    Task<PayrollProcessResultDto> ProcessOvertimeWelfareMonetaryAsync(
        Stream ezafe,
        Stream refahi,
        Stream coefficients,
        Stream deptMapping,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Process "پردازش نیم درصد و تجمیع پاداش" — merge nim on شماره کارمند,
    /// join dept → coefficients on اداره, group-sum سرانه پاداش per department.
    /// </summary>
    Task<PayrollProcessResultDto> ProcessHalfPercentBonusAsync(
        Stream nim,
        Stream coefficients,
        Stream deptMapping,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Save a payroll run to the database
    /// </summary>
    Task<PayrollRunSummaryDto> SaveRunAsync(
        SavePayrollRunRequestDto dto,
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all saved payroll runs
    /// </summary>
    Task<IEnumerable<PayrollRunSummaryDto>> GetRunsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the full result for a saved payroll run (for re-download)
    /// </summary>
    Task<PayrollProcessResultDto?> GetRunByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a saved payroll run
    /// </summary>
    Task DeleteRunAsync(Guid id, CancellationToken cancellationToken = default);
}
