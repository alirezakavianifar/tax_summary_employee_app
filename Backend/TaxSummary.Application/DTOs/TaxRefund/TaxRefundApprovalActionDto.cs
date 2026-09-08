using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.DTOs.TaxRefund;

public class TaxRefundApprovalActionDto
{
    public Guid Id { get; set; }
    public Guid TaxRefundCaseId { get; set; }
    public RefundCaseStatus FromStatus { get; set; }
    public string FromStatusName { get; set; } = string.Empty;
    public RefundCaseStatus ToStatus { get; set; }
    public string ToStatusName { get; set; } = string.Empty;
    public Guid ActorUserId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime ActionDate { get; set; }
}
