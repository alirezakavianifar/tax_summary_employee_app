namespace TaxSummary.Application.DTOs;

/// <summary>
/// Data Transfer Object for Performance Capability
/// </summary>
public class PerformanceCapabilityDto
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public string SystemRole { get; set; } = string.Empty;
    public bool DetectionOfTaxIssues { get; set; }
    public bool DetectionOfTaxEvasion { get; set; }
    public bool CompanyIdentification { get; set; }
    public bool ValueAddedRecognition { get; set; }
    public bool ReferredOrExecuted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
