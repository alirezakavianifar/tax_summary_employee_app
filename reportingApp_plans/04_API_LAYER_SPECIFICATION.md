# 04. API Layer Specification: Reporting & BI System

## 1. Controllers Structure & Routing Tree (`TaxSummary.Api/Controllers/Reporting/`)

All reporting REST endpoints reside under the `/api/reporting` route prefix, enforce JWT Bearer authentication, integrate with dynamic `[RequireModuleAccess]` menu permission filters, and produce standardized JSON or binary file streams.

```
TaxSummary.Api/
└── Controllers/
    └── Reporting/
        ├── ExecutiveReportingController.cs  ← /api/reporting/executive (KPIs, Dashboard, Trends)
        ├── StandardReportsController.cs     ← /api/reporting/standard  (Catalog, Execution, Exports)
        ├── ReportBuilderController.cs       ← /api/reporting/builder   (Schema Metadata, Dynamic Queries)
        └── SavedReportsController.cs        ← /api/reporting/saved     (Presets Management)
```

---

## 2. Controller Implementations

### 2.1 `ExecutiveReportingController.cs`
Route: `api/reporting/executive`  
Authorization: `[Authorize(Roles = "Admin,Manager,Auditor")]`  
Module Permission: `[RequireModuleAccess("module_reporting")]`

```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Api.Attributes;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;

namespace TaxSummary.Api.Controllers.Reporting;

[Authorize(Roles = "Admin,Manager,Auditor")]
[RequireModuleAccess("module_reporting")]
[ApiController]
[Route("api/reporting/executive")]
[Produces("application/json")]
public class ExecutiveReportingController : ControllerBase
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
        [FromQuery] int? fiscalYear,
        [FromQuery] Guid? payrollCycleId,
        [FromQuery] Guid? officeId,
        CancellationToken ct)
    {
        var filter = new DashboardFilterDto
        {
            FiscalYear = fiscalYear,
            PayrollCycleId = payrollCycleId,
            OfficeId = officeId
        };

        var userAssignedOffices = GetUserAssignedOfficeIds();
        var result = await _reportingService.GetExecutiveDashboardOverviewAsync(filter, userAssignedOffices, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// کارت‌های سبک شاخص‌های کلیدی جهت فراخوانی سریع یا پایش مستمر
    /// </summary>
    [HttpGet("kpis")]
    [ProducesResponseType(typeof(ExecutiveKpiMetricsDto), StatusCodes.Status200OK)]
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
    [ProducesResponseType(typeof(List<MonthlyTrendPointDto>), StatusCodes.Status200OK)]
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
    [ProducesResponseType(typeof(List<TopDepartmentBudgetDto>), StatusCodes.Status200OK)]
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

    private List<Guid>? GetUserAssignedOfficeIds()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (role == "Admin" || role == "Auditor")
            return null; // Full provincial access

        var officeClaims = User.FindAll("office_id").Select(c => c.Value).ToList();
        var ids = new List<Guid>();
        foreach (var claim in officeClaims)
        {
            if (Guid.TryParse(claim, out var id))
                ids.Add(id);
        }
        return ids;
    }
}
```

---

### 2.2 `StandardReportsController.cs`
Route: `api/reporting/standard`  
Authorization: `[Authorize]`  
Module Permission: `[RequireModuleAccess("module_reporting")]`

```csharp
using System.Diagnostics;
using System.Net.Mime;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Api.Attributes;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Api.Controllers.Reporting;

[Authorize]
[RequireModuleAccess("module_reporting")]
[ApiController]
[Route("api/reporting/standard")]
[Produces("application/json")]
public class StandardReportsController : ControllerBase
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
    /// فهرست گزارش‌های فعال و در دسترس کاربر جاری بر اساس نقش
    /// </summary>
    [HttpGet("catalog")]
    [ProducesResponseType(typeof(List<ReportDefinitionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ReportDefinitionDto>>> GetCatalog(
        [FromQuery] ReportDomainSource? source,
        CancellationToken ct)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        var result = await _reportingService.GetCatalogAsync(role, source, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// اجرای گزارش استاندارد با اعمال فیلترها و دریافت خروجی جدول داده با صفحه‌بندی
    /// </summary>
    [HttpPost("{code}/execute")]
    [RequireModuleAccess("action_reporting_standard_reports")]
    [ProducesResponseType(typeof(ReportExecutionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
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
        await LogExecutionMetricAsync(code, stopwatch.ElapsedMilliseconds, result.Value.TotalRowCount, parameters);

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

        await LogExecutionMetricAsync(code, stopwatch.ElapsedMilliseconds, -1, parameters, "Excel");

        var fileName = $"{code}_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
        return File(result.Value, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private async Task LogExecutionMetricAsync(
        string reportCode, 
        long durationMs, 
        int rowCount, 
        ReportFilterParametersDto parameters, 
        string? exportFormat = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var username = User.Identity?.Name ?? "unknown";
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();

            var filterSummary = $"Dept:{parameters.Department}, Cycle:{parameters.PayrollCycleId}, Dates:{parameters.ShamsiDateFrom}-{parameters.ShamsiDateTo}";
            var log = ReportExecutionLog.Record(null, reportCode, userId, username, durationMs, rowCount, filterSummary, exportFormat, ip);
            await _reportingRepository.LogExecutionAsync(log);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to record report execution log for {ReportCode}", reportCode);
        }
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }

    private List<Guid>? GetUserAssignedOfficeIds()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (role == "Admin" || role == "Auditor")
            return null;

        var officeClaims = User.FindAll("office_id").Select(c => c.Value).ToList();
        var ids = new List<Guid>();
        foreach (var claim in officeClaims)
        {
            if (Guid.TryParse(claim, out var id))
                ids.Add(id);
        }
        return ids;
    }
}
```

