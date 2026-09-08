using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.DTOs.TaxRefund;

/// <summary>
/// Request DTO for uploading a new PDF document attached to a Tax Refund Case
/// مدل ورودی برای بارگذاری سند پیوست پرونده استرداد
/// </summary>
public class UploadTaxRefundDocumentDto
{
    /// <summary>
    /// عنوان سند (مثال: درخواست کتبی مودی، فیش واریزی بانک ملی، برگ تشخیص قطعی)
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// نوع و طبقه‌بندی سند پیوست
    /// </summary>
    public TaxRefundDocumentType DocumentType { get; set; }

    /// <summary>
    /// توضیحات یا یادداشت‌های تکمیلی اختیاری
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// شناسه قبض مربوطه در جدول (الف) در صورت ارتباط مستقیم با یک قبض
    /// </summary>
    public Guid? RelatedReceiptId { get; set; }

    /// <summary>
    /// شناسه نامه اداری یا استعلام مربوطه در جدول استعلامات
    /// </summary>
    public Guid? RelatedLetterId { get; set; }
}
