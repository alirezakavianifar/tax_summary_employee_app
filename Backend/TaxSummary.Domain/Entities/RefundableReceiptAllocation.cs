namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents an allocated refundable receipt item under Table B (جدول ب - قبوض قابل استرداد / ابطال)
/// </summary>
public class RefundableReceiptAllocation
{
    public Guid Id { get; private set; }
    public Guid TaxRefundCaseId { get; private set; }
    public Guid TaxRefundReceiptId { get; private set; }
    public string ReceiptNumber { get; private set; } = string.Empty;
    public decimal TotalReceiptAmount { get; private set; }
    public decimal RefundableAmount { get; private set; }
    public string? BankBranch { get; private set; }
    public string? City { get; private set; }
    public string? RevenueLedgerRow { get; private set; } // شماره ردیف دفتر درآمد

    // Navigation property
    public TaxRefundCase? TaxRefundCase { get; private set; }
    public TaxRefundReceipt? TaxRefundReceipt { get; private set; }

    private RefundableReceiptAllocation() { }

    public static RefundableReceiptAllocation Create(
        Guid taxRefundCaseId,
        Guid taxRefundReceiptId,
        string receiptNumber,
        decimal totalReceiptAmount,
        decimal refundableAmount,
        string? bankBranch = null,
        string? city = null,
        string? revenueLedgerRow = null)
    {
        if (taxRefundCaseId == Guid.Empty)
            throw new ArgumentException("شناسه پرونده استرداد نامعتبر است", nameof(taxRefundCaseId));

        if (taxRefundReceiptId == Guid.Empty)
            throw new ArgumentException("شناسه قبض مرجع نامعتبر است", nameof(taxRefundReceiptId));

        if (string.IsNullOrWhiteSpace(receiptNumber))
            throw new ArgumentException("شماره قبض نمی‌تواند خالی باشد", nameof(receiptNumber));

        if (totalReceiptAmount <= 0)
            throw new ArgumentException("مبلغ مندرج در قبض باید بزرگتر از صفر باشد", nameof(totalReceiptAmount));

        if (refundableAmount <= 0)
            throw new ArgumentException("مبلغ قابل استرداد از قبض باید بزرگتر از صفر باشد", nameof(refundableAmount));

        if (refundableAmount > totalReceiptAmount)
            throw new ArgumentException($"مبلغ قابل استرداد ({refundableAmount:N0} ریال) نمی‌تواند بیشتر از کل مبلغ مندرج در قبض ({totalReceiptAmount:N0} ریال) باشد", nameof(refundableAmount));

        return new RefundableReceiptAllocation
        {
            Id = Guid.NewGuid(),
            TaxRefundCaseId = taxRefundCaseId,
            TaxRefundReceiptId = taxRefundReceiptId,
            ReceiptNumber = receiptNumber.Trim(),
            TotalReceiptAmount = totalReceiptAmount,
            RefundableAmount = refundableAmount,
            BankBranch = bankBranch?.Trim(),
            City = city?.Trim(),
            RevenueLedgerRow = revenueLedgerRow?.Trim()
        };
    }

    public void UpdateRefundableAmount(decimal refundableAmount)
    {
        if (refundableAmount <= 0)
            throw new ArgumentException("مبلغ قابل استرداد باید بزرگتر از صفر باشد", nameof(refundableAmount));

        if (refundableAmount > TotalReceiptAmount)
            throw new ArgumentException($"مبلغ قابل استرداد ({refundableAmount:N0} ریال) نمی‌تواند بیشتر از کل مبلغ مندرج در قبض ({TotalReceiptAmount:N0} ریال) باشد", nameof(refundableAmount));

        RefundableAmount = refundableAmount;
    }
}
