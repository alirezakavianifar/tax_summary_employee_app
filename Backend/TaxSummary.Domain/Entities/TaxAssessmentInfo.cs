namespace TaxSummary.Domain.Entities;

/// <summary>
/// Details regarding tax declaration submission and assessment finalization
/// فرآیند تسلیم اظهارنامه و قطعی‌سازی پرونده مالیاتی
/// </summary>
public class TaxAssessmentInfo
{
    public bool HasReturnFiled { get; private set; }
    public string? ReturnNumber { get; private set; }
    public string? ReturnDateJalali { get; private set; }
    public FinalizationMethod FinalizationMethod { get; private set; }
    public FinalityStage FinalityStage { get; private set; } = FinalityStage.Tamkin;
    public string? FinalNoticeNumber { get; private set; }
    public string? FinalNoticeDateJalali { get; private set; }

    /// <summary>
    /// درآمد تشخیصی قبل از کسر مالیات
    /// </summary>
    public decimal AssessedIncome { get; private set; }

    /// <summary>
    /// جمع معافیت‌ها و بخشودگی
    /// </summary>
    public decimal Exemptions { get; private set; }

    /// <summary>
    /// مالیات تشخیصی
    /// </summary>
    public decimal AssessedTax { get; private set; }

    /// <summary>
    /// جرایم غیرقابل بخشش
    /// </summary>
    public decimal NonWaivablePenalties { get; private set; }

    /// <summary>
    /// جایزه خوش‌حسابی
    /// </summary>
    public decimal TimelyPaymentBonus { get; private set; }

    /// <summary>
    /// مانده مشمول مالیات (درآمد تشخیصی منهای معافیت‌ها)
    /// </summary>
    public decimal TaxableBase => Math.Max(0, AssessedIncome - Exemptions);

    /// <summary>
    /// جمع کل مالیات تشخیصی و جرایم غیرقابل بخشش
    /// </summary>
    public decimal TotalAssessedTax => AssessedTax + NonWaivablePenalties;

    // Parameterless constructor for EF Core
    public TaxAssessmentInfo() { }

    public static TaxAssessmentInfo Create(
        bool hasReturnFiled,
        string? returnNumber,
        string? returnDateJalali,
        FinalizationMethod finalizationMethod,
        string? finalNoticeNumber,
        string? finalNoticeDateJalali,
        decimal assessedIncome,
        decimal exemptions = 0,
        decimal assessedTax = 0,
        decimal nonWaivablePenalties = 0,
        decimal timelyPaymentBonus = 0,
        FinalityStage finalityStage = FinalityStage.Tamkin)
    {
        if (assessedIncome < 0)
            throw new ArgumentException("درآمد تشخیصی نمی‌تواند منفی باشد", nameof(assessedIncome));

        if (exemptions < 0)
            throw new ArgumentException("مبلغ معافیت‌ها نمی‌تواند منفی باشد", nameof(exemptions));

        if (assessedTax < 0)
            throw new ArgumentException("مالیات تشخیصی نمی‌تواند منفی باشد", nameof(assessedTax));

        if (nonWaivablePenalties < 0)
            throw new ArgumentException("جرایم غیرقابل بخشش نمی‌تواند منفی باشد", nameof(nonWaivablePenalties));

        if (timelyPaymentBonus < 0)
            throw new ArgumentException("جایزه خوش‌حسابی نمی‌تواند منفی باشد", nameof(timelyPaymentBonus));

        return new TaxAssessmentInfo
        {
            HasReturnFiled = hasReturnFiled,
            ReturnNumber = returnNumber?.Trim(),
            ReturnDateJalali = returnDateJalali?.Trim(),
            FinalizationMethod = finalizationMethod,
            FinalityStage = finalityStage,
            FinalNoticeNumber = finalNoticeNumber?.Trim(),
            FinalNoticeDateJalali = finalNoticeDateJalali?.Trim(),
            AssessedIncome = assessedIncome,
            Exemptions = exemptions,
            AssessedTax = assessedTax,
            NonWaivablePenalties = nonWaivablePenalties,
            TimelyPaymentBonus = timelyPaymentBonus
        };
    }
}
