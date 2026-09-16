using TaxSummary.Application.DTOs.TaxSource;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service interface for managing configurable tax sources
/// </summary>
public interface ITaxSourceService
{
    Task<Result<IEnumerable<TaxSourceDto>>> GetActiveAsync(CancellationToken ct = default);
    Task<Result<IEnumerable<TaxSourceDto>>> GetAllForManagementAsync(CancellationToken ct = default);
    Task<Result<TaxSourceDto>> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Result<TaxSourceDto>> CreateAsync(CreateTaxSourceDto dto, CancellationToken ct = default);
    Task<Result<TaxSourceDto>> UpdateAsync(int id, UpdateTaxSourceDto dto, CancellationToken ct = default);
    Task<Result> DeleteAsync(int id, CancellationToken ct = default);
    Task<Result> ReorderAsync(IEnumerable<TaxSourceOrderDto> items, CancellationToken ct = default);
}
