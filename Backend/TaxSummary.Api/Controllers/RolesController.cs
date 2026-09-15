using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaxSummary.Application.DTOs.Roles;
using TaxSummary.Application.Services;

namespace TaxSummary.Api.Controllers;

[ApiController]
[Route("api/roles")]
[EnableRateLimiting("GeneralPolicy")]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;
    private readonly ILogger<RolesController> _logger;

    public RolesController(IRoleService roleService, ILogger<RolesController> logger)
    {
        _roleService = roleService ?? throw new ArgumentNullException(nameof(roleService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get all active roles for dropdown selection (accessible to authenticated users)
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<RoleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveRoles(CancellationToken cancellationToken = default)
    {
        var result = await _roleService.GetActiveRolesAsync(cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Get all roles with user counts and management metadata (Admin only)
    /// </summary>
    [HttpGet("management")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<RoleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllForManagement(CancellationToken cancellationToken = default)
    {
        var result = await _roleService.GetAllRolesForManagementAsync(cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Get role by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _roleService.GetRoleByIdAsync(id, cancellationToken);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Create a new organizational role (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequestDto request, CancellationToken cancellationToken = default)
    {
        var result = await _roleService.CreateRoleAsync(request, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value);
    }

    /// <summary>
    /// Update an existing role's title, description, order, or active status (Admin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoleRequestDto request, CancellationToken cancellationToken = default)
    {
        var result = await _roleService.UpdateRoleAsync(id, request, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Delete a custom role (Admin only). System roles or roles assigned to users cannot be deleted.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _roleService.DeleteRoleAsync(id, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }
}
