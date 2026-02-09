namespace TaxSummary.Application.DTOs;

/// <summary>
/// DTO for updating an existing employee report
/// </summary>
public class UpdateEmployeeReportDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Education { get; set; } = string.Empty;
    public string ServiceUnit { get; set; } = string.Empty;
    public string CurrentPosition { get; set; } = string.Empty;
    public string AppointmentPosition { get; set; } = string.Empty;
    public int PreviousExperienceYears { get; set; }

    // Administrative Status
    public int MissionDays { get; set; }
    public int IncentiveHours { get; set; }
    public int DelayAndAbsenceHours { get; set; }
    public int HourlyLeaveHours { get; set; }

    // Performance Capabilities
    public List<CreatePerformanceCapabilityDto> Capabilities { get; set; } = new();
}
