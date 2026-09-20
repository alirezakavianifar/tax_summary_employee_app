using Microsoft.Extensions.Logging;
using TaxSummary.Application.DTOs;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Domain.ValueObjects;

namespace TaxSummary.Application.Services;

public class RefundWorkflowSettingsService : IRefundWorkflowSettingsService
{
    private readonly IRefundWorkflowSettingsRepository _repository;
    private readonly ILogger<RefundWorkflowSettingsService> _logger;

    public RefundWorkflowSettingsService(
        IRefundWorkflowSettingsRepository repository,
        ILogger<RefundWorkflowSettingsService> logger)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<List<RefundWorkflowStepDto>> GetAllStepsAsync(CancellationToken ct = default)
    {
        var steps = await _repository.GetAllAsync(ct);
        if (steps.Count == 0)
        {
            steps = DefaultRefundWorkflowSteps.GetDefaults();
        }

        return steps.Select(MapToDto).ToList();
    }

    public async Task<List<RefundWorkflowStepDto>> GetActiveStepsAsync(CancellationToken ct = default)
    {
        var steps = await _repository.GetActiveAsync(ct);
        if (steps.Count == 0)
        {
            steps = DefaultRefundWorkflowSteps.GetDefaults().Where(s => s.IsEnabled).ToList();
        }

        return steps.Select(MapToDto).ToList();
    }

    public async Task<RefundCaseStatus?> GetNextStageAsync(RefundCaseStatus currentStatus, CancellationToken ct = default)
    {
        var activeSteps = await _repository.GetActiveAsync(ct);
        if (activeSteps.Count == 0)
        {
            activeSteps = DefaultRefundWorkflowSteps.GetDefaults().Where(s => s.IsEnabled).ToList();
        }

        // For initial stages, the next target is the first enabled stage (typically Audited)
        if (currentStatus == RefundCaseStatus.Draft || currentStatus == RefundCaseStatus.InquiriesPending)
        {
            return activeSteps.FirstOrDefault()?.Stage ?? RefundCaseStatus.Audited;
        }

        // Determine current step order (from DB or default order)
        var allSteps = await _repository.GetAllAsync(ct);
        int currentOrder = allSteps.FirstOrDefault(s => s.Stage == currentStatus)?.StepOrder
                           ?? GetDefaultStepOrder(currentStatus);

        // Find the next active step in sequence
        var nextStep = activeSteps
            .Where(s => s.StepOrder > currentOrder)
            .OrderBy(s => s.StepOrder)
            .FirstOrDefault();

        return nextStep?.Stage;
    }

    public async Task<RefundCaseStatus?> GetPreviousStageAsync(RefundCaseStatus currentStatus, CancellationToken ct = default)
    {
        var activeSteps = await _repository.GetActiveAsync(ct);
        if (activeSteps.Count == 0)
        {
            activeSteps = DefaultRefundWorkflowSteps.GetDefaults().Where(s => s.IsEnabled).ToList();
        }

        var allSteps = await _repository.GetAllAsync(ct);
        int currentOrder = allSteps.FirstOrDefault(s => s.Stage == currentStatus)?.StepOrder
                           ?? GetDefaultStepOrder(currentStatus);

        // Find the previous active step in reverse sequence
        var previousStep = activeSteps
            .Where(s => s.StepOrder < currentOrder)
            .OrderByDescending(s => s.StepOrder)
            .FirstOrDefault();

        // If no prior step exists in the chain, return to Draft
        return previousStep?.Stage ?? RefundCaseStatus.Draft;
    }

    public async Task<bool> IsStageEnabledAsync(RefundCaseStatus stage, CancellationToken ct = default)
    {
        if (stage == RefundCaseStatus.Draft ||
            stage == RefundCaseStatus.InquiriesPending ||
            stage == RefundCaseStatus.Rejected)
        {
            return true;
        }

        var step = await _repository.GetByStageAsync(stage, ct);
        if (step == null)
        {
            // If not found in DB, default to true
            return true;
        }

        return step.IsEnabled;
    }

