using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.Services;

/// <summary>
/// Mathematical and statutory calculation engine for Tax Refunds (Articles 242 and 243)
/// موتور محاسبات قانونی استرداد مالیات اضافه دریافتی (موضوع مواد ۲۴۲ و ۲۴۳ ق.م.م)
/// </summary>
public class RefundCalculationEngine
{
    /// <summary>
    /// Computes full refund calculations from domain models
    /// </summary>
    public RefundCalculationResult Compute(
        TaxAssessmentInfo assessment,
        IEnumerable<TaxRefundReceipt> receipts,
        IEnumerable<TaxRefundLetter> letters,
        decimal stampDuty = 0,
        decimal other = 0,
        decimal penalties = 0,
        int delayMonths = 0)
    {
        var result = new RefundCalculationResult();

        // 1. Table A: Paid Receipts Aggregation (جدول الف)
        var receiptsList = receipts?.ToList() ?? new List<TaxRefundReceipt>();
        result.TotalReceiptsCount = receiptsList.Count;
        result.TotalPaidAmount = receiptsList.Sum(r => r.AmountRials);

        // 2. Assessment Calculations (فرآیند قطعی‌سازی)
        if (assessment != null)
        {
            result.AssessedIncome = assessment.AssessedIncome;
            result.Exemptions = assessment.Exemptions;
            result.TaxableBase = Math.Max(0, assessment.AssessedIncome - assessment.Exemptions);
            result.AssessedTax = assessment.AssessedTax;
            result.NonWaivablePenalties = assessment.NonWaivablePenalties;
            result.TotalAssessedTax = assessment.AssessedTax + assessment.NonWaivablePenalties;
            result.TimelyPaymentBonus = assessment.TimelyPaymentBonus;

            // Formula: TotalAssessedTax - TimelyBonus - TotalPaidAmount
            // Negative indicates overpayment (مازاد پرداختی)
            result.SurplusPaid = result.TotalAssessedTax - result.TimelyPaymentBonus - result.TotalPaidAmount;
        }

        // 3. Inter-departmental Inquiries: Liabilities/Debts Aggregation (استعلامات بدهی)
        var lettersList = letters?.ToList() ?? new List<TaxRefundLetter>();
        result.TotalDiscoveredDebts = lettersList.Sum(l => l.DebtAmount);

        // 4. Gross Surplus and Net Principal Refund (اصل مالیات قابل استرداد)
        // If SurplusPaid < 0, gross surplus is |SurplusPaid|
        result.GrossSurplus = result.SurplusPaid < 0 ? Math.Abs(result.SurplusPaid) : 0;
        result.PrincipalTaxRefund = Math.Max(0, result.GrossSurplus - result.TotalDiscoveredDebts);

        // 5. Additional Refundable Items
        result.StampDutyRefund = Math.Max(0, stampDuty);
        result.OtherRefund = Math.Max(0, other);
        result.PenaltiesRefund = Math.Max(0, penalties);

        // 6. Article 243 Delay Damages (خسارت تاخیر در استرداد موضوع تبصره ماده ۲۴۳ ق.م.م)
        // Statutory interest rate: 1.5% per month (۰.۰۱۵ به ازای هر ماه تاخیر)
        if (delayMonths > 0 && result.PrincipalTaxRefund > 0)
        {
            result.DelayMonths = delayMonths;
            result.DelayDamages = Math.Round(result.PrincipalTaxRefund * 0.015m * delayMonths, 0);
        }

        // 7. Grand Total Refundable (جمع کل مبالغ قابل استرداد)
        result.GrandTotalRefundable = result.PrincipalTaxRefund
                                    + result.StampDutyRefund
                                    + result.OtherRefund
                                    + result.PenaltiesRefund
                                    + result.DelayDamages;

        return result;
    }
}

/// <summary>
/// Result data structure capturing the full computational breakdown of a refund calculation
/// </summary>
public class RefundCalculationResult
{
    // Receipts (Table A)
    public int TotalReceiptsCount { get; set; }
    public decimal TotalPaidAmount { get; set; }

    // Assessment & Determination
    public decimal AssessedIncome { get; set; }
    public decimal Exemptions { get; set; }
    public decimal TaxableBase { get; set; }
    public decimal AssessedTax { get; set; }
    public decimal NonWaivablePenalties { get; set; }
    public decimal TotalAssessedTax { get; set; }
    public decimal TimelyPaymentBonus { get; set; }
    public decimal SurplusPaid { get; set; }

    // Deductions & Inquiries
    public decimal TotalDiscoveredDebts { get; set; }
    public decimal GrossSurplus { get; set; }

    // Refund Breakdown Lines
    public decimal PrincipalTaxRefund { get; set; }
    public decimal StampDutyRefund { get; set; }
    public decimal OtherRefund { get; set; }
    public decimal PenaltiesRefund { get; set; }
    public int DelayMonths { get; set; }
    public decimal DelayDamages { get; set; }
    public decimal GrandTotalRefundable { get; set; }
}
