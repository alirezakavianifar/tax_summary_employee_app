using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;

namespace TaxSummary.Api.Controllers.Reporting;

[ApiController]
[Route("api/reporting/auditors")]
[Authorize]
[Produces("application/json")]
public class AuditorPerformanceController : ReportingControllerBase
{
    private readonly IAuditorPerformanceService _performanceService;
    private readonly ILogger<AuditorPerformanceController> _logger;

    public AuditorPerformanceController(
        IAuditorPerformanceService performanceService,
        ILogger<AuditorPerformanceController> logger)
    {
        _performanceService = performanceService ?? throw new ArgumentNullException(nameof(performanceService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// دریافت تمامی شاخص‌های ارزیابی عملکرد حسابرسان
    /// </summary>
    [HttpGet("metrics")]
    public async Task<ActionResult<List<AuditorPerformanceMetricDto>>> GetMetrics(
        [FromQuery] bool includeInactive = false, 
        CancellationToken ct = default)
    {
        var result = await _performanceService.GetMetricDefinitionsAsync(includeInactive, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// ایجاد یا ویرایش تعریف یک شاخص ارزیابی توسط مدیر
    /// </summary>
    [HttpPost("metrics")]
    [Authorize(Roles = "Admin,DirectorGeneral,Manager")]
    public async Task<ActionResult<AuditorPerformanceMetricDto>> SaveMetric(
        [FromBody] SaveAuditorMetricRequestDto request, 
        CancellationToken ct = default)
    {
        if (request == null)
            return BadRequest(new { error = "داده‌های شاخص نامعتبر است" });

        var result = await _performanceService.SaveMetricDefinitionAsync(request, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// تغییر وضعیت فعال/غیرفعال بودن یک شاخص
    /// </summary>
    [HttpPatch("metrics/{id:guid}/toggle")]
    [Authorize(Roles = "Admin,DirectorGeneral,Manager")]
    public async Task<ActionResult> ToggleMetricStatus(
        Guid id, 
        [FromBody] ToggleMetricStatusRequest request, 
        CancellationToken ct = default)
    {
        var result = await _performanceService.ToggleMetricStatusAsync(id, request.IsActive, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { success = true, isActive = request.IsActive });
    }

    /// <summary>
    /// حذف یک شاخص تعریف‌شده توسط مدیر
    /// </summary>
    [HttpDelete("metrics/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteMetric(Guid id, CancellationToken ct = default)
    {
        var result = await _performanceService.DeleteMetricDefinitionAsync(id, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { success = true });
    }

    /// <summary>
    /// شبیه‌سازی و پیش‌نمایش زنده اثر یک فرمول یا وزن جدید بر پرونده‌های سنیم
    /// </summary>
    [HttpPost("metrics/simulate")]
    [Authorize(Roles = "Admin,DirectorGeneral,Manager")]
    public async Task<ActionResult<AuditorMetricsSimulationResultDto>> SimulateMetric(
        [FromBody] SaveAuditorMetricRequestDto request, 
        [FromQuery] int? fiscalYear = null, 
        CancellationToken ct = default)
    {
        var result = await _performanceService.SimulateMetricAsync(request, fiscalYear, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// ارزیابی و رتبه‌بندی کلیه حسابرسان بر اساس شاخص‌های فعال
    /// </summary>
    [HttpGet("evaluation")]
    public async Task<ActionResult<List<AuditorScorecardDto>>> EvaluateAuditors(
        [FromQuery] int? fiscalYear = null, 
        [FromQuery] string? officeName = null, 
        CancellationToken ct = default)
    {
        var result = await _performanceService.EvaluateAuditorsAsync(fiscalYear, officeName, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// دریافت کارنامه جامع و پرونده ۳۶۰ درجه عملکرد یک حسابرس
    /// </summary>
    [HttpGet("profile/{auditorName}")]
    public async Task<ActionResult<Auditor360ProfileDto>> GetAuditorProfile(
        string auditorName, 
        [FromQuery] int? fiscalYear = null, 
        CancellationToken ct = default)
    {
        var result = await _performanceService.GetAuditor360ProfileAsync(auditorName, fiscalYear, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }
}

public class ToggleMetricStatusRequest
{
    public bool IsActive { get; set; }
}
