using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Domain.Tests.Entities;

public class TaxRefundCaseTests
{
    private TaxRefundCase CreateSampleCase()
    {
        return TaxRefundCase.Create(
            caseTrackingNumber: "REF-1402-0001",
            docketNumber: "87",
            taxpayerName: "شرکت نمونه",
            economicCode: "1234567890",
            taxUnitCode: "160300",
            province: "خوزستان",
            city: "اهواز",
            address: "اهواز کیانپارس خ ۱۷",
            bankName: "ملی",
            shebaNumber: "IR160120000000001234567890",
            taxYear: 1402,
            period: 1,
            taxSource: TaxSourceType.CorporateIncome,
            refundReason: "اشتباه واریزی",
            administrationHeadName: "غلامرضا اسلامی",
            groupHeadName: "مسعود بصیر",
            seniorAuditorName: "مهدی دلفی",
            createdByUserId: Guid.NewGuid());
    }

    [Fact]
    public void Create_WithValidParameters_InitializesCorrectly()
    {
        // Act
        var refundCase = CreateSampleCase();

        // Assert
        Assert.NotEqual(Guid.Empty, refundCase.Id);
        Assert.Equal("REF-1402-0001", refundCase.CaseTrackingNumber);
        Assert.Equal("شرکت نمونه", refundCase.TaxpayerName);
        Assert.Equal("1234567890", refundCase.EconomicCode);
        Assert.Equal(1402, refundCase.TaxYear);
        Assert.Equal(RefundCaseStatus.Draft, refundCase.Status);
        Assert.Empty(refundCase.Receipts);
        Assert.Empty(refundCase.Allocations);
        Assert.Empty(refundCase.Letters);
        Assert.Empty(refundCase.Approvals);
        Assert.Empty(refundCase.Documents);
    }

    [Fact]
    public void AddReceipt_AddsToCollection()
    {
        // Arrange
        var refundCase = CreateSampleCase();

        // Act
        var receipt = refundCase.AddReceipt(
            rowIndex: 1,
            receiptNumber: "987654321",
            issueDateJalali: "1403/05/01",
            paymentDateJalali: "1403/05/01",
            amountRials: 300_000_000,
            bankBranch: "مرکزی اهواز",
            city: "اهواز");

        // Assert
        Assert.Single(refundCase.Receipts);
        Assert.Equal(receipt.Id, refundCase.Receipts.First().Id);
        Assert.Equal(300_000_000, refundCase.Receipts.First().AmountRials);
    }

    [Fact]
    public void RemoveReceipt_AlsoRemovesAssociatedAllocations()
    {
        // Arrange
        var refundCase = CreateSampleCase();
        var receipt = refundCase.AddReceipt(
            rowIndex: 1,
            receiptNumber: "987654321",
            issueDateJalali: "1403/05/01",
            paymentDateJalali: "1403/05/01",
            amountRials: 300_000_000);

        var alloc = refundCase.AddAllocation(
            receipt.Id,
            receipt.ReceiptNumber,
            totalReceiptAmount: 300_000_000,
            refundableAmount: 65_000_000);

        Assert.Single(refundCase.Receipts);
        Assert.Single(refundCase.Allocations);

        // Act
        refundCase.RemoveReceipt(receipt.Id);

        // Assert
        Assert.Empty(refundCase.Receipts);
        Assert.Empty(refundCase.Allocations);
    }

    [Fact]
    public void AddLetter_AddsInquiryRecord()
    {
        // Arrange
        var refundCase = CreateSampleCase();

        // Act
        var letter = refundCase.AddLetter(
            TaxRefundLetterType.CollectionAndEnforcementInquiry,
            letterNumber: "1235465",
            letterDateJalali: "1405/02/01",
            description: "استعلام وصول و اجرا",
            debtAmount: 0);

        // Assert
        Assert.Single(refundCase.Letters);
        Assert.Equal(TaxRefundLetterType.CollectionAndEnforcementInquiry, letter.LetterType);
        Assert.Equal("1235465", letter.LetterNumber);
    }

