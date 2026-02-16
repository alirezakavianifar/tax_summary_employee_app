using TaxSummary.Application.DTOs;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service interface for employee report operations
/// </summary>
public interface IEmployeeReportService
{
    /// <summary>
    /// Gets a complete employee report by employee ID
    /// </summary>
    Task<Result<EmployeeReportDto>> GetReportAsync(Guid employeeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a complete employee report by personnel number
    /// </summary>
    Task<Result<EmployeeReportDto>> GetReportByPersonnelNumberAsync(string personnelNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new employee report
    /// </summary>
    Task<Result<Guid>> CreateReportAsync(CreateEmployeeReportDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing employee report
    /// </summary>
    Task<Result> UpdateReportAsync(Guid employeeId, UpdateEmployeeReportDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an employee report
    /// </summary>
    Task<Result> DeleteReportAsync(Guid employeeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all employees (basic information only)
    /// </summary>
    Task<Result<IEnumerable<EmployeeDto>>> GetAllEmployeesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets employees with pagination
    /// </summary>
    Task<Result<(IEnumerable<EmployeeDto> Employees, int TotalCount)>> GetEmployeesPagedAsync(
        int pageNumber, 
        int pageSize, 
        string? searchTerm = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches employees by name
    /// </summary>
    Task<Result<IEnumerable<EmployeeDto>>> SearchEmployeesByNameAsync(
        string searchTerm, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets employees by service unit
    /// </summary>
    Task<Result<IEnumerable<EmployeeDto>>> GetEmployeesByServiceUnitAsync(
        string serviceUnit, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Synchronizes employee photos from the upload directory based on National ID
    /// </summary>
    Task<Result<int>> SyncEmployeePhotosAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates a professional Persian description for an employee
    /// </summary>
    Task<Result<string>> GenerateDescriptionAsync(Guid employeeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Bulk generates Persian descriptions for all employees
    /// </summary>
    Task<Result<int>> BulkGenerateDescriptionsAsync(bool overwriteExisting, CancellationToken cancellationToken = default);
}
