using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Interfaces;

public interface ISystemSettingsRepository
{
    Task<SystemSetting?> GetByKeyAsync(string settingKey = SystemSetting.DefaultSettingKey, CancellationToken cancellationToken = default);
    Task<SystemSetting> GetOrCreateDefaultAsync(CancellationToken cancellationToken = default);
    Task UpdateAsync(SystemSetting setting, CancellationToken cancellationToken = default);
}

