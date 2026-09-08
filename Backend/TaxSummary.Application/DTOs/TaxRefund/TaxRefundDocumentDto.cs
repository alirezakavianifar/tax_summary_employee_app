using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.DTOs.TaxRefund;

/// <summary>
/// Data Transfer Object representing an attached PDF document for a Tax Refund Case
/// سند پیوست پرونده استرداد
/// </summary>
public class TaxRefundDocumentDto
{
    public Guid Id { get; set; }
    public Guid TaxRefundCaseId { get; set; }
    public TaxRefundDocumentType DocumentType { get; set; }
    public string DocumentTypeDescription { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileSizeFormatted { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
    public string UploadDateJalali { get; set; } = string.Empty;
    public Guid UploadedByUserId { get; set; }
    public string UploadedByUserName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? RelatedReceiptId { get; set; }
    public Guid? RelatedLetterId { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// URL for inline PDF viewing in the browser / embedded iframe
    /// </summary>
    public string ViewUrl => $"/api/tax-refunds/{TaxRefundCaseId}/documents/{Id}/view";

    /// <summary>
    /// URL for direct PDF file download
    /// </summary>
    public string DownloadUrl => $"/api/tax-refunds/{TaxRefundCaseId}/documents/{Id}/download";
}
