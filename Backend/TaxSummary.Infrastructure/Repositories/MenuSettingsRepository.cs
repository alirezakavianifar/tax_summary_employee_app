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

    public async Task<List<MenuSetting>> GetVisibleAsync(string? role, CancellationToken cancellationToken = default)
    {
        var allVisible = await _context.MenuSettings
            .Where(m => m.IsVisible)
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync(cancellationToken);

        bool isAdmin = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);

        // 1. Role-based filtering
        List<MenuSetting> roleFiltered;
        if (isAdmin)
        {
            roleFiltered = allVisible;
        }
        else
        {
            roleFiltered = allVisible
                .Where(m => !m.AdminOnly && m.IsRoleAllowed(role))
                .ToList();
        }

        // 2. Parent-child hierarchy verification:
        // Exclude children whose parent module is not present in roleFiltered (parent is hidden or not allowed)
        var allowedParentKeys = roleFiltered
            .Where(m => string.IsNullOrEmpty(m.ParentKey))
            .Select(m => m.MenuKey)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var finalItems = roleFiltered
            .Where(m => string.IsNullOrEmpty(m.ParentKey) || allowedParentKeys.Contains(m.ParentKey))
            .OrderBy(m => m.DisplayOrder)
            .ToList();

        return finalItems;
    }

    public Task<List<MenuSetting>> GetVisibleAsync(bool isAdmin, CancellationToken cancellationToken = default)
    {
        return GetVisibleAsync(isAdmin ? "Admin" : null, cancellationToken);
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
