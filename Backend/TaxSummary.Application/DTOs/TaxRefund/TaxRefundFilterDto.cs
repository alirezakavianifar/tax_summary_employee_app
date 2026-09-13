using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.DTOs.TaxRefund;

public class TransitionStatusDto
{
    public RefundCaseStatus NewStatus { get; set; }
    public string? Notes { get; set; }
}

public class TaxRefundFilterDto
{
    public int? TaxYear { get; set; }
    public TaxSourceType? TaxSource { get; set; }
    public RefundCaseStatus? Status { get; set; }
    public string? SearchTerm { get; set; }
    public string? OfficeCode { get; set; }
    public string? GroupCode { get; set; }
    public string? TaxUnitCode { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
