using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

public class SystemSettingsRepository : ISystemSettingsRepository
{
    private readonly TaxSummaryDbContext _context;

    public SystemSettingsRepository(TaxSummaryDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<SystemSetting?> GetByKeyAsync(string settingKey = SystemSetting.DefaultSettingKey, CancellationToken cancellationToken = default)
    {
        var normalized = string.IsNullOrWhiteSpace(settingKey) ? SystemSetting.DefaultSettingKey : settingKey.Trim();
        return await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.SettingKey.ToLower() == normalized.ToLower(), cancellationToken);
    }

    public async Task<SystemSetting> GetOrCreateDefaultAsync(CancellationToken cancellationToken = default)
    {
        var setting = await GetByKeyAsync(SystemSetting.DefaultSettingKey, cancellationToken);
        if (setting == null)
        {
            setting = SystemSetting.CreateDefault();
            await _context.SystemSettings.AddAsync(setting, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }
        return setting;
    }

    public async Task UpdateAsync(SystemSetting setting, CancellationToken cancellationToken = default)
    {
        _context.SystemSettings.Update(setting);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

