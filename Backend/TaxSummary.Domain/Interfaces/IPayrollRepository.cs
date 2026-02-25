using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Interfaces;

/// <summary>
/// Repository interface for PayrollRun entity operations
/// </summary>
public interface IPayrollRepository
{
    /// <summary>
    /// Saves a new payroll run
    /// </summary>
    Task<PayrollRun> SaveRunAsync(PayrollRun run, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all payroll runs ordered by creation date descending
    /// </summary>
    Task<IEnumerable<PayrollRun>> GetRunsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a payroll run by its identifier
    /// </summary>
    Task<PayrollRun?> GetRunByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a payroll run by its identifier
    /// </summary>
    Task DeleteRunAsync(Guid id, CancellationToken cancellationToken = default);
}
