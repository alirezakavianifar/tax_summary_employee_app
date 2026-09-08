namespace TaxSummary.Application.DTOs.TaxRefund;

public class RefundBreakdownDto
{
    public decimal PrincipalTaxRefund { get; set; }
    public decimal StampDutyRefund { get; set; }
    public decimal OtherRefund { get; set; }
    public decimal PenaltiesRefund { get; set; }
    public decimal DelayDamages { get; set; }
    public decimal GrandTotalRefundable { get; set; }
}

public class UpdateRefundBreakdownDto
{
    public decimal PrincipalTaxRefund { get; set; }
    public decimal StampDutyRefund { get; set; }
    public decimal OtherRefund { get; set; }
    public decimal PenaltiesRefund { get; set; }
    public decimal DelayDamages { get; set; }
}
