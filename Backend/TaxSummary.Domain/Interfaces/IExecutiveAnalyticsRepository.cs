using TaxSummary.Domain.ValueObjects.Reporting;

namespace TaxSummary.Domain.Interfaces;

public interface IExecutiveAnalyticsRepository
{
    Task<ExecutiveKpiSnapshot> GetExecutiveKpiSnapshotAsync(
        DateTime? fromDate, 
        DateTime? toDate, 
        List<Guid>? officeIds, 
        CancellationToken ct = default);

    Task<List<DepartmentBudgetVariance>> GetDepartmentBudgetVariancesAsync(
        Guid? payrollCycleId, 
        List<Guid>? officeIds, 
        CancellationToken ct = default);

    Task<List<TaxSourceDistribution>> GetTaxSourceDistributionsAsync(
        int? fiscalYear, 
        List<Guid>? officeIds, 
        CancellationToken ct = default);
}
