using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

public class MenuSettingsRepository : IMenuSettingsRepository
{
    private readonly TaxSummaryDbContext _context;

    public MenuSettingsRepository(TaxSummaryDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<List<MenuSetting>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.MenuSettings
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MenuSetting>> GetVisibleAsync(bool isAdmin, CancellationToken cancellationToken = default)
    {
        var query = _context.MenuSettings.AsQueryable();

        if (isAdmin)
        {
            query = query.Where(m => m.IsVisible);
        }
        else
        {
            query = query.Where(m => m.IsVisible && !m.AdminOnly);
        }

        return await query
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync(cancellationToken);
    }

    public async Task<MenuSetting?> GetByKeyAsync(string menuKey, CancellationToken cancellationToken = default)
    {
        var normalizedKey = menuKey.Trim().ToLowerInvariant();
        return await _context.MenuSettings
            .FirstOrDefaultAsync(m => m.MenuKey == normalizedKey, cancellationToken);
    }

    public async Task UpdateRangeAsync(IEnumerable<MenuSetting> settings, CancellationToken cancellationToken = default)
    {
        _context.MenuSettings.UpdateRange(settings);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ResetToDefaultsAsync(IEnumerable<MenuSetting> defaults, CancellationToken cancellationToken = default)
    {
        _context.MenuSettings.RemoveRange(_context.MenuSettings);
        await _context.MenuSettings.AddRangeAsync(defaults, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
