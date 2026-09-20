using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

public class RefundWorkflowSettingsRepository : IRefundWorkflowSettingsRepository
{
    private readonly TaxSummaryDbContext _context;

    public RefundWorkflowSettingsRepository(TaxSummaryDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<List<RefundWorkflowStep>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.RefundWorkflowSteps
            .OrderBy(s => s.StepOrder)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<RefundWorkflowStep>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _context.RefundWorkflowSteps
            .Where(s => s.IsEnabled)
            .OrderBy(s => s.StepOrder)
            .ToListAsync(cancellationToken);
    }

    public async Task<RefundWorkflowStep?> GetByStageAsync(RefundCaseStatus stage, CancellationToken cancellationToken = default)
    {
        return await _context.RefundWorkflowSteps
            .FirstOrDefaultAsync(s => s.Stage == stage, cancellationToken);
    }

    public async Task UpdateRangeAsync(IEnumerable<RefundWorkflowStep> steps, CancellationToken cancellationToken = default)
    {
        _context.RefundWorkflowSteps.UpdateRange(steps);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ResetToDefaultsAsync(IEnumerable<RefundWorkflowStep> defaults, CancellationToken cancellationToken = default)
    {
        var existing = await _context.RefundWorkflowSteps.ToListAsync(cancellationToken);
        _context.RefundWorkflowSteps.RemoveRange(existing);
        await _context.RefundWorkflowSteps.AddRangeAsync(defaults, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
