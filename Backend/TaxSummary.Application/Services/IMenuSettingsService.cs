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
    /// Resets all menu settings to initial system defaults.
    /// </summary>
    Task ResetToDefaultsAsync(Guid? currentUserId, CancellationToken cancellationToken = default);
}
