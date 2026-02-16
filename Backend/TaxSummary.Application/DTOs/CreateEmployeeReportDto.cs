using System.ComponentModel.DataAnnotations;

namespace TaxSummary.Application.DTOs;

/// <summary>
/// DTO for creating a new employee report
/// </summary>
public class CreateEmployeeReportDto
{
    public string PersonnelNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Education { get; set; } = string.Empty;
    public string ServiceUnit { get; set; } = string.Empty;
    public string? NationalId { get; set; }
    public string CurrentPosition { get; set; } = string.Empty;
    public string AppointmentPosition { get; set; } = string.Empty;
    public int PreviousExperienceYears { get; set; }
    public string? PhotoUrl { get; set; }
    public string? StatusDescription { get; set; }

    [Required]
    [Range(0, 365, ErrorMessage = "تعداد روزهای ماموریت باید بین 0 تا 365 باشد")]
    public int MissionDays { get; set; }

    [Required]
    [Range(0, 365, ErrorMessage = "تعداد روزهای مرخصی استعلاجی باید بین 0 تا 365 باشد")]
    public int SickLeaveDays { get; set; }

    [Required]
    [Range(0, 365, ErrorMessage = "تعداد روزهای مرخصی استحقاقی باید بین 0 تا 365 باشد")]
    public int PaidLeaveDays { get; set; }

    [Required]
    [Range(0, 8760, ErrorMessage = "ساعات اضافه کاری باید بین 0 تا 8760 باشد")]
    public int OvertimeHours { get; set; }

    [Required]
    [Range(0, 8760, ErrorMessage = "ساعات تاخیر و غیبت باید بین 0 تا 8760 باشد")]
    public int DelayAndAbsenceHours { get; set; }

    [Required]
    [Range(0, 8760, ErrorMessage = "ساعات مرخصی ساعتی باید بین 0 تا 8760 باشد")]
    public int HourlyLeaveHours { get; set; }

    // Performance Capabilities
    public List<CreatePerformanceCapabilityDto> Capabilities { get; set; } = new();
}

/// <summary>
/// DTO for creating a performance capability
/// </summary>
public class CreatePerformanceCapabilityDto
{
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
}
