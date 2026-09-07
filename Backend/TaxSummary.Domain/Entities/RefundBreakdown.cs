namespace TaxSummary.Domain.Entities;

/// <summary>
/// Breakdown of line-items composing the total refundable amount
/// شرح مبالغ قابل استرداد
/// </summary>
public class RefundBreakdown
{
    /// <summary>
    /// اصل مالیات قابل استرداد (پس از کسر بدهی‌ها)
    /// </summary>
    public decimal PrincipalTaxRefund { get; private set; }

    /// <summary>
    /// حق تمبر
    /// </summary>
    public decimal StampDutyRefund { get; private set; }

    /// <summary>
    /// سایر موارد
    /// </summary>
    public decimal OtherRefund { get; private set; }

    /// <summary>
    /// جرایم قابل استرداد
    /// </summary>
    public decimal PenaltiesRefund { get; private set; }

    /// <summary>
    /// خسارت تاخیر در استرداد (موضوع تبصره ماده ۲۴۳ ق.م.م)
    /// </summary>
    public decimal DelayDamages { get; private set; }

    /// <summary>
    /// جمع کل مبالغ قابل استرداد
    /// </summary>
    public decimal GrandTotalRefundable => PrincipalTaxRefund + StampDutyRefund + OtherRefund + PenaltiesRefund + DelayDamages;

    // Parameterless constructor for EF Core
    public RefundBreakdown() { }

    public static RefundBreakdown Create(
        decimal principalTaxRefund,
        decimal stampDutyRefund = 0,
        decimal otherRefund = 0,
        decimal penaltiesRefund = 0,
        decimal delayDamages = 0)
    {
        if (principalTaxRefund < 0)
            throw new ArgumentException("اصل مالیات قابل استرداد نمی‌تواند منفی باشد", nameof(principalTaxRefund));

        if (stampDutyRefund < 0)
            throw new ArgumentException("مبلغ حق تمبر نمی‌تواند منفی باشد", nameof(stampDutyRefund));

        if (otherRefund < 0)
            throw new ArgumentException("مبلغ سایر نمی‌تواند منفی باشد", nameof(otherRefund));

        if (penaltiesRefund < 0)
            throw new ArgumentException("مبلغ جرایم نمی‌تواند منفی باشد", nameof(penaltiesRefund));

        if (delayDamages < 0)
            throw new ArgumentException("مبلغ خسارت تاخیر نمی‌تواند منفی باشد", nameof(delayDamages));

        return new RefundBreakdown
        {
            PrincipalTaxRefund = principalTaxRefund,
            StampDutyRefund = stampDutyRefund,
            OtherRefund = otherRefund,
            PenaltiesRefund = penaltiesRefund,
            DelayDamages = delayDamages
        };
    }
}
