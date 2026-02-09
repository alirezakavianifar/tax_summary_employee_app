namespace TaxSummary.Application.DTOs;

/// <summary>
/// Complete employee report DTO including all related data
/// </summary>
public class EmployeeReportDto
{
    public EmployeeDto Employee { get; set; } = null!;
    public AdministrativeStatusDto? AdminStatus { get; set; }
    public List<PerformanceCapabilityDto> Capabilities { get; set; } = new();
}
