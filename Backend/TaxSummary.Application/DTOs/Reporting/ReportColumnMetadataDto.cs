namespace TaxSummary.Application.DTOs.Reporting;

public class ReportColumnMetadataDto
{
    public string FieldName { get; set; } = string.Empty;
    public string PersianLabel { get; set; } = string.Empty;
    public string DataType { get; set; } = "string"; // "string", "number", "currency", "date", "badge"
    public bool IsVisible { get; set; } = true;
    public bool IsSortable { get; set; } = true;
    public bool HasAggregateSum { get; set; }
    public string? Aggregate { get; set; } // "Sum", "Average", "Count", null
    public string Alignment { get; set; } = "right";
    public int DisplayOrder { get; set; }
}
