using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.DTOs.TaxRefund;

public class TaxRefundLetterDto
{
    public Guid Id { get; set; }
    public Guid TaxRefundCaseId { get; set; }
    public TaxRefundLetterType LetterType { get; set; }
    public string LetterTypeName { get; set; } = string.Empty;
    public string LetterNumber { get; set; } = string.Empty;
    public string LetterDateJalali { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DebtAmount { get; set; }
    public string? DebtYear { get; set; }
}

public class CreateTaxRefundLetterDto
{
    public TaxRefundLetterType LetterType { get; set; }
    public string LetterNumber { get; set; } = string.Empty;
    public string LetterDateJalali { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DebtAmount { get; set; }
    public string? DebtYear { get; set; }
}
