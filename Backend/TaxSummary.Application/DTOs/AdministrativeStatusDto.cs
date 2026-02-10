namespace TaxSummary.Application.DTOs;

/// <summary>
/// Data Transfer Object for Administrative Status
/// </summary>
public class AdministrativeStatusDto
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public int MissionDays { get; set; }
    public int SickLeaveDays { get; set; }
    public int PaidLeaveDays { get; set; }
    public int OvertimeHours { get; set; }
    public int DelayAndAbsenceHours { get; set; }
    public int HourlyLeaveHours { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
