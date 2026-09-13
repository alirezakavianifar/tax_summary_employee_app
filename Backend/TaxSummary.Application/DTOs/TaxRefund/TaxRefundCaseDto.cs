using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.DTOs.TaxRefund;

public class TaxRefundCaseDto
{
    public Guid Id { get; set; }
    public string CaseTrackingNumber { get; set; } = string.Empty;
    public string DocketNumber { get; set; } = string.Empty;

    // Taxpayer Information
    public string TaxpayerName { get; set; } = string.Empty;
    public string EconomicCode { get; set; } = string.Empty;
    public string? NationalId { get; set; }
    public string TaxUnitCode { get; set; } = string.Empty;
    public string GroupCode { get; set; } = string.Empty;
    public string OfficeCode { get; set; } = string.Empty;
    public Guid? OfficeId { get; set; }
    public string? OfficeName { get; set; }
    public string Province { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    // Banking Details
    public string BankName { get; set; } = string.Empty;
    public string ShebaNumber { get; set; } = string.Empty;

    // Case Scope
    public int TaxYear { get; set; }
    public int Period { get; set; }
    public TaxSourceType TaxSource { get; set; }
    public string TaxSourceName { get; set; } = string.Empty;
    public string RefundReason { get; set; } = string.Empty;

    // Officials
    public string AdministrationHeadName { get; set; } = string.Empty;
    public string GroupHeadName { get; set; } = string.Empty;
    public string SeniorAuditorName { get; set; } = string.Empty;

    // Workflow Status
    public RefundCaseStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;

    // Owned Details
    public TaxAssessmentInfoDto AssessmentInfo { get; set; } = new();
    public RefundBreakdownDto Breakdown { get; set; } = new();
    public JustificationReportDto JustificationReport { get; set; } = new();

    // Computed Figures
    public RefundCalculationResultDto Calculation { get; set; } = new();

    // Child Collections
    public List<TaxRefundReceiptDto> Receipts { get; set; } = new();
    public List<RefundableReceiptAllocationDto> Allocations { get; set; } = new();
    public List<TaxRefundLetterDto> Letters { get; set; } = new();
    public List<TaxRefundApprovalActionDto> Approvals { get; set; } = new();
    public List<TaxRefundDocumentDto> Documents { get; set; } = new();

    // Audit Info
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? FinalizedAt { get; set; }
}
