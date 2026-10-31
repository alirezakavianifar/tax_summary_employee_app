using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Reporting &amp; BI subsystem entities (ReportDefinitions, SavedReportPresets, ReportExecutionLogs)
/// </summary>
public class ReportingRepository : IReportingRepository
{
    private readonly TaxSummaryDbContext _db;

    public ReportingRepository(TaxSummaryDbContext db)
    {
        _db = db;
    }

    public async Task<ReportDefinition?> GetReportDefinitionByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.ReportDefinitions
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<ReportDefinition?> GetReportDefinitionByCodeAsync(string code, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;

        var normalizedCode = code.Trim().ToUpperInvariant();
        return await _db.ReportDefinitions
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Code.ToUpper() == normalizedCode, ct);
    }

    public async Task<List<ReportDefinition>> GetAvailableReportsAsync(
        string? userRole, 
        ReportDomainSource? source = null, 
        CancellationToken ct = default)
    {
        var query = _db.ReportDefinitions
            .AsNoTracking()
            .Where(r => r.IsActive);

        if (source.HasValue)
            query = query.Where(r => r.DomainSource == source.Value);

        if (!string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(r => r.RequiredRole == null || r.RequiredRole == "" || r.RequiredRole == userRole);
        }

        return await query
            .OrderBy(r => r.DomainSource)
            .ThenBy(r => r.Title)
            .ToListAsync(ct);
    }

    public async Task AddReportDefinitionAsync(ReportDefinition report, CancellationToken ct = default)
    {
        await _db.ReportDefinitions.AddAsync(report, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateReportDefinitionAsync(ReportDefinition report, CancellationToken ct = default)
    {
        _db.ReportDefinitions.Update(report);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteReportDefinitionAsync(Guid id, CancellationToken ct = default)
    {
        var report = await _db.ReportDefinitions.FindAsync(new object[] { id }, ct);
        if (report != null && !report.IsSystemReport)
        {
            _db.ReportDefinitions.Remove(report);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<List<SavedReportPreset>> GetUserSavedPresetsAsync(
        Guid userId, 
        Guid? reportDefinitionId = null, 
        CancellationToken ct = default)
    {
        var query = _db.SavedReportPresets
            .Include(p => p.ReportDefinition)
            .AsNoTracking()
            .Where(p => p.UserId == userId || p.IsSharedWithOffice);

        if (reportDefinitionId.HasValue)
            query = query.Where(p => p.ReportDefinitionId == reportDefinitionId.Value);

        return await query
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<SavedReportPreset?> GetPresetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _db.SavedReportPresets
            .Include(p => p.ReportDefinition)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task AddPresetAsync(SavedReportPreset preset, CancellationToken ct = default)
    {
        await _db.SavedReportPresets.AddAsync(preset, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdatePresetAsync(SavedReportPreset preset, CancellationToken ct = default)
    {
        _db.SavedReportPresets.Update(preset);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeletePresetAsync(Guid id, CancellationToken ct = default)
    {
        var preset = await _db.SavedReportPresets.FindAsync(new object[] { id }, ct);
        if (preset != null)
        {
            _db.SavedReportPresets.Remove(preset);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task LogExecutionAsync(ReportExecutionLog log, CancellationToken ct = default)
    {
        await _db.ReportExecutionLogs.AddAsync(log, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<ReportExecutionLog>> GetRecentExecutionLogsAsync(int limit = 50, CancellationToken ct = default) =>
        await _db.ReportExecutionLogs
            .AsNoTracking()
            .OrderByDescending(l => l.ExecutedAt)
            .Take(limit)
            .ToListAsync(ct);
}
