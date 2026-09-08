namespace TaxSummary.Domain.Entities;

/// <summary>
/// Category/Type of official supporting PDF document in a Tax Refund Case (Art. 242 & 243)
/// انواع اسناد و مدارک پیوست پرونده استرداد مالیات
/// </summary>
public enum TaxRefundDocumentType
{
    /// <summary>
    /// درخواست کتبی مودی / برگ تقاضای استرداد مالیات
    /// </summary>
    TaxpayerPetition = 1,

    /// <summary>
    /// تصویر فیش یا قبض پرداخت بانکی (قبوض جدول الف)
    /// </summary>
    ReceiptProof = 2,

    /// <summary>
    /// برگ تشخیص یا برگ قطعی مالیات
    /// </summary>
    AssessmentNotice = 3,

    /// <summary>
    /// پاسخ استعلام وصول و اجرا یا استعلام عدم بدهی
    /// </summary>
    InquiryResponse = 4,

    /// <summary>
    /// گزارش توجیهی حسابرسی و تاییدات سه امضا
    /// </summary>
    JustificationReport = 5,

    /// <summary>
    /// فرم تعهد رسمی کارشناس ارشد مالیاتی
    /// </summary>
    OfficeCommitment = 6,

    /// <summary>
    /// رسید پرداخت، حواله یا سند تسویه ذیحسابی
    /// </summary>
    DisbursementReceipt = 7,

    /// <summary>
    /// مدارک هویتی، ثبتی مودی، وکالت‌نامه یا روزنامه رسمی
    /// </summary>
    IdentityProof = 8,

    /// <summary>
    /// سایر مکاتبات، ضمائم و مدارک پیوست
    /// </summary>
    Other = 9,
}
