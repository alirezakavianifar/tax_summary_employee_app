using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaxSummary.Application.DTOs.Branding;
using TaxSummary.Application.Services;

namespace TaxSummary.Api.Controllers;

/// <summary>
/// API Controller for managing system-wide organization branding, logos, and global titles.
/// </summary>
[ApiController]
[Route("api/system-settings")]
[EnableRateLimiting("GeneralPolicy")]
public class SystemSettingsController : ControllerBase
{
    private readonly ISystemSettingsService _systemSettingsService;
    private readonly ILogger<SystemSettingsController> _logger;

    public SystemSettingsController(
        ISystemSettingsService systemSettingsService,
        ILogger<SystemSettingsController> logger)
    {
        _systemSettingsService = systemSettingsService ?? throw new ArgumentNullException(nameof(systemSettingsService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Retrieves current system branding and organizational title settings.
    /// Accessible anonymously so unauthenticated views (like login page and topbar) can load branding.
    /// </summary>
    [HttpGet("branding")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SystemSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SystemSettingsDto>> GetBrandingSettings(CancellationToken ct = default)
    {
        var result = await _systemSettingsService.GetBrandingSettingsAsync(ct);
        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }
        return Ok(result.Value);
    }

    /// <summary>
    /// Updates system branding parameters (organization name, system title, reporting module titles).
    /// Restricted to administrators.
    /// </summary>
    [HttpPut("branding")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SystemSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SystemSettingsDto>> UpdateBranding(
        [FromBody] UpdateSystemSettingsDto request,
        CancellationToken ct = default)
    {
        var updatedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("username")?.Value;
        var result = await _systemSettingsService.UpdateBrandingSettingsAsync(request, updatedBy, ct);
        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }
        return Ok(result.Value);
    }

    /// <summary>
    /// Uploads a new organization logo image and updates system branding.
    /// Restricted to administrators.
    /// </summary>
    [HttpPost("branding/logo")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SystemSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SystemSettingsDto>> UploadLogo(
        [FromForm] IFormFile file,
        CancellationToken ct = default)
    {
        var updatedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("username")?.Value;
        var result = await _systemSettingsService.UpdateLogoAsync(file, updatedBy, ct);
        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }
        return Ok(result.Value);
    }

    /// <summary>
    /// Resets all system branding back to default Khuzestan Tax Directorate values.
    /// Restricted to administrators.
    /// </summary>
    [HttpPost("branding/reset")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(SystemSettingsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SystemSettingsDto>> ResetBranding(CancellationToken ct = default)
    {
        var updatedBy = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("username")?.Value;
        var result = await _systemSettingsService.ResetToDefaultsAsync(updatedBy, ct);
        if (result.IsFailure)
        {
            return BadRequest(new { error = result.Error });
        }
        return Ok(result.Value);
    }
}

