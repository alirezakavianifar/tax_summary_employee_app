namespace TaxSummary.Application.DTOs.Reporting;

public class MonthlyTrendPointDto
{
    public string MonthNameShamsi { get; set; } = string.Empty;
    public decimal OvertimeAmount { get; set; }
    public decimal WelfareAmount { get; set; }
    public decimal RefundAmount { get; set; }
}
