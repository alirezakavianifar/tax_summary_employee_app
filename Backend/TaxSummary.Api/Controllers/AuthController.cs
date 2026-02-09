using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Application.DTOs.Auth;
using TaxSummary.Application.Services;

namespace TaxSummary.Api.Controllers;

/// <summary>
/// Authentication and authorization endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService ?? throw new ArgumentNullException(nameof(authService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Login with username and password
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>Access token and user information</returns>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers["User-Agent"].ToString();

        var result = await _authService.LoginAsync(request, ipAddress, userAgent);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed login attempt for username: {Username}", request.Username);
            return Unauthorized(new { error = result.Error });
        }

        _logger.LogInformation("User {Username} logged in successfully", request.Username);

        // Set refresh token in HTTP-only cookie
        SetRefreshTokenCookie(result.Value!.AccessToken); // Placeholder - will store actual refresh token

        return Ok(result.Value);
    }

    /// <summary>
    /// Register a new user (Admin only)
    /// </summary>
    /// <param name="request">Registration information</param>
    /// <returns>Created user information</returns>
    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        var result = await _authService.RegisterAsync(request);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        _logger.LogInformation("New user registered: {Username} with role {Role}", request.Username, request.Role);

        return CreatedAtAction(nameof(GetCurrentUser), new { }, result.Value);
    }

    /// <summary>
    /// Refresh access token using refresh token from cookie
    /// </summary>
    /// <returns>New access token and user information</returns>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { error = "توکن یافت نشد" });
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers["User-Agent"].ToString();

        var result = await _authService.RefreshTokenAsync(refreshToken, ipAddress, userAgent);

        if (result.IsFailure)
        {
            return Unauthorized(new { error = result.Error });
        }

        // Update refresh token cookie
        SetRefreshTokenCookie(refreshToken); // Will be replaced with new token

        return Ok(result.Value);
    }

    /// <summary>
    /// Logout and revoke refresh token
    /// </summary>
    /// <returns>Success message</returns>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.RevokeTokenAsync(refreshToken);
        }

        // Remove refresh token cookie
        Response.Cookies.Delete("refreshToken");

        _logger.LogInformation("User logged out");

        return Ok(new { message = "خروج موفقیت‌آمیز بود" });
    }

    /// <summary>
    /// Change current user's password
    /// </summary>
    /// <param name="request">Current and new password</param>
    /// <returns>Success message</returns>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "کاربر احراز هویت نشده است" });
        }

        var result = await _authService.ChangePasswordAsync(userId, request);

        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }

        _logger.LogInformation("User {UserId} changed password", userId);

        // Revoke current refresh token since password changed
        var refreshToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(refreshToken))
        {
            Response.Cookies.Delete("refreshToken");
        }

        return Ok(new { message = "رمز عبور با موفقیت تغییر کرد. لطفاً مجدداً وارد شوید" });
    }

    /// <summary>
    /// Get current authenticated user's information
    /// </summary>
    /// <returns>User information</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { error = "کاربر احراز هویت نشده است" });
        }

        var result = await _authService.GetCurrentUserAsync(userId);

        if (result.IsFailure)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Set refresh token in HTTP-only cookie
    /// </summary>
    private void SetRefreshTokenCookie(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Requires HTTPS
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        };

        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}
