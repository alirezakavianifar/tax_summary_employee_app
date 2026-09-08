namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents an official PDF document or supporting file attached to a Tax Refund Case
/// سند یا پیوست رسمی پرونده استرداد مالیات اضافه دریافتی
/// </summary>
public class TaxRefundDocument
{
    public Guid Id { get; private set; }
    public Guid TaxRefundCaseId { get; private set; }
    public TaxRefundDocumentType DocumentType { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string OriginalFileName { get; private set; } = string.Empty;
    public string StoredFileName { get; private set; } = string.Empty;
    public string FilePath { get; private set; } = string.Empty;
    public long FileSize { get; private set; }
    public string ContentType { get; private set; } = "application/pdf";
    public string UploadDateJalali { get; private set; } = string.Empty;
    public Guid UploadedByUserId { get; private set; }
    public string UploadedByUserName { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public Guid? RelatedReceiptId { get; private set; }
    public Guid? RelatedLetterId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation property
    public TaxRefundCase? TaxRefundCase { get; private set; }

    private TaxRefundDocument() { }

    public static TaxRefundDocument Create(
        Guid taxRefundCaseId,
        TaxRefundDocumentType documentType,
        string title,
        string originalFileName,
        string storedFileName,
        string filePath,
        long fileSize,
        string uploadDateJalali,
        Guid uploadedByUserId,
        string uploadedByUserName,
        string? description = null,
        Guid? relatedReceiptId = null,
        Guid? relatedLetterId = null,
        string contentType = "application/pdf")
    {
        if (taxRefundCaseId == Guid.Empty)
            throw new ArgumentException("شناسه پرونده استرداد نامعتبر است", nameof(taxRefundCaseId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان سند نمی‌تواند خالی باشد", nameof(title));

        if (string.IsNullOrWhiteSpace(originalFileName))
            throw new ArgumentException("نام فایل نمی‌تواند خالی باشد", nameof(originalFileName));

        if (string.IsNullOrWhiteSpace(storedFileName))
            throw new ArgumentException("نام ذخیره‌سازی فایل نمی‌تواند خالی باشد", nameof(storedFileName));

        if (string.IsNullOrWhiteSpace(filePath))
            throw new ArgumentException("مسیر فایل نمی‌تواند خالی باشد", nameof(filePath));

        if (fileSize <= 0)
            throw new ArgumentException("حجم فایل باید بزرگتر از صفر باشد", nameof(fileSize));

        return new TaxRefundDocument
        {
            Id = Guid.NewGuid(),
            TaxRefundCaseId = taxRefundCaseId,
            DocumentType = documentType,
            Title = title.Trim(),
            OriginalFileName = originalFileName.Trim(),
            StoredFileName = storedFileName.Trim(),
            FilePath = filePath.Trim(),
            FileSize = fileSize,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/pdf" : contentType.Trim(),
            UploadDateJalali = uploadDateJalali.Trim(),
            UploadedByUserId = uploadedByUserId,
            UploadedByUserName = uploadedByUserName.Trim(),
            Description = description?.Trim(),
            RelatedReceiptId = relatedReceiptId,
            RelatedLetterId = relatedLetterId,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void UpdateDetails(
        string title,
        TaxRefundDocumentType documentType,
        string? description = null,
        Guid? relatedReceiptId = null,
        Guid? relatedLetterId = null)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("عنوان سند نمی‌تواند خالی باشد", nameof(title));

        Title = title.Trim();
        DocumentType = documentType;
        Description = description?.Trim();
        RelatedReceiptId = relatedReceiptId;
        RelatedLetterId = relatedLetterId;
    }
}
