using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Interfaces;

public interface IRefundWorkflowSettingsRepository
{
    Task<List<RefundWorkflowStep>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<RefundWorkflowStep>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<RefundWorkflowStep?> GetByStageAsync(RefundCaseStatus stage, CancellationToken cancellationToken = default);
    Task UpdateRangeAsync(IEnumerable<RefundWorkflowStep> steps, CancellationToken cancellationToken = default);
    Task ResetToDefaultsAsync(IEnumerable<RefundWorkflowStep> defaults, CancellationToken cancellationToken = default);
}
