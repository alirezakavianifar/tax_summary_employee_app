namespace TaxSummary.Application.DTOs.Reporting;

public class SaveReportPresetRequestDto
{
    public Guid ReportDefinitionId { get; set; }
    public string PresetName { get; set; } = string.Empty;
    public string FilterCriteriaJson { get; set; } = "{}";
    public string? VisibleColumnsJson { get; set; }
    public bool IsSharedWithOffice { get; set; }
    public Guid? OfficeId { get; set; }
}
