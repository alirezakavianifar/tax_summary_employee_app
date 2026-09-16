using TaxSummary.Application.DTOs.TaxFinalityStage;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service interface for managing configurable tax finality stages
/// </summary>
public interface IFinalityStageService
{
    Task<Result<IEnumerable<FinalityStageDto>>> GetActiveAsync(CancellationToken ct = default);
    Task<Result<IEnumerable<FinalityStageDto>>> GetAllForManagementAsync(CancellationToken ct = default);
    Task<Result<FinalityStageDto>> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Result<FinalityStageDto>> CreateAsync(CreateFinalityStageDto dto, CancellationToken ct = default);
    Task<Result<FinalityStageDto>> UpdateAsync(int id, UpdateFinalityStageDto dto, CancellationToken ct = default);
    Task<Result> DeleteAsync(int id, CancellationToken ct = default);
    Task<Result> ReorderAsync(IEnumerable<FinalityStageOrderDto> items, CancellationToken ct = default);
}
