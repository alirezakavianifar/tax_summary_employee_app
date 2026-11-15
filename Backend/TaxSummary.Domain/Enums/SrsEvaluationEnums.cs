namespace TaxSummary.Domain.Enums;

/// <summary>
/// هفت دسته‌بندی موضوعی پرونده‌های مالیاتی بر اساس دستورالعمل ارزیابی عملکرد
/// </summary>
public enum TaxCaseCategory
{
    /// <summary>
    /// اشخاص حقوقی - ۳۰۰ پرونده مهم
    /// </summary>
    Corporate300 = 1,

    /// <summary>
    /// سایر اشخاص حقوقی
    /// </summary>
    CorporateOther = 2,

    /// <summary>
    /// ارزش افزوده ۳۰۰ پرونده حقوقی
    /// </summary>
    Vat300 = 3,

    /// <summary>
    /// سایر ارزش افزوده حقوقی
    /// </summary>
    VatLegalOther = 4,

    /// <summary>
    /// مالیات بر درآمد مشاغل (اشخاص حقیقی)
    /// </summary>
    BusinessIncome = 5,

    /// <summary>
    /// ارزش افزوده انفرادی (اشخاص حقیقی)
    /// </summary>
    VatIndividual = 6,

    /// <summary>
    /// مالیات بر مستغلات و املاک
    /// </summary>
    PropertyTax = 7
}

/// <summary>
/// هشت شاخص ارزیابی عملکرد کارکنان رسیدگی مالیاتی (FR-01 تا FR-08)
/// </summary>
public enum SrsPerformanceIndicator
{
    /// <summary>
    /// FR-01: تعداد برگ تشخیص صادره
    /// </summary>
    AssessmentsIssued = 1,

    /// <summary>
    /// FR-02: تعداد پرونده‌های قطعی شده
    /// </summary>
    FinalizedAssessments = 2,

    /// <summary>
    /// FR-03: تمکین و قبولی مودی
    /// </summary>
    TaxpayerAcceptance = 3,

    /// <summary>
    /// FR-04: توافقات موضوع ماده ۲۳۸ قانون مالیات‌های مستقیم
    /// </summary>
    Article238Agreements = 4,

    /// <summary>
    /// FR-05: رشد مالیات تشخیصی نسبت به ابرازی (بیش از ۷۰۰٪ حقوقی / بیش از ۵۰۰٪ حقیقی)
    /// </summary>
    AssessmentGrowth = 5,

    /// <summary>
    /// FR-06: تعدیل مالیات قطعی نسبت به تشخیصی (بیش از ۱۵٪ - امتیاز منفی)
    /// </summary>
    TaxAdjustment = 6,

    /// <summary>
    /// FR-07: سرعت صدور برگ تشخیص از تاریخ مرحله ۲
    /// </summary>
    IssuanceSpeed = 7,

    /// <summary>
    /// FR-08: سرعت قطعیت پرونده از تاریخ مرحله ۲
    /// </summary>
    FinalizationSpeed = 8
}

