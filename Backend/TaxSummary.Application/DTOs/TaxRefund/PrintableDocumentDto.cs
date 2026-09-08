namespace TaxSummary.Application.DTOs.TaxRefund;

/// <summary>
/// Pre-formatted document view model providing text and numerical bindings
/// for all 8 statutory print forms (cheklist, form1 - form7)
/// </summary>
public class PrintableDocumentDto
{
    public string FormType { get; set; } = string.Empty; // cheklist, form1, form2, form3, form4, form5, form6, form7
    public string FormTitle { get; set; } = string.Empty;
    public Guid CaseId { get; set; }
    public string CaseTrackingNumber { get; set; } = string.Empty;
    public string DocketNumber { get; set; } = string.Empty;

    // Taxpayer Information
    public string TaxpayerName { get; set; } = string.Empty;
    public string EconomicCode { get; set; } = string.Empty;
    public string? NationalId { get; set; }
    public string TaxUnitCode { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    // Banking
    public string BankName { get; set; } = string.Empty;
    public string ShebaNumber { get; set; } = string.Empty;

    // Period & Scope
    public int TaxYear { get; set; }
    public int Period { get; set; }
    public string TaxSourceName { get; set; } = string.Empty;
    public string RefundReason { get; set; } = string.Empty;

    // Presiding Officers
    public string AdministrationHeadName { get; set; } = string.Empty;
    public string GroupHeadName { get; set; } = string.Empty;
    public string SeniorAuditorName { get; set; } = string.Empty;

    // Numbers & Formatted Texts
    public string TotalPaidAmountFormatted { get; set; } = string.Empty;
    public string GrandTotalRefundableFormatted { get; set; } = string.Empty;
    public string GrandTotalRefundableInWords { get; set; } = string.Empty;
    public string PrincipalTaxRefundFormatted { get; set; } = string.Empty;

    // Document Specific Letter References
    public string? RefundVoucherNumber { get; set; }
    public string? RefundVoucherDate { get; set; }
    public string? JustificationReportNumber { get; set; }
    public string? JustificationReportDate { get; set; }
    public string? OfficeCommitmentNumber { get; set; }
    public string? OfficeCommitmentDate { get; set; }
    public string? TreasuryLetterNumber { get; set; }
    public string? TreasuryLetterDate { get; set; }
    public string? TaxpayerRequestNumber { get; set; }
    public string? TaxpayerRequestDate { get; set; }

    // Assessment & Deductions
    public TaxAssessmentInfoDto Assessment { get; set; } = new();
    public RefundCalculationResultDto Calculation { get; set; } = new();

    // Tables
    public List<TaxRefundReceiptDto> Receipts { get; set; } = new();
    public List<RefundableReceiptAllocationDto> Allocations { get; set; } = new();
    public List<TaxRefundLetterDto> Letters { get; set; } = new();
}
