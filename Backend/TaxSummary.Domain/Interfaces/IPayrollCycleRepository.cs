using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Interfaces;

public interface IPayrollCycleRepository
{
    Task<PayrollCycle> CreateCycleAsync(PayrollCycle cycle, CancellationToken cancellationToken = default);
    Task<PayrollCycle?> GetCycleByIdAsync(Guid id, bool includeDetails = true, CancellationToken cancellationToken = default);
    Task<IEnumerable<PayrollCycle>> GetCyclesAsync(CancellationToken cancellationToken = default);
    Task<PayrollDepartmentEntry?> GetDepartmentEntryByIdAsync(Guid id, bool includeItems = true, CancellationToken cancellationToken = default);
    Task<PayrollDepartmentEntry?> GetDepartmentEntryByNameAsync(Guid cycleId, string departmentName, bool includeItems = true, CancellationToken cancellationToken = default);
    Task<IEnumerable<PayrollDepartmentEntry>> GetDepartmentEntriesForUserAsync(string departmentName, CancellationToken cancellationToken = default);
    Task DeleteCycleAsync(Guid id, CancellationToken cancellationToken = default);
}
