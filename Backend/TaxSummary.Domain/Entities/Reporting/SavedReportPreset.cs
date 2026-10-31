namespace TaxSummary.Domain.Entities;

public class SavedReportPreset
{
    public Guid Id { get; private set; }
    public Guid ReportDefinitionId { get; private set; }
    public ReportDefinition ReportDefinition { get; private set; } = null!;

    public Guid UserId { get; private set; }
    public User User { get; private set; } = null!;

    /// <summary>
    /// عنوان الگو یا پیش‌تنظیم ذخیره‌شده
    /// </summary>
    public string PresetName { get; private set; } = string.Empty;

    /// <summary>
    /// پارامترهای فیلتر انتخاب شده (بازه تاریخی، ادارات، وضعیت و ...) به صورت JSON
    /// </summary>
    public string FilterCriteriaJson { get; private set; } = "{}";

    /// <summary>
    /// فهرست فیلدها و ستون‌های سفارشی به صورت JSON (اختیاری)
    /// </summary>
    public string? VisibleColumnsJson { get; private set; }

    /// <summary>
    /// آیا این الگو با سایر روسای اداره متبوع به اشتراک گذاشته شده است؟
    /// </summary>
    public bool IsSharedWithOffice { get; private set; }

    /// <summary>
    /// شناسه اداره مربوط به اشتراک‌گذاری
    /// </summary>
    public Guid? OfficeId { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private SavedReportPreset() { }

    public static SavedReportPreset Create(
        Guid reportDefinitionId,
        Guid userId,
        string presetName,
        string filterCriteriaJson,
        string? visibleColumnsJson = null,
        bool isShared = false,
        Guid? officeId = null)
    {
        if (string.IsNullOrWhiteSpace(presetName))
            throw new ArgumentException("نام الگوی گزارش نمی‌تواند خالی باشد.", nameof(presetName));

        if (string.IsNullOrWhiteSpace(filterCriteriaJson))
            throw new ArgumentException("معیارهای فیلتر الزامی است.", nameof(filterCriteriaJson));

        return new SavedReportPreset
        {
            Id = Guid.NewGuid(),
            ReportDefinitionId = reportDefinitionId,
            UserId = userId,
            PresetName = presetName.Trim(),
            FilterCriteriaJson = filterCriteriaJson.Trim(),
            VisibleColumnsJson = string.IsNullOrWhiteSpace(visibleColumnsJson) ? null : visibleColumnsJson.Trim(),
            IsSharedWithOffice = isShared,
            OfficeId = officeId,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string presetName, string filterCriteriaJson, string? visibleColumnsJson, bool isShared)
    {
        if (string.IsNullOrWhiteSpace(presetName))
            throw new ArgumentException("نام الگوی گزارش نمی‌تواند خالی باشد.", nameof(presetName));

        if (string.IsNullOrWhiteSpace(filterCriteriaJson))
            throw new ArgumentException("معیارهای فیلتر الزامی است.", nameof(filterCriteriaJson));

        PresetName = presetName.Trim();
        FilterCriteriaJson = filterCriteriaJson.Trim();
        VisibleColumnsJson = string.IsNullOrWhiteSpace(visibleColumnsJson) ? null : visibleColumnsJson.Trim();
        IsSharedWithOffice = isShared;
        UpdatedAt = DateTime.UtcNow;
    }
}
