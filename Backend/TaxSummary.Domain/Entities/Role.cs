namespace TaxSummary.Domain.Entities;

/// <summary>
/// Domain entity representing a system or custom organizational role
/// نقش سازمانی و سطوح دسترسی کاربران
/// </summary>
public class Role
{
    public Guid Id { get; private set; }

    /// <summary>
    /// Unique code/identifier for the role (e.g., "Admin", "DirectorGeneral", "Treasury", "OfficeHead", "GroupHead", "Expert", "Auditor")
    /// شناسه انگلیسی و منحصر‌به‌فرد نقش
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Persian display title for the role (e.g., "مدیر کل امور مالیاتی", "ذیحساب", "رئیس اداره امور مالیاتی")
    /// عنوان فارسی نقش سازمانی
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// Explanatory description of responsibilities and access scope
    /// توضیحات و شرح وظایف نقش
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// Whether this is a protected built-in core system role that cannot be deleted or renamed
    /// نشان‌دهنده سیستمی بودن نقش جهت جلوگیری از حذف
    /// </summary>
    public bool IsSystemRole { get; private set; }

    /// <summary>
    /// Whether this role is active and available for new user assignments
    /// وضعیت فعال/غیرفعال بودن نقش
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Order for sorting in dropdowns and matrices
    /// ترتیب نمایش در لیست‌ها
    /// </summary>
    public int DisplayOrder { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Role() { }

    public static Role Create(
        string name,
        string title,
        string? description = null,
        bool isSystemRole = false,
        bool isActive = true,
        int displayOrder = 0)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("کد نقش نمی‌تواند خالی باشد", nameof(name));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان نقش نمی‌تواند خالی باشد", nameof(title));

        return new Role
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Title = title.Trim(),
            Description = description?.Trim(),
            IsSystemRole = isSystemRole,
            IsActive = isActive,
            DisplayOrder = displayOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Update(string title, string? description, bool isActive, int displayOrder)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان نقش نمی‌تواند خالی باشد", nameof(title));

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
