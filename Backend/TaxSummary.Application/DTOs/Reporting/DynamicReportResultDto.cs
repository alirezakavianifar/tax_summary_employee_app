namespace TaxSummary.Application.DTOs.Reporting;

public class DynamicReportResultDto
{
    public List<ReportColumnMetadataDto> Columns { get; set; } = new();
    public List<Dictionary<string, object?>> Rows { get; set; } = new();
    public Dictionary<string, object?> GlobalAggregates { get; set; } = new();
    public int TotalRows { get; set; }
}
