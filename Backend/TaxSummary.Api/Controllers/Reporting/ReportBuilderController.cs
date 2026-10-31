using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Api.Attributes;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Enums;

namespace TaxSummary.Api.Controllers.Reporting;

/// <summary>
/// Controller for Dynamic Ad-Hoc Report Builder Engine, metadata schema discovery, and query execution
/// </summary>
[Authorize(Roles = "Admin,Manager,DirectorGeneral")]
[RequireModuleAccess("module_reporting")]
[ApiController]
[Route("api/reporting/builder")]
[Produces("application/json")]
public class ReportBuilderController : ReportingControllerBase
{
    private readonly IReportBuilderEngine _builderEngine;
    private readonly ILogger<ReportBuilderController> _logger;

    public ReportBuilderController(
        IReportBuilderEngine builderEngine,
        ILogger<ReportBuilderController> logger)
    {
        _builderEngine = builderEngine ?? throw new ArgumentNullException(nameof(builderEngine));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// دریافت کاتالوگ متادیتای ستون‌ها، دسته‌بندی‌ها و فیلترهای مجاز برای هر منبع داده
    /// </summary>
    [HttpGet("metadata/{source}")]
    [ProducesResponseType(typeof(DynamicQueryMetadataDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DynamicQueryMetadataDto>> GetMetadata(
        [FromRoute] ReportDomainSource source,
        CancellationToken ct)
    {
        var result = await _builderEngine.GetQueryableSchemaMetadataAsync(source, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// اجرای کوئری پویای سفارشی همراه با فیلترها، مرتب‌سازی و توابع تجمیعی
    /// </summary>
    [HttpPost("query")]
    [RequireModuleAccess("action_reporting_builder")]
    [ProducesResponseType(typeof(DynamicReportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DynamicReportResultDto>> ExecuteDynamicQuery(
        [FromBody] DynamicReportQueryRequestDto request,
        CancellationToken ct)
    {
        _logger.LogInformation("Executing dynamic query for DomainSource: {Source}, Fields: {FieldsCount}",
            request.DomainSource, request.SelectedFields?.Count ?? 0);

        var userAssignedOffices = GetUserAssignedOfficeIds();
        var result = await _builderEngine.ExecuteDynamicQueryAsync(request, userAssignedOffices, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// صدور مستقیم نتیجه کوئری پویا در قالب اکسل راست‌به‌چپ با فرمول
    /// </summary>
    [HttpPost("export/excel")]
    [RequireModuleAccess("action_reporting_export")]
    [Produces("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ExportDynamicExcel(
        [FromBody] DynamicReportQueryRequestDto request,
        CancellationToken ct)
    {
        var userAssignedOffices = GetUserAssignedOfficeIds();
        var result = await _builderEngine.ExportDynamicQueryAsync(request, ExportFormat.Excel, userAssignedOffices, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        var fileName = $"DynamicQuery_{request.DomainSource}_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
        return File(result.Value, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
