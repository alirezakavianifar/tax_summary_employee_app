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
    public string? PhotoUrl { get; set; }
    public string? StatusDescription { get; set; }
    public int MissionDays { get; set; }
    public int SickLeaveDays { get; set; }
    public int PaidLeaveDays { get; set; }
    public int OvertimeHours { get; set; }
    public int DelayAndAbsenceHours { get; set; }
    public int HourlyLeaveHours { get; set; }
    public List<CreatePerformanceCapabilityDto> Capabilities { get; set; } = new();
}
