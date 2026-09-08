namespace TaxSummary.Domain.Entities;

/// <summary>
/// Owned complex type representing the Senior Auditor's official Justification Report
/// (گزارش توجیهی استرداد مالیات اضافه دریافتی - موضوع مواد ۲۴۲ و ۲۴۳ ق.م.م)
/// </summary>
public class JustificationReportInfo
{
    /// <summary>
    /// شماره رسمی گزارش توجیهی در دبیرخانه / واحد مالیاتی
    /// </summary>
    public string ReportNumber { get; private set; } = string.Empty;

    /// <summary>
    /// تاریخ تنظیم گزارش توجیهی به شمسی
    /// </summary>
    public string ReportDateJalali { get; private set; } = string.Empty;

    /// <summary>
    /// بند ۱ و ۲: شرح رسیدگی، وضعیت اظهارنامه، دفاتر و سوابق مالیاتی مودی
    /// </summary>
    public string AuditExaminationFindings { get; private set; } = string.Empty;

    /// <summary>
    /// بند ۳: مبانی قانونی استرداد و استناد به مواد ۲۴۲ و ۲۴۳ قانون مالیات‌های مستقیم
    /// </summary>
    public string LegalGroundsAndReasoning { get; private set; } = string.Empty;

    /// <summary>
    /// بند ۴: خلاصه و شرح نتایج استعلامات بدهی از وصول و اجرا، حقوق، ارزش افزوده
    /// </summary>
    public string InquiriesAndDebtClearanceSummary { get; private set; } = string.Empty;

    /// <summary>
    /// بند ۵: تایید اصالت قبوض پرداختی جدول الف، تطبیق با سوابق بانکی و احراز عدم استرداد قبلی
    /// </summary>
    public string ReceiptsVerificationNotes { get; private set; } = string.Empty;

    /// <summary>
    /// جمع‌بندی و نتیجه‌گیری نهایی کارشناس ارشد و پیشنهاد استرداد
    /// </summary>
    public string AuditorConclusion { get; private set; } = string.Empty;

    /// <summary>
    /// مبلغ خالص پیشنهادی جهت استرداد (به ریال)
    /// </summary>
    public decimal RecommendedRefundAmount { get; private set; }

    /// <summary>
    /// تاریخ ثبت امضای کارشناس ارشد
    /// </summary>
    public string? AuditorSignatureDate { get; private set; }

    /// <summary>
    /// شناسه کارشناس ارشد مالیاتی تنظیم‌کننده
    /// </summary>
    public Guid? AuditorUserId { get; private set; }

    /// <summary>
    /// نام کارشناس ارشد مالیاتی تنظیم‌کننده
    /// </summary>
    public string? AuditorUserName { get; private set; }

    /// <summary>
    /// وضعیت تایید و قطعیت گزارش توجیهی
    /// </summary>
    public bool IsFinalized { get; private set; }

    /// <summary>
    /// زمان تایید نهایی گزارش
    /// </summary>
    public DateTime? FinalizedAt { get; private set; }

    /// <summary>
    /// متن اظهارنظر و تایید رئیس گروه مالیاتی (بخش دوم گزارش)
    /// </summary>
    public string? GroupHeadOpinionText { get; private set; }

    /// <summary>
    /// متن دستور و تایید رئیس امور مالیاتی (بخش دوم گزارش)
    /// </summary>
    public string? AdministrationHeadApprovalText { get; private set; }

    // Parameterless constructor for EF Core
    public JustificationReportInfo() { }

    public static JustificationReportInfo Create(
        string reportNumber,
        string reportDateJalali,
        string auditExaminationFindings,
        string legalGroundsAndReasoning,
        string inquiriesAndDebtClearanceSummary,
        string receiptsVerificationNotes,
        string auditorConclusion,
        decimal recommendedRefundAmount,
        string? auditorSignatureDate = null,
        Guid? auditorUserId = null,
        string? auditorUserName = null,
        bool isFinalized = false,
        DateTime? finalizedAt = null,
        string? groupHeadOpinionText = null,
        string? administrationHeadApprovalText = null)
    {
        return new JustificationReportInfo
        {
            ReportNumber = reportNumber?.Trim() ?? string.Empty,
            ReportDateJalali = reportDateJalali?.Trim() ?? string.Empty,
            AuditExaminationFindings = auditExaminationFindings?.Trim() ?? string.Empty,
            LegalGroundsAndReasoning = legalGroundsAndReasoning?.Trim() ?? string.Empty,
            InquiriesAndDebtClearanceSummary = inquiriesAndDebtClearanceSummary?.Trim() ?? string.Empty,
            ReceiptsVerificationNotes = receiptsVerificationNotes?.Trim() ?? string.Empty,
            AuditorConclusion = auditorConclusion?.Trim() ?? string.Empty,
            RecommendedRefundAmount = Math.Max(0, recommendedRefundAmount),
            AuditorSignatureDate = auditorSignatureDate?.Trim(),
            AuditorUserId = auditorUserId,
            AuditorUserName = auditorUserName?.Trim(),
            IsFinalized = isFinalized,
            FinalizedAt = finalizedAt,
            GroupHeadOpinionText = groupHeadOpinionText?.Trim(),
            AdministrationHeadApprovalText = administrationHeadApprovalText?.Trim()
        };
    }

    public void Finalize(Guid auditorUserId, string auditorName, string signatureDateJalali)
    {
        IsFinalized = true;
        FinalizedAt = DateTime.UtcNow;
        AuditorUserId = auditorUserId;
        AuditorUserName = auditorName.Trim();
        AuditorSignatureDate = signatureDateJalali.Trim();
    }
}
