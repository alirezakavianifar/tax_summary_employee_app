namespace TaxSummary.Domain.Entities;

/// <summary>
/// Performance Capability entity representing employee's performance capabilities
/// </summary>
public class PerformanceCapability
{
    public Guid Id { get; private set; }
    public Guid EmployeeId { get; private set; }
    public string SystemRole { get; private set; }
    
    // Boolean flags (kept for backward compatibility)
    public bool DetectionOfTaxIssues { get; private set; }
    public bool DetectionOfTaxEvasion { get; private set; }
    public bool CompanyIdentification { get; private set; }
    public bool ValueAddedRecognition { get; private set; }
    public bool ReferredOrExecuted { get; private set; }
    
    // NEW: Numerical tracking - تعداد (Quantity) and مبلغ (Amount)
    public int DetectionOfTaxIssues_Quantity { get; private set; }
    public decimal DetectionOfTaxIssues_Amount { get; private set; }
    
    public int DetectionOfTaxEvasion_Quantity { get; private set; }
    public decimal DetectionOfTaxEvasion_Amount { get; private set; }
    
    public int CompanyIdentification_Quantity { get; private set; }
    public decimal CompanyIdentification_Amount { get; private set; }
    
    public int ValueAddedRecognition_Quantity { get; private set; }
    public decimal ValueAddedRecognition_Amount { get; private set; }
    public int ValueAddedRecognition_UndetectedQuantity { get; private set; } // Added

    public int Jobs_Quantity { get; private set; } // Added
    public decimal Jobs_Amount { get; private set; } // Added
    public int Jobs_UndetectedQuantity { get; private set; } // Added

    public int Other_Quantity { get; private set; } // Added
    public decimal Other_Amount { get; private set; } // Added
    public int Other_UndetectedQuantity { get; private set; } // Added
    
    public int ReferredOrExecuted_Quantity { get; private set; }
    public decimal ReferredOrExecuted_Amount { get; private set; }
    
