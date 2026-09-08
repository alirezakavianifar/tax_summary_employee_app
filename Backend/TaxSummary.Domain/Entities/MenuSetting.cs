namespace TaxSummary.Domain.Entities;

/// <summary>
/// Domain entity representing configurable navigation menu and module visibility settings.
/// </summary>
public class MenuSetting
{
    public Guid Id { get; private set; }

    /// <summary>
    /// Unique identifier key for the menu or module (e.g. "module_tax_refund", "module_payroll", "module_evaluation", "nav_home").
    /// </summary>
    public string MenuKey { get; private set; } = string.Empty;

    /// <summary>
    /// Parent module key if this item is a sub-action under a dropdown. Null for top-level menu modules.
    /// </summary>
    public string? ParentKey { get; private set; }

    /// <summary>
    /// Persian display title for the menu item.
    /// </summary>
    public string Title { get; private set; } = string.Empty;

    /// <summary>
    /// Primary route or URL path associated with this menu option.
    /// </summary>
    public string Route { get; private set; } = string.Empty;

    /// <summary>
    /// Icon identifier name (e.g. "Scale", "Calculator", "Users", "Home", "ShieldCheck").
    /// </summary>
    public string? IconName { get; private set; }

    /// <summary>
    /// Whether this menu option is visible and active.
    /// </summary>
    public bool IsVisible { get; private set; }

    /// <summary>
    /// If true, this menu item is restricted to administrators and hidden from regular users.
    /// </summary>
    public bool AdminOnly { get; private set; }

    /// <summary>
    /// Display sequence order in the navigation bar.
    /// </summary>
    public int DisplayOrder { get; private set; }

    /// <summary>
    /// Optional description or explanatory note for administrators.
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// Timestamp when this setting was created.
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// Timestamp when this setting was last modified.
    /// </summary>
    public DateTime UpdatedAt { get; private set; }

    /// <summary>
    /// Optional identifier of the user who made the last change.
    /// </summary>
    public Guid? UpdatedByUserId { get; private set; }

    // EF Core Constructor
    private MenuSetting() { }

    public static MenuSetting Create(
        string menuKey,
        string title,
        string route,
        string? parentKey = null,
        string? iconName = null,
        bool isVisible = true,
        bool adminOnly = false,
        int displayOrder = 0,
        string? description = null,
        Guid? updatedByUserId = null)
    {
        if (string.IsNullOrWhiteSpace(menuKey))
            throw new ArgumentException("شناسه یکتای منو الزامی است", nameof(menuKey));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان منو الزامی است", nameof(title));

        return new MenuSetting
        {
            Id = Guid.NewGuid(),
            MenuKey = menuKey.Trim().ToLowerInvariant(),
            ParentKey = string.IsNullOrWhiteSpace(parentKey) ? null : parentKey.Trim().ToLowerInvariant(),
            Title = title.Trim(),
            Route = string.IsNullOrWhiteSpace(route) ? "/" : route.Trim(),
            IconName = iconName?.Trim(),
            IsVisible = isVisible,
            AdminOnly = adminOnly,
            DisplayOrder = displayOrder,
            Description = description?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UpdatedByUserId = updatedByUserId
        };
    }

    public void UpdateVisibility(bool isVisible, bool adminOnly, int? displayOrder = null, Guid? updatedByUserId = null)
    {
        IsVisible = isVisible;
        AdminOnly = adminOnly;
        if (displayOrder.HasValue)
        {
            DisplayOrder = displayOrder.Value;
        }
        UpdatedAt = DateTime.UtcNow;
        UpdatedByUserId = updatedByUserId;
    }

    public void UpdateMetadata(string title, string route, string? description = null, Guid? updatedByUserId = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان منو الزامی است", nameof(title));

        Title = title.Trim();
        Route = string.IsNullOrWhiteSpace(route) ? "/" : route.Trim();
        Description = description?.Trim();
        UpdatedAt = DateTime.UtcNow;
        UpdatedByUserId = updatedByUserId;
    }
}
