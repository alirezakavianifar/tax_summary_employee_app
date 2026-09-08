using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

/// <summary>
/// Entity Framework Core repository implementation for TaxRefundCase aggregate roots
/// </summary>
public class TaxRefundRepository : ITaxRefundRepository
{
    private readonly TaxSummaryDbContext _context;

    public TaxRefundRepository(TaxSummaryDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<TaxRefundCase?> GetByIdAsync(Guid id, bool includeDetails = true, CancellationToken cancellationToken = default)
    {
        var query = _context.TaxRefundCases.AsQueryable();

        if (includeDetails)
        {
            query = query
                .Include(c => c.Receipts)
                .Include(c => c.Allocations)
                .Include(c => c.Letters)
                .Include(c => c.Approvals)
                .Include(c => c.Documents);
        }

        return await query.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<TaxRefundCase?> GetByTrackingNumberAsync(string trackingNumber, CancellationToken cancellationToken = default)
    {
        return await _context.TaxRefundCases
            .Include(c => c.Receipts)
            .Include(c => c.Allocations)
            .Include(c => c.Letters)
            .Include(c => c.Approvals)
            .Include(c => c.Documents)
            .FirstOrDefaultAsync(c => c.CaseTrackingNumber == trackingNumber, cancellationToken);
    }

    public async Task<IEnumerable<TaxRefundCase>> GetCasesAsync(
        int? taxYear = null,
        TaxSourceType? taxSource = null,
        RefundCaseStatus? status = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.TaxRefundCases
            .Include(c => c.Receipts)
            .AsQueryable();

        if (taxYear.HasValue)
        {
            query = query.Where(c => c.TaxYear == taxYear.Value);
        }

        if (taxSource.HasValue)
        {
            query = query.Where(c => c.TaxSource == taxSource.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(c => c.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.Trim();
            query = query.Where(c =>
                c.TaxpayerName.Contains(term) ||
                c.EconomicCode.Contains(term) ||
                c.CaseTrackingNumber.Contains(term) ||
                c.DocketNumber.Contains(term) ||
                c.City.Contains(term));
        }

        return await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<TaxRefundCase> CreateAsync(TaxRefundCase refundCase, CancellationToken cancellationToken = default)
    {
        if (refundCase == null) throw new ArgumentNullException(nameof(refundCase));
        await _context.TaxRefundCases.AddAsync(refundCase, cancellationToken);
        return refundCase;
    }

    public Task UpdateAsync(TaxRefundCase refundCase, CancellationToken cancellationToken = default)
    {
        if (refundCase == null) throw new ArgumentNullException(nameof(refundCase));
        var entry = _context.Entry(refundCase);
        if (entry.State == EntityState.Detached)
        {
            _context.TaxRefundCases.Update(refundCase);
        }
        else
        {
            foreach (var receipt in refundCase.Receipts)
            {
                var rEntry = _context.Entry(receipt);
                if (rEntry.State == EntityState.Detached || (rEntry.State == EntityState.Modified && !_context.TaxRefundReceipts.Any(r => r.Id == receipt.Id)))
                    rEntry.State = EntityState.Added;
            }

            foreach (var alloc in refundCase.Allocations)
            {
                var aEntry = _context.Entry(alloc);
                if (aEntry.State == EntityState.Detached || (aEntry.State == EntityState.Modified && !_context.RefundableReceiptAllocations.Any(a => a.Id == alloc.Id)))
                    aEntry.State = EntityState.Added;
            }

            foreach (var letter in refundCase.Letters)
            {
                var lEntry = _context.Entry(letter);
                if (lEntry.State == EntityState.Detached || (lEntry.State == EntityState.Modified && !_context.TaxRefundLetters.Any(l => l.Id == letter.Id)))
                    lEntry.State = EntityState.Added;
            }

            foreach (var approval in refundCase.Approvals)
            {
                var apEntry = _context.Entry(approval);
                if (apEntry.State == EntityState.Detached || (apEntry.State == EntityState.Modified && !_context.TaxRefundApprovalActions.Any(ap => ap.Id == approval.Id)))
                    apEntry.State = EntityState.Added;
            }

            foreach (var doc in refundCase.Documents)
            {
                var dEntry = _context.Entry(doc);
                if (dEntry.State == EntityState.Detached || (dEntry.State == EntityState.Modified && !_context.TaxRefundDocuments.Any(d => d.Id == doc.Id)))
                    dEntry.State = EntityState.Added;
            }
        }

        return Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var refundCase = await _context.TaxRefundCases
            .Include(c => c.Receipts)
            .Include(c => c.Allocations)
            .Include(c => c.Letters)
            .Include(c => c.Approvals)
            .Include(c => c.Documents)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (refundCase != null)
        {
            _context.TaxRefundCases.Remove(refundCase);
        }
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TaxRefundCases.AnyAsync(c => c.Id == id, cancellationToken);
    }
}
