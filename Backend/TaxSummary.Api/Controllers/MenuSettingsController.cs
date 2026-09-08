using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaxSummary.Application.DTOs.MenuSettings;
using TaxSummary.Application.Services;

namespace TaxSummary.Api.Controllers;

/// <summary>
/// API Controller for querying and managing dynamic navigation menus and module visibility.
/// </summary>
[ApiController]
[Route("api/menu-settings")]
[EnableRateLimiting("GeneralPolicy")]
public class MenuSettingsController : ControllerBase
{
    private readonly IMenuSettingsService _menuSettingsService;
    private readonly ILogger<MenuSettingsController> _logger;

    public MenuSettingsController(
        IMenuSettingsService menuSettingsService,
        ILogger<MenuSettingsController> logger)
    {
        _menuSettingsService = menuSettingsService ?? throw new ArgumentNullException(nameof(menuSettingsService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets menu items for the current user based on their authentication status and role.
    /// If user is Admin and ?all=true is passed, returns all menu settings.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<MenuSettingDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MenuSettingDto>>> GetMenuSettings(
        [FromQuery] bool all = false,
        CancellationToken ct = default)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        bool isAdmin = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);

        if (all && isAdmin)
        {
            var allSettings = await _menuSettingsService.GetAllSettingsAsync(ct);
            return Ok(allSettings);
        }

        var visibleSettings = await _menuSettingsService.GetVisibleSettingsForRoleAsync(role, ct);
        return Ok(visibleSettings);
    }

    /// <summary>
    /// Retrieves all menu settings including hidden items for administrators.
    /// </summary>
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<MenuSettingDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MenuSettingDto>>> GetAllSettingsForAdmin(CancellationToken ct)
    {
        var settings = await _menuSettingsService.GetAllSettingsAsync(ct);
        return Ok(settings);
    }

    /// <summary>
    /// Updates visibility and access flags for menu options. Restricted to Admins.
    /// </summary>
    [HttpPut]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<MenuSettingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<MenuSettingDto>>> UpdateSettings(
        [FromBody] UpdateMenuSettingsRequestDto request,
        CancellationToken ct)
    {
        if (request == null || request.Settings == null)
        {
            return BadRequest(new { error = "داده‌های درخواست نامعتبر است" });
        }

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? currentUserId = Guid.TryParse(userIdString, out var parsedGuid) ? parsedGuid : null;

        var updatedSettings = await _menuSettingsService.UpdateSettingsAsync(request, currentUserId, ct);
        return Ok(updatedSettings);
    }

    /// <summary>
    /// Resets all menu settings back to system defaults. Restricted to Admins.
    /// </summary>
    [HttpPost("reset")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<MenuSettingDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MenuSettingDto>>> ResetToDefaults(CancellationToken ct)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid? currentUserId = Guid.TryParse(userIdString, out var parsedGuid) ? parsedGuid : null;

        await _menuSettingsService.ResetToDefaultsAsync(currentUserId, ct);
        var settings = await _menuSettingsService.GetAllSettingsAsync(ct);
        return Ok(settings);
    }
}
