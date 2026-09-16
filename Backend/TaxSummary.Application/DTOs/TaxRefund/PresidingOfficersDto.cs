namespace TaxSummary.Application.DTOs.TaxRefund;

/// <summary>
/// DTO representing the presiding officers for a tax refund case
/// مشخصات مقامات مسئول پرونده استرداد مالیاتی
/// </summary>
public class PresidingOfficersDto
{
    /// <summary>
    /// مدیر کل امور مالیاتی استان (مشترک در سطح کل استان)
    /// </summary>
    public string DirectorGeneralName { get; set; } = string.Empty;

    /// <summary>
    /// رئیس امور مالیاتی / رئیس اداره (سطح ۱ سازمانی)
    /// </summary>
    public string AdministrationHeadName { get; set; } = string.Empty;

    /// <summary>
    /// رئیس گروه مالیاتی (سطح ۲ سازمانی)
    /// </summary>
    public string GroupHeadName { get; set; } = string.Empty;

    /// <summary>
    /// کارشناس ارشد مالیاتی (سطح ۳ سازمانی / ثبت‌کننده پرونده)
    /// </summary>
    public string SeniorAuditorName { get; set; } = string.Empty;

    /// <summary>
    /// کد واحد مالیاتی استخراج‌شده بر اساس کاربر در صورت خالی بودن
    /// </summary>
    public string? InferredTaxUnitCode { get; set; }
}
