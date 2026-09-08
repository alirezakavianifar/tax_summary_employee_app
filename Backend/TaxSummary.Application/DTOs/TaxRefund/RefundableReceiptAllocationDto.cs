namespace TaxSummary.Application.DTOs.TaxRefund;

public class RefundableReceiptAllocationDto
{
    public Guid Id { get; set; }
    public Guid TaxRefundCaseId { get; set; }
    public Guid TaxRefundReceiptId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public decimal TotalReceiptAmount { get; set; }
    public decimal RefundableAmount { get; set; }
    public string? BankBranch { get; set; }
    public string? City { get; set; }
    public string? RevenueLedgerRow { get; set; }
}

public class CreateRefundableReceiptAllocationDto
{
    public Guid TaxRefundReceiptId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public decimal TotalReceiptAmount { get; set; }
    public decimal RefundableAmount { get; set; }
    public string? BankBranch { get; set; }
    public string? City { get; set; }
    public string? RevenueLedgerRow { get; set; }
}
