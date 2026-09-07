namespace TaxSummary.Domain.Entities;

/// <summary>
/// Audit trail entity recording an approval, endorsement, rejection, or state transition action
/// تاریخچه و سوابق تاییدات و گردش کار پرونده استرداد
/// </summary>
public class TaxRefundApprovalAction
{
    public Guid Id { get; private set; }
    public Guid TaxRefundCaseId { get; private set; }
    public RefundCaseStatus FromStatus { get; private set; }
    public RefundCaseStatus ToStatus { get; private set; }
    public Guid ActorUserId { get; private set; }
    public string ActorName { get; private set; } = string.Empty;
    public string ActorRole { get; private set; } = string.Empty;
    public string? Notes { get; private set; }
    public DateTime ActionDate { get; private set; }

    // Navigation property
    public TaxRefundCase? TaxRefundCase { get; private set; }

    private TaxRefundApprovalAction() { }

    public static TaxRefundApprovalAction Create(
        Guid taxRefundCaseId,
        RefundCaseStatus fromStatus,
        RefundCaseStatus toStatus,
        Guid actorUserId,
        string actorName,
        string actorRole,
        string? notes = null)
    {
        if (taxRefundCaseId == Guid.Empty)
            throw new ArgumentException("شناسه پرونده استرداد نامعتبر است", nameof(taxRefundCaseId));

        if (actorUserId == Guid.Empty)
            throw new ArgumentException("شناسه کاربر اقدام‌کننده نامعتبر است", nameof(actorUserId));

        if (string.IsNullOrWhiteSpace(actorName))
            throw new ArgumentException("نام کاربر اقدام‌کننده نمی‌تواند خالی باشد", nameof(actorName));

        if (string.IsNullOrWhiteSpace(actorRole))
            throw new ArgumentException("سمت اقدام‌کننده نمی‌تواند خالی باشد", nameof(actorRole));

        return new TaxRefundApprovalAction
        {
            Id = Guid.NewGuid(),
            TaxRefundCaseId = taxRefundCaseId,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            ActorUserId = actorUserId,
            ActorName = actorName.Trim(),
            ActorRole = actorRole.Trim(),
            Notes = notes?.Trim(),
            ActionDate = DateTime.UtcNow
        };
    }
}
