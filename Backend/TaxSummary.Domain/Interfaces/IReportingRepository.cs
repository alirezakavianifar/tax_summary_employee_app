using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;

namespace TaxSummary.Domain.Interfaces;

public interface IReportingRepository
{
    // Report Definitions
    Task<ReportDefinition?> GetReportDefinitionByIdAsync(Guid id, CancellationToken ct = default);
    Task<ReportDefinition?> GetReportDefinitionByCodeAsync(string code, CancellationToken ct = default);
    Task<List<ReportDefinition>> GetAvailableReportsAsync(string? userRole, ReportDomainSource? source = null, bool includeInactive = false, CancellationToken ct = default);
    Task AddReportDefinitionAsync(ReportDefinition report, CancellationToken ct = default);
    Task UpdateReportDefinitionAsync(ReportDefinition report, CancellationToken ct = default);
    Task DeleteReportDefinitionAsync(Guid id, CancellationToken ct = default);

    // Saved User Presets
    Task<List<SavedReportPreset>> GetUserSavedPresetsAsync(Guid userId, Guid? reportDefinitionId = null, CancellationToken ct = default);
    Task<SavedReportPreset?> GetPresetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddPresetAsync(SavedReportPreset preset, CancellationToken ct = default);
    Task UpdatePresetAsync(SavedReportPreset preset, CancellationToken ct = default);
    Task DeletePresetAsync(Guid id, CancellationToken ct = default);

    // Execution Logs
    Task LogExecutionAsync(ReportExecutionLog log, CancellationToken ct = default);
    Task<List<ReportExecutionLog>> GetRecentExecutionLogsAsync(int limit = 50, CancellationToken ct = default);
}
