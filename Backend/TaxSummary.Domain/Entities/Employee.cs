namespace TaxSummary.Domain.Entities;

/// <summary>
/// Employee entity representing the core employee information
/// </summary>
public class Employee
{
    public Guid Id { get; private set; }
    public string PersonnelNumber { get; private set; }
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public string Education { get; private set; }
    public string ServiceUnit { get; private set; }
    public string CurrentPosition { get; private set; }
    public string AppointmentPosition { get; private set; }
    public int PreviousExperienceYears { get; private set; }
    public string? PhotoUrl { get; private set; }
    public string? StatusDescription { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation Properties
    public AdministrativeStatus? AdministrativeStatus { get; private set; }
    public ICollection<PerformanceCapability> PerformanceCapabilities { get; private set; }
    
    /// <summary>
    /// Optional reference to associated user account
    /// </summary>
    public Guid? UserId { get; private set; }
    
    /// <summary>
    /// Navigation property to associated user account
    /// </summary>
    public User? User { get; private set; }

    // Private constructor for EF Core
    private Employee()
    {
        PersonnelNumber = string.Empty;
        FirstName = string.Empty;
        LastName = string.Empty;
        Education = string.Empty;
        ServiceUnit = string.Empty;
        CurrentPosition = string.Empty;
        AppointmentPosition = string.Empty;
        PerformanceCapabilities = new List<PerformanceCapability>();
    }

    // Factory method for creating new employees
    public static Employee Create(
        string personnelNumber,
        string firstName,
        string lastName,
        string education,
        string serviceUnit,
        string currentPosition,
        string appointmentPosition,
        int previousExperienceYears)
    {
        ValidateRequiredFields(personnelNumber, firstName, lastName);
        ValidateExperienceYears(previousExperienceYears);

        return new Employee
        {
            Id = Guid.NewGuid(),
            PersonnelNumber = personnelNumber.Trim(),
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Education = education?.Trim() ?? string.Empty,
            ServiceUnit = serviceUnit?.Trim() ?? string.Empty,
            CurrentPosition = currentPosition?.Trim() ?? string.Empty,
            AppointmentPosition = appointmentPosition?.Trim() ?? string.Empty,
            PreviousExperienceYears = previousExperienceYears,
            CreatedAt = DateTime.UtcNow,
            PerformanceCapabilities = new List<PerformanceCapability>()
        };
    }

    // Domain Methods
    public void UpdatePersonalInfo(string firstName, string lastName, string education)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new ArgumentException("First name cannot be empty", nameof(firstName));

        if (string.IsNullOrWhiteSpace(lastName))
            throw new ArgumentException("Last name cannot be empty", nameof(lastName));

        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        Education = education?.Trim() ?? string.Empty;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdatePosition(string currentPosition, string appointmentPosition, int previousExperienceYears)
    {
        ValidateExperienceYears(previousExperienceYears);

        CurrentPosition = currentPosition?.Trim() ?? string.Empty;
        AppointmentPosition = appointmentPosition?.Trim() ?? string.Empty;
        PreviousExperienceYears = previousExperienceYears;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateServiceUnit(string serviceUnit)
    {
        ServiceUnit = serviceUnit?.Trim() ?? string.Empty;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetAdministrativeStatus(AdministrativeStatus status)
    {
        if (status == null)
            throw new ArgumentNullException(nameof(status));

        AdministrativeStatus = status;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddPerformanceCapability(PerformanceCapability capability)
    {
        if (capability == null)
            throw new ArgumentNullException(nameof(capability));

        PerformanceCapabilities.Add(capability);
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemovePerformanceCapability(Guid capabilityId)
    {
        var capability = PerformanceCapabilities.FirstOrDefault(c => c.Id == capabilityId);
        if (capability != null)
        {
            PerformanceCapabilities.Remove(capability);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void UpdatePhoto(string? photoUrl)
    {
        PhotoUrl = photoUrl;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateStatusDescription(string? statusDescription)
    {
        StatusDescription = statusDescription;
        UpdatedAt = DateTime.UtcNow;
    }

    public string GetFullName() => $"{FirstName} {LastName}";

    /// <summary>
    /// Associate this employee with a user account
    /// </summary>
    public void AssociateWithUser(Guid userId)
    {
        UserId = userId;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Remove user association
    /// </summary>
    public void RemoveUserAssociation()
    {
        UserId = null;
        UpdatedAt = DateTime.UtcNow;
    }

    // Private validation methods
    private static void ValidateRequiredFields(string personnelNumber, string firstName, string lastName)
    {
        if (string.IsNullOrWhiteSpace(personnelNumber))
            throw new ArgumentException("Personnel number cannot be empty", nameof(personnelNumber));

        if (string.IsNullOrWhiteSpace(firstName))
            throw new ArgumentException("First name cannot be empty", nameof(firstName));

        if (string.IsNullOrWhiteSpace(lastName))
            throw new ArgumentException("Last name cannot be empty", nameof(lastName));
    }

    private static void ValidateExperienceYears(int years)
    {
        if (years < 0)
            throw new ArgumentException("Experience years cannot be negative", nameof(years));

        if (years > 60)
            throw new ArgumentException("Experience years seems unrealistic (max 60)", nameof(years));
    }
}
