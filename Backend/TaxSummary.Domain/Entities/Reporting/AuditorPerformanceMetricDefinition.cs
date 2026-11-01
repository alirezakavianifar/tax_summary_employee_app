using TaxSummary.Domain.Enums;

namespace TaxSummary.Domain.Entities.Reporting;

/// <summary>
/// تعریف داینامیک شاخص‌های ارزیابی عملکرد حسابرسان مالیاتی توسط مدیر سیستم
/// </summary>
public class AuditorPerformanceMetricDefinition
{
    public Guid Id { get; private set; }

    /// <summary>
    /// شناسه یکتای شاخص (مانند: DEFENSIBILITY_RATIO)
    /// </summary>
    public string MetricCode { get; private set; } = string.Empty;

    /// <summary>
    /// عنوان فارسی شاخص
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// شرح مفهومی شاخص و شیوه تفسیر آن
    /// </summary>
    public string Description { get; private set; } = string.Empty;

    /// <summary>
    /// دسته‌بندی شاخص (کیفیت، مالی، سرعت، بهره‌وری)
    /// </summary>
    public AuditorMetricCategory Category { get; private set; }

    /// <summary>
    /// نوع فرمول و شیوه محاسبه
    /// </summary>
    public AuditorMetricFormulaType FormulaType { get; private set; }

    /// <summary>
    /// نام فیلد اصلی محاسبات (مانند: FinalTaxAmount, DaysAssignmentToNotice)
    /// </summary>
    public string PrimaryField { get; private set; } = string.Empty;

    /// <summary>
    /// نام فیلد دوم برای فرمول‌های کسری یا اختلافی (مانند: AssessedTaxAmount, DeclaredTaxAmount)
    /// </summary>
    public string? SecondaryField { get; private set; }

    /// <summary>
    /// ضریب اعمالی (مثلاً ۱۰۰ برای درصدی کردن)
    /// </summary>
    public decimal Multiplier { get; private set; } = 1.0m;

    /// <summary>
    /// وزن این شاخص در امتیاز کل حسابرس (۰ تا ۱۰۰ درصد)
    /// مجموع اوزان شاخص‌های فعال باید ۱۰۰ درصد باشد
    /// </summary>
    public decimal WeightPercentage { get; private set; }

    /// <summary>
    /// آیا مقدار بالاتر نشان‌دهنده عملکرد بهتر است؟ (برای مواعد و روزهای تاخیر false است)
    /// </summary>
    public bool HigherIsBetter { get; private set; } = true;

    /// <summary>
    /// مقدار هدف ایده‌آل (باند سبز)
    /// </summary>
    public decimal TargetValue { get; private set; }

    /// <summary>
    /// آستانه هشدار (باند زرد)
    /// </summary>
    public decimal WarningThreshold { get; private set; }

    /// <summary>
    /// آستانه بحرانی (باند قرمز)
    /// </summary>
    public decimal CriticalThreshold { get; private set; }

    /// <summary>
    /// واحد سنجش (درصد، روز، ریال، فقره)
    /// </summary>
    public string Unit { get; private set; } = "%";

    /// <summary>
    /// ترتیب نمایش در کارنامه و جداول
    /// </summary>
    public int DisplayOrder { get; private set; }

    /// <summary>
    /// فعال بودن یا غیرفعال بودن شاخص در محاسبات
    /// </summary>
    public bool IsActive { get; private set; } = true;

    /// <summary>
    /// بازه‌های ارزیابی و گریدهای رتبه‌بندی در قالب JSON
    /// </summary>
    public string TierThresholdsJson { get; private set; } = "{}";

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    protected AuditorPerformanceMetricDefinition() { }

    public static AuditorPerformanceMetricDefinition Create(
        string metricCode,
        string title,
        string description,
        AuditorMetricCategory category,
        AuditorMetricFormulaType formulaType,
        string primaryField,
        string? secondaryField,
        decimal multiplier,
        decimal weightPercentage,
        bool higherIsBetter,
        decimal targetValue,
        decimal warningThreshold,
        decimal criticalThreshold,
        string unit,
        int displayOrder,
        string tierThresholdsJson = "{}")
    {
        if (string.IsNullOrWhiteSpace(metricCode))
            throw new ArgumentException("شناسه شاخص نمی‌تواند خالی باشد", nameof(metricCode));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان شاخص نمی‌تواند خالی باشد", nameof(title));

        return new AuditorPerformanceMetricDefinition
        {
            Id = Guid.NewGuid(),
            MetricCode = metricCode.Trim().ToUpperInvariant(),
            Title = title.Trim(),
            Description = description?.Trim() ?? string.Empty,
            Category = category,
            FormulaType = formulaType,
            PrimaryField = primaryField.Trim(),
            SecondaryField = secondaryField?.Trim(),
            Multiplier = multiplier,
            WeightPercentage = weightPercentage,
            HigherIsBetter = higherIsBetter,
            TargetValue = targetValue,
            WarningThreshold = warningThreshold,
            CriticalThreshold = criticalThreshold,
            Unit = unit?.Trim() ?? "%",
            DisplayOrder = displayOrder,
            IsActive = true,
            TierThresholdsJson = tierThresholdsJson,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(
        string title,
        string description,
        AuditorMetricCategory category,
        AuditorMetricFormulaType formulaType,
        string primaryField,
        string? secondaryField,
        decimal multiplier,
        decimal weightPercentage,
        bool higherIsBetter,
        decimal targetValue,
        decimal warningThreshold,
        decimal criticalThreshold,
        string unit,
        int displayOrder,
        bool isActive,
        string tierThresholdsJson)
    {
        Title = title.Trim();
        Description = description?.Trim() ?? string.Empty;
        Category = category;
        FormulaType = formulaType;
        PrimaryField = primaryField.Trim();
        SecondaryField = secondaryField?.Trim();
        Multiplier = multiplier;
        WeightPercentage = weightPercentage;
        HigherIsBetter = higherIsBetter;
        TargetValue = targetValue;
        WarningThreshold = warningThreshold;
        CriticalThreshold = criticalThreshold;
        Unit = unit?.Trim() ?? "%";
        DisplayOrder = displayOrder;
        IsActive = isActive;
        TierThresholdsJson = tierThresholdsJson;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetWeight(decimal weightPercentage)
    {
        WeightPercentage = weightPercentage;
        UpdatedAt = DateTime.UtcNow;
    }
}
