using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Api.Attributes;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;

namespace TaxSummary.Api.Controllers.Reporting;

/// <summary>
/// Controller for Executive KPI Dashboards, cross-domain trends, and departmental budget variances
/// </summary>
[Authorize(Roles = "Admin,Manager,Auditor,DirectorGeneral")]
[RequireModuleAccess("module_reporting")]
[ApiController]
[Route("api/reporting/executive")]
[Produces("application/json")]
public class ExecutiveReportingController : ReportingControllerBase
{
    private readonly IExecutiveReportingService _reportingService;
    private readonly ILogger<ExecutiveReportingController> _logger;

    public ExecutiveReportingController(
        IExecutiveReportingService reportingService,
        ILogger<ExecutiveReportingController> logger)
    {
        _reportingService = reportingService ?? throw new ArgumentNullException(nameof(reportingService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// دریافت داشبورد جامع شاخص‌های کلیدی عملکرد (KPI)، روندهای ماهانه و وضعیت بودجه ادارات
    /// </summary>
    [HttpGet("dashboard")]
    [RequireModuleAccess("action_reporting_view_dashboard")]
    [ProducesResponseType(typeof(ExecutiveDashboardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ExecutiveDashboardDto>> GetDashboard(
        [FromQuery] DashboardFilterDto filter,
        CancellationToken ct)
    {
        _logger.LogInformation("Fetching executive dashboard for FiscalYear: {Year}, Cycle: {Cycle}, Office: {Office}",
            filter.FiscalYear, filter.PayrollCycleId, filter.OfficeId);

        var userAssignedOffices = GetUserAssignedOfficeIds();
        var result = await _reportingService.GetExecutiveDashboardOverviewAsync(filter, userAssignedOffices, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// دریافت داشبورد جامع شاخص‌های کلیدی عملکرد تلفیقی استان (ترکیب رسیدگی سنیم و قرارهای دادرسی)
    /// </summary>
    [HttpGet("combined-kpi")]
    [RequireModuleAccess("action_reporting_view_dashboard")]
    [ProducesResponseType(typeof(ReportExecutiveKpiDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReportExecutiveKpiDto>> GetCombinedKpi(CancellationToken ct)
    {
        var userAssignedOffices = GetUserAssignedOfficeIds();
        var result = await _reportingService.GetCombinedExecutiveKpiOverviewAsync(userAssignedOffices, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// کارت‌های سبک شاخص‌های کلیدی جهت فراخوانی سریع یا پایش مستمر
    /// </summary>
    [HttpGet("kpis")]
    [RequireModuleAccess("action_reporting_view_dashboard")]
    [ProducesResponseType(typeof(ExecutiveKpiMetricsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ExecutiveKpiMetricsDto>> GetKpiMetrics(
        [FromQuery] int? fiscalYear,
        CancellationToken ct)
    {
        var userAssignedOffices = GetUserAssignedOfficeIds();
        var filter = new DashboardFilterDto { FiscalYear = fiscalYear };
        var result = await _reportingService.GetExecutiveDashboardOverviewAsync(filter, userAssignedOffices, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value.KpiMetrics);
    }

    /// <summary>
    /// روندهای مقایسه‌ای ماهانه اضافه کار، رفاهی و استرداد مالیات
    /// </summary>
    [HttpGet("trends")]
    [RequireModuleAccess("action_reporting_view_dashboard")]
    [ProducesResponseType(typeof(List<MonthlyTrendPointDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<MonthlyTrendPointDto>>> GetMonthlyTrends(
        [FromQuery] int? fiscalYear,
        CancellationToken ct)
    {
        var userAssignedOffices = GetUserAssignedOfficeIds();
        var filter = new DashboardFilterDto { FiscalYear = fiscalYear };
        var result = await _reportingService.GetExecutiveDashboardOverviewAsync(filter, userAssignedOffices, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value.MonthlyTrends);
    }

    /// <summary>
    /// وضعیت مصرف بودجه و انحرافات ادارات کل استان
    /// </summary>
    [HttpGet("departments")]
    [RequireModuleAccess("action_reporting_view_dashboard")]
    [ProducesResponseType(typeof(List<TopDepartmentBudgetDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<TopDepartmentBudgetDto>>> GetDepartmentBudgets(
        [FromQuery] Guid? payrollCycleId,
        CancellationToken ct)
    {
        var userAssignedOffices = GetUserAssignedOfficeIds();
        var filter = new DashboardFilterDto { PayrollCycleId = payrollCycleId };
        var result = await _reportingService.GetExecutiveDashboardOverviewAsync(filter, userAssignedOffices, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value.TopDepartmentBudgets);
    }
}
