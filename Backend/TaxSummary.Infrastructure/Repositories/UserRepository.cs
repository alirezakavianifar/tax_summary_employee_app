using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for user operations
/// </summary>
public class UserRepository : IUserRepository
{
    private readonly TaxSummaryDbContext _context;

    public UserRepository(TaxSummaryDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Result<User>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                .Include(u => u.RefreshTokens)
                .Include(u => u.UserOffices)
                    .ThenInclude(uo => uo.Office)
                .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

            if (user == null)
                return Result.Failure<User>("کاربر یافت نشد");

            return Result.Success(user);
        }
        catch (Exception ex)
        {
            return Result.Failure<User>($"خطا در دریافت کاربر: {ex.Message}");
        }
    }

    public async Task<Result<User>> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                .Include(u => u.RefreshTokens)
                .Include(u => u.UserOffices)
                    .ThenInclude(uo => uo.Office)
                .FirstOrDefaultAsync(u => u.Username == username, cancellationToken);

            if (user == null)
                return Result.Failure<User>("کاربر یافت نشد");

            return Result.Success(user);
        }
        catch (Exception ex)
        {
            return Result.Failure<User>($"خطا در دریافت کاربر: {ex.Message}");
        }
    }

    public async Task<Result<User>> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Employee)
                .Include(u => u.RefreshTokens)
                .Include(u => u.UserOffices)
                    .ThenInclude(uo => uo.Office)
                .FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant(), cancellationToken);

            if (user == null)
                return Result.Failure<User>("کاربر یافت نشد");

            return Result.Success(user);
        }
        catch (Exception ex)
        {
            return Result.Failure<User>($"خطا در دریافت کاربر: {ex.Message}");
        }
    }

    public async Task<Result<IEnumerable<User>>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var users = await _context.Users
                .Include(u => u.Employee)
                .Include(u => u.UserOffices)
                    .ThenInclude(uo => uo.Office)
                .ToListAsync(cancellationToken);

            return Result.Success<IEnumerable<User>>(users);
        }
        catch (Exception ex)
        {
            return Result.Failure<IEnumerable<User>>($"خطا در دریافت لیست کاربران: {ex.Message}");
        }
    }

    public async Task<Result<(IEnumerable<User> Items, int TotalCount)>> GetPagedAsync(
        string? search = null,
        string? role = null,
        Guid? officeId = null,
        int page = 1,
        int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 200) pageSize = 25;

            var query = _context.Users
                .AsNoTracking()
                .Include(u => u.Employee)
                .Include(u => u.UserOffices)
                    .ThenInclude(uo => uo.Office)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(role))
            {
                var roleTrimmed = role.Trim();
                query = query.Where(u => u.Role == roleTrimmed);
            }

            if (officeId.HasValue && officeId.Value != Guid.Empty)
            {
                query = query.Where(u => u.UserOffices.Any(uo => uo.OfficeId == officeId.Value) ||
                                         (u.Employee != null && u.Employee.OfficeId == officeId.Value));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                var termLower = term.ToLower();

                query = query.Where(u =>
                    u.Username.Contains(termLower) ||
                    (u.Email != null && u.Email.Contains(termLower)) ||
                    (u.Employee != null && (
                        u.Employee.PersonnelNumber.Contains(term) ||
                        u.Employee.FirstName.Contains(term) ||
                        u.Employee.LastName.Contains(term) ||
                        (u.Employee.NationalId != null && u.Employee.NationalId.Contains(term)) ||
                        u.Employee.CurrentPosition.Contains(term) ||
                        u.Employee.ServiceUnit.Contains(term)
                    )) ||
                    u.UserOffices.Any(uo => uo.Office.Name.Contains(term) || uo.Office.Code.Contains(term))
                );
            }

            var totalCount = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(u => u.Username)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return Result.Success<(IEnumerable<User> Items, int TotalCount)>((items, totalCount));
        }
        catch (Exception ex)
        {
            return Result.Failure<(IEnumerable<User> Items, int TotalCount)>($"خطا در دریافت کاربران: {ex.Message}");
        }
    }

    public async Task<Result<Guid>> CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.Users.AddAsync(user, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success(user.Id);
        }
        catch (Exception ex)
        {
            return Result.Failure<Guid>($"خطا در ایجاد کاربر: {ex.Message}");
        }
    }

    public async Task<Result> UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        try
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"خطا در بروزرسانی کاربر: {ex.Message}");
        }
    }

    public async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
            if (user == null)
                return Result.Failure("کاربر یافت نشد");

            _context.Users.Remove(user);
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"خطا در حذف کاربر: {ex.Message}");
        }
    }

    public async Task<Result<RefreshToken>> GetRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        try
        {
            var token = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

            if (token == null)
                return Result.Failure<RefreshToken>("توکن یافت نشد");

            return Result.Success(token);
        }
        catch (Exception ex)
        {
            return Result.Failure<RefreshToken>($"خطا در دریافت توکن: {ex.Message}");
        }
    }

    public async Task<Result> SaveRefreshTokenAsync(RefreshToken token, CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.RefreshTokens.AddAsync(token, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"خطا در ذخیره توکن: {ex.Message}");
        }
    }

    public async Task<Result> RevokeRefreshTokenAsync(string tokenHash, string? replacedByToken = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var token = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken);

            if (token == null)
                return Result.Failure("توکن یافت نشد");

            token.Revoke(replacedByToken);
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"خطا در باطل کردن توکن: {ex.Message}");
        }
    }

    public async Task<Result> RevokeAllUserTokensAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var tokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var token in tokens)
            {
                token.Revoke();
            }

            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"خطا در باطل کردن توکن‌ها: {ex.Message}");
        }
    }

    public async Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AnyAsync(u => u.Username == username, cancellationToken);
    }

    public async Task<bool> EmailExistsAsync(string? email, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        return await _context.Users
            .AnyAsync(u => u.Email == email.ToLowerInvariant(), cancellationToken);
    }

    public async Task<Result> UpdateUserOfficesAsync(Guid userId, IEnumerable<Guid> officeIds, CancellationToken cancellationToken = default)
    {
        try
        {
            var existing = await _context.UserOffices
                .Where(uo => uo.UserId == userId)
                .ToListAsync(cancellationToken);

            _context.UserOffices.RemoveRange(existing);

            if (officeIds != null)
            {
                var newAssignments = officeIds
                    .Distinct()
                    .Select(officeId => UserOffice.Create(userId, officeId))
                    .ToList();

                if (newAssignments.Any())
                {
                    await _context.UserOffices.AddRangeAsync(newAssignments, cancellationToken);
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (Exception ex)
        {
            return Result.Failure($"خطا در بروزرسانی ادارات کاربر: {ex.Message}");
        }
    }
}

