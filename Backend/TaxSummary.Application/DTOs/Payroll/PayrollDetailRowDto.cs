namespace TaxSummary.Application.DTOs.Payroll;

/// <summary>
/// Detail row for a single employee in a payroll processing result
/// </summary>
public class PayrollDetailRowDto
{
    public string PersonnelNumber { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;

    // Rates (null if not applicable for the process type)
    public double? OvertimeRate { get; set; }
    public double? WelfareRate { get; set; }

    // Base amounts from coefficient file
    public double? BaseOvertimeAmount { get; set; }
    public double? BaseWelfareAmount { get; set; }
    public double? BaseBonusAmount { get; set; }

    // Calculated amounts
    public long? CalculatedOvertimeAmount { get; set; }
    public long? CalculatedWelfareAmount { get; set; }
    public long? CalculatedBonusAmount { get; set; }
}
