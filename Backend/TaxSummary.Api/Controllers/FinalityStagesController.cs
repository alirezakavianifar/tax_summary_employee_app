using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TaxSummary.Application.DTOs.TaxFinalityStage;
using TaxSummary.Application.Services;

namespace TaxSummary.Api.Controllers;

[ApiController]
[Route("api/finality-stages")]
[EnableRateLimiting("GeneralPolicy")]
public class FinalityStagesController : ControllerBase
{
    private readonly IFinalityStageService _finalityStageService;
    private readonly ILogger<FinalityStagesController> _logger;

    public FinalityStagesController(IFinalityStageService finalityStageService, ILogger<FinalityStagesController> logger)
    {
        _finalityStageService = finalityStageService ?? throw new ArgumentNullException(nameof(finalityStageService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get all active finality stages for dropdown selection in refund cases
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<FinalityStageDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActive(CancellationToken cancellationToken = default)
    {
        var result = await _finalityStageService.GetActiveAsync(cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Get all finality stages including inactive ones for system administration (Admin only)
    /// </summary>
    [HttpGet("management")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<FinalityStageDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllForManagement(CancellationToken cancellationToken = default)
    {
        var result = await _finalityStageService.GetAllForManagementAsync(cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Get finality stage by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(FinalityStageDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var result = await _finalityStageService.GetByIdAsync(id, cancellationToken);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Create a new finality stage option (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(FinalityStageDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateFinalityStageDto request, CancellationToken cancellationToken = default)
    {
        var result = await _finalityStageService.CreateAsync(request, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value);
    }

    /// <summary>
    /// Update an existing finality stage (title, description, active status, order) (Admin only)
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(FinalityStageDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateFinalityStageDto request, CancellationToken cancellationToken = default)
    {
        var result = await _finalityStageService.UpdateAsync(id, request, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Batch update display order of finality stages (Admin only)
    /// </summary>
    [HttpPut("reorder")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Reorder([FromBody] IEnumerable<FinalityStageOrderDto> items, CancellationToken cancellationToken = default)
    {
        var result = await _finalityStageService.ReorderAsync(items, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }

    /// <summary>
    /// Delete a custom finality stage (Admin only). Core system stages cannot be deleted.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var result = await _finalityStageService.DeleteAsync(id, cancellationToken);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return NoContent();
    }
}