    // Additional Undetected for Company
    public int CompanyIdentification_UndetectedQuantity { get; private set; } // Added
    
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
        bool referredOrExecuted = false,
        int detectionOfTaxIssuesQuantity = 0,
        decimal detectionOfTaxIssuesAmount = 0,
        int detectionOfTaxEvasionQuantity = 0,
        decimal detectionOfTaxEvasionAmount = 0,
        int companyIdentificationQuantity = 0,
        decimal companyIdentificationAmount = 0,
        int valueAddedRecognitionQuantity = 0,
        decimal valueAddedRecognitionAmount = 0,
        int valueAddedRecognitionUndetectedQuantity = 0,
        int jobsQuantity = 0,
        decimal jobsAmount = 0,
        int jobsUndetectedQuantity = 0,
        int otherQuantity = 0,
        decimal otherAmount = 0,
        int otherUndetectedQuantity = 0,
        int companyIdentificationUndetectedQuantity = 0,
        int referredOrExecutedQuantity = 0,
        decimal referredOrExecutedAmount = 0)
    {
        if (string.IsNullOrWhiteSpace(systemRole))
            throw new ArgumentException("System role cannot be empty", nameof(systemRole));

        if (detectionOfTaxIssuesQuantity < 0) throw new ArgumentException("Quantity cannot be negative", nameof(detectionOfTaxIssuesQuantity));
        if (detectionOfTaxIssuesAmount < 0) throw new ArgumentException("Amount cannot be negative", nameof(detectionOfTaxIssuesAmount));
        if (detectionOfTaxEvasionQuantity < 0) throw new ArgumentException("Quantity cannot be negative", nameof(detectionOfTaxEvasionQuantity));
        if (detectionOfTaxEvasionAmount < 0) throw new ArgumentException("Amount cannot be negative", nameof(detectionOfTaxEvasionAmount));
        if (companyIdentificationQuantity < 0) throw new ArgumentException("Quantity cannot be negative", nameof(companyIdentificationQuantity));
        if (companyIdentificationAmount < 0) throw new ArgumentException("Amount cannot be negative", nameof(companyIdentificationAmount));
        if (valueAddedRecognitionQuantity < 0) throw new ArgumentException("Quantity cannot be negative", nameof(valueAddedRecognitionQuantity));
        if (valueAddedRecognitionAmount < 0) throw new ArgumentException("Amount cannot be negative", nameof(valueAddedRecognitionAmount));
        if (referredOrExecutedQuantity < 0) throw new ArgumentException("Quantity cannot be negative", nameof(referredOrExecutedQuantity));
        if (referredOrExecutedAmount < 0) throw new ArgumentException("Amount cannot be negative", nameof(referredOrExecutedAmount));

        return new PerformanceCapability
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            SystemRole = systemRole.Trim(),
            DetectionOfTaxIssues = detectionOfTaxIssues || detectionOfTaxIssuesQuantity > 0,
            DetectionOfTaxEvasion = detectionOfTaxEvasion || detectionOfTaxEvasionQuantity > 0,
            CompanyIdentification = companyIdentification || companyIdentificationQuantity > 0,
            ValueAddedRecognition = valueAddedRecognition || valueAddedRecognitionQuantity > 0,
            ReferredOrExecuted = referredOrExecuted || referredOrExecutedQuantity > 0,
            DetectionOfTaxIssues_Quantity = detectionOfTaxIssuesQuantity,
            DetectionOfTaxIssues_Amount = detectionOfTaxIssuesAmount,
            DetectionOfTaxEvasion_Quantity = detectionOfTaxEvasionQuantity,
            DetectionOfTaxEvasion_Amount = detectionOfTaxEvasionAmount,
            CompanyIdentification_Quantity = companyIdentificationQuantity,
            CompanyIdentification_Amount = companyIdentificationAmount,
            ValueAddedRecognition_Quantity = valueAddedRecognitionQuantity,
            ValueAddedRecognition_Amount = valueAddedRecognitionAmount,
            ValueAddedRecognition_UndetectedQuantity = valueAddedRecognitionUndetectedQuantity,
            
            Jobs_Quantity = jobsQuantity,
            Jobs_Amount = jobsAmount,
            Jobs_UndetectedQuantity = jobsUndetectedQuantity,
            
            Other_Quantity = otherQuantity,
            Other_Amount = otherAmount,
            Other_UndetectedQuantity = otherUndetectedQuantity,
            
            CompanyIdentification_UndetectedQuantity = companyIdentificationUndetectedQuantity,

            ReferredOrExecuted_Quantity = referredOrExecutedQuantity,
            ReferredOrExecuted_Amount = referredOrExecutedAmount,
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

    /// <summary>
    /// Updates all capability metrics (quantity and amount)
    /// </summary>
    public void UpdateAllCapabilityMetrics(
        int detectionOfTaxIssuesQuantity,
        decimal detectionOfTaxIssuesAmount,
        int detectionOfTaxEvasionQuantity,
        decimal detectionOfTaxEvasionAmount,
        int companyIdentificationQuantity,
        decimal companyIdentificationAmount,
        int companyIdentificationUndetectedQuantity,
        int valueAddedRecognitionQuantity,
        decimal valueAddedRecognitionAmount,
        int valueAddedRecognitionUndetectedQuantity,
        int jobsQuantity,
        decimal jobsAmount,
        int jobsUndetectedQuantity,
        int otherQuantity,
        decimal otherAmount,
        int otherUndetectedQuantity,
        int referredOrExecutedQuantity,
        decimal referredOrExecutedAmount)
    {
        if (detectionOfTaxIssuesQuantity < 0) throw new ArgumentException("Quantity cannot be negative");
        if (detectionOfTaxIssuesAmount < 0) throw new ArgumentException("Amount cannot be negative");
        if (detectionOfTaxEvasionQuantity < 0) throw new ArgumentException("Quantity cannot be negative");
        if (detectionOfTaxEvasionAmount < 0) throw new ArgumentException("Amount cannot be negative");
        if (companyIdentificationQuantity < 0) throw new ArgumentException("Quantity cannot be negative");
        if (companyIdentificationAmount < 0) throw new ArgumentException("Amount cannot be negative");
        if (valueAddedRecognitionQuantity < 0) throw new ArgumentException("Quantity cannot be negative");
        if (valueAddedRecognitionAmount < 0) throw new ArgumentException("Amount cannot be negative");
        if (referredOrExecutedQuantity < 0) throw new ArgumentException("Quantity cannot be negative");
        if (referredOrExecutedAmount < 0) throw new ArgumentException("Amount cannot be negative");
        
        // No strict check for Undetected quantities? Assuming non-negative.
        if (companyIdentificationUndetectedQuantity < 0) throw new ArgumentException("Undetected Quantity cannot be negative");
        if (valueAddedRecognitionUndetectedQuantity < 0) throw new ArgumentException("Undetected Quantity cannot be negative");
        if (jobsQuantity < 0) throw new ArgumentException("Jobs Quantity cannot be negative");
        if (jobsAmount < 0) throw new ArgumentException("Jobs Amount cannot be negative");
        if (jobsUndetectedQuantity < 0) throw new ArgumentException("Undetected Quantity cannot be negative");
        if (otherQuantity < 0) throw new ArgumentException("Other Quantity cannot be negative");
        if (otherAmount < 0) throw new ArgumentException("Other Amount cannot be negative");
        if (otherUndetectedQuantity < 0) throw new ArgumentException("Undetected Quantity cannot be negative");

        DetectionOfTaxIssues_Quantity = detectionOfTaxIssuesQuantity;
        DetectionOfTaxIssues_Amount = detectionOfTaxIssuesAmount;
        DetectionOfTaxEvasion_Quantity = detectionOfTaxEvasionQuantity;
        DetectionOfTaxEvasion_Amount = detectionOfTaxEvasionAmount;
        CompanyIdentification_Quantity = companyIdentificationQuantity;
        CompanyIdentification_Amount = companyIdentificationAmount;
        CompanyIdentification_UndetectedQuantity = companyIdentificationUndetectedQuantity;
        
        ValueAddedRecognition_Quantity = valueAddedRecognitionQuantity;
        ValueAddedRecognition_Amount = valueAddedRecognitionAmount;
        ValueAddedRecognition_UndetectedQuantity = valueAddedRecognitionUndetectedQuantity;
        
        Jobs_Quantity = jobsQuantity;
        Jobs_Amount = jobsAmount;
        Jobs_UndetectedQuantity = jobsUndetectedQuantity;
        
        Other_Quantity = otherQuantity;
        Other_Amount = otherAmount;
        Other_UndetectedQuantity = otherUndetectedQuantity;
        
        ReferredOrExecuted_Quantity = referredOrExecutedQuantity;
        ReferredOrExecuted_Amount = referredOrExecutedAmount;

        // Auto-update boolean flags based on quantity
        DetectionOfTaxIssues = detectionOfTaxIssuesQuantity > 0;
        DetectionOfTaxEvasion = detectionOfTaxEvasionQuantity > 0;
        CompanyIdentification = companyIdentificationQuantity > 0;
        ValueAddedRecognition = valueAddedRecognitionQuantity > 0;
        ReferredOrExecuted = referredOrExecutedQuantity > 0;

        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Updates a specific capability's metrics
    /// </summary>
    public void UpdateCapabilityMetric(string capabilityType, int quantity, decimal amount)
    {
        if (quantity < 0) throw new ArgumentException("Quantity cannot be negative", nameof(quantity));
        if (amount < 0) throw new ArgumentException("Amount cannot be negative", nameof(amount));

        switch (capabilityType.ToLower())
        {
            case "detectionoftaxissues":
                DetectionOfTaxIssues_Quantity = quantity;
                DetectionOfTaxIssues_Amount = amount;
                DetectionOfTaxIssues = quantity > 0;
                break;
            case "detectionoftaxevasion":
                DetectionOfTaxEvasion_Quantity = quantity;
                DetectionOfTaxEvasion_Amount = amount;
                DetectionOfTaxEvasion = quantity > 0;
                break;
            case "companyidentification":
                CompanyIdentification_Quantity = quantity;
                CompanyIdentification_Amount = amount;
                CompanyIdentification = quantity > 0;
                break;
            case "valueaddedrecognition":
                ValueAddedRecognition_Quantity = quantity;
                ValueAddedRecognition_Amount = amount;
                ValueAddedRecognition = quantity > 0;
                break;
            case "referredorexecuted":
                ReferredOrExecuted_Quantity = quantity;
                ReferredOrExecuted_Amount = amount;
                ReferredOrExecuted = quantity > 0;
                break;
            default:
                throw new ArgumentException($"Unknown capability type: {capabilityType}", nameof(capabilityType));
        }

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

    /// <summary>
    /// Calculates the total amount across all capabilities
    /// </summary>
    public decimal GetTotalAmount()
    {
        return DetectionOfTaxIssues_Amount +
               DetectionOfTaxEvasion_Amount +
               CompanyIdentification_Amount +
               ValueAddedRecognition_Amount +
               ReferredOrExecuted_Amount;
    }

    /// <summary>
    /// Calculates the total quantity across all capabilities
    /// </summary>
    public int GetTotalQuantity()
    {
        return DetectionOfTaxIssues_Quantity +
               DetectionOfTaxEvasion_Quantity +
               CompanyIdentification_Quantity +
               ValueAddedRecognition_Quantity +
               ReferredOrExecuted_Quantity;
    }

    /// <summary>
    /// Checks if any capability has metrics (quantity or amount)
    /// </summary>
    public bool HasAnyMetrics()
    {
        return GetTotalQuantity() > 0 || GetTotalAmount() > 0;
    }

    public int GetCapabilityCount()
    {
        int count = 0;
        if (DetectionOfTaxIssues) count++;
        if (DetectionOfTaxEvasion) count++;
        if (CompanyIdentification) count++;
        if (ValueAddedRecognition) count++;
        if (ReferredOrExecuted) count++;
        return count;
    }
}
