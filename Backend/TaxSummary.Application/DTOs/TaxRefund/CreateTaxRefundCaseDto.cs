using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.DTOs.TaxRefund;

public class TaxRefundCaseSummaryDto
{
    public Guid Id { get; set; }
    public string CaseTrackingNumber { get; set; } = string.Empty;
    public string DocketNumber { get; set; } = string.Empty;
    public string TaxpayerName { get; set; } = string.Empty;
    public string EconomicCode { get; set; } = string.Empty;
    public string TaxUnitCode { get; set; } = string.Empty;
    public string GroupCode { get; set; } = string.Empty;
    public string OfficeCode { get; set; } = string.Empty;
    public Guid? OfficeId { get; set; }
    public string? OfficeName { get; set; }
    public string City { get; set; } = string.Empty;
    public int TaxYear { get; set; }
    public int Period { get; set; }
    public TaxSourceType TaxSource { get; set; }
    public string TaxSourceName { get; set; } = string.Empty;
    public RefundCaseStatus Status { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int ReceiptsCount { get; set; }
    public decimal TotalPaidAmount { get; set; }
    public decimal PrincipalTaxRefund { get; set; }
    public decimal GrandTotalRefundable { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateTaxRefundCaseDto
{
    public string? CaseTrackingNumber { get; set; }
    public string DocketNumber { get; set; } = string.Empty;
    public string TaxpayerName { get; set; } = string.Empty;
    public string EconomicCode { get; set; } = string.Empty;
    public string? NationalId { get; set; }
    public string TaxUnitCode { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string ShebaNumber { get; set; } = string.Empty;
    public int TaxYear { get; set; }
    public int Period { get; set; } = 1;
    public TaxSourceType TaxSource { get; set; }
    public string RefundReason { get; set; } = string.Empty;
    public string AdministrationHeadName { get; set; } = string.Empty;
    public string GroupHeadName { get; set; } = string.Empty;
    public string SeniorAuditorName { get; set; } = string.Empty;

    // Optional initial children
    public List<CreateTaxRefundReceiptDto>? Receipts { get; set; }
    public List<CreateTaxRefundLetterDto>? Letters { get; set; }
    public List<CreateRefundableReceiptAllocationDto>? Allocations { get; set; }
    public UpdateTaxAssessmentInfoDto? AssessmentInfo { get; set; }
    public UpdateRefundBreakdownDto? Breakdown { get; set; }
}

public class UpdateTaxRefundCaseDto
{
    public string DocketNumber { get; set; } = string.Empty;
    public string TaxpayerName { get; set; } = string.Empty;
    public string EconomicCode { get; set; } = string.Empty;
    public string? NationalId { get; set; }
    public string TaxUnitCode { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string ShebaNumber { get; set; } = string.Empty;
    public string RefundReason { get; set; } = string.Empty;
    public string AdministrationHeadName { get; set; } = string.Empty;
    public string GroupHeadName { get; set; } = string.Empty;
    public string SeniorAuditorName { get; set; } = string.Empty;
    public int? TaxYear { get; set; }
    public TaxSourceType? TaxSource { get; set; }
    public int? Period { get; set; }
}
