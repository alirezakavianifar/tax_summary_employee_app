namespace TaxSummary.Application.DTOs.Reporting;

public class ReportExecutionResultDto
{
    public string ReportCode { get; set; } = string.Empty;
    public string ReportTitle { get; set; } = string.Empty;
    public DateTime ExecutedAt { get; set; }
    public List<ReportColumnMetadataDto> Columns { get; set; } = new();
    public List<Dictionary<string, object?>> Rows { get; set; } = new();
    public Dictionary<string, object?> SummaryAggregates { get; set; } = new();
    public int TotalRowCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalRowCount / PageSize) : 0;
}
