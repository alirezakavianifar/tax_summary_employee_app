using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Interfaces;

/// <summary>
/// Repository interface for managing Tax Refund Case aggregate roots and their domain queries
/// </summary>
public interface ITaxRefundRepository
{
    Task<TaxRefundCase?> GetByIdAsync(Guid id, bool includeDetails = true, CancellationToken cancellationToken = default);
    Task<TaxRefundCase?> GetByTrackingNumberAsync(string trackingNumber, CancellationToken cancellationToken = default);
    Task<IEnumerable<TaxRefundCase>> GetCasesAsync(
        int? taxYear = null,
        TaxSourceType? taxSource = null,
        RefundCaseStatus? status = null,
        string? searchTerm = null,
        CancellationToken cancellationToken = default);
    Task<TaxRefundCase> CreateAsync(TaxRefundCase refundCase, CancellationToken cancellationToken = default);
    Task UpdateAsync(TaxRefundCase refundCase, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
}
