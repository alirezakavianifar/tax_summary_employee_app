namespace TaxSummary.Application.DTOs.Payroll;

/// <summary>
/// Request DTO for saving a payroll run to the database
/// </summary>
public class SavePayrollRunRequestDto
{
    public string ProcessType { get; set; } = string.Empty;
    public string RunLabel { get; set; } = string.Empty;
    public PayrollProcessResultDto Result { get; set; } = new();
}
