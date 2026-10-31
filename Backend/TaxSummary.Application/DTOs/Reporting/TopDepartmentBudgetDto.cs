namespace TaxSummary.Application.DTOs.Reporting;

public class TopDepartmentBudgetDto
{
    public string DepartmentName { get; set; } = string.Empty;
    public decimal AllocatedBudget { get; set; }
    public decimal ConsumedAmount { get; set; }
    public decimal Variance { get; set; }
    public bool HasViolation { get; set; }
    public int EmployeeCount { get; set; }
    public decimal AverageOvertimePerCapita { get; set; }
}
