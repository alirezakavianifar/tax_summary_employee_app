namespace TaxSummary.Domain.ValueObjects.Reporting;

public record TaxSourceDistribution(
    string TaxSourceCode,
    string TaxSourcePersianTitle,
    int CaseCount,
    decimal TotalApprovedRefundAmount,
    decimal TotalDelayInterestAmount
);
