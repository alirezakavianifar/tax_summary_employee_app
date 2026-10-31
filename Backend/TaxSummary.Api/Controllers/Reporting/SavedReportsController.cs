using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Api.Attributes;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;

namespace TaxSummary.Api.Controllers.Reporting;

/// <summary>
/// Controller for User-Saved Filter Presets and Office-Shared Templates
/// </summary>
[Authorize]
[RequireModuleAccess("module_reporting")]
[ApiController]
[Route("api/reporting/saved")]
[Produces("application/json")]
public class SavedReportsController : ReportingControllerBase
{
    private readonly ISavedReportsService _savedReportsService;
    private readonly ILogger<SavedReportsController> _logger;

    public SavedReportsController(
        ISavedReportsService savedReportsService,
        ILogger<SavedReportsController> logger)
    {
        _savedReportsService = savedReportsService ?? throw new ArgumentNullException(nameof(savedReportsService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// دریافت الگوها و پیش‌تنظیم‌های ذخیره‌شده کاربر جاری و الگوهای به اشتراک گذاشته شده در اداره
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<SavedReportPresetDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<SavedReportPresetDto>>> GetUserPresets(
        [FromQuery] Guid? reportDefinitionId,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _savedReportsService.GetUserPresetsAsync(userId, reportDefinitionId, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// ذخیره الگوی فیلتر جدید برای گزارش مشخص
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SavedReportPresetDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SavedReportPresetDto>> CreatePreset(
        [FromBody] SaveReportPresetRequestDto request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _savedReportsService.SavePresetAsync(request, userId, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        _logger.LogInformation("Saved new report preset {PresetName} for user {UserId}", result.Value.PresetName, userId);
        return CreatedAtAction(nameof(GetUserPresets), new { id = result.Value.Id }, result.Value);
    }

    /// <summary>
    /// به‌روزرسانی پارامترهای الگوی ذخیره‌شده
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePreset(
        [FromRoute] Guid id,
        [FromBody] UpdateReportPresetRequestDto request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _savedReportsService.UpdatePresetAsync(id, request, userId, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    /// <summary>
    /// حذف الگوی فیلتر ذخیره‌شده
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeletePreset(
        [FromRoute] Guid id,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _savedReportsService.DeletePresetAsync(id, userId, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }
}
