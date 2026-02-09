namespace TaxSummary.Application.DTOs;

/// <summary>
/// DTO for creating a new employee report
/// </summary>
public class CreateEmployeeReportDto
{
    public string PersonnelNumber { get; set; } = string.Empty;
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

/// <summary>
/// DTO for creating a performance capability
/// </summary>
public class CreatePerformanceCapabilityDto
{
    public string SystemRole { get; set; } = string.Empty;
    public bool DetectionOfTaxIssues { get; set; }
    public bool DetectionOfTaxEvasion { get; set; }
    public bool CompanyIdentification { get; set; }
    public bool ValueAddedRecognition { get; set; }
    public bool ReferredOrExecuted { get; set; }
}
