namespace TaxSummary.Domain.Entities;

/// <summary>
/// Domain entity representing a configurable finality stage for tax refund cases
/// مرحله قطعیت پرونده مالیاتی قابل پیکربندی توسط مدیر سامانه
/// </summary>
public class TaxFinalityStage
{
    public int Id { get; private set; }

    /// <summary>
    /// Unique code / key of the finality stage (e.g. Tamkin, Agreement, PrimaryBoard244, CustomStage_1)
    /// شناسه سیستمی یا انگلیسی مرحله قطعیت
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// Persian display title (e.g. تمکین، توافق، رای هیات بدوی ۲۴۴)
    /// عنوان فارسی مرحله قطعیت
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// Description or statutory notes
    /// توضیحات یا بند قانونی مرتبط
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// Whether this stage is active and displayed in dropdowns
    /// فعال/غیرفعال بودن جهت نمایش در فرم‌های ثبت پرونده
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Display order for sorting in dropdowns
    /// ترتیب نمایش در لیست‌ها
    /// </summary>
    public int DisplayOrder { get; private set; }

    /// <summary>
    /// Indicates whether this is a built-in core finality stage
    /// مشخص‌کننده سیستمی بودن جهت ممانعت از حذف فیزیکی
    /// </summary>
    public bool IsSystem { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private TaxFinalityStage() { }

    public static TaxFinalityStage Create(
        int id,
        string code,
        string title,
        string? description = null,
        bool isActive = true,
        int displayOrder = 0,
        bool isSystem = false)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("کد مرحله قطعیت نمی‌تواند خالی باشد", nameof(code));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان مرحله قطعیت نمی‌تواند خالی باشد", nameof(title));

        var now = DateTime.UtcNow;
        return new TaxFinalityStage
        {
            Id = id,
            Code = code.Trim(),
            Title = title.Trim(),
            Description = description?.Trim(),
            IsActive = isActive,
            DisplayOrder = displayOrder,
            IsSystem = isSystem,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void Update(string title, string? description, bool isActive, int displayOrder)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان مرحله قطعیت نمی‌تواند خالی باشد", nameof(title));

        Title = title.Trim();
        Description = description?.Trim();
        IsActive = isActive;
        DisplayOrder = displayOrder;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetActive(bool isActive)
    {
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }
}
