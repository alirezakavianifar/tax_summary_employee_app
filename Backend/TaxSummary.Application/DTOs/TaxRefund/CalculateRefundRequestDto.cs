using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.DTOs.TaxRefund;

public class CalculateRefundRequestDto
{
    // Assessment inputs
    public decimal AssessedIncome { get; set; }
    public decimal Exemptions { get; set; }
    public decimal AssessedTax { get; set; }
    public decimal NonWaivablePenalties { get; set; }
    public decimal TimelyPaymentBonus { get; set; }

    // Receipts total (either total amount directly or list of amounts)
    public decimal TotalPaidAmount { get; set; }
    public List<decimal>? ReceiptAmounts { get; set; }

    // Inquiries debts (either total debts directly or list of debt amounts)
    public decimal TotalDiscoveredDebts { get; set; }
    public List<decimal>? DebtAmounts { get; set; }

    // Additional items
    public decimal StampDuty { get; set; }
    public decimal Other { get; set; }
    public decimal Penalties { get; set; }
    public int DelayMonths { get; set; }
}

public class RefundCalculationResultDto
{
    public int TotalReceiptsCount { get; set; }
    public decimal TotalPaidAmount { get; set; }
    public decimal AssessedIncome { get; set; }
    public decimal Exemptions { get; set; }
    public decimal TaxableBase { get; set; }
    public decimal AssessedTax { get; set; }
    public decimal NonWaivablePenalties { get; set; }
    public decimal TotalAssessedTax { get; set; }
    public decimal TimelyPaymentBonus { get; set; }
    public decimal SurplusPaid { get; set; }
    public decimal TotalDiscoveredDebts { get; set; }
    public decimal GrossSurplus { get; set; }
    public decimal PrincipalTaxRefund { get; set; }
    public decimal StampDutyRefund { get; set; }
    public decimal OtherRefund { get; set; }
    public decimal PenaltiesRefund { get; set; }
    public int DelayMonths { get; set; }
    public decimal DelayDamages { get; set; }
    public decimal GrandTotalRefundable { get; set; }
}
