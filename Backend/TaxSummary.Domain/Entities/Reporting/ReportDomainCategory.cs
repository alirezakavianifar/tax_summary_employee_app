namespace TaxSummary.Domain.Entities.Reporting;

/// <summary>
/// Domain entity representing a configurable report category / domain source
/// حوزه و دسته‌بندی موضوعی گزارش‌ها (قابل مدیریت و ویرایش توسط مدیر سیستم)
/// </summary>
public class ReportDomainCategory
{
    public int Id { get; private set; }

    /// <summary>
    /// Unique code / key of the report category (e.g. HR, PAYROLL, REFUNDS, CROSS_SYSTEM, TAX_AUDIT, CUSTOM_DATASET)
    /// شناسه انگلیسی یکتای دسته‌بندی
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// Persian display title (e.g. داده‌های بارگذاری شده از اکسل, رسیدگی سنیم, حقوق و اضافه کار)
    /// عنوان فارسی دسته‌بندی گزارش
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// Description of reports under this category
    /// شرح کاربردی و مخاطبان گزارش‌های این حوزه
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// Whether this category is active and visible in catalog tabs and dropdowns
    /// وضعیت فعال بودن جهت نمایش در کاتالوگ و فرم‌های بارگذاری
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Display order for sorting tabs in reports catalog
    /// ترتیب نمایش در زبانه‌های کاتالوگ
    /// </summary>
    public int DisplayOrder { get; private set; }

    /// <summary>
    /// Indicates whether this is a built-in core category (cannot be deleted)
    /// مشخص‌کننده سیستمی بودن جهت ممانعت از حذف فیزیکی
    /// </summary>
    public bool IsSystem { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private ReportDomainCategory() { } // EF Core Constructor

    public static ReportDomainCategory Create(
        int id,
        string code,
        string title,
        string? description = null,
        bool isActive = true,
        int displayOrder = 0,
        bool isSystem = false)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("کد دسته‌بندی گزارش نمی‌تواند خالی باشد.", nameof(code));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان دسته‌بندی گزارش نمی‌تواند خالی باشد.", nameof(title));

        var now = DateTime.UtcNow;
        return new ReportDomainCategory
        {
            Id = id,
            Code = code.Trim().ToUpperInvariant(),
            Title = title.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            IsActive = isActive,
            DisplayOrder = displayOrder,
            IsSystem = isSystem,
            CreatedAt = now,
            UpdatedAt = null
        };
    }

    public void UpdateDetails(string title, string? description, int displayOrder, bool isActive)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان دسته‌بندی گزارش نمی‌تواند خالی باشد.", nameof(title));

        Title = title.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        DisplayOrder = displayOrder;
        IsActive = isActive;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ToggleStatus()
    {
        IsActive = !IsActive;
        UpdatedAt = DateTime.UtcNow;
    }
}
