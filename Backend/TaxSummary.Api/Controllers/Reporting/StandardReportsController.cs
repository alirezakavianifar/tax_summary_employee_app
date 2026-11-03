using System.Diagnostics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Api.Attributes;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Api.Controllers.Reporting;

/// <summary>
/// Controller for Standard Predefined Reporting Catalog, Parameterized Execution, and Excel Export
/// </summary>
[Authorize]
[RequireModuleAccess("module_reporting")]
[ApiController]
[Route("api/reporting/standard")]
[Produces("application/json")]
public class StandardReportsController : ReportingControllerBase
{
    private readonly IExecutiveReportingService _reportingService;
    private readonly IReportingRepository _reportingRepository;
    private readonly ILogger<StandardReportsController> _logger;

    public StandardReportsController(
        IExecutiveReportingService reportingService,
        IReportingRepository reportingRepository,
        ILogger<StandardReportsController> logger)
    {
        _reportingService = reportingService ?? throw new ArgumentNullException(nameof(reportingService));
        _reportingRepository = reportingRepository ?? throw new ArgumentNullException(nameof(reportingRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// فهرست گزارش‌های فعال و در دسترس کاربر جاری بر اساس نقش (همراه با امکان نمایش بایگانی برای مدیران)
    /// </summary>
    [HttpGet("catalog")]
    [ProducesResponseType(typeof(List<ReportDefinitionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<ReportDefinitionDto>>> GetCatalog(
        [FromQuery] ReportDomainSource? source,
        [FromQuery] bool includeInactive = false,
        CancellationToken ct = default)
    {
        var role = GetCurrentUserRole();
        var result = await _reportingService.GetCatalogAsync(role, source, includeInactive, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// تغییر وضعیت فعال یا بایگانی گزارش توسط مدیر سامانه
    /// </summary>
    [HttpPatch("{code}/toggle-status")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ToggleReportStatus(
        [FromRoute] string code,
        [FromQuery] bool? isActive,
        CancellationToken ct)
    {
        var role = GetCurrentUserRole();
        var result = await _reportingService.ToggleReportStatusAsync(code, isActive, role, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = "وضعیت فعال/بایگانی گزارش با موفقیت تغییر یافت.", isActive = result.Value });
    }

    /// <summary>
    /// حذف کامل گزارش و جداول پایگاه داده مرتبط (مخصوص گزارش‌های سفارشی اکسل و گزارش‌های ساخته شده)
    /// </summary>
    [HttpDelete("{code}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteReport(
        [FromRoute] string code,
        CancellationToken ct)
    {
        var role = GetCurrentUserRole();
        var result = await _reportingService.DeleteReportAsync(code, role, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = $"گزارش '{code}' و داده‌های مربوطه با موفقیت حذف گردید." });
    }

    /// <summary>
    /// اجرای گزارش استاندارد با اعمال فیلترها و دریافت خروجی جدول داده با صفحه‌بندی
    /// </summary>
    [HttpPost("{code}/execute")]
    [RequireModuleAccess("action_reporting_standard_reports")]
    [ProducesResponseType(typeof(ReportExecutionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReportExecutionResultDto>> ExecuteReport(
        [FromRoute] string code,
        [FromBody] ReportFilterParametersDto parameters,
        CancellationToken ct)
    {
        var stopwatch = Stopwatch.StartNew();
        var userAssignedOffices = GetUserAssignedOfficeIds();

        var result = await _reportingService.ExecuteStandardReportAsync(code, parameters, userAssignedOffices, ct);
        stopwatch.Stop();

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        // Record execution metric in audit ledger
        await LogExecutionMetricAsync(code, stopwatch.ElapsedMilliseconds, result.Value.TotalRowCount, parameters, ct: ct);

        return Ok(result.Value);
    }

    /// <summary>
    /// دریافت داشبورد جامع شاخص‌های کلیدی عملکرد (Executive KPI) برای گزارش استاندارد
    /// </summary>
    [HttpGet("{code}/kpi")]
    [RequireModuleAccess("action_reporting_standard_reports")]
    [ProducesResponseType(typeof(ReportExecutiveKpiDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReportExecutiveKpiDto>> GetReportKpi(
        [FromRoute] string code,
        CancellationToken ct)
    {
        var userAssignedOffices = GetUserAssignedOfficeIds();
        var result = await _reportingService.GetStandardReportKpiOverviewAsync(code, userAssignedOffices, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// صدور فایل گزارش استاندارد به صورت فایل اکسل چندبرگی استاندارد با فرمول (EPPlus 7 RTL)
    /// </summary>
    [HttpPost("{code}/export/excel")]
    [RequireModuleAccess("action_reporting_export")]
    [Produces("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExportExcel(
        [FromRoute] string code,
        [FromBody] ReportFilterParametersDto parameters,
        CancellationToken ct)
    {
        var stopwatch = Stopwatch.StartNew();
        var userAssignedOffices = GetUserAssignedOfficeIds();

        var result = await _reportingService.ExportStandardReportAsync(code, parameters, ExportFormat.Excel, userAssignedOffices, ct);
        stopwatch.Stop();

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        await LogExecutionMetricAsync(code, stopwatch.ElapsedMilliseconds, -1, parameters, exportFormat: "Excel", ct: ct);

        var fileName = $"{code}_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
        return File(result.Value, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private async Task LogExecutionMetricAsync(
        string reportCode, 
        long durationMs, 
        int rowCount, 
        ReportFilterParametersDto parameters, 
        string? exportFormat = null,
        CancellationToken ct = default)
    {
        try
        {
            var userId = GetCurrentUserId();
            var username = GetCurrentUsername();
            var ip = GetClientIpAddress();

            var filterSummary = $"Dept:{parameters.Department}, Cycle:{parameters.PayrollCycleId}, Dates:{parameters.ShamsiDateFrom}-{parameters.ShamsiDateTo}";
            var log = ReportExecutionLog.Record(null, reportCode, userId, username, durationMs, rowCount, filterSummary, exportFormat, ip);
            await _reportingRepository.LogExecutionAsync(log, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record report execution log for {ReportCode}", reportCode);
        }
    }
}
