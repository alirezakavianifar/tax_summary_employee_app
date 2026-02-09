using AutoMapper;
using Microsoft.Extensions.Configuration;
using TaxSummary.Application.DTOs.Auth;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Application.Services;

/// <summary>
/// Authentication service implementation
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;
    private readonly int _maxFailedAttempts;
    private readonly int _accessTokenExpirationMinutes;
    private readonly int _refreshTokenExpirationDays;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService,
        IMapper mapper,
        IConfiguration configuration)
    {
        _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
        _jwtTokenService = jwtTokenService ?? throw new ArgumentNullException(nameof(jwtTokenService));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));

        _maxFailedAttempts = int.Parse(configuration["Authentication:MaxFailedAttempts"] ?? "5");
        _accessTokenExpirationMinutes = int.Parse(configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "15");
        _refreshTokenExpirationDays = int.Parse(configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7");
    }

    public async Task<Result<LoginResponseDto>> LoginAsync(
        LoginRequestDto request,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default)
    {
        // Find user by username
        var userResult = await _userRepository.GetByUsernameAsync(request.Username, cancellationToken);
        if (userResult.IsFailure)
        {
            return Result.Failure<LoginResponseDto>("نام کاربری یا رمز عبور اشتباه است");
        }

        var user = userResult.Value!;

        // Check if account is locked
        if (user.IsLockedOut())
        {
            return Result.Failure<LoginResponseDto>($"حساب کاربری به دلیل تلاش‌های ناموفق متعدد قفل شده است. لطفاً بعد از {user.LockoutEnd:yyyy-MM-dd HH:mm} مجدداً تلاش کنید");
        }

        // Check if account is active
        if (!user.IsActive)
        {
            return Result.Failure<LoginResponseDto>("حساب کاربری غیرفعال است. لطفاً با مدیر سیستم تماس بگیرید");
        }

        // Verify password
        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            // Increment failed login attempts
            user.IncrementFailedLoginAttempts();

            // Lock account if max attempts reached
            if (user.FailedLoginAttempts >= _maxFailedAttempts)
            {
                user.LockAccount(TimeSpan.FromMinutes(30));
                await _userRepository.UpdateAsync(user, cancellationToken);
                return Result.Failure<LoginResponseDto>("تعداد تلاش‌های ناموفق از حد مجاز گذشته است. حساب کاربری برای 30 دقیقه قفل شد");
            }

            await _userRepository.UpdateAsync(user, cancellationToken);
            var remainingAttempts = _maxFailedAttempts - user.FailedLoginAttempts;
            return Result.Failure<LoginResponseDto>($"نام کاربری یا رمز عبور اشتباه است. تعداد تلاش‌های باقی‌مانده: {remainingAttempts}");
        }

        // Reset failed attempts on successful login
        user.ResetFailedLoginAttempts();
        await _userRepository.UpdateAsync(user, cancellationToken);

        // Generate tokens
        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var refreshTokenString = _jwtTokenService.GenerateRefreshToken();

        // Create refresh token entity (store token as plain text - it's already cryptographically secure)
        var refreshToken = RefreshToken.Create(
            userId: user.Id,
            tokenHash: refreshTokenString, // TokenHash field now stores plain token
            expiresAt: DateTime.UtcNow.AddDays(request.RememberMe ? _refreshTokenExpirationDays * 2 : _refreshTokenExpirationDays),
            ipAddress: ipAddress,
            userAgent: userAgent
        );

        // Save refresh token
        var saveResult = await _userRepository.SaveRefreshTokenAsync(refreshToken, cancellationToken);
        if (saveResult.IsFailure)
        {
            return Result.Failure<LoginResponseDto>("خطا در ذخیره توکن. لطفاً مجدداً تلاش کنید");
        }

        // Map user to DTO
        var userDto = _mapper.Map<UserDto>(user);

        // Return response
        var response = new LoginResponseDto
        {
            AccessToken = accessToken,
            TokenType = "Bearer",
            ExpiresIn = _accessTokenExpirationMinutes * 60, // Convert to seconds
            User = userDto
        };

        return Result.Success(response);
    }

    public async Task<Result<UserDto>> RegisterAsync(
        RegisterRequestDto request,
        CancellationToken cancellationToken = default)
    {
        // Check if username already exists
        if (await _userRepository.UsernameExistsAsync(request.Username, cancellationToken))
        {
            return Result.Failure<UserDto>("این نام کاربری قبلاً استفاده شده است");
        }

        // Check if email already exists
        if (await _userRepository.EmailExistsAsync(request.Email, cancellationToken))
        {
            return Result.Failure<UserDto>("این ایمیل قبلاً استفاده شده است");
        }

        // Hash password
        var passwordHash = _passwordHasher.HashPassword(request.Password);

        // Create user entity
        var user = User.Create(
            username: request.Username,
            email: request.Email,
            passwordHash: passwordHash,
            role: request.Role,
            employeeId: request.EmployeeId
        );

        // Save user
        var createResult = await _userRepository.CreateAsync(user, cancellationToken);
        if (createResult.IsFailure)
        {
            return Result.Failure<UserDto>("خطا در ایجاد کاربر. لطفاً مجدداً تلاش کنید");
        }

        // Reload user with employee data
        var userResult = await _userRepository.GetByIdAsync(user.Id, cancellationToken);
        if (userResult.IsFailure)
        {
            return Result.Failure<UserDto>("کاربر ایجاد شد اما خطا در بازیابی اطلاعات رخ داد");
        }

        // Map to DTO
        var userDto = _mapper.Map<UserDto>(userResult.Value);

        return Result.Success(userDto);
    }

    public async Task<Result<LoginResponseDto>> RefreshTokenAsync(
        string refreshToken,
        string? ipAddress,
        string? userAgent,
        CancellationToken cancellationToken = default)
    {
        // Get token from database (stored as plain text since it's already cryptographically secure)
        var tokenResult = await _userRepository.GetRefreshTokenAsync(refreshToken, cancellationToken);
        if (tokenResult.IsFailure)
        {
            return Result.Failure<LoginResponseDto>("توکن نامعتبر یا منقضی شده است");
        }

        var token = tokenResult.Value!;

        // Check if token is expired
        if (token.IsExpired())
        {
            return Result.Failure<LoginResponseDto>("توکن منقضی شده است. لطفاً مجدداً وارد شوید");
        }

        // Check if token is revoked
        if (!token.IsActive())
        {
            return Result.Failure<LoginResponseDto>("توکن باطل شده است. لطفاً مجدداً وارد شوید");
        }

        // Get user
        var userResult = await _userRepository.GetByIdAsync(token.UserId, cancellationToken);
        if (userResult.IsFailure)
        {
            return Result.Failure<LoginResponseDto>("کاربر یافت نشد");
        }

        var user = userResult.Value!;

        // Check if account is active
        if (!user.IsActive)
        {
            return Result.Failure<LoginResponseDto>("حساب کاربری غیرفعال است");
        }

        // Generate new tokens
        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var newRefreshTokenString = _jwtTokenService.GenerateRefreshToken();

        // Create new refresh token entity
        var newRefreshToken = RefreshToken.Create(
            userId: user.Id,
            tokenHash: newRefreshTokenString, // Store as plain text
            expiresAt: DateTime.UtcNow.AddDays(_refreshTokenExpirationDays),
            ipAddress: ipAddress,
            userAgent: userAgent
        );

        // Revoke old token and replace with new one
        await _userRepository.RevokeRefreshTokenAsync(refreshToken, newRefreshTokenString, cancellationToken);

        // Save new token
        var saveResult = await _userRepository.SaveRefreshTokenAsync(newRefreshToken, cancellationToken);
        if (saveResult.IsFailure)
        {
            return Result.Failure<LoginResponseDto>("خطا در ذخیره توکن جدید");
        }

        // Map user to DTO
        var userDto = _mapper.Map<UserDto>(user);

        // Return response
        var response = new LoginResponseDto
        {
            AccessToken = accessToken,
            TokenType = "Bearer",
            ExpiresIn = _accessTokenExpirationMinutes * 60,
            User = userDto
        };

        return Result.Success(response);
    }

    public async Task<Result> RevokeTokenAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        // Get token from database
        var tokenResult = await _userRepository.GetRefreshTokenAsync(refreshToken, cancellationToken);
        if (tokenResult.IsFailure)
        {
            // Token not found or already revoked - this is okay for logout
            return Result.Success();
        }

        // Revoke the token
        await _userRepository.RevokeRefreshTokenAsync(refreshToken, cancellationToken: cancellationToken);

        return Result.Success();
    }

    public async Task<Result> ChangePasswordAsync(
        Guid userId,
        ChangePasswordRequestDto request,
        CancellationToken cancellationToken = default)
    {
        // Get user
        var userResult = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (userResult.IsFailure)
        {
            return Result.Failure("کاربر یافت نشد");
        }

        var user = userResult.Value!;

        // Verify current password
        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            return Result.Failure("رمز عبور فعلی اشتباه است");
        }

        // Hash new password
        var newPasswordHash = _passwordHasher.HashPassword(request.NewPassword);

        // Update password
        user.UpdatePassword(newPasswordHash);

        // Save changes
        var updateResult = await _userRepository.UpdateAsync(user, cancellationToken);
        if (updateResult.IsFailure)
        {
            return Result.Failure("خطا در بروزرسانی رمز عبور");
        }

        // Revoke all refresh tokens for security
        await _userRepository.RevokeAllUserTokensAsync(userId, cancellationToken);

        return Result.Success();
    }

    public async Task<Result<UserDto>> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var userResult = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (userResult.IsFailure)
        {
            return Result.Failure<UserDto>("کاربر یافت نشد");
        }

        var userDto = _mapper.Map<UserDto>(userResult.Value);
        return Result.Success(userDto);
    }
}
