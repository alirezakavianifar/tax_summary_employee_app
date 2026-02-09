using Microsoft.AspNetCore.Mvc;
using TaxSummary.Application.Services;

namespace TaxSummary.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly IExcelSeedService _seedService;

    public SeedController(IExcelSeedService seedService)
    {
        _seedService = seedService;
    }

    /// <summary>
    /// Seeds employees and administrative status from Excel file
    /// </summary>
    /// <param name="file">The Excel file (.xlsx) containing employee data</param>
    /// <returns>Status of the operation</returns>
    [HttpPost("upload")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        if (!Path.GetExtension(file.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Only .xlsx files are supported.");
        }

        try
        {
            using (var stream = file.OpenReadStream())
            {
                var count = await _seedService.SeedFromExcelAsync(stream);
                return Ok(new { message = $"Data seeded successfully. {count} records processed.", count = count });
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"Error processing file: {ex.Message}" });
        }
    }
}