    [Fact]
    public void UpdateAssessmentInfo_UpdatesOwnedObject()
    {
        // Arrange
        var refundCase = CreateSampleCase();
        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: true,
            returnNumber: "654321987",
            returnDateJalali: "1403/04/31",
            finalizationMethod: FinalizationMethod.AliRas,
            finalNoticeNumber: "326541789",
            finalNoticeDateJalali: "1403/10/20",
            assessedIncome: 1_000_000_000,
            exemptions: 0,
            assessedTax: 250_000_000);

        // Act
        refundCase.UpdateAssessmentInfo(assessment);

        // Assert
        Assert.Equal(1_000_000_000, refundCase.AssessmentInfo.AssessedIncome);
        Assert.Equal(1_000_000_000, refundCase.AssessmentInfo.TaxableBase);
        Assert.Equal(250_000_000, refundCase.AssessmentInfo.AssessedTax);
    }

    [Fact]
    public void TransitionStatus_RecordsApprovalHistory()
    {
        // Arrange
        var refundCase = CreateSampleCase();
        var userId = Guid.NewGuid();

        // Act
        refundCase.TransitionStatus(
            RefundCaseStatus.Audited,
            actorUserId: userId,
            actorName: "مهدی دلفی",
            actorRole: "کارشناس ارشد مالیاتی",
            notes: "گزارش توجیهی تنظیم و تایید گردید");

        // Assert
        Assert.Equal(RefundCaseStatus.Audited, refundCase.Status);
        Assert.Single(refundCase.Approvals);
        var action = refundCase.Approvals.First();
        Assert.Equal(RefundCaseStatus.Draft, action.FromStatus);
        Assert.Equal(RefundCaseStatus.Audited, action.ToStatus);
        Assert.Equal(userId, action.ActorUserId);
    }

    [Fact]
    public void Modifications_WhenCaseIsApproved_ThrowsInvalidOperationException()
    {
        // Arrange
        var refundCase = CreateSampleCase();
        refundCase.TransitionStatus(
            RefundCaseStatus.AdministrationHeadApproved,
            Guid.NewGuid(),
            "غلامرضا اسلامی",
            "رئیس امور مالیاتی");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() =>
            refundCase.AddReceipt(1, "12345", "1403/01/01", "1403/01/01", 100_000));
    }

    [Fact]
    public void AddDocument_AddsToCollection()
    {
        // Arrange
        var refundCase = CreateSampleCase();
        var userId = Guid.NewGuid();

        // Act
        var doc = refundCase.AddDocument(
            documentType: TaxRefundDocumentType.AssessmentNotice,
            title: "برگ قطعی عملکرد ۱۴۰۲",
            originalFileName: "barghe_ghati.pdf",
            storedFileName: "stored_ghati.pdf",
            filePath: "uploads/stored_ghati.pdf",
            fileSize: 2048,
            uploadDateJalali: "1403/06/18",
            uploadedByUserId: userId,
            uploadedByUserName: "مهدی دلفی");

        // Assert
        Assert.Single(refundCase.Documents);
        Assert.Equal(doc.Id, refundCase.Documents.First().Id);
        Assert.Equal("برگ قطعی عملکرد ۱۴۰۲", refundCase.Documents.First().Title);
    }

    [Fact]
    public void RemoveDocument_RemovesFromCollection()
    {
        // Arrange
        var refundCase = CreateSampleCase();
        var doc = refundCase.AddDocument(
            documentType: TaxRefundDocumentType.AssessmentNotice,
            title: "برگ قطعی عملکرد ۱۴۰۲",
            originalFileName: "barghe_ghati.pdf",
            storedFileName: "stored_ghati.pdf",
            filePath: "uploads/stored_ghati.pdf",
            fileSize: 2048,
            uploadDateJalali: "1403/06/18",
            uploadedByUserId: Guid.NewGuid(),
            uploadedByUserName: "مهدی دلفی");

        // Act
        refundCase.RemoveDocument(doc.Id);

        // Assert
        Assert.Empty(refundCase.Documents);
    }
}
