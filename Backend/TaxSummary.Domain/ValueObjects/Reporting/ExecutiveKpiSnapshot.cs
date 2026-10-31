namespace TaxSummary.Domain.ValueObjects.Reporting;

public record ExecutiveKpiSnapshot(
    // HR & Evaluation Domain
    int TotalEmployeesActive,
    int TotalEvaluationsRecorded,
    decimal TotalEvasionIdentifiedAmount,

    // Payroll Domain
    decimal CurrentMonthApprovedBudget,
    decimal CurrentMonthActualSpent,
    int TotalOvertimeHoursRecorded,
    int LaborCapViolationsCount,

    // Tax Refund Domain
    int ActiveRefundCasesCount,
    decimal TotalRefundClaimedAmount,
    decimal TotalRefundApprovedAmount,
    decimal TotalDelayInterestPaid,
    double AverageProcessingDays
)
{
    public decimal BudgetUtilizationPercentage => CurrentMonthApprovedBudget > 0
        ? Math.Round((CurrentMonthActualSpent / CurrentMonthApprovedBudget) * 100, 1)
        : 0;
}
