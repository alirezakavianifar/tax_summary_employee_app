using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaxSummary.Application.DTOs;
using TaxSummary.Application.DTOs.Auth;
using TaxSummary.Application.Services;

namespace TaxSummary.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
[EnableRateLimiting("GeneralPolicy")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IAuthService _authService;

    public UsersController(IUserService userService, IAuthService authService)
    {
        _userService = userService;
        _authService = authService;
    }

    /// <summary>
    /// Get all users
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        // Get user agent and IP for logging if needed, or just pass cancellation token
        var result = await _userService.GetAllUsersAsync(cancellationToken);
        
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });
            
        return Ok(result.Value);
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _userService.GetUserByIdAsync(id, cancellationToken);
        
        if (result.IsFailure)
            return NotFound(new { error = result.Error });
            
        return Ok(result.Value);
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] RegisterRequestDto request)
    {
        // Reusing AuthService logic since creating a user is same as registration
        // Just protected by Admin role here
        // We could also reuse AuthController.Register, but having it here makes REST API cleaner
        
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        // UserAgent not strictly needed for registration but AuthService might log it if we passed it?
        // RegisterAsync in AuthService currently doesn't take IP/UserAgent, only Login/Refresh do.
        
        var result = await _authService.RegisterAsync(request);
        
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });
            
        return CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value);
    }

    /// <summary>
    /// Update a user
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _userService.UpdateUserAsync(id, request, cancellationToken);
        
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });
            
        return Ok(new { message = "کاربر با موفقیت بروزرسانی شد" });
    }

    /// <summary>
    /// Delete a user
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _userService.DeleteUserAsync(id, cancellationToken);
        
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });
            
        return Ok(new { message = "کاربر با موفقیت حذف شد" });
    }

    /// <summary>
    /// Reset user password (Admin only)
    /// </summary>
    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequestDto request, CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new { error = "رمز عبور جدید الزامی است" });

        var result = await _userService.ResetPasswordAsync(id, request.NewPassword, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = "رمز عبور با موفقیت بازنشانی شد" });
    }

    /// <summary>
    /// Unlock locked user account (Admin only)
    /// </summary>
    [HttpPost("{id}/unlock")]
    public async Task<IActionResult> Unlock(Guid id, CancellationToken cancellationToken)
    {
        var result = await _userService.UnlockUserAsync(id, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = "قفل حساب کاربری با موفقیت باز شد" });
    }
}
