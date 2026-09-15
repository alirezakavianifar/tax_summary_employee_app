using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Interfaces;

/// <summary>
/// Repository interface for organizational role entities
/// </summary>
public interface IRoleRepository
{
    Task<Result<Role>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<Role>> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<Role>>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<bool> ExistsByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<int> GetUserCountByRoleNameAsync(string roleName, CancellationToken cancellationToken = default);
    Task<Result<Role>> AddAsync(Role role, CancellationToken cancellationToken = default);
    Task<Result<Role>> UpdateAsync(Role role, CancellationToken cancellationToken = default);
    Task<Result<bool>> DeleteAsync(Role role, CancellationToken cancellationToken = default);
}
