using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Domain.Tests.Entities;

public class TaxRefundDocumentTests
{
    [Fact]
    public void Create_WithValidParameters_InitializesCorrectly()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        // Act
        var doc = TaxRefundDocument.Create(
            taxRefundCaseId: caseId,
            documentType: TaxRefundDocumentType.ReceiptProof,
            title: "تصویر قبض واریزی بانک ملی",
            originalFileName: "bank_slip_987654.pdf",
            storedFileName: $"{caseId}_receipt_01.pdf",
            filePath: $"App_Data/uploads/refund-documents/{caseId}/{caseId}_receipt_01.pdf",
            fileSize: 1048576, // 1MB
            uploadDateJalali: "1403/06/18",
            uploadedByUserId: userId,
            uploadedByUserName: "مهدی دلفی",
            description: "فیش واریزی اصل مالیات عملکرد");

        // Assert
        Assert.NotEqual(Guid.Empty, doc.Id);
        Assert.Equal(caseId, doc.TaxRefundCaseId);
        Assert.Equal(TaxRefundDocumentType.ReceiptProof, doc.DocumentType);
        Assert.Equal("تصویر قبض واریزی بانک ملی", doc.Title);
        Assert.Equal("bank_slip_987654.pdf", doc.OriginalFileName);
        Assert.Equal(1048576, doc.FileSize);
        Assert.Equal("application/pdf", doc.ContentType);
        Assert.Equal("1403/06/18", doc.UploadDateJalali);
        Assert.Equal(userId, doc.UploadedByUserId);
        Assert.Equal("مهدی دلفی", doc.UploadedByUserName);
        Assert.Equal("فیش واریزی اصل مالیات عملکرد", doc.Description);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithEmptyTitle_ThrowsArgumentException(string invalidTitle)
    {
        // Arrange
        var caseId = Guid.NewGuid();

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
            TaxRefundDocument.Create(
                caseId,
                TaxRefundDocumentType.TaxpayerPetition,
                invalidTitle,
                "test.pdf",
                "stored.pdf",
                "path/to/file.pdf",
                1024,
                "1403/06/18",
                Guid.NewGuid(),
                "کارشناس ارشد"));
    }

    [Fact]
    public void Create_WithZeroOrNegativeFileSize_ThrowsArgumentException()
    {
        // Arrange
        var caseId = Guid.NewGuid();

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
            TaxRefundDocument.Create(
                caseId,
                TaxRefundDocumentType.TaxpayerPetition,
                "درخواست مودی",
                "test.pdf",
                "stored.pdf",
                "path/to/file.pdf",
                0, // invalid size
                "1403/06/18",
                Guid.NewGuid(),
                "کارشناس ارشد"));
    }

    [Fact]
    public void UpdateDetails_UpdatesAllowedFields()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var doc = TaxRefundDocument.Create(
            caseId,
            TaxRefundDocumentType.Other,
            "سند اولیه",
            "file.pdf",
            "stored.pdf",
            "path.pdf",
            2048,
            "1403/06/18",
            Guid.NewGuid(),
            "کارشناس");

        var receiptId = Guid.NewGuid();

        // Act
        doc.UpdateDetails(
            "عنوان ویرایش شده",
            TaxRefundDocumentType.ReceiptProof,
            "توضیحات تکمیلی جدید",
            receiptId,
            null);

        // Assert
        Assert.Equal("عنوان ویرایش شده", doc.Title);
        Assert.Equal(TaxRefundDocumentType.ReceiptProof, doc.DocumentType);
        Assert.Equal("توضیحات تکمیلی جدید", doc.Description);
        Assert.Equal(receiptId, doc.RelatedReceiptId);
    }
}
