using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

public class PayrollCycleRepository : IPayrollCycleRepository
{
    private readonly TaxSummaryDbContext _context;

    public PayrollCycleRepository(TaxSummaryDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<PayrollCycle> CreateCycleAsync(PayrollCycle cycle, CancellationToken cancellationToken = default)
    {
        if (cycle == null) throw new ArgumentNullException(nameof(cycle));
        await _context.PayrollCycles.AddAsync(cycle, cancellationToken);
        return cycle;
    }

    public async Task<PayrollCycle?> GetCycleByIdAsync(Guid id, bool includeDetails = true, CancellationToken cancellationToken = default)
    {
        var query = _context.PayrollCycles
            .Include(c => c.CreatedBy)
            .Include(c => c.FinalizedBy)
            .AsQueryable();

        if (includeDetails)
        {
            query = query
                .Include(c => c.DepartmentEntries)
                    .ThenInclude(d => d.SubmittedBy)
                .Include(c => c.DepartmentEntries)
                    .ThenInclude(d => d.ApprovedBy)
                .Include(c => c.DepartmentEntries)
                    .ThenInclude(d => d.Items);
        }

        return await query.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<PayrollCycle>> GetCyclesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.PayrollCycles
            .Include(c => c.CreatedBy)
            .Include(c => c.DepartmentEntries)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<PayrollDepartmentEntry?> GetDepartmentEntryByIdAsync(Guid id, bool includeItems = true, CancellationToken cancellationToken = default)
    {
        var query = _context.PayrollDepartmentEntries
            .Include(d => d.PayrollCycle)
            .Include(d => d.SubmittedBy)
            .Include(d => d.ApprovedBy)
            .AsQueryable();

        if (includeItems)
        {
            query = query.Include(d => d.Items);
        }

        return await query.FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }

    public async Task<PayrollDepartmentEntry?> GetDepartmentEntryByNameAsync(Guid cycleId, string departmentName, bool includeItems = true, CancellationToken cancellationToken = default)
    {
        var query = _context.PayrollDepartmentEntries
            .Include(d => d.PayrollCycle)
            .Include(d => d.SubmittedBy)
            .Include(d => d.ApprovedBy)
            .Where(d => d.PayrollCycleId == cycleId && d.DepartmentName == departmentName)
            .AsQueryable();

        if (includeItems)
        {
            query = query.Include(d => d.Items);
        }

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IEnumerable<PayrollDepartmentEntry>> GetDepartmentEntriesForUserAsync(string departmentName, CancellationToken cancellationToken = default)
    {
        return await _context.PayrollDepartmentEntries
            .Include(d => d.PayrollCycle)
            .Include(d => d.Items)
            .Where(d => d.DepartmentName == departmentName)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteCycleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cycle = await _context.PayrollCycles.FindAsync(new object[] { id }, cancellationToken);
        if (cycle != null)
        {
            _context.PayrollCycles.Remove(cycle);
        }
    }
}
