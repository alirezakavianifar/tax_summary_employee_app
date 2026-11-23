using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services.Reporting;

/// <summary>
/// سرویس تولید فایل اکسل راستی‌آزمایی ارزیابی عملکرد و رتبه‌بندی حسابرسان
/// شامل دو برگه داده‌های خام رسیدگی و رتبه‌بندی محاسباتی با فرمول‌های اکسل
/// </summary>
public interface IAuditorVerificationExcelService
{
    /// <summary>
    /// تولید فایل اکسل دوبرگه‌ای راستی‌آزمایی رتبه‌بندی حسابرسان بر اساس داده‌های موجود (پایگاه داده سنیم یا گزارش اکسل)
    /// </summary>
    Task<Result<byte[]>> ExportVerificationExcelAsync(
        int? fiscalYear,
        string? officeName,
        string? reportCode,
        CancellationToken ct = default);

    /// <summary>
    /// پردازش مستقیم جریان فایل اکسل خام سنیم و تولید درلحظه فایل اکسل راستی‌آزمایی (داده‌های خام + فرمول‌های رتبه‌بندی)
    /// </summary>
    Task<Result<byte[]>> GenerateVerificationExcelFromStreamAsync(
        Stream excelStream,
        string fileName,
        CancellationToken ct = default);
}
