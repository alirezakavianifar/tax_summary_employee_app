namespace TaxSummary.Application.DTOs.Payroll;

/// <summary>
/// Full result of a payroll processing operation
/// </summary>
public class PayrollProcessResultDto
{
    public string ProcessType { get; set; } = string.Empty;
    public List<PayrollDetailRowDto> DetailRows { get; set; } = new();
    public List<PayrollGroupedRowDto> GroupedRows { get; set; } = new();
}
