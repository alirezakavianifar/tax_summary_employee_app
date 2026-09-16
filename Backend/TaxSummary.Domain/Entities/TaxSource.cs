namespace TaxSummary.Domain.Entities;

/// <summary>
/// Domain entity representing a configurable tax source for tax refund cases
/// منبع مالیاتی قابل پیکربندی توسط مدیر سامانه
/// </summary>
public class TaxSource
{
    public int Id { get; private set; }

    /// <summary>
    /// Unique code / key of the tax source (e.g. CorporateIncome, ValueAddedTax, CustomSource_1)
    /// شناسه سیستمی یا انگلیسی منبع مالیاتی
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// Persian display title (e.g. عملکرد اشخاص حقوقی (شرکت‌ها))
    /// عنوان فارسی منبع مالیاتی
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// Description or statutory notes
    /// توضیحات یا بند قانونی مرتبط
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// Whether this tax source is active and displayed in dropdowns
    /// فعال/غیرفعال بودن جهت نمایش در فرم‌های ثبت پرونده
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Display order for sorting in dropdowns
    /// ترتیب نمایش در لیست‌ها
    /// </summary>
    public int DisplayOrder { get; private set; }

    /// <summary>
    /// Indicates whether this is a built-in core tax source
    /// مشخص‌کننده سیستمی بودن جهت ممانعت از حذف فیزیکی
    /// </summary>
    public bool IsSystem { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private TaxSource() { }

    public static TaxSource Create(
        int id,
        string code,
        string title,
        string? description = null,
        bool isActive = true,
        int displayOrder = 0,
        bool isSystem = false)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("کد منبع مالیاتی نمی‌تواند خالی باشد", nameof(code));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان منبع مالیاتی نمی‌تواند خالی باشد", nameof(title));

        var now = DateTime.UtcNow;
        return new TaxSource
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
            throw new ArgumentException("عنوان منبع مالیاتی نمی‌تواند خالی باشد", nameof(title));

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
