using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for PayrollRun entity
/// </summary>
public class PayrollRepository : IPayrollRepository
{
    private readonly TaxSummaryDbContext _context;

    public PayrollRepository(TaxSummaryDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<PayrollRun> SaveRunAsync(PayrollRun run, CancellationToken cancellationToken = default)
    {
        if (run == null) throw new ArgumentNullException(nameof(run));
        await _context.PayrollRuns.AddAsync(run, cancellationToken);
        return run;
    }

    public async Task<IEnumerable<PayrollRun>> GetRunsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.PayrollRuns
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<PayrollRun?> GetRunByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.PayrollRuns
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task DeleteRunAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var run = await _context.PayrollRuns.FindAsync(new object[] { id }, cancellationToken);
        if (run != null)
            _context.PayrollRuns.Remove(run);
    }
}
