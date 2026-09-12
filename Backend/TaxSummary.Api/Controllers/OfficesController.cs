using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaxSummary.Application.DTOs.Office;
using TaxSummary.Application.Services;

namespace TaxSummary.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OfficesController : ControllerBase
{
    private readonly IOfficeService _officeService;

    public OfficesController(IOfficeService officeService)
    {
        _officeService = officeService ?? throw new ArgumentNullException(nameof(officeService));
    }

    /// <summary>
    /// Get all offices
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OfficeDto>>> GetAll(CancellationToken cancellationToken)
    {
        var offices = await _officeService.GetAllOfficesAsync(cancellationToken);
        return Ok(offices);
    }

    /// <summary>
    /// Get office by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OfficeDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var office = await _officeService.GetOfficeByIdAsync(id, cancellationToken);
        if (office == null)
            return NotFound(new { error = "اداره یافت نشد" });

        return Ok(office);
    }

    /// <summary>
    /// Create new office (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OfficeDto>> Create([FromBody] CreateOfficeRequestDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var office = await _officeService.CreateOfficeAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = office.Id }, office);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update an office (Admin only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OfficeDto>> Update(Guid id, [FromBody] UpdateOfficeRequestDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var office = await _officeService.UpdateOfficeAsync(id, dto, cancellationToken);
            if (office == null)
                return NotFound(new { error = "اداره یافت نشد" });

            return Ok(office);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