    public async Task<Result<List<RefundWorkflowStepDto>>> UpdateWorkflowStepsAsync(
        UpdateWorkflowStepsRequestDto dto,
        Guid adminUserId,
        CancellationToken ct = default)
    {
        if (dto?.Steps == null || dto.Steps.Count == 0)
        {
            return Result.Failure<List<RefundWorkflowStepDto>>("فهرست مراحل ارسالی نامعتبر است");
        }

        // Validate mandatory steps cannot be disabled
        var mandatoryViolation = dto.Steps.FirstOrDefault(s =>
            (s.Stage == RefundCaseStatus.Audited || s.Stage == RefundCaseStatus.TreasuryDisbursed) && !s.IsEnabled);

        if (mandatoryViolation != null)
        {
            return Result.Failure<List<RefundWorkflowStepDto>>(
                "مراحل کارشناسی ارشد (Audited) و ذیحسابی (TreasuryDisbursed) طبق قوانین مالیاتی الزامی بوده و امکان غیرفعال‌سازی آن‌ها وجود ندارد.");
        }

        var existingSteps = await _repository.GetAllAsync(ct);
        var existingMap = existingSteps.ToDictionary(s => s.Stage);

        foreach (var update in dto.Steps)
        {
            if (existingMap.TryGetValue(update.Stage, out var entity))
            {
                entity.Update(
                    title: update.Title,
                    description: update.Description ?? string.Empty,
                    isEnabled: update.IsEnabled,
                    allowedRoles: update.AllowedRoles,
                    updatedByUserId: adminUserId
                );
            }
        }

        await _repository.UpdateRangeAsync(existingSteps, ct);
        _logger.LogInformation("Admin {AdminId} updated Tax Refund workflow configuration.", adminUserId);

        var updated = await GetAllStepsAsync(ct);
        return Result.Success(updated);
    }

    public async Task<Result<List<RefundWorkflowStepDto>>> ResetToDefaultsAsync(
        Guid adminUserId,
        CancellationToken ct = default)
    {
        var defaults = DefaultRefundWorkflowSteps.GetDefaults();
        await _repository.ResetToDefaultsAsync(defaults, ct);
        _logger.LogInformation("Admin {AdminId} reset Tax Refund workflow configuration to defaults.", adminUserId);

        var refreshed = await GetAllStepsAsync(ct);
        return Result.Success(refreshed);
    }

    public async Task<bool> CanUserApproveStageAsync(
        User? user,
        RefundCaseStatus targetStage,
        string? taxUnitCode,
        CancellationToken ct = default)
    {
        if (user == null)
            return false;

        if (user.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
            return true;

        // Check if the stage is enabled
        if (!await IsStageEnabledAsync(targetStage, ct))
            return false;

        // Check role permission from the step's AllowedRoles
        var step = await _repository.GetByStageAsync(targetStage, ct);
        if (step != null && !step.IsRoleAllowed(user.Role))
        {
            return false;
        }

        // Director General has province-wide authority
        if (user.Role.Equals("DirectorGeneral", StringComparison.OrdinalIgnoreCase))
            return true;

        // Treasury has province-wide financial authority for disbursement
        if (user.Role.Equals("Treasury", StringComparison.OrdinalIgnoreCase) &&
            targetStage == RefundCaseStatus.TreasuryDisbursed)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(taxUnitCode))
            return false;

        // Check unit/office access
        if (!user.HasAccessToTaxHierarchy(taxUnitCode))
            return false;

        // Specific hierarchy checks:
        var hierarchy = TaxHierarchy.Decompose(taxUnitCode);

        if (targetStage == RefundCaseStatus.GroupHeadApproved &&
            user.Role.Equals("GroupHead", StringComparison.OrdinalIgnoreCase))
        {
            // Must cover the exact group code (e.g. 161010)
            return user.CanVerifyStage(targetStage, taxUnitCode);
        }

        if (targetStage == RefundCaseStatus.AdministrationHeadApproved &&
            user.Role.Equals("OfficeHead", StringComparison.OrdinalIgnoreCase))
        {
            // Must cover the office level (e.g. 161000)
            return user.CanVerifyStage(targetStage, taxUnitCode);
        }

        return true;
    }

    private static int GetDefaultStepOrder(RefundCaseStatus status) => status switch
    {
        RefundCaseStatus.Audited => 10,
        RefundCaseStatus.GroupHeadApproved => 20,
        RefundCaseStatus.AdministrationHeadApproved => 30,
        RefundCaseStatus.DirectorGeneralApproved => 40,
        RefundCaseStatus.TreasuryDisbursed => 50,
        _ => 99
    };

    private static RefundWorkflowStepDto MapToDto(RefundWorkflowStep step)
    {
        return new RefundWorkflowStepDto
        {
            Id = step.Id,
            Stage = step.Stage,
            Title = step.Title,
            Description = step.Description,
            StepOrder = step.StepOrder,
            IsEnabled = step.IsEnabled,
            IsMandatory = step.IsMandatory,
            AllowedRoles = step.AllowedRoles,
            CreatedAt = step.CreatedAt,
            UpdatedAt = step.UpdatedAt
        };
    }
}
