using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaxSummary.Application.DTOs.TaxSource;
using TaxSummary.Application.Services;

namespace TaxSummary.Api.Controllers;

[ApiController]
[Route("api/tax-sources")]
[EnableRateLimiting("GeneralPolicy")]
public class TaxSourcesController : ControllerBase
{
    private readonly ITaxSourceService _taxSourceService;
    private readonly ILogger<TaxSourcesController> _logger;

    public TaxSourcesController(ITaxSourceService taxSourceService, ILogger<TaxSourcesController> logger)
    {
        _taxSourceService = taxSourceService ?? throw new ArgumentNullException(nameof(taxSourceService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get all active tax sources for dropdown selection in refund cases
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<TaxSourceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActive(CancellationToken cancellationToken = default)
    {
        var result = await _taxSourceService.GetActiveAsync(cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Get all tax sources including inactive ones for system administration (Admin only)
    /// </summary>
    [HttpGet("management")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<TaxSourceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllForManagement(CancellationToken cancellationToken = default)
    {
        var result = await _taxSourceService.GetAllForManagementAsync(cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Get tax source by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(TaxSourceDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _taxSourceService.GetByIdAsync(id, cancellationToken);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Create a new tax source option (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(TaxSourceDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateTaxSourceDto request, CancellationToken cancellationToken = default)
    {
        var result = await _taxSourceService.CreateAsync(request, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value);
    }

    /// <summary>
    /// Update an existing tax source (title, description, active status, order) (Admin only)
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(TaxSourceDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTaxSourceDto request, CancellationToken cancellationToken = default)
    {
        var result = await _taxSourceService.UpdateAsync(id, request, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Delete a custom tax source (Admin only). Core system sources cannot be deleted.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var result = await _taxSourceService.DeleteAsync(id, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    /// <summary>
    /// Batch update display order of tax sources (Admin only)
    /// </summary>
    [HttpPut("reorder")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Reorder([FromBody] IEnumerable<TaxSourceOrderDto> items, CancellationToken cancellationToken = default)
    {
        var result = await _taxSourceService.ReorderAsync(items, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }
}
