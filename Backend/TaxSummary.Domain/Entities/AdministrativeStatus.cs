namespace TaxSummary.Domain.Entities;

/// <summary>
/// Administrative Status entity representing employee's administrative performance
/// </summary>
public class AdministrativeStatus
{
    public Guid Id { get; private set; }
    public Guid EmployeeId { get; private set; }
    public int MissionDays { get; private set; }
    public int SickLeaveDays { get; private set; } // Added
    public int PaidLeaveDays { get; private set; } // Added
    public int OvertimeHours { get; private set; } // Renamed from IncentiveHours
    public int DelayAndAbsenceHours { get; private set; }
    public int HourlyLeaveHours { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation
    public Employee Employee { get; private set; } = null!;

    // Private constructor for EF Core
    private AdministrativeStatus() { }

    // Factory method for creating new administrative status
    public static AdministrativeStatus Create(
        Guid employeeId,
        int missionDays,
        int sickLeaveDays,
        int paidLeaveDays,
        int overtimeHours,
        int delayAndAbsenceHours,
        int hourlyLeaveHours)
    {
        var status = new AdministrativeStatus
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            MissionDays = missionDays,
            SickLeaveDays = sickLeaveDays,
            PaidLeaveDays = paidLeaveDays,
            OvertimeHours = overtimeHours,
            DelayAndAbsenceHours = delayAndAbsenceHours,
            HourlyLeaveHours = hourlyLeaveHours,
            CreatedAt = DateTime.UtcNow
        };

        status.Validate();
        return status;
    }

    // Domain Methods
    public void UpdateStatus(
        int missionDays,
        int sickLeaveDays,
        int paidLeaveDays,
        int overtimeHours,
        int delayAndAbsenceHours,
        int hourlyLeaveHours)
    {
        MissionDays = missionDays;
        SickLeaveDays = sickLeaveDays;
        PaidLeaveDays = paidLeaveDays;
        OvertimeHours = overtimeHours;
        DelayAndAbsenceHours = delayAndAbsenceHours;
        HourlyLeaveHours = hourlyLeaveHours;
        UpdatedAt = DateTime.UtcNow;

        Validate();
    }

    public void UpdateMissionDays(int days)
    {
        if (days < 0)
            throw new ArgumentException("Mission days cannot be negative", nameof(days));

        MissionDays = days;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateSickLeaveDays(int days)
    {
        if (days < 0)
            throw new ArgumentException("Sick leave days cannot be negative", nameof(days));

        SickLeaveDays = days;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdatePaidLeaveDays(int days)
    {
        if (days < 0)
            throw new ArgumentException("Paid leave days cannot be negative", nameof(days));

        PaidLeaveDays = days;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateOvertimeHours(int hours)
    {
        if (hours < 0)
            throw new ArgumentException("Overtime hours cannot be negative", nameof(hours));

        OvertimeHours = hours;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDelayAndAbsenceHours(int hours)
    {
        if (hours < 0)
            throw new ArgumentException("Delay and absence hours cannot be negative", nameof(hours));

        DelayAndAbsenceHours = hours;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateHourlyLeaveHours(int hours)
    {
        if (hours < 0)
            throw new ArgumentException("Hourly leave hours cannot be negative", nameof(hours));

        HourlyLeaveHours = hours;
        UpdatedAt = DateTime.UtcNow;
    }

    public bool IsValid()
    {
        try
        {
            Validate();
            return true;
        }
        catch
        {
            return false;
        }
    }

    public bool HasDisciplinaryIssues()
    {
        // Consider having disciplinary issues if there are excessive delays/absences
        const int maxAcceptableDelayHours = 40; // Example threshold
        return DelayAndAbsenceHours > maxAcceptableDelayHours;
    }

    public int GetTotalLeaveHours()
    {
        return HourlyLeaveHours;
    }

    // Private validation method
    private void Validate()
    {
        if (MissionDays < 0)
            throw new InvalidOperationException("Mission days cannot be negative");

        if (SickLeaveDays < 0)
            throw new InvalidOperationException("Sick leave days cannot be negative");

        if (PaidLeaveDays < 0)
            throw new InvalidOperationException("Paid leave days cannot be negative");

        if (OvertimeHours < 0)
            throw new InvalidOperationException("Overtime hours cannot be negative");

        if (DelayAndAbsenceHours < 0)
            throw new InvalidOperationException("Delay and absence hours cannot be negative");

        if (HourlyLeaveHours < 0)
            throw new InvalidOperationException("Hourly leave hours cannot be negative");

        // Business rule: Maximum reasonable values
        if (MissionDays > 365)
            throw new InvalidOperationException("Mission days cannot exceed 365 days per year");

        if (SickLeaveDays > 365)
            throw new InvalidOperationException("Sick leave days cannot exceed 365 days per year");

        if (PaidLeaveDays > 365)
            throw new InvalidOperationException("Paid leave days cannot exceed 365 days per year");

        if (OvertimeHours > 8760) // 24 hours * 365 days
            throw new InvalidOperationException("Overtime hours exceed reasonable annual limit");

        if (DelayAndAbsenceHours > 8760)
            throw new InvalidOperationException("Delay hours exceed reasonable annual limit");

        if (HourlyLeaveHours > 8760)
            throw new InvalidOperationException("Leave hours exceed reasonable annual limit");
    }
}
