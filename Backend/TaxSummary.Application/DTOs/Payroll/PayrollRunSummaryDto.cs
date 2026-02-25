namespace TaxSummary.Application.DTOs.Payroll;

/// <summary>
/// Summary DTO for listing saved payroll runs
/// </summary>
public class PayrollRunSummaryDto
{
    public Guid Id { get; set; }
    public string ProcessType { get; set; } = string.Empty;
    public string RunLabel { get; set; } = string.Empty;
    public int RowCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
