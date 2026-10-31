namespace TaxSummary.Application.DTOs.Reporting;

public class RecentAuditActivityDto
{
    public string Action { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string ShamsiTimestamp { get; set; } = string.Empty;
}
