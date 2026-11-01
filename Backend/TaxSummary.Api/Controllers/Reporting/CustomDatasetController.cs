using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TaxSummary.Api.Attributes;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;

namespace TaxSummary.Api.Controllers.Reporting;

/// <summary>
/// Controller for Dynamic Excel Report Ingestion, Schema Inference, and Report Tweaking
/// </summary>
[Authorize]
[RequireModuleAccess("module_reporting")]
[ApiController]
[Route("api/reporting/custom-datasets")]
[Produces("application/json")]
public class CustomDatasetController : ReportingControllerBase
{
    private readonly ICustomDatasetService _customDatasetService;
    private readonly ILogger<CustomDatasetController> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public CustomDatasetController(
        ICustomDatasetService customDatasetService,
        ILogger<CustomDatasetController> logger)
    {
        _customDatasetService = customDatasetService ?? throw new ArgumentNullException(nameof(customDatasetService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// بررسی ساختار فایل اکسل، استخراج نام برگه‌ها و شناسایی خودکار نوع ستون‌ها جهت پیش‌نمایش
    /// </summary>
    [HttpPost("inspect")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ExcelInspectionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ExcelInspectionResultDto>> InspectExcel(
        IFormFile file,
        [FromQuery] string? sheetName,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "فایل اکسل بارگذاری‌شده خالی است یا انتخاب نشده است." });

        if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase) &&
            !file.FileName.EndsWith(".xls", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { error = "صرفاً فایل‌های با فرمت اکسل (.xlsx, .xls) مجاز هستند." });
        }

        using var stream = file.OpenReadStream();
        var result = await _customDatasetService.InspectExcelStreamAsync(stream, file.FileName, sheetName, 15, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// بارگذاری کامل فایل اکسل، ساخت جدول پایگاه داده اختصاصی، ثبت رکوردها و ایجاد گزارش
    /// </summary>
    [HttpPost("create")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(ReportDefinitionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReportDefinitionDto>> CreateCustomDataset(
        IFormFile file,
        [FromForm] string requestJson,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "فایل اکسل بارگذاری‌شده خالی است یا انتخاب نشده است." });

        if (string.IsNullOrWhiteSpace(requestJson))
            return BadRequest(new { error = "اطلاعات پیکربندی گزارش (requestJson) الزامی است." });

        CreateCustomDatasetRequestDto? request;
        try
        {
            request = JsonSerializer.Deserialize<CreateCustomDatasetRequestDto>(requestJson, JsonOptions);
            if (request == null)
            {
                return BadRequest(new { error = "قالب اطلاعات پیکربندی نامعتبر است." });
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"خطا در خواندن ساختار پیکربندی: {ex.Message}" });
        }

        var userId = GetCurrentUserId();
        using var stream = file.OpenReadStream();
        var result = await _customDatasetService.CreateCustomDatasetAsync(stream, file.FileName, request, userId, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// دریافت پیکربندی کامل ستون‌ها، فیلترها و مشخصات مجموعه داده جهت سفارشی‌سازی
    /// </summary>
    [HttpGet("{reportCode}/config")]
    [ProducesResponseType(typeof(CustomDatasetConfigJsonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomDatasetConfigJsonDto>> GetConfig(
        [FromRoute] string reportCode,
        CancellationToken ct)
    {
        var result = await _customDatasetService.GetCustomDatasetConfigAsync(reportCode, ct);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// ویرایش و سفارشی‌سازی مشخصات گزارش (عناوین فارسی ستون‌ها، نمایش/عدم نمایش، نوع داده، تجمیع و فیلترها)
    /// </summary>
    [HttpPut("{reportCode}/tweak")]
    [ProducesResponseType(typeof(ReportDefinitionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReportDefinitionDto>> TweakReport(
        [FromRoute] string reportCode,
        [FromBody] TweakCustomReportRequestDto request,
        CancellationToken ct)
    {
        var result = await _customDatasetService.TweakCustomReportAsync(reportCode, request, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// افزودن رکوردهای تکمیلی از فایل اکسل جدید به مجموعه داده گزارش موجود
    /// </summary>
    [HttpPost("{reportCode}/append")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AppendRows(
        [FromRoute] string reportCode,
        IFormFile file,
        [FromQuery] string? sheetName,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "فایل اکسل خالی است یا انتخاب نشده است." });

        using var stream = file.OpenReadStream();
        var result = await _customDatasetService.AppendDatasetRowsAsync(reportCode, stream, sheetName, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = $"تعداد {result.Value:N0} رکورد با موفقیت به گزارش افزوده شد.", appendedCount = result.Value });
    }

    /// <summary>
    /// جایگزینی کلیه رکوردهای گزارش موجود با داده‌های فایل اکسل جدید
    /// </summary>
    [HttpPost("{reportCode}/replace")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReplaceRows(
        [FromRoute] string reportCode,
        IFormFile file,
        [FromQuery] string? sheetName,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "فایل اکسل خالی است یا انتخاب نشده است." });

        using var stream = file.OpenReadStream();
        var result = await _customDatasetService.ReplaceDatasetRowsAsync(reportCode, stream, sheetName, ct);

        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = $"داده‌های گزارش با {result.Value:N0} رکورد جدید با موفقیت جایگزین شد.", newCount = result.Value });
    }

    /// <summary>
    /// حذف کامل گزارش و حذف فیزیکی جدول داده مربوطه از پایگاه داده
    /// </summary>
    [HttpDelete("{reportCode}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteReport(
        [FromRoute] string reportCode,
        CancellationToken ct)
    {
        var result = await _customDatasetService.DeleteCustomDatasetAsync(reportCode, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = $"گزارش '{reportCode}' و جدول داده آن با موفقیت حذف گردید." });
    }
}
