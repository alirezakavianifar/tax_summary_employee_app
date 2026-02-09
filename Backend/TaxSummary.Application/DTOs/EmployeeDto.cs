namespace TaxSummary.Application.DTOs;

/// <summary>
/// Data Transfer Object for Employee
/// </summary>
public class EmployeeDto
{
    public Guid Id { get; set; }
    public string PersonnelNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Education { get; set; } = string.Empty;
    public string ServiceUnit { get; set; } = string.Empty;
    public string CurrentPosition { get; set; } = string.Empty;
    public string AppointmentPosition { get; set; } = string.Empty;
    public int PreviousExperienceYears { get; set; }
    public string? PhotoUrl { get; set; }
    public string? StatusDescription { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
