using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Employee entity
/// </summary>
public class EmployeeRepository : IEmployeeRepository
{
    private readonly TaxSummaryDbContext _context;

    public EmployeeRepository(TaxSummaryDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<Employee?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Employees
            .Include(e => e.AdministrativeStatus)
            .Include(e => e.PerformanceCapabilities)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<Employee?> GetByPersonnelNumberAsync(string personnelNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(personnelNumber))
            return null;

        return await _context.Employees
            .Include(e => e.AdministrativeStatus)
            .Include(e => e.PerformanceCapabilities)
            .FirstOrDefaultAsync(e => e.PersonnelNumber == personnelNumber, cancellationToken);
    }

    public async Task<IEnumerable<Employee>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Employees
            .Include(e => e.AdministrativeStatus)
            .Include(e => e.PerformanceCapabilities)
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<(IEnumerable<Employee> Employees, int TotalCount)> GetPagedAsync(
        int pageNumber,
        int pageSize,
        string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber < 1)
            pageNumber = 1;

        if (pageSize < 1)
            pageSize = 10;

        if (pageSize > 100)
            pageSize = 100;

        var query = _context.Employees
            .Include(e => e.AdministrativeStatus)
            .Include(e => e.PerformanceCapabilities)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var normalizedSearchTerm = searchTerm.Trim().ToLower();
            query = query.Where(e => e.FirstName.ToLower().Contains(normalizedSearchTerm) ||
                                     e.LastName.ToLower().Contains(normalizedSearchTerm) ||
                                     e.PersonnelNumber.ToLower().Contains(normalizedSearchTerm));
        }

        query = query.OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName);

        var totalCount = await query.CountAsync(cancellationToken);

        var employees = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (employees, totalCount);
    }

    public async Task<Employee> AddAsync(Employee employee, CancellationToken cancellationToken = default)
    {
        if (employee == null)
            throw new ArgumentNullException(nameof(employee));

        await _context.Employees.AddAsync(employee, cancellationToken);
        return employee;
    }

    public Task UpdateAsync(Employee employee, CancellationToken cancellationToken = default)
    {
        if (employee == null)
            throw new ArgumentNullException(nameof(employee));

        _context.Employees.Update(employee);
        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var employee = await _context.Employees.FindAsync(new object[] { id }, cancellationToken);
        
        if (employee != null)
        {
            _context.Employees.Remove(employee);
        }
    }

    public async Task<bool> ExistsByPersonnelNumberAsync(string personnelNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(personnelNumber))
            return false;

        return await _context.Employees
            .AnyAsync(e => e.PersonnelNumber == personnelNumber, cancellationToken);
    }

    public async Task<IEnumerable<Employee>> GetByServiceUnitAsync(string serviceUnit, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(serviceUnit))
            return Enumerable.Empty<Employee>();

        return await _context.Employees
            .Include(e => e.AdministrativeStatus)
            .Include(e => e.PerformanceCapabilities)
            .Where(e => e.ServiceUnit == serviceUnit)
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Employee>> SearchByNameAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
            return Enumerable.Empty<Employee>();

        var normalizedSearchTerm = searchTerm.Trim().ToLower();

        return await _context.Employees
            .Include(e => e.AdministrativeStatus)
            .Include(e => e.PerformanceCapabilities)
            .Where(e => e.FirstName.ToLower().Contains(normalizedSearchTerm) ||
                       e.LastName.ToLower().Contains(normalizedSearchTerm) ||
                       e.PersonnelNumber.ToLower().Contains(normalizedSearchTerm))
            .OrderBy(e => e.LastName)
            .ThenBy(e => e.FirstName)
            .ToListAsync(cancellationToken);
    }
}
