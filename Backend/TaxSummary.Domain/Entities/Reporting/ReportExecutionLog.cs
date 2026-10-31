namespace TaxSummary.Domain.Entities;

public class ReportExecutionLog
{
    public Guid Id { get; private set; }
    public Guid? ReportDefinitionId { get; private set; }
    public string ReportCode { get; private set; } = string.Empty;
    public Guid UserId { get; private set; }
    public string Username { get; private set; } = string.Empty;

    public DateTime ExecutedAt { get; private set; }
    public long ExecutionDurationMs { get; private set; }
    public int ResultRowCount { get; private set; }
    public string? AppliedFiltersSummary { get; private set; }
    public string? ExportFormat { get; private set; } // null, "Excel", "Pdf", "Csv"
    public string? ClientIpAddress { get; private set; }

    private ReportExecutionLog() { }

    public static ReportExecutionLog Record(
        Guid? reportDefinitionId,
        string reportCode,
        Guid userId,
        string username,
        long durationMs,
        int rowCount,
        string? filtersSummary,
        string? exportFormat = null,
        string? ipAddress = null)
    {
        return new ReportExecutionLog
        {
            Id = Guid.NewGuid(),
            ReportDefinitionId = reportDefinitionId,
            ReportCode = string.IsNullOrWhiteSpace(reportCode) ? "DYNAMIC_QUERY" : reportCode.Trim(),
            UserId = userId,
            Username = username?.Trim() ?? "unknown",
            ExecutedAt = DateTime.UtcNow,
            ExecutionDurationMs = Math.Max(0, durationMs),
            ResultRowCount = Math.Max(0, rowCount),
            AppliedFiltersSummary = filtersSummary?.Trim(),
            ExportFormat = exportFormat?.Trim(),
            ClientIpAddress = ipAddress?.Trim()
        };
    }
}
