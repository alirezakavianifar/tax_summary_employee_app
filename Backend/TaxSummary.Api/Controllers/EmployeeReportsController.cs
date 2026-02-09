using Microsoft.AspNetCore.Mvc;
using TaxSummary.Application.DTOs;
using TaxSummary.Application.Services;

namespace TaxSummary.Api.Controllers;

/// <summary>
/// API controller for employee report operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EmployeeReportsController : ControllerBase
{
    private readonly IEmployeeReportService _reportService;
    private readonly ILogger<EmployeeReportsController> _logger;

    public EmployeeReportsController(
        IEmployeeReportService reportService,
        ILogger<EmployeeReportsController> logger)
    {
        _reportService = reportService ?? throw new ArgumentNullException(nameof(reportService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Get complete employee report by employee ID
    /// </summary>
    /// <param name="employeeId">Employee unique identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Complete employee report</returns>
    [HttpGet("{employeeId:guid}")]
    [ProducesResponseType(typeof(EmployeeReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<EmployeeReportDto>> GetReport(
        Guid employeeId,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting report for employee {EmployeeId}", employeeId);

        var result = await _reportService.GetReportAsync(employeeId, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Report not found for employee {EmployeeId}: {Error}", employeeId, result.Error);
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Get complete employee report by personnel number
    /// </summary>
    /// <param name="personnelNumber">Personnel number</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Complete employee report</returns>
    [HttpGet("by-personnel-number/{personnelNumber}")]
    [ProducesResponseType(typeof(EmployeeReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<EmployeeReportDto>> GetReportByPersonnelNumber(
        string personnelNumber,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting report for personnel number {PersonnelNumber}", personnelNumber);

        var result = await _reportService.GetReportByPersonnelNumberAsync(personnelNumber, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Report not found for personnel number {PersonnelNumber}: {Error}", personnelNumber, result.Error);
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Create a new employee report
    /// </summary>
    /// <param name="dto">Employee report data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created employee ID</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<Guid>> CreateReport(
        [FromBody] CreateEmployeeReportDto dto,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating report for personnel number {PersonnelNumber}", dto.PersonnelNumber);

        var result = await _reportService.CreateReportAsync(dto, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to create report: {Error}", result.Error);
            return BadRequest(new { error = result.Error });
        }

        _logger.LogInformation("Report created successfully with ID {EmployeeId}", result.Value);
        return CreatedAtAction(
            nameof(GetReport),
            new { employeeId = result.Value },
            new { id = result.Value });
    }

    /// <summary>
    /// Update an existing employee report
    /// </summary>
    /// <param name="employeeId">Employee unique identifier</param>
    /// <param name="dto">Updated employee report data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>No content on success</returns>
    [HttpPut("{employeeId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateReport(
        Guid employeeId,
        [FromBody] UpdateEmployeeReportDto dto,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating report for employee {EmployeeId}", employeeId);

        var result = await _reportService.UpdateReportAsync(employeeId, dto, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to update report for employee {EmployeeId}: {Error}", employeeId, result.Error);
            
            if (result.Error.Contains("یافت نشد"))
                return NotFound(new { error = result.Error });

            return BadRequest(new { error = result.Error });
        }

        _logger.LogInformation("Report updated successfully for employee {EmployeeId}", employeeId);
        return NoContent();
    }

    /// <summary>
    /// Delete an employee report
    /// </summary>
    /// <param name="employeeId">Employee unique identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>No content on success</returns>
    [HttpDelete("{employeeId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteReport(
        Guid employeeId,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting report for employee {EmployeeId}", employeeId);

        var result = await _reportService.DeleteReportAsync(employeeId, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to delete report for employee {EmployeeId}: {Error}", employeeId, result.Error);
            
            if (result.Error.Contains("یافت نشد"))
                return NotFound(new { error = result.Error });

            return BadRequest(new { error = result.Error });
        }

        _logger.LogInformation("Report deleted successfully for employee {EmployeeId}", employeeId);
        return NoContent();
    }

    /// <summary>
    /// Get all employees (basic information only)
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of employees</returns>
    [HttpGet("employees")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetAllEmployees(
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Getting all employees");

        var result = await _reportService.GetAllEmployeesAsync(cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogError("Failed to get all employees: {Error}", result.Error);
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Get employees with pagination
    /// </summary>
    /// <param name="pageNumber">Page number (1-based)</param>
    /// <param name="pageSize">Page size (1-100)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of employees</returns>
    [HttpGet("employees/paged")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> GetEmployeesPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Getting employees page {PageNumber} with size {PageSize}", pageNumber, pageSize);

        var result = await _reportService.GetEmployeesPagedAsync(pageNumber, pageSize, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to get paged employees: {Error}", result.Error);
            return BadRequest(new { error = result.Error });
        }

        var (employees, totalCount) = result.Value;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return Ok(new
        {
            data = employees,
            pagination = new
            {
                pageNumber,
                pageSize,
                totalCount,
                totalPages
            }
        });
    }

    /// <summary>
    /// Search employees by name
    /// </summary>
    /// <param name="searchTerm">Search term (name or personnel number)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of matching employees</returns>
    [HttpGet("employees/search")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> SearchEmployees(
        [FromQuery] string searchTerm,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return BadRequest(new { error = "عبارت جستجو نمی‌تواند خالی باشد" });
        }

        _logger.LogInformation("Searching employees with term: {SearchTerm}", searchTerm);

        var result = await _reportService.SearchEmployeesByNameAsync(searchTerm, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to search employees: {Error}", result.Error);
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Get employees by service unit
    /// </summary>
    /// <param name="serviceUnit">Service unit name</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of employees in the service unit</returns>
    [HttpGet("employees/by-service-unit")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployeesByServiceUnit(
        [FromQuery] string serviceUnit,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(serviceUnit))
        {
            return BadRequest(new { error = "واحد محل خدمت نمی‌تواند خالی باشد" });
        }

        _logger.LogInformation("Getting employees for service unit: {ServiceUnit}", serviceUnit);

        var result = await _reportService.GetEmployeesByServiceUnitAsync(serviceUnit, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to get employees by service unit: {Error}", result.Error);
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Value);
    }
}
