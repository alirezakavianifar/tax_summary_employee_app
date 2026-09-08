using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Interfaces;

/// <summary>
/// Repository interface for persisting and querying navigation menu visibility settings.
/// </summary>
public interface IMenuSettingsRepository
{
    Task<List<MenuSetting>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<MenuSetting>> GetVisibleAsync(string? role, CancellationToken cancellationToken = default);
    Task<List<MenuSetting>> GetVisibleAsync(bool isAdmin, CancellationToken cancellationToken = default);
    Task<MenuSetting?> GetByKeyAsync(string menuKey, CancellationToken cancellationToken = default);
    Task UpdateRangeAsync(IEnumerable<MenuSetting> settings, CancellationToken cancellationToken = default);
    Task ResetToDefaultsAsync(IEnumerable<MenuSetting> defaults, CancellationToken cancellationToken = default);
}
