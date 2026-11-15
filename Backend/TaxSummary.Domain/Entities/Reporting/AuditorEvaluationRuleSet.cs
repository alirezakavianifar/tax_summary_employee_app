using System.Text.Json;

namespace TaxSummary.Domain.Entities.Reporting;

/// <summary>
/// پیکربندی قواعد و ماتریس اوزان امتیازی دستورالعمل ارزیابی عملکرد کارکنان رسیدگی مالیاتی
/// </summary>
public class AuditorEvaluationRuleSet
{
    public Guid Id { get; private set; }
    public string Code { get; private set; } = "INTA_SRS_V1";
    public string Title { get; private set; } = "دستورالعمل مصوب ارزیابی عملکرد کارکنان رسیدگی مالیاتی";
    public string Description { get; private set; } = "نظام جامع امتیازی ارزیابی عملکرد حسابرسان مالیاتی مبتنی بر ۸ شاخص عملکردی و ۷ دسته‌بندی پرونده";
    
    /// <summary>
    /// ماتریس اوزان ۸ شاخص در ۷ دسته‌بندی منبع به صورت رشته JSON
    /// </summary>
    public string WeightsMatrixJson { get; private set; } = string.Empty;

    /// <summary>
    /// آستانه درصد رشد تشخیصی نسبت به ابرازی برای اشخاص حقوقی (پیش‌فرض: ۷۰۰ درصد)
    /// </summary>
    public decimal GrowthThresholdLegalEntity { get; private set; } = 700.0m;

    /// <summary>
    /// آستانه درصد رشد تشخیصی نسبت به ابرازی برای اشخاص حقیقی/مشاغل (پیش‌فرض: ۵۰۰ درصد)
    /// </summary>
    public decimal GrowthThresholdIndividual { get; private set; } = 500.0m;

    /// <summary>
    /// آستانه درصد تعدیل کاهشی مالیات قطعی نسبت به تشخیصی مشمول امتیاز منفی (پیش‌فرض: ۱۵ درصد)
    /// </summary>
    public decimal AdjustmentThreshold { get; private set; } = 15.0m;

    /// <summary>
    /// نرخ کسر امتیاز به ازای هر روز تاخیر مازاد بر مهلت مجاز (پیش‌فرض: ۰.۲۵ نمره در روز)
    /// </summary>
    public decimal DailyDelayPenalty { get; private set; } = 0.25m;

    /// <summary>
    /// مهلت‌های مجاز رسیدگی (روز) به تفکیک منابع برای صدور تشخیص و قطعیت به صورت JSON
    /// </summary>
    public string AllowedDaysJson { get; private set; } = string.Empty;

    /// <summary>
    /// تعداد پرونده‌های حقوقی مهم جهت تفکیک ۳۰۰ پرونده اول (پیش‌فرض: ۳۰۰)
    /// </summary>
    public int Top300TaxpayersCount { get; private set; } = 300;

    /// <summary>
    /// آیا نمره شاخص‌های سرعت در صورت تاخیر زیاد می‌تواند منفی شود؟ (در غیر این صورت کف آن صفر است)
    /// </summary>
    public bool AllowNegativeSpeedScore { get; private set; } = false;

    public bool IsActive { get; private set; } = true;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    protected AuditorEvaluationRuleSet() { }