---

### 2.3 `ReportBuilderController.cs`
Route: `api/reporting/builder`  
Authorization: `[Authorize(Roles = "Admin,Manager")]`  
Module Permission: `[RequireModuleAccess("module_reporting")]`

```csharp
using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Api.Attributes;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Enums;

namespace TaxSummary.Api.Controllers.Reporting;

[Authorize(Roles = "Admin,Manager")]
[RequireModuleAccess("module_reporting")]
[ApiController]
[Route("api/reporting/builder")]
[Produces("application/json")]
public class ReportBuilderController : ControllerBase
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
    /// اجرای کوئری پویای سفارشی همراه با فیلترها، گروه‌بندی و توابع تجمیعی (SUM, AVG)
    /// </summary>
    [HttpPost("query")]
    [RequireModuleAccess("action_reporting_builder")]
    [ProducesResponseType(typeof(DynamicReportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DynamicReportResultDto>> ExecuteDynamicQuery(
        [FromBody] DynamicReportQueryRequestDto request,
        CancellationToken ct)
    {
        var userAssignedOffices = GetUserAssignedOfficeIds();
        var result = await _builderEngine.ExecuteDynamicQueryAsync(request, userAssignedOffices, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// صدور مستقیم نتیجه کوئری پویا در قالب اکسل راست به چپ با فرمول
    /// </summary>
    [HttpPost("export/excel")]
    [RequireModuleAccess("action_reporting_export")]
    [Produces("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")]
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

    private List<Guid>? GetUserAssignedOfficeIds()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        if (role == "Admin")
            return null;

        var officeClaims = User.FindAll("office_id").Select(c => c.Value).ToList();
        var ids = new List<Guid>();
        foreach (var claim in officeClaims)
        {
            if (Guid.TryParse(claim, out var id))
                ids.Add(id);
        }
        return ids;
    }
}
```

---

### 2.4 `SavedReportsController.cs`
Route: `api/reporting/saved`  
Authorization: `[Authorize]`  
Module Permission: `[RequireModuleAccess("module_reporting")]`

```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Api.Attributes;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;

namespace TaxSummary.Api.Controllers.Reporting;

[Authorize]
[RequireModuleAccess("module_reporting")]
[ApiController]
[Route("api/reporting/saved")]
[Produces("application/json")]
public class SavedReportsController : ControllerBase
{
    private readonly ISavedReportsService _savedReportsService;

    public SavedReportsController(ISavedReportsService savedReportsService)
    {
        _savedReportsService = savedReportsService ?? throw new ArgumentNullException(nameof(savedReportsService));
    }

    /// <summary>
    /// دریافت الگوها و پیش‌تنظیم‌های ذخیره‌شده کاربر جاری و الگوهای به اشتراک گذاشته شده در اداره
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<SavedReportPresetDto>), StatusCodes.Status200OK)]
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

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
```

---

## 3. Standard HTTP Status Codes & Error Envelope

All responses follow the project's consistent JSON structure:
- **Success Responses**: Return the typed payload (`200 OK` or `201 Created`).
- **Failure Responses**: Return `400 Bad Request` or `404 Not Found` with a Persian error message object:
  ```json
  {
    "error": "بازه تاریخی معتبر نمی‌باشد. فرمت مجاز: ۱۴۰۴/۰۷/۰۱"
  }
  ```
- **Unauthorized (`401`)**: Returned automatically by ASP.NET Core JWT authentication middleware when token is missing or expired.
- **Forbidden (`403`)**: Returned by `[Authorize(Roles = "...")]` or `[RequireModuleAccess]` when user role does not possess permissions for that reporting sub-action.

---

## 4. File Download Protocol (Excel & PDF)

For `/export/excel` and `/export/pdf` endpoints:
1. `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (or `application/pdf`).
2. `Content-Disposition`: `attachment; filename="<Code>_<Timestamp>.xlsx"`.
3. Client browser initiates direct file download with no intermediate disk file leaks on server.
