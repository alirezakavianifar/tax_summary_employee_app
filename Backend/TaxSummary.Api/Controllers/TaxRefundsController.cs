using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaxSummary.Api.Attributes;
using TaxSummary.Application.DTOs.TaxRefund;
using TaxSummary.Application.Services;

namespace TaxSummary.Api.Controllers;

/// <summary>
/// RESTful API Controller for Tax Refund Cases (Articles 242 and 243 Direct Taxes Act)
/// سیستم استرداد مالیات اضافه دریافتی (موضوع مواد ۲۴۲ و ۲۴۳ ق.م.م)
/// </summary>
[Authorize]
[RequireModuleAccess("module_tax_refund")]
[ApiController]
[Route("api/tax-refunds")]
[Produces("application/json")]
[EnableRateLimiting("GeneralPolicy")]
public class TaxRefundsController : ControllerBase
{
    private readonly ITaxRefundService _refundService;
    private readonly ITaxRefundExcelService _excelService;
    private readonly ILogger<TaxRefundsController> _logger;

    public TaxRefundsController(
        ITaxRefundService refundService,
        ITaxRefundExcelService excelService,
        ILogger<TaxRefundsController> logger)
    {
        _refundService = refundService ?? throw new ArgumentNullException(nameof(refundService));
        _excelService = excelService ?? throw new ArgumentNullException(nameof(excelService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Interactive real-time sandbox calculation without database persistence
    /// محاسبه برخط و آزمایشی استرداد مالیات بدون ذخیره‌سازی در پایگاه داده
    /// </summary>
    [HttpPost("calculate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(RefundCalculationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RefundCalculationResultDto>> CalculateSandbox(
        [FromBody] CalculateRefundRequestDto request,
        CancellationToken ct)
    {
        if (request == null)
            return BadRequest(new { error = "اطلاعات درخواست محاسبه الزامی است" });

        var result = await _refundService.CalculateSandboxAsync(request, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Retrieve paginated or filtered list of tax refund cases
    /// دریافت فهرست پرونده‌های استرداد همراه با فیلتر سال، منبع، وضعیت و جستجو
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TaxRefundCaseSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TaxRefundCaseSummaryDto>>> GetCases(
        [FromQuery] TaxRefundFilterDto filter,
        CancellationToken ct)
    {
        var result = await _refundService.GetCasesAsync(filter, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Retrieve full tax refund case aggregate details by ID
    /// دریافت اطلاعات کامل پرونده استرداد شامل قبوض، استعلامات و محاسبات
    /// </summary>
    [HttpGet("{id:guid}", Name = "GetTaxRefundCaseById")]
    [ProducesResponseType(typeof(TaxRefundCaseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaxRefundCaseDto>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _refundService.GetByIdAsync(id, ct);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Retrieve tax refund case aggregate by unique case tracking number
    /// دریافت پرونده استرداد بر اساس شماره پیگیری یکتای پرونده
    /// </summary>
    [HttpGet("tracking/{trackingNumber}")]
    [ProducesResponseType(typeof(TaxRefundCaseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaxRefundCaseDto>> GetByTrackingNumber(string trackingNumber, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(trackingNumber))
            return BadRequest(new { error = "شماره پیگیری نمی‌تواند خالی باشد" });

        var result = await _refundService.GetByTrackingNumberAsync(trackingNumber, ct);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Create a new tax refund case draft
    /// ایجاد پیش‌نویس پرونده جدید استرداد مالیات
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TaxRefundCaseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TaxRefundCaseDto>> Create(
        [FromBody] CreateTaxRefundCaseDto dto,
        CancellationToken ct)
    {
        if (dto == null)
            return BadRequest(new { error = "اطلاعات ورودی الزامی است" });

        var userId = GetCurrentUserId();
        var createResult = await _refundService.CreateAsync(dto, userId, ct);
        if (createResult.IsFailure)
            return BadRequest(new { error = createResult.Error });

        var caseResult = await _refundService.GetByIdAsync(createResult.Value, ct);
        if (caseResult.IsFailure)
            return CreatedAtAction(nameof(GetById), new { id = createResult.Value }, new { id = createResult.Value });

        return CreatedAtAction(nameof(GetById), new { id = createResult.Value }, caseResult.Value);
    }

    /// <summary>
    /// Update general taxpayer and case metadata
    /// ویرایش مشخصات عمومی و هویتی مودی در پرونده استرداد
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateTaxRefundCaseDto dto,
        CancellationToken ct)
    {
        if (dto == null)
            return BadRequest(new { error = "اطلاعات ورودی الزامی است" });

        var result = await _refundService.UpdateAsync(id, dto, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    /// <summary>
    /// Delete a tax refund case
    /// حذف پرونده استرداد (صرفاً برای پرونده‌های پیش‌نویس و رد شده)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await _refundService.DeleteAsync(id, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    /// <summary>
    /// Update tax assessment and finalization parameters
    /// ویرایش مشخصات قطعی‌سازی و مبالغ تشخیصی مالیات
    /// </summary>
    [HttpPut("{id:guid}/assessment")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateAssessment(
        Guid id,
        [FromBody] UpdateTaxAssessmentInfoDto dto,
        CancellationToken ct)
    {
        if (dto == null)
            return BadRequest(new { error = "اطلاعات ورودی الزامی است" });

        var result = await _refundService.UpdateAssessmentAsync(id, dto, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    /// <summary>
    /// Update refund breakdown items (stamp duty, penalties, delay damages)
    /// ویرایش شرح و اقلام مبالغ قابل استرداد
    /// </summary>
    [HttpPut("{id:guid}/breakdown")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateBreakdown(
        Guid id,
        [FromBody] UpdateRefundBreakdownDto dto,
        CancellationToken ct)
    {
        if (dto == null)
            return BadRequest(new { error = "اطلاعات ورودی الزامی است" });

        var result = await _refundService.UpdateBreakdownAsync(id, dto, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    /// <summary>
    /// Add a paid tax receipt to Table A
    /// افزودن قبض پرداختی به جدول (الف)
    /// </summary>
    [HttpPost("{id:guid}/receipts")]
    [ProducesResponseType(typeof(TaxRefundReceiptDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TaxRefundReceiptDto>> AddReceipt(
        Guid id,
        [FromBody] CreateTaxRefundReceiptDto dto,
        CancellationToken ct)
    {
        if (dto == null)
            return BadRequest(new { error = "اطلاعات قبض الزامی است" });

        var result = await _refundService.AddReceiptAsync(id, dto, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id }, result.Value);
    }

    /// <summary>
    /// Remove a paid tax receipt from Table A
    /// حذف قبض پرداختی از جدول (الف)
    /// </summary>
    [HttpDelete("{id:guid}/receipts/{receiptId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoveReceipt(Guid id, Guid receiptId, CancellationToken ct)
    {
        var result = await _refundService.RemoveReceiptAsync(id, receiptId, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    /// <summary>
    /// Add a refundable receipt allocation to Table B
    /// تخصیص مبلغ استردادی به قبض در جدول (ب)
    /// </summary>
    [HttpPost("{id:guid}/allocations")]
    [ProducesResponseType(typeof(RefundableReceiptAllocationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RefundableReceiptAllocationDto>> AddAllocation(
        Guid id,
        [FromBody] CreateRefundableReceiptAllocationDto dto,
        CancellationToken ct)
    {
        if (dto == null)
            return BadRequest(new { error = "اطلاعات تخصیص الزامی است" });

        var result = await _refundService.AddAllocationAsync(id, dto, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id }, result.Value);
    }

    /// <summary>
    /// Remove a refundable receipt allocation from Table B
    /// حذف تخصیص از جدول (ب)
    /// </summary>
    [HttpDelete("{id:guid}/allocations/{allocationId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoveAllocation(Guid id, Guid allocationId, CancellationToken ct)
    {
        var result = await _refundService.RemoveAllocationAsync(id, allocationId, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    /// <summary>
    /// Add an official letter or inter-departmental debt inquiry
    /// ثبت نامه اداری یا پاسخ استعلام عدم بدهی
    /// </summary>
    [HttpPost("{id:guid}/letters")]
    [ProducesResponseType(typeof(TaxRefundLetterDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TaxRefundLetterDto>> AddLetter(
        Guid id,
        [FromBody] CreateTaxRefundLetterDto dto,
        CancellationToken ct)
    {
        if (dto == null)
            return BadRequest(new { error = "اطلاعات نامه الزامی است" });

        var result = await _refundService.AddLetterAsync(id, dto, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id }, result.Value);
    }

    /// <summary>
    /// Remove an official letter or inquiry
    /// حذف نامه اداری یا استعلام
    /// </summary>
    [HttpDelete("{id:guid}/letters/{letterId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RemoveLetter(Guid id, Guid letterId, CancellationToken ct)
    {
        var result = await _refundService.RemoveLetterAsync(id, letterId, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    /// <summary>
    /// Transition case workflow status (Audited, GroupHeadApproved, AdministrationHeadApproved, TreasuryDisbursed)
    /// تغییر و تایید وضعیت پرونده در گردش کار سازمانی
    /// </summary>
    [HttpPost("{id:guid}/approvals")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TransitionStatus(
        Guid id,
        [FromBody] TransitionStatusDto dto,
        CancellationToken ct)
    {
        if (dto == null)
            return BadRequest(new { error = "اطلاعات گردش کار الزامی است" });

        var userId = GetCurrentUserId();
        var actorName = GetCurrentUserName();
        var actorRole = GetCurrentUserRole();

        var result = await _refundService.TransitionStatusAsync(id, dto, userId, actorName, actorRole, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = "وضعیت پرونده با موفقیت به روزرسانی گردید", status = dto.NewStatus });
    }

    /// <summary>
    /// Generate pre-formatted Persian view-model for any of the 8 output forms (cheklist, form1 - form7)
    /// دریافت اطلاعات قالب‌بندی شده برای چاپ هر یک از فرم‌های ۸ گانه
    /// </summary>
    [HttpGet("{id:guid}/print/{formType}")]
    [ProducesResponseType(typeof(PrintableDocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PrintableDocumentDto>> GetPrintableDocument(
        Guid id,
        string formType,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(formType))
            return BadRequest(new { error = "نوع فرم چاپی الزامی است" });

        var result = await _refundService.GetPrintableDocumentAsync(id, formType, ct);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Import a complete tax refund case from an uploaded Excel (.xlsm or .xlsx) workbook
    /// بارگذاری و ثبت پرونده استرداد از فایل اکسل (الگوی دلفی)
    /// </summary>
    [HttpPost("import-excel")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(TaxRefundCaseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TaxRefundCaseDto>> ImportExcel(
        IFormFile file,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "لطفاً فایل اکسل استرداد را انتخاب نمایید" });

        var allowedExts = new[] { ".xlsm", ".xlsx" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExts.Contains(ext))
            return BadRequest(new { error = "صرفاً فایل‌های با پسوند .xlsm یا .xlsx مجاز می‌باشند" });

        var userId = GetCurrentUserId();
        using var stream = file.OpenReadStream();
        var result = await _excelService.ImportFromExcelAsync(stream, userId, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        var caseResult = await _refundService.GetByIdAsync(result.Value, ct);
        if (caseResult.IsFailure)
            return CreatedAtAction(nameof(GetById), new { id = result.Value }, new { id = result.Value });

        return CreatedAtAction(nameof(GetById), new { id = result.Value }, caseResult.Value);
    }

    /// <summary>
    /// Export the tax refund case as an authentic 9-sheet formula-wired Excel workbook
    /// دریافت فایل خروجی اکسل ۹ برگه‌ای منطبق با الگوی استاندارد
    /// </summary>
    [HttpGet("{id:guid}/export-excel")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExportExcel(Guid id, CancellationToken ct)
    {
        var result = await _excelService.ExportToExcelAsync(id, ct);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        var filename = $"tax_refund_{id}_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
        return File(result.Value!, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename);
    }

    /// <summary>
    /// Upload and attach an official PDF document to a tax refund case
    /// بارگذاری و پیوست سند رسمی PDF به پرونده استرداد
    /// </summary>
    [HttpPost("{id:guid}/documents")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(TaxRefundDocumentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TaxRefundDocumentDto>> UploadDocument(
        Guid id,
        IFormFile file,
        [FromForm] UploadTaxRefundDocumentDto dto,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "لطفاً فایل PDF سند را انتخاب نمایید" });

        if (dto == null)
            dto = new UploadTaxRefundDocumentDto { Title = Path.GetFileNameWithoutExtension(file.FileName) };

        var userId = GetCurrentUserId();
        var userName = GetCurrentUserName();

        var result = await _refundService.UploadDocumentAsync(id, file, dto, userId, userName, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetDocuments), new { id }, result.Value);
    }

    /// <summary>
    /// Retrieve all attached PDF documents for a tax refund case
    /// دریافت فهرست اسناد و مدارک پیوست پرونده استرداد
    /// </summary>
    [HttpGet("{id:guid}/documents")]
    [ProducesResponseType(typeof(IEnumerable<TaxRefundDocumentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<TaxRefundDocumentDto>>> GetDocuments(
        Guid id,
        CancellationToken ct)
    {
        var result = await _refundService.GetDocumentsAsync(id, ct);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Stream PDF document for inline in-browser / embedded viewing
    /// مشاهده مستقیم و درون‌برنامه‌ای فایل PDF سند پیوست
    /// </summary>
    [HttpGet("{id:guid}/documents/{documentId:guid}/view")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ViewDocument(
        Guid id,
        Guid documentId,
        CancellationToken ct)
    {
        var result = await _refundService.GetDocumentStreamAsync(id, documentId, ct);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        Response.Headers.Append("Content-Disposition", "inline");
        return File(result.Value.Stream, result.Value.ContentType);
    }

    /// <summary>
    /// Download PDF document as an attachment
    /// دانلود مستقیم فایل PDF سند پیوست
    /// </summary>
    [HttpGet("{id:guid}/documents/{documentId:guid}/download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadDocument(
        Guid id,
        Guid documentId,
        CancellationToken ct)
    {
        var result = await _refundService.GetDocumentStreamAsync(id, documentId, ct);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return File(result.Value.Stream, result.Value.ContentType, result.Value.FileName);
    }

    /// <summary>
    /// Delete an attached PDF document
    /// حذف سند پیوست از پرونده استرداد
    /// </summary>
    [HttpDelete("{id:guid}/documents/{documentId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteDocument(
        Guid id,
        Guid documentId,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await _refundService.DeleteDocumentAsync(id, documentId, userId, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    /// <summary>
    /// Get the official Justification Report (گزارش توجیهی)
    /// دریافت اطلاعات گزارش توجیهی پرونده
    /// </summary>
    [HttpGet("{id:guid}/justification-report")]
    [ProducesResponseType(typeof(JustificationReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JustificationReportDto>> GetJustificationReport(Guid id, CancellationToken ct)
    {
        var result = await _refundService.GetJustificationReportAsync(id, ct);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Auto-generate standard legal template draft for Justification Report
    /// تولید خودکار پیش‌نویس قانونی گزارش توجیهی
    /// </summary>
    [HttpGet("{id:guid}/justification-report/default-draft")]
    [ProducesResponseType(typeof(JustificationReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JustificationReportDto>> GetDefaultJustificationReportDraft(Guid id, CancellationToken ct)
    {
        var result = await _refundService.GenerateDefaultDraftAsync(id, ct);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Save or update Justification Report draft
    /// ثبت و ویرایش پیش‌نویس گزارش توجیهی
    /// </summary>
    [HttpPut("{id:guid}/justification-report")]
    [ProducesResponseType(typeof(JustificationReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<JustificationReportDto>> SaveJustificationReport(
        Guid id,
        [FromBody] UpdateJustificationReportDto dto,
        CancellationToken ct)
    {
        if (dto == null)
            return BadRequest(new { error = "اطلاعات گزارش توجیهی الزامی است" });

        var userId = GetCurrentUserId();
        var userName = GetCurrentUserName();

        var result = await _refundService.SaveJustificationReportAsync(id, dto, userId, userName, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Finalize Justification Report and advance case status to Audited
    /// تایید و ثبت نهایی گزارش توجیهی توسط کارشناس ارشد
    /// </summary>
    [HttpPost("{id:guid}/justification-report/finalize")]
    [ProducesResponseType(typeof(JustificationReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<JustificationReportDto>> FinalizeJustificationReport(
        Guid id,
        [FromBody] FinalizeJustificationReportDto dto,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var userName = GetCurrentUserName();

        var result = await _refundService.FinalizeJustificationReportAsync(id, dto ?? new FinalizeJustificationReportDto(), userId, userName, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub") ?? User.FindFirst("id");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : Guid.Empty;
    }

    private string GetCurrentUserName()
    {
        return User.FindFirst(ClaimTypes.Name)?.Value ??
               User.FindFirst(ClaimTypes.GivenName)?.Value ??
               User.Identity?.Name ??
               "کارشناس سامانه";
    }

    private string GetCurrentUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? "کارشناس ارشد مالیاتی";
    }
}
