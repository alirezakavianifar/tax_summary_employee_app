namespace TaxSummary.Domain.Enums;

/// <summary>
/// قلمرو سازمانی و منبع پایگاه داده گزارش
/// </summary>
public enum ReportDomainSource
{
    HumanResources = 1,     // پرسنل، ارزیابی شایستگی، سوابق اداری، کشف فرار مالیاتی
    PayrollAndWelfare = 2,  // حقوق و اضافه کار، سرانه رفاهی، سقف ۱۲۰ ساعت کارگری، بودجه ادارات
    TaxRefunds = 3,         // پرونده‌های استرداد مواد ۲۴۲ و ۲۴۳ ق.م.م، قبوض پرداختی، خسارت تاخیر
    CrossSystem = 4,        // تلفیقی و فرابخشی (مقایسه بهره‌وری، اضافه کار و عملکرد شعب)
    TaxAudit = 5,           // رسیدگی و حسابرسی مالیاتی سنیم (اظهارنامه‌ها، برگ تشخیص، قطعی، فواصل رسیدگی)
    CustomUploadedDataset = 6 // مجموعه‌داده‌های بارگذاری شده از اکسل و گزارش‌های اختصاصی پویا
}

/// <summary>
/// سطح مدیریتی و هدف گزارش
/// </summary>
public enum ReportCategory
{
    ExecutiveKpi = 1,       // شاخص‌های کلیدی عملکرد و داشبورد مدیر کل و معاونین
    Operational = 2,        // گزارش‌های اجرایی روزانه و پیگیری کارتابل‌ها
    Financial = 3,          // تحلیل مصرف بودجه، انحرافات و تعهدات مالی
    ComplianceAndAudit = 4  // نظارت، کنترل سقف‌های قانونی، گلوگاه‌ها و ممیزی رویدادها
}

/// <summary>
/// قالب ساختاری خروجی گزارش
/// </summary>
public enum ReportType
{
    Tabular = 1,            // جدول مشروح رکوردها با امکان مرتب‌سازی و صفحه‌بندی
    Pivot = 2,              // ماتریس تجمیعی با گروه‌بندی چندسطحی (مانند به تفکیک اداره و ماه)
    SummaryKpi = 3          // کارت شاخص تک‌عددی یا مقایسه‌ای با دوره قبل
}

/// <summary>
/// توابع تجمیع محاسباتی
/// </summary>
public enum AggregationType
{
    Count = 1,
    Sum = 2,
    Average = 3,
    Min = 4,
    Max = 5
}

/// <summary>
/// قالب‌های مجاز صدور خروجی
/// </summary>
public enum ExportFormat
{
    Excel = 1,  // مایکروسافت اکسل چندبرگی استاندارد با فونت راست به چپ و فرمول
    Pdf = 2,    // پی‌دی‌اف رسمی قطع A4 با نشان اداری و کادر امضا
    Csv = 3     // فایل متن جداشده با ویرگول مناسب تحلیل آماری
}

/// <summary>
/// دسته‌بندی شاخص‌های ارزیابی عملکرد حسابرسان
/// </summary>
public enum AuditorMetricCategory
{
    Quality = 1,      // کیفیت و استحکام تشخیص
    Financial = 2,    // مالی و کشف ماخذ
    Speed = 3,        // سرعت و مواعد قانونی
    Productivity = 4  // بهره‌وری و ظرفیت رسیدگی
}

/// <summary>
/// نحوه محاسبه و فرمول شاخص ارزیابی حسابرس
/// </summary>
public enum AuditorMetricFormulaType
{
    Ratio = 1,        // نسبت PrimaryField / SecondaryField
    Difference = 2,   // اختلاف PrimaryField - SecondaryField
    Average = 3,      // میانگین ستون
    Count = 4,        // تعداد رکوردهای منطبق
    Percentage = 5,   // درصد وقوع شرط نسبت به کل پرونده‌ها
    Custom = 6        // فرمول ترکیبی
}

