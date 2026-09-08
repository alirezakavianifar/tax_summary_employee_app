namespace TaxSummary.Application.DTOs.TaxRefund;

public class TaxRefundReceiptDto
{
    public Guid Id { get; set; }
    public Guid TaxRefundCaseId { get; set; }
    public int RowIndex { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public string IssueDateJalali { get; set; } = string.Empty;
    public string PaymentDateJalali { get; set; } = string.Empty;
    public decimal AmountRials { get; set; }
    public string? BankBranch { get; set; }
    public string? City { get; set; }
    public string? RevenueLedgerRow { get; set; }
}

public class CreateTaxRefundReceiptDto
{
    public int RowIndex { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public string IssueDateJalali { get; set; } = string.Empty;
    public string PaymentDateJalali { get; set; } = string.Empty;
    public decimal AmountRials { get; set; }
    public string? BankBranch { get; set; }
    public string? City { get; set; }
    public string? RevenueLedgerRow { get; set; }
}
