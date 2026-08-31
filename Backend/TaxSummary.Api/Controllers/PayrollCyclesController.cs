using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaxSummary.Application.DTOs.PayrollCycle;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Api.Controllers;

/// <summary>
/// API controller for collaborative multi-department payroll cycles
/// </summary>
[Authorize]
[ApiController]
[Route("api/payroll/cycles")]
[Produces("application/json")]
public class PayrollCyclesController : ControllerBase
{
    private readonly IPayrollCycleService _cycleService;
    private readonly ILogger<PayrollCyclesController> _logger;

    public PayrollCyclesController(
        IPayrollCycleService cycleService,
        ILogger<PayrollCyclesController> logger)
    {
        _cycleService = cycleService ?? throw new ArgumentNullException(nameof(cycleService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Create a new collaborative payroll cycle by uploading base files (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(PayrollCycleSummaryDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PayrollCycleSummaryDto>> CreateCycle(
        [FromForm] string title,
        [FromForm] string processType,
        [FromForm] int fiscalYear,
        [FromForm] int fiscalMonth,
        [FromForm] DateTime? deadline,
        [FromForm] string? notes,
        IFormFile? ezafe,
        IFormFile? refahi,
        IFormFile? nim,
        IFormFile? coefficients,
        IFormFile? deptMapping,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(title))
            return BadRequest(new { error = "عنوان دوره الزامی است" });

        var userId = GetCurrentUserId();

        try
        {
            Stream? ezafeStream = ezafe?.OpenReadStream();
            Stream? refahiStream = refahi?.OpenReadStream();
            Stream? nimStream = nim?.OpenReadStream();
            Stream? coefStream = coefficients?.OpenReadStream();
            Stream? deptStream = deptMapping?.OpenReadStream();

            var result = await _cycleService.CreateCycleAsync(
                title,
                processType,
                fiscalYear,
                fiscalMonth,
                userId,
                deadline,
                notes,
                ezafeStream,
                refahiStream,
                coefStream,
                deptStream,
                nimStream,
                cancellationToken);

            ezafeStream?.Dispose();
            refahiStream?.Dispose();
            nimStream?.Dispose();
            coefStream?.Dispose();
            deptStream?.Dispose();

            return CreatedAtAction(nameof(GetCycleById), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payroll cycle: {Title}", title);
            return BadRequest(new { error = "خطا در ایجاد دوره محاسبه: " + ex.Message });
        }
    }

    /// <summary>
    /// Get list of all payroll cycles
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PayrollCycleSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PayrollCycleSummaryDto>>> GetCycles(CancellationToken cancellationToken)
    {
        var list = await _cycleService.GetCyclesAsync(cancellationToken);
        return Ok(list);
    }

    /// <summary>
    /// Get details of a specific payroll cycle (Admin or Manager)
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PayrollCycleDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PayrollCycleDetailDto>> GetCycleById(Guid id, CancellationToken cancellationToken)
    {
        var cycle = await _cycleService.GetCycleByIdAsync(id, cancellationToken);
        if (cycle == null) return NotFound(new { error = "دوره محاسبه یافت نشد" });
        return Ok(cycle);
    }

    /// <summary>
    /// Get department entry with all employee items
    /// </summary>
    [HttpGet("departments/{departmentEntryId:guid}")]
    [ProducesResponseType(typeof(PayrollDepartmentEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PayrollDepartmentEntryDto>> GetDepartmentEntryById(
        Guid departmentEntryId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var dept = await _cycleService.GetDepartmentEntryByIdAsync(departmentEntryId, userId, role, cancellationToken);
            if (dept == null) return NotFound(new { error = "رکورد اداره یافت نشد" });
            return Ok(dept);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    /// <summary>
    /// Get department entries for the currently logged in officer
    /// </summary>
    [HttpGet("my-departments")]
    [ProducesResponseType(typeof(IEnumerable<PayrollDepartmentEntrySummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PayrollDepartmentEntrySummaryDto>>> GetMyDepartmentEntries(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var entries = await _cycleService.GetDepartmentEntriesForOfficerAsync(userId, cancellationToken);
        return Ok(entries);
    }

    /// <summary>
    /// Save draft adjustments for a department
    /// </summary>
    [HttpPut("departments/{departmentEntryId:guid}/draft")]
    [ProducesResponseType(typeof(PayrollDepartmentEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PayrollDepartmentEntryDto>> SaveDraft(
        Guid departmentEntryId,
        [FromBody] SaveDepartmentDraftDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _cycleService.SaveDepartmentDraftAsync(departmentEntryId, dto, userId, role, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Submit department entry to Admin for approval
    /// </summary>
    [HttpPost("departments/{departmentEntryId:guid}/submit")]
    [ProducesResponseType(typeof(PayrollDepartmentEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PayrollDepartmentEntryDto>> SubmitDepartment(
        Guid departmentEntryId,
        [FromBody] SubmitDepartmentDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        try
        {
            var result = await _cycleService.SubmitDepartmentAsync(departmentEntryId, dto, userId, role, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Review (Approve or Reject) department entry (Admin only)
    /// </summary>
    [HttpPost("departments/{departmentEntryId:guid}/review")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PayrollDepartmentEntryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PayrollDepartmentEntryDto>> ReviewDepartment(
        Guid departmentEntryId,
        [FromBody] ReviewDepartmentDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();

        try
        {
            var result = await _cycleService.ReviewDepartmentAsync(departmentEntryId, dto, userId, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Finalize entire payroll cycle (Admin only)
    /// </summary>
    [HttpPost("{id:guid}/finalize")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(PayrollCycleDetailDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PayrollCycleDetailDto>> FinalizeCycle(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _cycleService.FinalizeCycleAsync(id, userId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Delete payroll cycle (Admin only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteCycle(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _cycleService.DeleteCycleAsync(id, userId, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Export single department Excel sheet
    /// </summary>
    [HttpGet("departments/{departmentEntryId:guid}/export")]
    public async Task<IActionResult> ExportDepartmentExcel(Guid departmentEntryId, CancellationToken cancellationToken)
    {
        var bytes = await _cycleService.ExportDepartmentExcelAsync(departmentEntryId, cancellationToken);
        var filename = $"department_payroll_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    /// <summary>
    /// Import single department Excel sheet
    /// </summary>
    [HttpPost("departments/{departmentEntryId:guid}/import")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<PayrollDepartmentEntryDto>> ImportDepartmentExcel(
        Guid departmentEntryId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "فایل اکسل انتخاب نشده است" });

        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole();

        using var stream = file.OpenReadStream();
        var result = await _cycleService.ImportDepartmentExcelAsync(departmentEntryId, stream, userId, role, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Export master consolidated multi-sheet Excel for entire cycle (Admin only)
    /// </summary>
    [HttpGet("{id:guid}/export-master")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ExportMasterExcel(Guid id, CancellationToken cancellationToken)
    {
        var bytes = await _cycleService.ExportMasterExcelAsync(id, cancellationToken);
        var filename = $"payroll_master_consolidated_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub") ?? User.FindFirst("id");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? "Employee";
    }
}