    public static AuditorEvaluationRuleSet CreateDefault()
    {
        var ruleSet = new AuditorEvaluationRuleSet
        {
            Id = Guid.NewGuid(),
            Code = "INTA_SRS_V1",
            Title = "دستورالعمل مصوب ارزیابی عملکرد کارکنان رسیدگی مالیاتی",
            Description = "نظام جامع امتیازی ارزیابی عملکرد حسابرسان مالیاتی مبتنی بر ۸ شاخص عملکردی و ۷ دسته‌بندی پرونده",
            WeightsMatrixJson = GetDefaultWeightsMatrixJson(),
            GrowthThresholdLegalEntity = 700.0m,
            GrowthThresholdIndividual = 500.0m,
            AdjustmentThreshold = 15.0m,
            DailyDelayPenalty = 0.25m,
            AllowedDaysJson = GetDefaultAllowedDaysJson(),
            Top300TaxpayersCount = 300,
            AllowNegativeSpeedScore = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        return ruleSet;
    }

    public void Update(
        string title,
        string description,
        string weightsMatrixJson,
        decimal growthThresholdLegalEntity,
        decimal growthThresholdIndividual,
        decimal adjustmentThreshold,
        decimal dailyDelayPenalty,
        string allowedDaysJson,
        int top300TaxpayersCount,
        bool allowNegativeSpeedScore,
        bool isActive)
    {
        Title = string.IsNullOrWhiteSpace(title) ? Title : title.Trim();
        Description = description?.Trim() ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(weightsMatrixJson))
            WeightsMatrixJson = weightsMatrixJson;

        GrowthThresholdLegalEntity = growthThresholdLegalEntity;
        GrowthThresholdIndividual = growthThresholdIndividual;
        AdjustmentThreshold = adjustmentThreshold;
        DailyDelayPenalty = dailyDelayPenalty;

        if (!string.IsNullOrWhiteSpace(allowedDaysJson))
            AllowedDaysJson = allowedDaysJson;

        Top300TaxpayersCount = top300TaxpayersCount > 0 ? top300TaxpayersCount : 300;
        AllowNegativeSpeedScore = allowNegativeSpeedScore;
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ResetToDefaults()
    {
        WeightsMatrixJson = GetDefaultWeightsMatrixJson();
        GrowthThresholdLegalEntity = 700.0m;
        GrowthThresholdIndividual = 500.0m;
        AdjustmentThreshold = 15.0m;
        DailyDelayPenalty = 0.25m;
        AllowedDaysJson = GetDefaultAllowedDaysJson();
        Top300TaxpayersCount = 300;
        AllowNegativeSpeedScore = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public static string GetDefaultWeightsMatrixJson()
    {
        // Matrix: 8 indicators x 7 categories (weights matching SRS Section 2.1)
        // Categories: Corporate300, CorporateOther, Vat300, VatLegalOther, BusinessIncome, VatIndividual, PropertyTax
        var defaultMatrix = new Dictionary<string, Dictionary<string, decimal>>
        {
            ["AssessmentsIssued"] = new()
            {
                ["Corporate300"] = 10m,
                ["CorporateOther"] = 4m,
                ["Vat300"] = 2.5m,
                ["VatLegalOther"] = 1m,
                ["BusinessIncome"] = 2m,
                ["VatIndividual"] = 0.5m,
                ["PropertyTax"] = 1m
            },
            ["FinalizedAssessments"] = new()
            {
                ["Corporate300"] = 10m,
                ["CorporateOther"] = 4m,
                ["Vat300"] = 2.5m,
                ["VatLegalOther"] = 1m,
                ["BusinessIncome"] = 2m,
                ["VatIndividual"] = 0.5m,
                ["PropertyTax"] = 1m
            },
            ["TaxpayerAcceptance"] = new()
            {
                ["Corporate300"] = 10m,
                ["CorporateOther"] = 4m,
                ["Vat300"] = 2.5m,
                ["VatLegalOther"] = 1m,
                ["BusinessIncome"] = 2m,
                ["VatIndividual"] = 0.5m,
                ["PropertyTax"] = 1m
            },
            ["Article238Agreements"] = new()
            {
                ["Corporate300"] = 10m,
                ["CorporateOther"] = 4m,
                ["Vat300"] = 2.5m,
                ["VatLegalOther"] = 1m,
                ["BusinessIncome"] = 2m,
                ["VatIndividual"] = 0.5m,
                ["PropertyTax"] = 1m
            },
            ["AssessmentGrowth"] = new()
            {
                ["Corporate300"] = 10m,
                ["CorporateOther"] = 4m,
                ["Vat300"] = 2.5m,
                ["VatLegalOther"] = 1m,
                ["BusinessIncome"] = 2m,
                ["VatIndividual"] = 0.5m,
                ["PropertyTax"] = 1m
            },
            ["TaxAdjustment"] = new()
            {
                ["Corporate300"] = -10m,
                ["CorporateOther"] = -4m,
                ["Vat300"] = -2.5m,
                ["VatLegalOther"] = -1m,
                ["BusinessIncome"] = -2m,
                ["VatIndividual"] = -0.5m,
                ["PropertyTax"] = -1m
            },
            ["IssuanceSpeed"] = new()
            {
                ["Corporate300"] = 10m,
                ["CorporateOther"] = 4m,
                ["Vat300"] = 2.5m,
                ["VatLegalOther"] = 1m,
                ["BusinessIncome"] = 2m,
                ["VatIndividual"] = 0.5m,
                ["PropertyTax"] = 1m
            },
            ["FinalizationSpeed"] = new()
            {
                ["Corporate300"] = 10m,
                ["CorporateOther"] = 4m,
                ["Vat300"] = 2.5m,
                ["VatLegalOther"] = 1m,
                ["BusinessIncome"] = 2m,
                ["VatIndividual"] = 0.5m,
                ["PropertyTax"] = 1m
            }
        };

        return JsonSerializer.Serialize(defaultMatrix);
    }

    public static string GetDefaultAllowedDaysJson()
    {
        // Allowed days per category: Issuance days and Finalization days
        var defaultDays = new Dictionary<string, AllowedDaysLimit>
        {
            ["Corporate300"] = new(IssuanceAllowedDays: 60, FinalizationAllowedDays: 60),
            ["CorporateOther"] = new(IssuanceAllowedDays: 45, FinalizationAllowedDays: 45),
            ["Vat300"] = new(IssuanceAllowedDays: 60, FinalizationAllowedDays: 60),
            ["VatLegalOther"] = new(IssuanceAllowedDays: 45, FinalizationAllowedDays: 45),
            ["BusinessIncome"] = new(IssuanceAllowedDays: 30, FinalizationAllowedDays: 30),
            ["VatIndividual"] = new(IssuanceAllowedDays: 30, FinalizationAllowedDays: 30),
            ["PropertyTax"] = new(IssuanceAllowedDays: 30, FinalizationAllowedDays: 30)
        };

        return JsonSerializer.Serialize(defaultDays);
    }
}

public record AllowedDaysLimit(int IssuanceAllowedDays, int FinalizationAllowedDays);

