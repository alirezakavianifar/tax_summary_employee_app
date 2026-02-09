namespace TaxSummary.Application.DTOs;

/// <summary>
/// Data Transfer Object for Performance Capability
/// </summary>
public class PerformanceCapabilityDto
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public string SystemRole { get; set; } = string.Empty;
    
    // Boolean flags (kept for backward compatibility)
    public bool DetectionOfTaxIssues { get; set; }
    public bool DetectionOfTaxEvasion { get; set; }
    public bool CompanyIdentification { get; set; }
    public bool ValueAddedRecognition { get; set; }
    public bool ReferredOrExecuted { get; set; }
    
    // NEW: Numerical tracking - تعداد (Quantity) and مبلغ (Amount)
    public int DetectionOfTaxIssues_Quantity { get; set; }
    public decimal DetectionOfTaxIssues_Amount { get; set; }
    
    public int DetectionOfTaxEvasion_Quantity { get; set; }
    public decimal DetectionOfTaxEvasion_Amount { get; set; }
    
    public int CompanyIdentification_Quantity { get; set; }
    public decimal CompanyIdentification_Amount { get; set; }
    
    public int ValueAddedRecognition_Quantity { get; set; }
    public decimal ValueAddedRecognition_Amount { get; set; }
    
    public int ReferredOrExecuted_Quantity { get; set; }
    public decimal ReferredOrExecuted_Amount { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
