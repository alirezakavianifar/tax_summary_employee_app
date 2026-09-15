using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for role operations
/// </summary>
public class RoleRepository : IRoleRepository
{
    private readonly TaxSummaryDbContext _context;

    public RoleRepository(TaxSummaryDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Result<Role>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
            if (role == null)
                return Result.Failure<Role>("نقش مورد نظر یافت نشد");

            return Result.Success(role);
        }
        catch (Exception ex)
        {
            return Result.Failure<Role>($"خطا در دریافت نقش: {ex.Message}");
        }
    }

    public async Task<Result<Role>> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        try
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == name.Trim().ToLower(), cancellationToken);
            if (role == null)
                return Result.Failure<Role>("نقش مورد نظر یافت نشد");

            return Result.Success(role);
        }
        catch (Exception ex)
        {
            return Result.Failure<Role>($"خطا در دریافت نقش: {ex.Message}");
        }
    }

    public async Task<Result<IEnumerable<Role>>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        try
        {
            IQueryable<Role> query = _context.Roles.AsNoTracking();
            if (!includeInactive)
            {
                query = query.Where(r => r.IsActive);
            }

            var roles = await query
                .OrderBy(r => r.DisplayOrder)
                .ThenBy(r => r.Title)
                .ToListAsync(cancellationToken);

            return Result.Success<IEnumerable<Role>>(roles);
        }
        catch (Exception ex)
        {
            return Result.Failure<IEnumerable<Role>>($"خطا در دریافت لیست نقش‌ها: {ex.Message}");
        }
    }

    public async Task<bool> ExistsByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _context.Roles.AnyAsync(r => r.Name.ToLower() == name.Trim().ToLower(), cancellationToken);
    }

    public async Task<int> GetUserCountByRoleNameAsync(string roleName, CancellationToken cancellationToken = default)
    {
        return await _context.Users.CountAsync(u => u.Role.ToLower() == roleName.Trim().ToLower(), cancellationToken);
    }

    public async Task<Result<Role>> AddAsync(Role role, CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.Roles.AddAsync(role, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success(role);
        }
        catch (Exception ex)
        {
            return Result.Failure<Role>($"خطا در ایجاد نقش: {ex.Message}");
        }
    }

    public async Task<Result<Role>> UpdateAsync(Role role, CancellationToken cancellationToken = default)
    {
        try
        {
            _context.Roles.Update(role);
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success(role);
        }
        catch (Exception ex)
        {
            return Result.Failure<Role>($"خطا در بروزرسانی نقش: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteAsync(Role role, CancellationToken cancellationToken = default)
    {
        try
        {
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success(true);
        }
        catch (Exception ex)
        {
            return Result.Failure<bool>($"خطا در حذف نقش: {ex.Message}");
        }
    }
}
