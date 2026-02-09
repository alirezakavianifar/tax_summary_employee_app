using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Interfaces;

/// <summary>
/// Repository interface for Employee entity operations
/// </summary>
public interface IEmployeeRepository
{
    /// <summary>
    /// Gets an employee by their unique identifier
    /// </summary>
    Task<Employee?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets an employee by their personnel number
    /// </summary>
    Task<Employee?> GetByPersonnelNumberAsync(string personnelNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all employees with their related data
    /// </summary>
    Task<IEnumerable<Employee>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets employees with pagination support
    /// </summary>
    Task<(IEnumerable<Employee> Employees, int TotalCount)> GetPagedAsync(
        int pageNumber, 
        int pageSize, 
        string? searchTerm = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a new employee to the repository
    /// </summary>
    Task<Employee> AddAsync(Employee employee, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing employee
    /// </summary>
    Task UpdateAsync(Employee employee, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an employee by their identifier
    /// </summary>
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if an employee with the given personnel number exists
    /// </summary>
    Task<bool> ExistsByPersonnelNumberAsync(string personnelNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets employees by service unit
    /// </summary>
    Task<IEnumerable<Employee>> GetByServiceUnitAsync(string serviceUnit, CancellationToken cancellationToken = default);

    /// <summary>
    /// Searches employees by name (first name or last name)
    /// </summary>
    Task<IEnumerable<Employee>> SearchByNameAsync(string searchTerm, CancellationToken cancellationToken = default);
}
