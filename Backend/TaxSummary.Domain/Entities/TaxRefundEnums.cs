namespace TaxSummary.Domain.Entities;

/// <summary>
/// Source of tax liability under the Iranian Tax Code
/// </summary>
public enum TaxSourceType
{
    /// <summary>
    /// عملکرد شرکت‌ها - Corporate Income Tax
    /// </summary>
    CorporateIncome = 1,

    /// <summary>
    /// عملکرد مشاغل - Business / Individual Income Tax
    /// </summary>
    PersonalBusiness = 2,

    /// <summary>
    /// مالیات بر حقوق - Salary / Payroll Tax
    /// </summary>
    SalaryPayroll = 3,

    /// <summary>
    /// مالیات بر ارزش افزوده - Value-Added Tax (VAT)
    /// </summary>
    ValueAddedTax = 4,

    /// <summary>
    /// مالیات بر درآمد اجاره املاک - Real Estate Rental Tax
    /// </summary>
    PropertyRental = 5,

    /// <summary>
    /// نقل و انتقال املاک - Real Estate Transfer Tax
    /// </summary>
    PropertyTransfer = 6,

    /// <summary>
    /// مالیات بر خودرو - Vehicle Tax
    /// </summary>
    Vehicles = 7
}

/// <summary>
/// Method by which the tax assessment was finalized
/// نحوه قطعی شدن پرونده مالیاتی
/// </summary>
public enum FinalizationMethod
{
    /// <summary>
    /// تایید اظهارنامه تسلیمی
    /// </summary>
    ReturnAccepted = 1,

    /// <summary>
    /// رسیدگی به دفاتر و اسناد و مدارک
    /// </summary>
    AuditBooks = 2,

    /// <summary>
    /// علی‌الراس
    /// </summary>
    AliRas = 3,

    /// <summary>
    /// معافیت مالیاتی
    /// </summary>
    TaxExemption = 4,

    /// <summary>
    /// قبول زیان
    /// </summary>
    LossAccepted = 5
}

/// <summary>
/// Lifecycle status of a Tax Refund case
/// وضعیت پرونده استرداد مالیاتی
/// </summary>
public enum RefundCaseStatus
{
    /// <summary>
    /// پیش‌نویس
    /// </summary>
    Draft = 0,

    /// <summary>
    /// در انتظار پاسخ استعلامات (وصول و اجرا، حقوق، و ...)
    /// </summary>
    InquiriesPending = 1,

    /// <summary>
    /// گزارش توجیهی توسط کارشناس ارشد تنظیم شده
    /// </summary>
    Audited = 2,

    /// <summary>
    /// تایید شده توسط رئیس گروه مالیاتی
    /// </summary>
    GroupHeadApproved = 3,

    /// <summary>
    /// تایید نهایی و دستور صدور برگ استرداد توسط رئیس امور مالیاتی
    /// </summary>
    AdministrationHeadApproved = 4,

    /// <summary>
    /// پرداخت و استرداد وجه توسط ذیحسابی انجام گردیده است
    /// </summary>
    TreasuryDisbursed = 5,

    /// <summary>
    /// پرونده استرداد رد شده است
    /// </summary>
    Rejected = 6
}

/// <summary>
/// Type of official letter or inter-departmental inquiry in a refund case
/// نوع نامه یا استعلام در پرونده استرداد
/// </summary>
public enum TaxRefundLetterType
{
    /// <summary>
    /// درخواست کتبی استرداد مودی
    /// </summary>
    InboundTaxpayerRequest = 1,

    /// <summary>
    /// استعلام عدم بدهی از اداره وصول و اجرا
    /// </summary>
    CollectionAndEnforcementInquiry = 2,

    /// <summary>
    /// استعلام از واحد مالیات حقوق و تکلیفی
    /// </summary>
    WithholdingTaxInquiry = 3,

    /// <summary>
    /// استعلام از واحد مالیات بر ارث
    /// </summary>
    EstateInquiry = 4,

    /// <summary>
    /// استعلام از واحد مالیات مشاغل
    /// </summary>
    BusinessInquiry = 5,

    /// <summary>
    /// استعلام از واحد مالیات بر ارزش افزوده
    /// </summary>
    VatInquiry = 6,

    /// <summary>
    /// گزارش توجیه استرداد اداره
    /// </summary>
    JustificationReport = 7,

    /// <summary>
    /// فرم تعهد اداره امور مالیاتی (مسئولیت کارشناس ارشد)
    /// </summary>
    OfficeCommitment = 8,

    /// <summary>
    /// برگ استرداد اصلی مالیات اضافه دریافتی (ماده ۲۴۲)
    /// </summary>
    RefundVoucher = 9,

    /// <summary>
    /// نامه ارسالی به ذیحسابی جهت پرداخت وجه
    /// </summary>
    TreasuryLetter = 10
}
