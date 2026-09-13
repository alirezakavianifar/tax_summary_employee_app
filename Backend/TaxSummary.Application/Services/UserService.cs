using AutoMapper;
using TaxSummary.Application.DTOs;
using TaxSummary.Application.DTOs.Auth;
using TaxSummary.Application.DTOs.Common;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IMapper _mapper;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(
        IUserRepository userRepository,
        IEmployeeRepository employeeRepository,
        IMapper mapper,
        IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
    }

    public async Task<Result<IEnumerable<UserDto>>> GetAllUsersAsync(CancellationToken cancellationToken = default)
    {
        var result = await _userRepository.GetAllAsync(cancellationToken);

        if (result.IsFailure)
            return Result.Failure<IEnumerable<UserDto>>(result.Error);

        var userDtos = _mapper.Map<IEnumerable<UserDto>>(result.Value);
        return Result.Success(userDtos);
    }

    public async Task<Result<PagedResultDto<UserDto>>> GetUsersPagedAsync(
        string? search = null,
        string? role = null,
        Guid? officeId = null,
        int page = 1,
        int pageSize = 25,
        CancellationToken cancellationToken = default)
    {
        var result = await _userRepository.GetPagedAsync(search, role, officeId, page, pageSize, cancellationToken);

        if (result.IsFailure)
            return Result.Failure<PagedResultDto<UserDto>>(result.Error);

        var (items, totalCount) = result.Value;
        var userDtos = _mapper.Map<IEnumerable<UserDto>>(items);

        var pagedResult = new PagedResultDto<UserDto>
        {
            Items = userDtos,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };

        return Result.Success(pagedResult);
    }

    public async Task<Result<UserDto>> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _userRepository.GetByIdAsync(id, cancellationToken);

        if (result.IsFailure)
            return Result.Failure<UserDto>(result.Error);

        var userDto = _mapper.Map<UserDto>(result.Value);
        return Result.Success(userDto);
    }

    public async Task<Result> UpdateUserAsync(Guid id, UpdateUserRequestDto request, CancellationToken cancellationToken = default)
    {
        var userResult = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (userResult.IsFailure)
            return Result.Failure(userResult.Error);

        var user = userResult.Value;

        // Check username uniqueness if changed
        if (!string.IsNullOrWhiteSpace(request.Username) && !string.Equals(user.Username, request.Username, StringComparison.OrdinalIgnoreCase))
        {
            var normalizedUsername = request.Username.Trim().ToLowerInvariant();
            if (await _userRepository.UsernameExistsAsync(normalizedUsername, cancellationToken))
            {
                return Result.Failure("این نام کاربری (کد ملی) قبلاً ثبت شده است");
            }
        }

        // Check email uniqueness if changed
        var normalizedRequestEmail = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLowerInvariant();
        if (user.Email != normalizedRequestEmail)
        {
            if (!string.IsNullOrWhiteSpace(normalizedRequestEmail) && await _userRepository.EmailExistsAsync(normalizedRequestEmail, cancellationToken))
                return Result.Failure("ایمیل وارد شده تکراری است");
        }

        // Validate role
        var validRoles = new[] { "Admin", "OfficeHead", "GroupHead", "Expert", "ITSpecialist", "Manager", "Employee" };
        if (!validRoles.Contains(request.Role, StringComparer.OrdinalIgnoreCase))
            return Result.Failure("نقش کاربری نامعتبر است");

        // Update user
        user.UpdateDetails(request.Email, request.Role, request.IsActive, request.EmployeeId, request.Username);

        var updateResult = await _userRepository.UpdateAsync(user, cancellationToken);
        if (updateResult.IsFailure)
            return updateResult;

        if (request.OfficeIds != null)
        {
            var officeResult = await _userRepository.UpdateUserOfficesAsync(user.Id, request.OfficeIds, cancellationToken);
            if (officeResult.IsFailure)
                return officeResult;
        }

        return Result.Success();
    }

    public async Task<Result> DeleteUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var userResult = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (userResult.IsFailure)
            return Result.Failure("کاربر یافت نشد");
            
        return await _userRepository.DeleteAsync(id, cancellationToken);
    }

    public async Task<Result> ResetPasswordAsync(Guid id, string newPassword, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(newPassword))
            return Result.Failure("رمز عبور جدید نمی‌تواند خالی باشد");

        if (newPassword.Length < 6)
            return Result.Failure("رمز عبور باید حداقل ۶ کاراکتر باشد");

        var userResult = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (userResult.IsFailure)
            return Result.Failure("کاربر یافت نشد");

        var user = userResult.Value;

        // Hash new password using BCrypt
        var newPasswordHash = _passwordHasher.HashPassword(newPassword);

        // Update password, require change on next login, and clear any lockouts
        user.UpdatePassword(newPasswordHash);
        user.RequirePasswordChange();
        user.UnlockAccount();

        var updateResult = await _userRepository.UpdateAsync(user, cancellationToken);
        if (updateResult.IsFailure)
            return Result.Failure("خطا در بازنشانی رمز عبور");

        // Revoke all existing sessions/refresh tokens for this user
        await _userRepository.RevokeAllUserTokensAsync(id, cancellationToken);

        return Result.Success();
    }

    public async Task<Result> UnlockUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var userResult = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (userResult.IsFailure)
            return Result.Failure("کاربر یافت نشد");

        var user = userResult.Value;
        user.UnlockAccount();

        return await _userRepository.UpdateAsync(user, cancellationToken);
    }
}
