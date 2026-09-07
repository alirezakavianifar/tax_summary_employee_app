namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents a paid tax receipt submitted under Table A (جدول الف - اطلاعات قبوض پرداختی مودی)
/// </summary>
public class TaxRefundReceipt
{
    public Guid Id { get; private set; }
    public Guid TaxRefundCaseId { get; private set; }
    public int RowIndex { get; private set; }
    public string ReceiptNumber { get; private set; } = string.Empty;
    public string IssueDateJalali { get; private set; } = string.Empty;
    public string PaymentDateJalali { get; private set; } = string.Empty;
    public decimal AmountRials { get; private set; }
    public string? BankBranch { get; private set; }
    public string? City { get; private set; }
    public string? RevenueLedgerRow { get; private set; } // شماره ردیف دفتر درآمد

    // Navigation property
    public TaxRefundCase? TaxRefundCase { get; private set; }

    private TaxRefundReceipt() { }

    public static TaxRefundReceipt Create(
        Guid taxRefundCaseId,
        int rowIndex,
        string receiptNumber,
        string issueDateJalali,
        string paymentDateJalali,
        decimal amountRials,
        string? bankBranch = null,
        string? city = null,
        string? revenueLedgerRow = null)
    {
        if (taxRefundCaseId == Guid.Empty)
            throw new ArgumentException("شناسه پرونده استرداد نامعتبر است", nameof(taxRefundCaseId));

        if (string.IsNullOrWhiteSpace(receiptNumber))
            throw new ArgumentException("شماره قبض پرداخت نمی‌تواند خالی باشد", nameof(receiptNumber));

        if (amountRials <= 0)
            throw new ArgumentException("مبلغ قبض پرداختی باید بزرگتر از صفر باشد", nameof(amountRials));

        return new TaxRefundReceipt
        {
            Id = Guid.NewGuid(),
            TaxRefundCaseId = taxRefundCaseId,
            RowIndex = rowIndex,
            ReceiptNumber = receiptNumber.Trim(),
            IssueDateJalali = issueDateJalali.Trim(),
            PaymentDateJalali = paymentDateJalali.Trim(),
            AmountRials = amountRials,
            BankBranch = bankBranch?.Trim(),
            City = city?.Trim(),
            RevenueLedgerRow = revenueLedgerRow?.Trim()
        };
    }

    public void Update(
        int rowIndex,
        string receiptNumber,
        string issueDateJalali,
        string paymentDateJalali,
        decimal amountRials,
        string? bankBranch = null,
        string? city = null,
        string? revenueLedgerRow = null)
    {
        if (string.IsNullOrWhiteSpace(receiptNumber))
            throw new ArgumentException("شماره قبض پرداخت نمی‌تواند خالی باشد", nameof(receiptNumber));

        if (amountRials <= 0)
            throw new ArgumentException("مبلغ قبض پرداختی باید بزرگتر از صفر باشد", nameof(amountRials));

        RowIndex = rowIndex;
        ReceiptNumber = receiptNumber.Trim();
        IssueDateJalali = issueDateJalali.Trim();
        PaymentDateJalali = paymentDateJalali.Trim();
        AmountRials = amountRials;
        BankBranch = bankBranch?.Trim();
        City = city?.Trim();
        RevenueLedgerRow = revenueLedgerRow?.Trim();
    }
}
