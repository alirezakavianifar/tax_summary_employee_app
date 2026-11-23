using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Logging;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;

namespace TaxSummary.Api.Controllers.Reporting;

[ApiController]
[Route("api/reporting/categories")]
[EnableRateLimiting("GeneralPolicy")]
public class ReportCategoriesController : ReportingControllerBase
{
    private readonly IReportCategoryService _categoryService;
    private readonly ILogger<ReportCategoriesController> _logger;

    public ReportCategoriesController(
        IReportCategoryService categoryService,
        ILogger<ReportCategoriesController> logger)
    {
        _categoryService = categoryService ?? throw new ArgumentNullException(nameof(categoryService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Gets all active report categories for catalog tabs and creation dropdowns
    /// </summary>
    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<ReportCategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActive(CancellationToken ct = default)
    {
        var result = await _categoryService.GetActiveCategoriesAsync(ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets all report categories including inactive ones with report counts for system admin
    /// </summary>
    [HttpGet("management")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<ReportCategoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllForManagement(CancellationToken ct = default)
    {
        var result = await _categoryService.GetAllForManagementAsync(ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Gets single category by ID
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize]
    [ProducesResponseType(typeof(ReportCategoryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
    {
        var result = await _categoryService.GetByIdAsync(id, ct);
        if (result.IsFailure)
            return NotFound(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Creates a new custom report category (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ReportCategoryDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateReportCategoryDto request, CancellationToken ct = default)
    {
        var result = await _categoryService.CreateAsync(request, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    /// <summary>
    /// Updates an existing report category (Admin only)
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ReportCategoryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateReportCategoryDto request, CancellationToken ct = default)
    {
        var result = await _categoryService.UpdateAsync(id, request, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Toggles active/inactive status of a category (Admin only)
    /// </summary>
    [HttpPatch("{id:int}/toggle-status")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ReportCategoryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleStatus(int id, CancellationToken ct = default)
    {
        var result = await _categoryService.ToggleStatusAsync(id, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Deletes an unused custom report category (Admin only)
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        var result = await _categoryService.DeleteAsync(id, ct);
        if (result.IsFailure)
            return BadRequest(new { error = result.Error });

        return Ok(new { message = "دسته‌بندی گزارش با موفقیت حذف شد." });
    }
}
