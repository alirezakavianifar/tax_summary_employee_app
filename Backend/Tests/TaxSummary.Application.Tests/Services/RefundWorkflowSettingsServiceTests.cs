using Microsoft.Extensions.Logging;
using Moq;
using TaxSummary.Application.DTOs;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class RefundWorkflowSettingsServiceTests
{
    private readonly Mock<IRefundWorkflowSettingsRepository> _mockRepo;
    private readonly Mock<ILogger<RefundWorkflowSettingsService>> _mockLogger;
    private readonly RefundWorkflowSettingsService _service;

    public RefundWorkflowSettingsServiceTests()
    {
        _mockRepo = new Mock<IRefundWorkflowSettingsRepository>();
        _mockLogger = new Mock<ILogger<RefundWorkflowSettingsService>>();
        _service = new RefundWorkflowSettingsService(_mockRepo.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task GetNextStageAsync_StandardFlow_ReturnsImmediateNext()
    {
        // Arrange: All 5 statutory steps enabled
        var steps = DefaultRefundWorkflowSteps.GetDefaults();
        _mockRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(steps.Where(s => s.IsEnabled).ToList());
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(steps);

        // Act & Assert
        var step1 = await _service.GetNextStageAsync(RefundCaseStatus.Draft);
        Assert.Equal(RefundCaseStatus.Audited, step1);

        var step2 = await _service.GetNextStageAsync(RefundCaseStatus.Audited);
        Assert.Equal(RefundCaseStatus.GroupHeadApproved, step2);

        var step3 = await _service.GetNextStageAsync(RefundCaseStatus.GroupHeadApproved);
        Assert.Equal(RefundCaseStatus.AdministrationHeadApproved, step3);

        var step4 = await _service.GetNextStageAsync(RefundCaseStatus.AdministrationHeadApproved);
        Assert.Equal(RefundCaseStatus.DirectorGeneralApproved, step4);

        var step5 = await _service.GetNextStageAsync(RefundCaseStatus.DirectorGeneralApproved);
        Assert.Equal(RefundCaseStatus.TreasuryDisbursed, step5);

        var stepTerminal = await _service.GetNextStageAsync(RefundCaseStatus.TreasuryDisbursed);
        Assert.Null(stepTerminal);
    }

    [Fact]
    public async Task GetNextStageAsync_GroupHeadSkipped_AdvancesDirectlyToAdministrationHead()
    {
        // Arrange: GroupHead step disabled
        var steps = DefaultRefundWorkflowSteps.GetDefaults();
        var groupHeadStep = steps.First(s => s.Stage == RefundCaseStatus.GroupHeadApproved);
        groupHeadStep.SetEnabled(false);

        _mockRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(steps.Where(s => s.IsEnabled).ToList());
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(steps);

        // Act
        var nextAfterAudited = await _service.GetNextStageAsync(RefundCaseStatus.Audited);

        // Assert: GroupHead was skipped, advances straight to AdministrationHeadApproved!
        Assert.Equal(RefundCaseStatus.AdministrationHeadApproved, nextAfterAudited);
    }

    [Fact]
    public async Task GetPreviousStageAsync_GroupHeadSkipped_ReturnsDirectlyToAudited()
    {
        // Arrange: GroupHead step disabled
        var steps = DefaultRefundWorkflowSteps.GetDefaults();
        var groupHeadStep = steps.First(s => s.Stage == RefundCaseStatus.GroupHeadApproved);
        groupHeadStep.SetEnabled(false);

        _mockRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(steps.Where(s => s.IsEnabled).ToList());
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(steps);

        // Act: Office head returning the case for revision
        var prevFromOfficeHead = await _service.GetPreviousStageAsync(RefundCaseStatus.AdministrationHeadApproved);

        // Assert: Returns directly to Audited because GroupHead is disabled!
        Assert.Equal(RefundCaseStatus.Audited, prevFromOfficeHead);
    }

    [Fact]
    public async Task GetNextStageAsync_DirectorGeneralSkipped_AdvancesDirectlyToTreasury()
    {
        // Arrange: DirectorGeneral step disabled
        var steps = DefaultRefundWorkflowSteps.GetDefaults();
        var dgStep = steps.First(s => s.Stage == RefundCaseStatus.DirectorGeneralApproved);
        dgStep.SetEnabled(false);

        _mockRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(steps.Where(s => s.IsEnabled).ToList());
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(steps);

        // Act
        var nextAfterOfficeHead = await _service.GetNextStageAsync(RefundCaseStatus.AdministrationHeadApproved);

        // Assert: Advances directly to TreasuryDisbursed!
        Assert.Equal(RefundCaseStatus.TreasuryDisbursed, nextAfterOfficeHead);
    }

    [Fact]
    public async Task GetNextStageAsync_BothGroupHeadAndDGSkipped_AdvancesAuditedToOfficeHeadToTreasury()
    {
        // Arrange: Both GroupHead and DirectorGeneral disabled
        var steps = DefaultRefundWorkflowSteps.GetDefaults();
        steps.First(s => s.Stage == RefundCaseStatus.GroupHeadApproved).SetEnabled(false);
        steps.First(s => s.Stage == RefundCaseStatus.DirectorGeneralApproved).SetEnabled(false);

        _mockRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(steps.Where(s => s.IsEnabled).ToList());
        _mockRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(steps);

        // Act & Assert
        var stepAfterAudit = await _service.GetNextStageAsync(RefundCaseStatus.Audited);
        Assert.Equal(RefundCaseStatus.AdministrationHeadApproved, stepAfterAudit);

        var stepAfterOfficeHead = await _service.GetNextStageAsync(RefundCaseStatus.AdministrationHeadApproved);
        Assert.Equal(RefundCaseStatus.TreasuryDisbursed, stepAfterOfficeHead);
    }

    [Fact]
    public async Task UpdateWorkflowStepsAsync_DisablingMandatoryStep_ReturnsFailure()
    {
        // Arrange: Try to disable Audited
        var request = new UpdateWorkflowStepsRequestDto
        {
            Steps = new List<UpdateRefundWorkflowStepDto>
            {
                new()
                {
                    Stage = RefundCaseStatus.Audited,
                    Title = "Audited",
                    IsEnabled = false, // Forbidden!
                    AllowedRoles = "Expert"
                }
            }
        };

        // Act
        var result = await _service.UpdateWorkflowStepsAsync(request, Guid.NewGuid());

        // Assert
        Assert.True(result.IsFailure);
        Assert.Contains("الزامی", result.Error);
    }
}
