using TaxSummary.Application.DTOs;
using TaxSummary.Application.DTOs.Auth;
using TaxSummary.Application.DTOs.Common;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services;

public interface IUserService
{
    Task<Result<IEnumerable<UserDto>>> GetAllUsersAsync(CancellationToken cancellationToken = default);
    Task<Result<PagedResultDto<UserDto>>> GetUsersPagedAsync(
        string? search = null,
        string? role = null,
        Guid? officeId = null,
        int page = 1,
        int pageSize = 25,
        CancellationToken cancellationToken = default);
    Task<Result<UserDto>> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result> UpdateUserAsync(Guid id, UpdateUserRequestDto request, CancellationToken cancellationToken = default);
    Task<Result> DeleteUserAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result> ResetPasswordAsync(Guid id, string newPassword, CancellationToken cancellationToken = default);
    Task<Result> UnlockUserAsync(Guid id, CancellationToken cancellationToken = default);
}
