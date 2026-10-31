namespace TaxSummary.Application.DTOs.Reporting;

public class ExecutiveKpiMetricsDto
{
    // HR & Evaluation
    public int TotalEmployeesActive { get; set; }
    public int TotalEvaluationsRecorded { get; set; }
    public decimal TotalEvasionIdentifiedAmount { get; set; }

    // Payroll & Overtime
    public decimal CurrentMonthApprovedBudget { get; set; }
    public decimal CurrentMonthActualSpent { get; set; }
    public decimal BudgetUtilizationPercentage { get; set; }
    public int TotalOvertimeHoursRecorded { get; set; }
    public int LaborCapViolationsCount { get; set; }

    // Tax Refunds (Articles 242 & 243)
    public int ActiveRefundCasesCount { get; set; }
    public decimal TotalRefundClaimedAmount { get; set; }
    public decimal TotalRefundApprovedAmount { get; set; }
    public decimal TotalDelayInterestPaid { get; set; }
    public double AverageProcessingDays { get; set; }
}
