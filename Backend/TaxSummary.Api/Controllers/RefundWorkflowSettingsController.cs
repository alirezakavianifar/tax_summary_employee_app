using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaxSummary.Application.DTOs;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Api.Controllers;

[ApiController]
[Route("api/refunds/workflow-settings")]
[EnableRateLimiting("GeneralPolicy")]
public class RefundWorkflowSettingsController : ControllerBase
{
    private readonly IRefundWorkflowSettingsService _workflowService;
    private readonly ILogger<RefundWorkflowSettingsController> _logger;

    public RefundWorkflowSettingsController(
        IRefundWorkflowSettingsService workflowService,
        ILogger<RefundWorkflowSettingsController> logger)
    {
        _workflowService = workflowService ?? throw new ArgumentNullException(nameof(workflowService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get all workflow steps (including disabled/bypassed ones)
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(List<RefundWorkflowStepDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct = default)
    {
        var steps = await _workflowService.GetAllStepsAsync(ct);
        return Ok(steps);
    }

    /// <summary>
    /// Get only active/enabled workflow steps in pipeline order
    /// </summary>
    [HttpGet("active")]
    [Authorize]
    [ProducesResponseType(typeof(List<RefundWorkflowStepDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActive(CancellationToken ct = default)
    {
        var active = await _workflowService.GetActiveStepsAsync(ct);
        return Ok(active);
    }

    /// <summary>
    /// Resolves the next enabled workflow stage given a current status
    /// </summary>
    [HttpGet("next-stage/{currentStatus}")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNextStage(RefundCaseStatus currentStatus, CancellationToken ct = default)
    {
        var nextStage = await _workflowService.GetNextStageAsync(currentStatus, ct);
        return Ok(new
        {
            CurrentStatus = currentStatus,
            NextStage = nextStage,
            NextStageValue = nextStage.HasValue ? (int)nextStage.Value : (int?)null
        });
    }

    /// <summary>
    /// Update workflow configuration (Admin only)
    /// </summary>
    [HttpPut]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<RefundWorkflowStepDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateWorkflowSettings(
        [FromBody] UpdateWorkflowStepsRequestDto dto,
        CancellationToken ct = default)
    {
        var adminUserId = GetCurrentUserId();
        var result = await _workflowService.UpdateWorkflowStepsAsync(dto, adminUserId, ct);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Reset workflow configuration to standard statutory defaults (Admin only)
    /// </summary>
    [HttpPost("reset")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<RefundWorkflowStepDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetToDefaults(CancellationToken ct = default)
    {
        var adminUserId = GetCurrentUserId();
        var result = await _workflowService.ResetToDefaultsAsync(adminUserId, ct);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub") ?? User.FindFirst("id");
        if (claim != null && Guid.TryParse(claim.Value, out var guid))
        {
            return guid;
        }

        return Guid.Empty;
    }
}
