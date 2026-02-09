using AutoMapper;
using TaxSummary.Application.DTOs;
using TaxSummary.Application.DTOs.Auth;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IMapper _mapper;

    public UserService(
        IUserRepository userRepository,
        IEmployeeRepository employeeRepository,
        IMapper mapper)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _employeeRepository = employeeRepository ?? throw new ArgumentNullException(nameof(employeeRepository));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }

    public async Task<Result<IEnumerable<UserDto>>> GetAllUsersAsync(CancellationToken cancellationToken = default)
    {
        var result = await _userRepository.GetAllAsync(cancellationToken);

        if (result.IsFailure)
            return Result.Failure<IEnumerable<UserDto>>(result.Error);

        var userDtos = _mapper.Map<IEnumerable<UserDto>>(result.Value);
        return Result.Success(userDtos);
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

        // Check email uniqueness if changed
        if (user.Email != request.Email.ToLowerInvariant())
        {
            if (await _userRepository.EmailExistsAsync(request.Email, cancellationToken))
                return Result.Failure("ایمیل وارد شده تکراری است");
        }

        // Validate role
        if (!new[] { "Admin", "Manager", "Employee" }.Contains(request.Role))
            return Result.Failure("نقش کاربری نامعتبر است");

        // Update user
        user.UpdateDetails(request.Email, request.Role, request.IsActive, request.EmployeeId);

        return await _userRepository.UpdateAsync(user, cancellationToken);
    }

    public async Task<Result> DeleteUserAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var userResult = await _userRepository.GetByIdAsync(id, cancellationToken);
        if (userResult.IsFailure)
            return Result.Failure("کاربر یافت نشد");
            
        return await _userRepository.DeleteAsync(id, cancellationToken);
    }
}
