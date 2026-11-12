using TaxSummary.Application.DTOs.MenuSettings;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service interface for managing application navigation menu and module visibility settings.
/// </summary>
public interface IMenuSettingsService
{
    /// <summary>
    /// Retrieves all menu settings for administration view.
    /// </summary>
    Task<List<MenuSettingDto>> GetAllSettingsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Retrieves visible menu settings filtered by user role.
    /// </summary>
    Task<List<MenuSettingDto>> GetVisibleSettingsForRoleAsync(string? role, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates visibility and access restrictions for multiple menu items.
    /// </summary>
    Task<List<MenuSettingDto>> UpdateSettingsAsync(UpdateMenuSettingsRequestDto request, Guid? currentUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new custom menu option or module.
    /// </summary>
    Task<List<MenuSettingDto>> CreateSettingAsync(CreateMenuSettingRequestDto request, Guid? currentUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates metadata and access settings for a custom menu item.
    /// </summary>
    Task<List<MenuSettingDto>> UpdateSettingMetadataAsync(string menuKey, UpdateMenuSettingMetadataDto request, Guid? currentUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a custom menu item (and any custom children). Built-in items cannot be deleted.
    /// </summary>
    Task<List<MenuSettingDto>> DeleteSettingAsync(string menuKey, Guid? currentUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Resets built-in menu settings to initial system defaults while preserving custom items.
    /// </summary>
    Task ResetToDefaultsAsync(Guid? currentUserId, CancellationToken cancellationToken = default);
}
