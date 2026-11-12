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

        var updatedSettings = await _menuSettingsService.UpdateSettingsAsync(request, GetCurrentUserId(), ct);
        return Ok(updatedSettings);
    }

    /// <summary>
    /// Creates a new custom menu option or module. Restricted to Admins.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<MenuSettingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<MenuSettingDto>>> CreateSetting(
        [FromBody] CreateMenuSettingRequestDto request,
        CancellationToken ct)
    {
        if (request == null)
        {
            return BadRequest(new { error = "اطلاعات گزینه منو نامعتبر است" });
        }

        return await ExecuteMutationAsync(() =>
            _menuSettingsService.CreateSettingAsync(request, GetCurrentUserId(), ct));
    }

    /// <summary>
    /// Updates metadata and access settings for a custom menu option. Restricted to Admins.
    /// </summary>
    [HttpPut("{menuKey}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<MenuSettingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<MenuSettingDto>>> UpdateSettingMetadata(
        string menuKey,
        [FromBody] UpdateMenuSettingMetadataDto request,
        CancellationToken ct)
    {
        if (request == null)
        {
            return BadRequest(new { error = "اطلاعات ویرایش منو نامعتبر است" });
        }

        return await ExecuteMutationAsync(() =>
            _menuSettingsService.UpdateSettingMetadataAsync(menuKey, request, GetCurrentUserId(), ct));
    }

    /// <summary>
    /// Deletes a custom menu option (built-in options cannot be deleted). Restricted to Admins.
    /// </summary>
    [HttpDelete("{menuKey}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<MenuSettingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<MenuSettingDto>>> DeleteSetting(
        string menuKey,
        CancellationToken ct)
    {
        return await ExecuteMutationAsync(() =>
            _menuSettingsService.DeleteSettingAsync(menuKey, GetCurrentUserId(), ct));
    }

    /// <summary>
    /// Resets built-in menu settings back to system defaults while preserving custom items. Restricted to Admins.
    /// </summary>
    [HttpPost("reset")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(List<MenuSettingDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MenuSettingDto>>> ResetToDefaults(CancellationToken ct)
    {
        await _menuSettingsService.ResetToDefaultsAsync(GetCurrentUserId(), ct);
        var settings = await _menuSettingsService.GetAllSettingsAsync(ct);
        return Ok(settings);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdString, out var parsedGuid) ? parsedGuid : null;
    }

    private async Task<ActionResult<List<MenuSettingDto>>> ExecuteMutationAsync(Func<Task<List<MenuSettingDto>>> action)
    {
        try
        {
            var result = await action();
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
