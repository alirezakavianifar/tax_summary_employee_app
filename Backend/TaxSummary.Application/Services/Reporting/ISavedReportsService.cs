using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services.Reporting;

/// <summary>
/// Service contract for managing user and office-shared saved report filter presets
/// </summary>
public interface ISavedReportsService
{
    Task<Result<List<SavedReportPresetDto>>> GetUserPresetsAsync(
        Guid userId, 
        Guid? reportDefinitionId = null, 
        CancellationToken ct = default);

    Task<Result<SavedReportPresetDto>> SavePresetAsync(
        SaveReportPresetRequestDto request, 
        Guid userId, 
        CancellationToken ct = default);

    Task<Result<bool>> UpdatePresetAsync(
        Guid id, 
        UpdateReportPresetRequestDto request, 
        Guid userId, 
        CancellationToken ct = default);

    Task<Result<bool>> DeletePresetAsync(
        Guid id, 
        Guid userId, 
        CancellationToken ct = default);
}
