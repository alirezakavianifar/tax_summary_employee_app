namespace TaxSummary.Domain.Entities;

/// <summary>
/// Performance Capability entity representing employee's performance capabilities
/// </summary>
public class PerformanceCapability
{
    public Guid Id { get; private set; }
    public Guid EmployeeId { get; private set; }
    public string SystemRole { get; private set; }
    public bool DetectionOfTaxIssues { get; private set; }
    public bool DetectionOfTaxEvasion { get; private set; }
    public bool CompanyIdentification { get; private set; }
    public bool ValueAddedRecognition { get; private set; }
    public bool ReferredOrExecuted { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation
    public Employee Employee { get; private set; } = null!;

    // Private constructor for EF Core
    private PerformanceCapability() 
    {
        SystemRole = string.Empty;
    }

    // Factory method for creating new performance capability
    public static PerformanceCapability Create(
        Guid employeeId,
        string systemRole,
        bool detectionOfTaxIssues = false,
        bool detectionOfTaxEvasion = false,
        bool companyIdentification = false,
        bool valueAddedRecognition = false,
        bool referredOrExecuted = false)
    {
        if (string.IsNullOrWhiteSpace(systemRole))
            throw new ArgumentException("System role cannot be empty", nameof(systemRole));

        return new PerformanceCapability
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            SystemRole = systemRole.Trim(),
            DetectionOfTaxIssues = detectionOfTaxIssues,
            DetectionOfTaxEvasion = detectionOfTaxEvasion,
            CompanyIdentification = companyIdentification,
            ValueAddedRecognition = valueAddedRecognition,
            ReferredOrExecuted = referredOrExecuted,
            CreatedAt = DateTime.UtcNow
        };
    }

    // Domain Methods
    public void UpdateCapabilities(
        bool detectionOfTaxIssues,
        bool detectionOfTaxEvasion,
        bool companyIdentification,
        bool valueAddedRecognition,
        bool referredOrExecuted)
    {
        DetectionOfTaxIssues = detectionOfTaxIssues;
        DetectionOfTaxEvasion = detectionOfTaxEvasion;
        CompanyIdentification = companyIdentification;
        ValueAddedRecognition = valueAddedRecognition;
        ReferredOrExecuted = referredOrExecuted;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateSystemRole(string systemRole)
    {
        if (string.IsNullOrWhiteSpace(systemRole))
            throw new ArgumentException("System role cannot be empty", nameof(systemRole));

        SystemRole = systemRole.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void EnableDetectionOfTaxIssues()
    {
        DetectionOfTaxIssues = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void DisableDetectionOfTaxIssues()
    {
        DetectionOfTaxIssues = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void EnableDetectionOfTaxEvasion()
    {
        DetectionOfTaxEvasion = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void DisableDetectionOfTaxEvasion()
    {
        DetectionOfTaxEvasion = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void EnableCompanyIdentification()
    {
        CompanyIdentification = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void DisableCompanyIdentification()
    {
        CompanyIdentification = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void EnableValueAddedRecognition()
    {
        ValueAddedRecognition = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void DisableValueAddedRecognition()
    {
        ValueAddedRecognition = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkAsReferredOrExecuted()
    {
        ReferredOrExecuted = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UnmarkAsReferredOrExecuted()
    {
        ReferredOrExecuted = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public int GetCapabilityScore()
    {
        // Calculate a simple score based on enabled capabilities
        int score = 0;
        if (DetectionOfTaxIssues) score += 20;
        if (DetectionOfTaxEvasion) score += 25;
        if (CompanyIdentification) score += 20;
        if (ValueAddedRecognition) score += 20;
        if (ReferredOrExecuted) score += 15;
        return score;
    }

    public bool HasAnyCapability()
    {
        return DetectionOfTaxIssues ||
               DetectionOfTaxEvasion ||
               CompanyIdentification ||
               ValueAddedRecognition ||
               ReferredOrExecuted;
    }

    public IEnumerable<string> GetActiveCapabilities()
    {
        var capabilities = new List<string>();

        if (DetectionOfTaxIssues) capabilities.Add("Detection of Tax Issues");
        if (DetectionOfTaxEvasion) capabilities.Add("Detection of Tax Evasion");
        if (CompanyIdentification) capabilities.Add("Company Identification");
        if (ValueAddedRecognition) capabilities.Add("Value Added Recognition");
        if (ReferredOrExecuted) capabilities.Add("Referred or Executed");

        return capabilities;
    }
}
