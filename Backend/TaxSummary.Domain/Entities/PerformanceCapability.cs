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

    // Executive Metrics (Heads of Tax Affairs / رؤسای امور)
    public decimal Collections1404_Amount { get; private set; }
    public decimal Collections1405_Amount { get; private set; }
    public int TotalObjections_Quantity { get; private set; }
    public int IssuedRulings_Quantity { get; private set; }
    public decimal IssuedRulings_Percentage { get; private set; }
    public int FinalizedObjections_Quantity { get; private set; }
    public decimal FinalizedRulings_Percentage { get; private set; }

    // Systemic Audit Performance Metrics (1399 & 1403)
    public int SystemicAudit1399_TotalQuantity { get; private set; }
    public int SystemicAudit1399_ObjectionQuantity { get; private set; }
    public decimal SystemicAudit1399_ObjectionPercentage { get; private set; }
    public int SystemicAudit1399_FinalizedObjectionQuantity { get; private set; }
    public decimal SystemicAudit1399_FinalizedObjectionPercentage { get; private set; }

    public int SystemicAudit1403_TotalQuantity { get; private set; }
    public int SystemicAudit1403_ObjectionQuantity { get; private set; }
    public decimal SystemicAudit1403_ObjectionPercentage { get; private set; }
    public int SystemicAudit1403_FinalizedObjectionQuantity { get; private set; }
    public decimal SystemicAudit1403_FinalizedObjectionPercentage { get; private set; }
    
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
        decimal referredOrExecutedAmount = 0,
        decimal collections1404Amount = 0,
        decimal collections1405Amount = 0,
        int totalObjectionsQuantity = 0,
        int issuedRulingsQuantity = 0,
        decimal issuedRulingsPercentage = 0,
        int finalizedObjectionsQuantity = 0,
        decimal finalizedRulingsPercentage = 0,
        int systemicAudit1399TotalQuantity = 0,
        int systemicAudit1399ObjectionQuantity = 0,
        decimal systemicAudit1399ObjectionPercentage = 0,
        int systemicAudit1399FinalizedObjectionQuantity = 0,
        decimal systemicAudit1399FinalizedObjectionPercentage = 0,
        int systemicAudit1403TotalQuantity = 0,
        int systemicAudit1403ObjectionQuantity = 0,
        decimal systemicAudit1403ObjectionPercentage = 0,
        int systemicAudit1403FinalizedObjectionQuantity = 0,
        decimal systemicAudit1403FinalizedObjectionPercentage = 0)
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

            Collections1404_Amount = collections1404Amount >= 0 ? collections1404Amount : 0,
            Collections1405_Amount = collections1405Amount >= 0 ? collections1405Amount : 0,
            TotalObjections_Quantity = totalObjectionsQuantity >= 0 ? totalObjectionsQuantity : 0,
            IssuedRulings_Quantity = issuedRulingsQuantity >= 0 ? issuedRulingsQuantity : 0,
            IssuedRulings_Percentage = issuedRulingsPercentage >= 0 ? issuedRulingsPercentage : 0,
            FinalizedObjections_Quantity = finalizedObjectionsQuantity >= 0 ? finalizedObjectionsQuantity : 0,
            FinalizedRulings_Percentage = finalizedRulingsPercentage >= 0 ? finalizedRulingsPercentage : 0,

            SystemicAudit1399_TotalQuantity = systemicAudit1399TotalQuantity >= 0 ? systemicAudit1399TotalQuantity : 0,
            SystemicAudit1399_ObjectionQuantity = systemicAudit1399ObjectionQuantity >= 0 ? systemicAudit1399ObjectionQuantity : 0,
            SystemicAudit1399_ObjectionPercentage = systemicAudit1399ObjectionPercentage >= 0 ? systemicAudit1399ObjectionPercentage : 0,
            SystemicAudit1399_FinalizedObjectionQuantity = systemicAudit1399FinalizedObjectionQuantity >= 0 ? systemicAudit1399FinalizedObjectionQuantity : 0,
            SystemicAudit1399_FinalizedObjectionPercentage = systemicAudit1399FinalizedObjectionPercentage >= 0 ? systemicAudit1399FinalizedObjectionPercentage : 0,

            SystemicAudit1403_TotalQuantity = systemicAudit1403TotalQuantity >= 0 ? systemicAudit1403TotalQuantity : 0,
            SystemicAudit1403_ObjectionQuantity = systemicAudit1403ObjectionQuantity >= 0 ? systemicAudit1403ObjectionQuantity : 0,
            SystemicAudit1403_ObjectionPercentage = systemicAudit1403ObjectionPercentage >= 0 ? systemicAudit1403ObjectionPercentage : 0,
            SystemicAudit1403_FinalizedObjectionQuantity = systemicAudit1403FinalizedObjectionQuantity >= 0 ? systemicAudit1403FinalizedObjectionQuantity : 0,
            SystemicAudit1403_FinalizedObjectionPercentage = systemicAudit1403FinalizedObjectionPercentage >= 0 ? systemicAudit1403FinalizedObjectionPercentage : 0,

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

    public void UpdateExecutiveMetrics(
        decimal collections1404Amount,
        decimal collections1405Amount,
        int totalObjectionsQuantity,
        int issuedRulingsQuantity,
        decimal issuedRulingsPercentage,
        int finalizedObjectionsQuantity,
        decimal finalizedRulingsPercentage)
    {
        Collections1404_Amount = collections1404Amount >= 0 ? collections1404Amount : 0;
        Collections1405_Amount = collections1405Amount >= 0 ? collections1405Amount : 0;
        TotalObjections_Quantity = totalObjectionsQuantity >= 0 ? totalObjectionsQuantity : 0;
        IssuedRulings_Quantity = issuedRulingsQuantity >= 0 ? issuedRulingsQuantity : 0;
        IssuedRulings_Percentage = issuedRulingsPercentage >= 0 ? issuedRulingsPercentage : 0;
        FinalizedObjections_Quantity = finalizedObjectionsQuantity >= 0 ? finalizedObjectionsQuantity : 0;
        FinalizedRulings_Percentage = finalizedRulingsPercentage >= 0 ? finalizedRulingsPercentage : 0;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateSystemicAuditMetrics(
        int systemicAudit1399TotalQuantity,
        int systemicAudit1399ObjectionQuantity,
        decimal systemicAudit1399ObjectionPercentage,
        int systemicAudit1399FinalizedObjectionQuantity,
        decimal systemicAudit1399FinalizedObjectionPercentage,
        int systemicAudit1403TotalQuantity,
        int systemicAudit1403ObjectionQuantity,
        decimal systemicAudit1403ObjectionPercentage,
        int systemicAudit1403FinalizedObjectionQuantity,
        decimal systemicAudit1403FinalizedObjectionPercentage)
    {
        SystemicAudit1399_TotalQuantity = systemicAudit1399TotalQuantity >= 0 ? systemicAudit1399TotalQuantity : 0;
        SystemicAudit1399_ObjectionQuantity = systemicAudit1399ObjectionQuantity >= 0 ? systemicAudit1399ObjectionQuantity : 0;
        SystemicAudit1399_ObjectionPercentage = systemicAudit1399ObjectionPercentage >= 0 ? systemicAudit1399ObjectionPercentage : 0;
        SystemicAudit1399_FinalizedObjectionQuantity = systemicAudit1399FinalizedObjectionQuantity >= 0 ? systemicAudit1399FinalizedObjectionQuantity : 0;
        SystemicAudit1399_FinalizedObjectionPercentage = systemicAudit1399FinalizedObjectionPercentage >= 0 ? systemicAudit1399FinalizedObjectionPercentage : 0;

        SystemicAudit1403_TotalQuantity = systemicAudit1403TotalQuantity >= 0 ? systemicAudit1403TotalQuantity : 0;
        SystemicAudit1403_ObjectionQuantity = systemicAudit1403ObjectionQuantity >= 0 ? systemicAudit1403ObjectionQuantity : 0;
        SystemicAudit1403_ObjectionPercentage = systemicAudit1403ObjectionPercentage >= 0 ? systemicAudit1403ObjectionPercentage : 0;
        SystemicAudit1403_FinalizedObjectionQuantity = systemicAudit1403FinalizedObjectionQuantity >= 0 ? systemicAudit1403FinalizedObjectionQuantity : 0;
        SystemicAudit1403_FinalizedObjectionPercentage = systemicAudit1403FinalizedObjectionPercentage >= 0 ? systemicAudit1403FinalizedObjectionPercentage : 0;

        UpdatedAt = DateTime.UtcNow;
    }

    public bool HasSystemicAuditMetrics()
    {
        return SystemicAudit1399_TotalQuantity > 0 ||
               SystemicAudit1403_TotalQuantity > 0 ||
               SystemicAudit1399_ObjectionQuantity > 0 ||
               SystemicAudit1403_ObjectionQuantity > 0;
    }

    public bool HasExecutiveMetrics()
    {
        return Collections1404_Amount > 0 ||
               Collections1405_Amount > 0 ||
               TotalObjections_Quantity > 0 ||
               IssuedRulings_Quantity > 0 ||
               FinalizedObjections_Quantity > 0 ||
               HasSystemicAuditMetrics();
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
