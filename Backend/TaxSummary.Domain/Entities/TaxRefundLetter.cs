namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents an official letter, inbound taxpayer petition, or inter-departmental debt inquiry
/// جدول نامه‌ها و استعلامات پرونده استرداد
/// </summary>
public class TaxRefundLetter
{
    public Guid Id { get; private set; }
    public Guid TaxRefundCaseId { get; private set; }
    public TaxRefundLetterType LetterType { get; private set; }
    public string LetterNumber { get; private set; } = string.Empty;
    public string LetterDateJalali { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal DebtAmount { get; private set; } // مبلغ بدهی اعلام شده در استعلام
    public string? DebtYear { get; private set; } // سال بدهی

    // Navigation property
    public TaxRefundCase? TaxRefundCase { get; private set; }

    private TaxRefundLetter() { }

    public static TaxRefundLetter Create(
        Guid taxRefundCaseId,
        TaxRefundLetterType letterType,
        string letterNumber,
        string letterDateJalali,
        string? description = null,
        decimal debtAmount = 0,
        string? debtYear = null)
    {
        if (taxRefundCaseId == Guid.Empty)
            throw new ArgumentException("شناسه پرونده استرداد نامعتبر است", nameof(taxRefundCaseId));

        if (string.IsNullOrWhiteSpace(letterNumber))
            throw new ArgumentException("شماره نامه نمی‌تواند خالی باشد", nameof(letterNumber));

        if (debtAmount < 0)
            throw new ArgumentException("مبلغ بدهی نمی‌تواند منفی باشد", nameof(debtAmount));

        return new TaxRefundLetter
        {
            Id = Guid.NewGuid(),
            TaxRefundCaseId = taxRefundCaseId,
            LetterType = letterType,
            LetterNumber = letterNumber.Trim(),
            LetterDateJalali = letterDateJalali.Trim(),
            Description = description?.Trim(),
            DebtAmount = debtAmount,
            DebtYear = debtYear?.Trim()
        };
    }

    public void Update(
        TaxRefundLetterType letterType,
        string letterNumber,
        string letterDateJalali,
        string? description = null,
        decimal debtAmount = 0,
        string? debtYear = null)
    {
        if (string.IsNullOrWhiteSpace(letterNumber))
            throw new ArgumentException("شماره نامه نمی‌تواند خالی باشد", nameof(letterNumber));

        if (debtAmount < 0)
            throw new ArgumentException("مبلغ بدهی نمی‌تواند منفی باشد", nameof(debtAmount));

        LetterType = letterType;
        LetterNumber = letterNumber.Trim();
        LetterDateJalali = letterDateJalali.Trim();
        Description = description?.Trim();
        DebtAmount = debtAmount;
        DebtYear = debtYear?.Trim();
    }
}
