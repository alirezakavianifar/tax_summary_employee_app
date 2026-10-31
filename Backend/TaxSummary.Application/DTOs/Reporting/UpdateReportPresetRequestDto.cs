namespace TaxSummary.Application.DTOs.Reporting;

public class UpdateReportPresetRequestDto
{
    public string PresetName { get; set; } = string.Empty;
    public string FilterCriteriaJson { get; set; } = "{}";
    public string? VisibleColumnsJson { get; set; }
    public bool IsSharedWithOffice { get; set; }
}
