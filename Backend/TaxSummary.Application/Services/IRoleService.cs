using TaxSummary.Application.DTOs.Roles;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services;

public interface IRoleService
{
    Task<Result<IEnumerable<RoleDto>>> GetActiveRolesAsync(CancellationToken cancellationToken = default);
    Task<Result<IEnumerable<RoleDto>>> GetAllRolesForManagementAsync(CancellationToken cancellationToken = default);
    Task<Result<RoleDto>> GetRoleByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result<RoleDto>> CreateRoleAsync(CreateRoleRequestDto request, CancellationToken cancellationToken = default);
    Task<Result<RoleDto>> UpdateRoleAsync(Guid id, UpdateRoleRequestDto request, CancellationToken cancellationToken = default);
    Task<Result> DeleteRoleAsync(Guid id, CancellationToken cancellationToken = default);
}
