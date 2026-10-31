namespace TaxSummary.Domain.ValueObjects.Reporting;

public record DepartmentBudgetVariance(
    string DepartmentName,
    decimal AllocatedBudget,
    decimal ConsumedAmount,
    decimal Variance,
    bool HasViolation,
    int EmployeeCount,
    decimal AverageOvertimePerCapita
);
