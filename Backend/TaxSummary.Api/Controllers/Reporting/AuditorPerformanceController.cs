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
    /// دریافت فهرست منابع داده ارزیابی حسابرسی (پایگاه داده اصلی و گزارش‌های اکسل بارگذاری‌شده)
    /// </summary>
    [HttpGet("sources")]
    public async Task<ActionResult<List<AuditDataSourceDto>>> GetAuditSources(CancellationToken ct = default)
    {
        var result = await _performanceService.GetAuditReportSourcesAsync(ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// شبیه‌سازی و پیش‌نمایش زنده اثر یک فرمول یا وزن جدید بر پرونده‌های سنیم یا گزارش اکسل
    /// </summary>
    [HttpPost("metrics/simulate")]
    [Authorize(Roles = "Admin,DirectorGeneral,Manager")]
    public async Task<ActionResult<AuditorMetricsSimulationResultDto>> SimulateMetric(
        [FromBody] SaveAuditorMetricRequestDto request, 
        [FromQuery] int? fiscalYear = null, 
        [FromQuery] string? reportCode = null,
        CancellationToken ct = default)
    {
        var result = await _performanceService.SimulateMetricAsync(request, fiscalYear, reportCode, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// ارزیابی و رتبه‌بندی کلیه حسابرسان بر اساس شاخص‌های فعال (پایگاه داده یا گزارش اکسل)
    /// </summary>
    [HttpGet("evaluation")]
    public async Task<ActionResult<List<AuditorScorecardDto>>> EvaluateAuditors(
        [FromQuery] int? fiscalYear = null, 
        [FromQuery] string? officeName = null, 
        [FromQuery] string? reportCode = null,
        CancellationToken ct = default)
    {
        var result = await _performanceService.EvaluateAuditorsAsync(fiscalYear, officeName, reportCode, ct);
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
        [FromQuery] string? reportCode = null,
        CancellationToken ct = default)
    {
        var result = await _performanceService.GetAuditor360ProfileAsync(auditorName, fiscalYear, reportCode, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// دریافت پیکربندی فعال و ماتریس اوزان امتیازی دستورالعمل ارزیابی عملکرد (SRS)
    /// </summary>
    [HttpGet("srs/rules")]
    public async Task<ActionResult<SrsRuleSetConfigDto>> GetSrsRules(CancellationToken ct = default)
    {
        var result = await _performanceService.GetSrsRuleConfigurationAsync(ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// ذخیره و به‌روزرسانی پیکربندی قواعد و ماتریس اوزان دستورالعمل ارزیابی عملکرد
    /// </summary>
    [HttpPut("srs/rules")]
    [Authorize(Roles = "Admin,DirectorGeneral,Manager")]
    public async Task<ActionResult<SrsRuleSetConfigDto>> SaveSrsRules(
        [FromBody] SaveSrsRuleConfigRequestDto request, 
        CancellationToken ct = default)
    {
        if (request == null)
            return BadRequest(new { error = "داده‌های پیکربندی بخشنامه نامعتبر است" });

        var result = await _performanceService.SaveSrsRuleConfigurationAsync(request, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// بازنشانی قواعد و ماتریس اوزان به مقادیر پیش‌فرض مصوب بخشنامه ارزیابی عملکرد
    /// </summary>
    [HttpPost("srs/rules/reset")]
    [Authorize(Roles = "Admin,DirectorGeneral")]
    public async Task<ActionResult<SrsRuleSetConfigDto>> ResetSrsRules(CancellationToken ct = default)
    {
        var result = await _performanceService.ResetSrsRuleConfigurationAsync(ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// ارزیابی و رتبه‌بندی استانی حسابرسان بر اساس قواعد امتیازی دستورالعمل ارزیابی عملکرد (SRS)
    /// </summary>
    [HttpGet("srs/evaluation")]
    public async Task<ActionResult<List<SrsEmployeeScorecardDto>>> EvaluateAuditorsSrs(
        [FromQuery] int? fiscalYear = null, 
        [FromQuery] string? officeName = null, 
        [FromQuery] string? reportCode = null, 
        CancellationToken ct = default)
    {
        var result = await _performanceService.EvaluateAuditorsSrsAsync(fiscalYear, officeName, reportCode, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// دریافت کارنامه تفصیلی و جدول ماتریسی ۸ در ۷ یک حسابرس بر اساس دستورالعمل ارزیابی عملکرد
    /// </summary>
    [HttpGet("srs/scorecard/{auditorName}")]
    public async Task<ActionResult<SrsEmployeeScorecardDto>> GetAuditorSrsScorecard(
        string auditorName, 
        [FromQuery] int? fiscalYear = null, 
        [FromQuery] string? reportCode = null, 
        CancellationToken ct = default)
    {
        var result = await _performanceService.GetAuditorSrsScorecardAsync(auditorName, fiscalYear, reportCode, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// همگام‌سازی پرونده‌های ۳۰۰ پرونده مهم و ۱۰۰ پرونده از فایل اکسل سنیم در پایگاه داده
    /// </summary>
    [HttpPost("srs/sync-300-cases")]
    [Authorize(Roles = "Admin,DirectorGeneral")]
    public async Task<ActionResult> Sync300Cases(CancellationToken ct = default)
    {
        var result = await _performanceService.Sync300CasesFromExcelAsync(null, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = "همگام‌سازی ۳۰۰ پرونده مهم با موفقیت انجام شد", updatedCount = result.Value });
    }
}

public class ToggleMetricStatusRequest
{
    public bool IsActive { get; set; }
}
