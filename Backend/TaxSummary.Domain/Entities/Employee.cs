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
    public string? NationalId { get; private set; }
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
        int previousExperienceYears,
        string? nationalId = null)
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
            NationalId = nationalId?.Trim(),
            CreatedAt = DateTime.UtcNow,
            PerformanceCapabilities = new List<PerformanceCapability>()
        };
    }

    // Domain Methods
    public void UpdatePersonalInfo(string firstName, string lastName, string education, string? nationalId = null)
    {
        if (string.IsNullOrWhiteSpace(firstName))
            throw new ArgumentException("First name cannot be empty", nameof(firstName));

        if (string.IsNullOrWhiteSpace(lastName))
            throw new ArgumentException("Last name cannot be empty", nameof(lastName));

        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        Education = education?.Trim() ?? string.Empty;
        NationalId = nationalId?.Trim();
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

    /// <summary>
    /// Generates a professional Persian status description based on employee data
    /// </summary>
    /// <returns>Persian description string</returns>
    public string GenerateStatusDescription()
    {
        var sb = new System.Text.StringBuilder();

        // 1. Basic Information
        sb.Append($"همکار گرامی، ");
        sb.Append($"{FirstName} {LastName} ");
        sb.Append($"با تحصیلات {Education} ");
        
        if (PreviousExperienceYears > 0)
        {
            sb.Append($"و {PreviousExperienceYears} سال سابقه خدمت، ");
        }

        sb.Append($"در حال حاضر در واحد {ServiceUnit} ");
        sb.Append($"در سمت {CurrentPosition} مشغول به فعالیت می‌باشند. ");

        if (!string.IsNullOrWhiteSpace(AppointmentPosition))
        {
            sb.Append($"ایشان جهت انتصاب در پست {AppointmentPosition} پیشنهاد شده‌اند. ");
        }

        // 2. Administrative Status
        if (AdministrativeStatus != null)
        {
            sb.Append("\n\n");
            sb.Append("وضعیت اداری ایشان در دوره اخیر به شرح ذیل است: ");
            
            var adminParts = new List<string>();
            if (AdministrativeStatus.OvertimeHours > 0) adminParts.Add($"{AdministrativeStatus.OvertimeHours} ساعت اضافه‌کاری");
            if (AdministrativeStatus.MissionDays > 0) adminParts.Add($"{AdministrativeStatus.MissionDays} روز مأموریت");
            if (AdministrativeStatus.PaidLeaveDays > 0) adminParts.Add($"{AdministrativeStatus.PaidLeaveDays} روز مرخصی استحقاقی");
            if (AdministrativeStatus.SickLeaveDays > 0) adminParts.Add($"{AdministrativeStatus.SickLeaveDays} روز مرخصی استعلاجی");
            
            if (adminParts.Any())
            {
                sb.Append(string.Join("، ", adminParts));
                sb.Append(" ثبت شده است. ");
            }

            if (AdministrativeStatus.DelayAndAbsenceHours > 0)
            {
                sb.Append($"همچنین میزان تأخیر و غیبت ایشان {AdministrativeStatus.DelayAndAbsenceHours} ساعت برآورد گردیده است. ");
            }
        }

        // 3. Performance Capabilities
        if (PerformanceCapabilities != null && PerformanceCapabilities.Any())
        {
            sb.Append("\n\n");
            sb.Append("در حوزه توانمندی‌های عملکردی: ");

            foreach (var cap in PerformanceCapabilities)
            {
                
                var details = new List<string>();

                if (cap.DetectionOfTaxIssues)
                {
                    var msg = "تشخیص مشاغل/مالیات";
                    var parts = new List<string>();
                    if (cap.DetectionOfTaxIssues_Quantity > 0) parts.Add($"{cap.DetectionOfTaxIssues_Quantity.ToString("N0", new System.Globalization.CultureInfo("fa-IR"))} مورد");
                    if (cap.DetectionOfTaxIssues_Amount > 0) parts.Add($"به مبلغ {cap.DetectionOfTaxIssues_Amount.ToString("N0", new System.Globalization.CultureInfo("fa-IR"))} ریال");
                    if (parts.Any()) msg += $" ({string.Join(" و ", parts)})";
                    details.Add(msg);
                }

                if (cap.DetectionOfTaxEvasion)
                {
                    var msg = "تشخیص فرار مالیاتی";
                    var parts = new List<string>();
                    if (cap.DetectionOfTaxEvasion_Quantity > 0) parts.Add($"{cap.DetectionOfTaxEvasion_Quantity.ToString("N0", new System.Globalization.CultureInfo("fa-IR"))} مورد");
                    if (cap.DetectionOfTaxEvasion_Amount > 0) parts.Add($"به مبلغ {cap.DetectionOfTaxEvasion_Amount.ToString("N0", new System.Globalization.CultureInfo("fa-IR"))} ریال");
                    if (parts.Any()) msg += $" ({string.Join(" و ", parts)})";
                    details.Add(msg);
                }

                if (cap.CompanyIdentification)
                {
                    var msg = "تشخیص شرکت/مالیات";
                    var parts = new List<string>();
                    if (cap.CompanyIdentification_Quantity > 0) parts.Add($"{cap.CompanyIdentification_Quantity.ToString("N0", new System.Globalization.CultureInfo("fa-IR"))} مورد");
                    if (cap.CompanyIdentification_Amount > 0) parts.Add($"به مبلغ {cap.CompanyIdentification_Amount.ToString("N0", new System.Globalization.CultureInfo("fa-IR"))} ریال");
                    if (parts.Any()) msg += $" ({string.Join(" و ", parts)})";
                    details.Add(msg);
                }

                if (cap.ValueAddedRecognition)
                {
                    var msg = "تشخیص ارزش افزوده/مالیات";
                    var parts = new List<string>();
                    if (cap.ValueAddedRecognition_Quantity > 0) parts.Add($"{cap.ValueAddedRecognition_Quantity.ToString("N0", new System.Globalization.CultureInfo("fa-IR"))} مورد");
                    if (cap.ValueAddedRecognition_Amount > 0) parts.Add($"به مبلغ {cap.ValueAddedRecognition_Amount.ToString("N0", new System.Globalization.CultureInfo("fa-IR"))} ریال");
                    if (parts.Any()) msg += $" ({string.Join(" و ", parts)})";
                    details.Add(msg);
                }

                if (cap.ReferredOrExecuted)
                {
                    var msg = "ارجاع یا اجرا شده";
                    var parts = new List<string>();
                    if (cap.ReferredOrExecuted_Quantity > 0) parts.Add($"{cap.ReferredOrExecuted_Quantity.ToString("N0", new System.Globalization.CultureInfo("fa-IR"))} مورد");
                    if (cap.ReferredOrExecuted_Amount > 0) parts.Add($"به مبلغ {cap.ReferredOrExecuted_Amount.ToString("N0", new System.Globalization.CultureInfo("fa-IR"))} ریال");
                    if (parts.Any()) msg += $" ({string.Join(" و ", parts)})";
                    details.Add(msg);
                }

                if (details.Any())
                {
                    sb.Append("دارای عملکرد در زمینه " + string.Join("، ", details) + " می‌باشند. ");
                }
            }
        }

        return sb.ToString().Trim();
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
