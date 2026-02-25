using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Application.DTOs.Payroll;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Api.Controllers;

/// <summary>
/// API controller for payroll processing operations
/// </summary>
[Authorize]
[ApiController]
[Route("api/payroll")]
[Produces("application/json")]
public class PayrollController : ControllerBase
{
    private readonly IPayrollService _payrollService;
    private readonly IPayrollExcelExportService _excelExportService;
    private readonly ILogger<PayrollController> _logger;

    public PayrollController(
        IPayrollService payrollService,
        IPayrollExcelExportService excelExportService,
        ILogger<PayrollController> logger)
    {
        _payrollService = payrollService ?? throw new ArgumentNullException(nameof(payrollService));
        _excelExportService = excelExportService ?? throw new ArgumentNullException(nameof(excelExportService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Process payroll files — accepts multipart/form-data.
    /// processType: OvertimeWelfareRated | OvertimeWelfareMonetary | HalfPercentBonus
    /// Files for overtime+welfare: ezafe, refahi, coefficients, deptMapping
    /// Files for bonus: nim, coefficients, deptMapping
    /// </summary>
    [HttpPost("process")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(PayrollProcessResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PayrollProcessResultDto>> Process(
        [FromForm] string processType,
        IFormFile? ezafe,
        IFormFile? refahi,
        IFormFile? nim,
        IFormFile? coefficients,
        IFormFile? deptMapping,
        CancellationToken cancellationToken)
    {
        if (!PayrollProcessType.IsValid(processType))
            return BadRequest(new { error = $"نوع پردازش نامعتبر است: {processType}" });

        _logger.LogInformation("Payroll process request: {ProcessType}", processType);

        try
        {
            PayrollProcessResultDto result;

            if (processType == PayrollProcessType.HalfPercentBonus)
            {
                if (nim == null || coefficients == null || deptMapping == null)
                    return BadRequest(new { error = "فایل‌های nim، coefficients و deptMapping الزامی هستند" });

                using var nimStream = nim.OpenReadStream();
                using var coefStream = coefficients.OpenReadStream();
                using var deptStream = deptMapping.OpenReadStream();

                result = await _payrollService.ProcessHalfPercentBonusAsync(
                    nimStream, coefStream, deptStream, cancellationToken);
            }
            else
            {
                if (ezafe == null || refahi == null || coefficients == null || deptMapping == null)
                    return BadRequest(new { error = "فایل‌های ezafe، refahi، coefficients و deptMapping الزامی هستند" });

                using var ezafeStream = ezafe.OpenReadStream();
                using var refahiStream = refahi.OpenReadStream();
                using var coefStream = coefficients.OpenReadStream();
                using var deptStream = deptMapping.OpenReadStream();

                result = processType == PayrollProcessType.OvertimeWelfareRated
                    ? await _payrollService.ProcessOvertimeWelfareRatedAsync(
                        ezafeStream, refahiStream, coefStream, deptStream, cancellationToken)
                    : await _payrollService.ProcessOvertimeWelfareMonetaryAsync(
                        ezafeStream, refahiStream, coefStream, deptStream, cancellationToken);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payroll files");
            return BadRequest(new { error = "خطا در پردازش فایل‌ها: " + ex.Message });
        }
    }

    /// <summary>
    /// Export payroll result to Excel — returns .xlsx file
    /// </summary>
    [HttpPost("export")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Export(
        [FromBody] PayrollProcessResultDto result,
        CancellationToken cancellationToken)
    {
        if (result == null)
            return BadRequest(new { error = "نتیجه پردازش الزامی است" });

        _logger.LogInformation("Payroll Excel export request: {ProcessType}", result.ProcessType);

        var bytes = await _excelExportService.ExportToExcelAsync(result, cancellationToken);
        var fileName = $"payroll_{result.ProcessType}_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";

        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }

    /// <summary>
    /// Save a payroll run to the database
    /// </summary>
    [HttpPost("runs")]
    [ProducesResponseType(typeof(PayrollRunSummaryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PayrollRunSummaryDto>> SaveRun(
        [FromBody] SavePayrollRunRequestDto request,
        CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "کاربر احراز هویت نشده" });

        if (string.IsNullOrWhiteSpace(request.RunLabel))
            return BadRequest(new { error = "برچسب ذخیره الزامی است" });

        _logger.LogInformation("Saving payroll run: {Label} by user {UserId}", request.RunLabel, userId);

        var summary = await _payrollService.SaveRunAsync(request, userId, cancellationToken);
        return CreatedAtAction(nameof(GetRun), new { id = summary.Id }, summary);
    }

    /// <summary>
    /// List all saved payroll runs
    /// </summary>
    [HttpGet("runs")]
    [ProducesResponseType(typeof(IEnumerable<PayrollRunSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PayrollRunSummaryDto>>> GetRuns(
        CancellationToken cancellationToken)
    {
        var runs = await _payrollService.GetRunsAsync(cancellationToken);
        return Ok(runs);
    }

    /// <summary>
    /// Get the full result for a saved payroll run (for re-download)
    /// </summary>
    [HttpGet("runs/{id:guid}")]
    [ProducesResponseType(typeof(PayrollProcessResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PayrollProcessResultDto>> GetRun(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _payrollService.GetRunByIdAsync(id, cancellationToken);
        if (result == null)
            return NotFound(new { error = "اجرای ذخیره‌شده پیدا نشد" });

        return Ok(result);
    }

    /// <summary>
    /// Delete a saved payroll run
    /// </summary>
    [HttpDelete("runs/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRun(
        Guid id,
        CancellationToken cancellationToken)
    {
        var existing = await _payrollService.GetRunByIdAsync(id, cancellationToken);
        if (existing == null)
            return NotFound(new { error = "اجرای ذخیره‌شده پیدا نشد" });

        await _payrollService.DeleteRunAsync(id, cancellationToken);

        _logger.LogInformation("Deleted payroll run {RunId}", id);
        return NoContent();
    }
}
