using TaxSummary.Application.DTOs;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.Services;

public interface IRefundWorkflowSettingsService
{
    Task<List<RefundWorkflowStepDto>> GetAllStepsAsync(CancellationToken ct = default);
    Task<List<RefundWorkflowStepDto>> GetActiveStepsAsync(CancellationToken ct = default);
    Task<RefundCaseStatus?> GetNextStageAsync(RefundCaseStatus currentStatus, CancellationToken ct = default);
    Task<RefundCaseStatus?> GetPreviousStageAsync(RefundCaseStatus currentStatus, CancellationToken ct = default);
    Task<bool> IsStageEnabledAsync(RefundCaseStatus stage, CancellationToken ct = default);
    Task<Result<List<RefundWorkflowStepDto>>> UpdateWorkflowStepsAsync(UpdateWorkflowStepsRequestDto dto, Guid adminUserId, CancellationToken ct = default);
    Task<Result<List<RefundWorkflowStepDto>>> ResetToDefaultsAsync(Guid adminUserId, CancellationToken ct = default);
    Task<bool> CanUserApproveStageAsync(User? user, RefundCaseStatus targetStage, string? taxUnitCode, CancellationToken ct = default);
}
