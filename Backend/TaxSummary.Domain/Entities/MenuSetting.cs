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
    /// Comma-separated list of allowed role names (e.g. "Admin,Manager,Employee").
    /// </summary>
    public string AllowedRoles { get; private set; } = "Admin,Manager,Employee";

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
        Guid? updatedByUserId = null,
        string? allowedRoles = null)
    {
        if (string.IsNullOrWhiteSpace(menuKey))
            throw new ArgumentException("شناسه یکتای منو الزامی است", nameof(menuKey));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان منو الزامی است", nameof(title));

        string resolvedRoles;
        if (!string.IsNullOrWhiteSpace(allowedRoles))
        {
            resolvedRoles = NormalizeRoles(allowedRoles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        }
        else if (adminOnly)
        {
            resolvedRoles = "Admin";
        }
        else
        {
            resolvedRoles = "Admin,OfficeHead,GroupHead,Expert,ITSpecialist,Manager,Employee";
        }

        bool isActuallyAdminOnly = adminOnly || !resolvedRoles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(r => !string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase));

        return new MenuSetting
        {
            Id = Guid.NewGuid(),
            MenuKey = menuKey.Trim().ToLowerInvariant(),
            ParentKey = string.IsNullOrWhiteSpace(parentKey) ? null : parentKey.Trim().ToLowerInvariant(),
            Title = title.Trim(),
            Route = string.IsNullOrWhiteSpace(route) ? "/" : route.Trim(),
            IconName = string.IsNullOrWhiteSpace(iconName) ? null : iconName.Trim(),
            IsVisible = isVisible,
            AdminOnly = isActuallyAdminOnly,
            AllowedRoles = resolvedRoles,
            DisplayOrder = displayOrder,
            Description = description?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UpdatedByUserId = updatedByUserId
        };
    }

    public bool IsRoleAllowed(string? role)
    {
        if (string.IsNullOrWhiteSpace(role))
            return false;

        // Admin always has full access
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.IsNullOrWhiteSpace(AllowedRoles))
            return false;

        var roles = AllowedRoles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return roles.Any(r => string.Equals(r, role, StringComparison.OrdinalIgnoreCase));
    }

    public void UpdateRoles(IEnumerable<string> roles, Guid? updatedByUserId = null)
    {
        AllowedRoles = NormalizeRoles(roles);
        AdminOnly = !AllowedRoles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(r => !string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase));
        UpdatedAt = DateTime.UtcNow;
        UpdatedByUserId = updatedByUserId;
    }

    public void UpdateVisibility(
        bool isVisible,
        bool adminOnly,
        int? displayOrder = null,
        Guid? updatedByUserId = null,
        IEnumerable<string>? allowedRoles = null)
    {
        IsVisible = isVisible;
        if (allowedRoles != null && allowedRoles.Any())
        {
            UpdateRoles(allowedRoles, updatedByUserId);
        }
        else
        {
            AdminOnly = adminOnly;
            if (adminOnly)
            {
                AllowedRoles = "Admin";
            }
            else if (!AllowedRoles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Any(r => !string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase)))
            {
                AllowedRoles = "Admin,OfficeHead,GroupHead,Expert,ITSpecialist,Manager,Employee";
            }
        }

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

    private static string NormalizeRoles(IEnumerable<string> roles)
    {
        var distinctRoles = roles
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase);

        var list = distinctRoles.ToList();
        return list.Count == 0 ? "Admin" : string.Join(",", list);
    }
}
