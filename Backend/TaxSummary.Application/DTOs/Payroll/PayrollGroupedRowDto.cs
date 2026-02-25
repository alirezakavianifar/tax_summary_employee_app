namespace TaxSummary.Application.DTOs.Payroll;

/// <summary>
/// Grouped/aggregated row per department in a payroll processing result
/// </summary>
public class PayrollGroupedRowDto
{
    public string Department { get; set; } = string.Empty;
    public int EmployeeCount { get; set; }

    // Overtime/Welfare sums
    public double? BaseOvertimePerPerson { get; set; }
    public double? BaseOvertimeSum { get; set; }
    public double? BaseWelfarePerPerson { get; set; }
    public double? BaseWelfareSum { get; set; }
    public long? TotalOvertimeAmount { get; set; }
    public long? TotalWelfareAmount { get; set; }

    // Bonus sums (HalfPercentBonus process)
    public double? BonusPerPerson { get; set; }
    public double? TotalBonusSum { get; set; }
}
