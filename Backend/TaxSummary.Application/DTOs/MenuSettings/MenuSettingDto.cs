namespace TaxSummary.Application.DTOs.MenuSettings;

/// <summary>
/// DTO representing a navigation menu or module visibility configuration item.
/// </summary>
public class MenuSettingDto
{
    public Guid Id { get; set; }
    public string MenuKey { get; set; } = string.Empty;
    public string? ParentKey { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public string? IconName { get; set; }
    public bool IsVisible { get; set; }
    public bool AdminOnly { get; set; }
    public int DisplayOrder { get; set; }
    public string? Description { get; set; }
    public List<MenuSettingDto> Children { get; set; } = new();
}

/// <summary>
/// DTO for updating the visibility and role restrictions of a single menu setting.
/// </summary>
public class UpdateMenuSettingItemDto
{
    public string MenuKey { get; set; } = string.Empty;
    public bool IsVisible { get; set; }
    public bool AdminOnly { get; set; }
    public int? DisplayOrder { get; set; }
}

/// <summary>
/// Request payload for bulk updating menu settings.
/// </summary>
public class UpdateMenuSettingsRequestDto
{
    public List<UpdateMenuSettingItemDto> Settings { get; set; } = new();
}
