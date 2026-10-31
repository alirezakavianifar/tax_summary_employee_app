namespace TaxSummary.Application.DTOs.Reporting;

public class TaxSourceDistributionDto
{
    public string TaxSourceCode { get; set; } = string.Empty;
    public string TaxSourcePersianTitle { get; set; } = string.Empty;
    public int CaseCount { get; set; }
    public decimal TotalApprovedRefundAmount { get; set; }
    public decimal TotalDelayInterestAmount { get; set; }
}
