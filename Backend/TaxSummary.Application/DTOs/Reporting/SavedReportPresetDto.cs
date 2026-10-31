namespace TaxSummary.Application.DTOs.Reporting;

public class SavedReportPresetDto
{
    public Guid Id { get; set; }
    public Guid ReportDefinitionId { get; set; }
    public string ReportCode { get; set; } = string.Empty;
    public string PresetName { get; set; } = string.Empty;
    public string FilterCriteriaJson { get; set; } = "{}";
    public string? VisibleColumnsJson { get; set; }
    public bool IsSharedWithOffice { get; set; }
    public Guid? OfficeId { get; set; }
    public DateTime CreatedAt { get; set; }
}
