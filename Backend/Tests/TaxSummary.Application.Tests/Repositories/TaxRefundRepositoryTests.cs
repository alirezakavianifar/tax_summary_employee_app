using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Infrastructure.Data;
using TaxSummary.Infrastructure.Repositories;
using Xunit;

namespace TaxSummary.Application.Tests.Repositories;

public class TaxRefundRepositoryTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly TaxSummaryDbContext _context;
    private readonly TaxRefundRepository _repository;

    public TaxRefundRepositoryTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<TaxSummaryDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new TaxSummaryDbContext(options);
        _context.Database.EnsureCreated();

        _repository = new TaxRefundRepository(_context);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    private TaxRefundCase CreateSampleCase(
        string trackingNumber = "TRC-TEST-001",
        string taxpayerName = "شرکت پتروشیمی نمونه",
        int taxYear = 1402,
        TaxSourceType taxSource = TaxSourceType.CorporateIncome)
    {
        var refundCase = TaxRefundCase.Create(
            caseTrackingNumber: trackingNumber,
            docketNumber: "DOK-101",
            taxpayerName: taxpayerName,
            economicCode: "1234567890",
            taxUnitCode: "160300",
            province: "تهران",
            city: "تهران",
            address: "خیابان ولیعصر",
            bankName: "ملی",
            shebaNumber: "IR160120000000001234567890",
            taxYear: taxYear,
            period: 1,
            taxSource: taxSource,
            refundReason: "اضافه پرداختی عملکرد",
            administrationHeadName: "آقای احمدی",
            groupHeadName: "آقای محمدی",
            seniorAuditorName: "آقای حسینی",
            createdByUserId: Guid.NewGuid()
        );

        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: true,
            returnNumber: "RET-001",
            returnDateJalali: "1403/04/31",
            finalizationMethod: FinalizationMethod.AliRas,
            finalNoticeNumber: "NOT-001",
            finalNoticeDateJalali: "1403/10/20",
            assessedIncome: 1_000_000_000,
            exemptions: 0,
            assessedTax: 250_000_000,
            nonWaivablePenalties: 0,
            timelyPaymentBonus: 0);
        refundCase.UpdateAssessmentInfo(assessment);

        var breakdown = RefundBreakdown.Create(
            principalTaxRefund: 65_000_000,
            stampDutyRefund: 0,
            otherRefund: 0,
            penaltiesRefund: 0,
            delayDamages: 0);
        refundCase.UpdateBreakdown(breakdown);

        return refundCase;
    }

    [Fact]
    public async Task CreateAsync_And_GetByIdAsync_WithDetails_ReturnsCompleteAggregate()
    {
        // Arrange
        var refundCase = CreateSampleCase();
        var receipt = refundCase.AddReceipt(1, "REC-987", "1403/05/01", "1403/05/01", 300_000_000, "مرکزی", "تهران", "ردیف 1");
        refundCase.AddAllocation(receipt.Id, receipt.ReceiptNumber, receipt.AmountRials, 65_000_000, receipt.BankBranch, receipt.City, receipt.RevenueLedgerRow);
        refundCase.AddLetter(TaxRefundLetterType.InboundTaxpayerRequest, "REQ-100", "1403/01/10", "درخواست استرداد مودی");
        refundCase.TransitionStatus(RefundCaseStatus.Audited, Guid.NewGuid(), "آقای حسینی", "کارشناس ارشد", "بررسی انجام شد");

        // Act
        await _repository.CreateAsync(refundCase);
        await _context.SaveChangesAsync();

        // Detach to test clean retrieval from database
        _context.ChangeTracker.Clear();

        var retrieved = await _repository.GetByIdAsync(refundCase.Id, includeDetails: true);

        // Assert
        Assert.NotNull(retrieved);
        Assert.Equal("TRC-TEST-001", retrieved.CaseTrackingNumber);
        Assert.Equal("شرکت پتروشیمی نمونه", retrieved.TaxpayerName);
        Assert.Equal(1402, retrieved.TaxYear);
        Assert.Equal(250_000_000, retrieved.AssessmentInfo.AssessedTax);
        Assert.Equal(65_000_000, retrieved.Breakdown.PrincipalTaxRefund);
        Assert.Single(retrieved.Receipts);
        Assert.Single(retrieved.Allocations);
        Assert.Single(retrieved.Letters);
        Assert.Single(retrieved.Approvals);
    }

    [Fact]
    public async Task GetByIdAsync_WithoutDetails_DoesNotIncludeCollections()
    {
        // Arrange
        var refundCase = CreateSampleCase();
        refundCase.AddReceipt(1, "REC-987", "1403/05/01", "1403/05/01", 300_000_000);
        await _repository.CreateAsync(refundCase);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var retrieved = await _repository.GetByIdAsync(refundCase.Id, includeDetails: false);

        // Assert
        Assert.NotNull(retrieved);
        Assert.Empty(retrieved.Receipts);
        Assert.Empty(retrieved.Allocations);
        Assert.Empty(retrieved.Letters);
        Assert.Empty(retrieved.Approvals);
    }

    [Fact]
    public async Task GetByTrackingNumberAsync_ReturnsMatchingCaseWithDetails()
    {
        // Arrange
        var refundCase = CreateSampleCase("TRC-UNIQUE-999");
        refundCase.AddReceipt(1, "REC-1", "1403/01/01", "1403/01/01", 50_000_000);
        await _repository.CreateAsync(refundCase);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();

        // Act
        var retrieved = await _repository.GetByTrackingNumberAsync("TRC-UNIQUE-999");

        // Assert
        Assert.NotNull(retrieved);
        Assert.Equal("TRC-UNIQUE-999", retrieved.CaseTrackingNumber);
        Assert.Single(retrieved.Receipts);
    }

    [Fact]
    public async Task GetCasesAsync_FiltersCorrectly()
    {
        // Arrange
        var case1 = CreateSampleCase("TRC-101", "شرکت الف", 1402, TaxSourceType.CorporateIncome);
        var case2 = CreateSampleCase("TRC-102", "شرکت ب", 1401, TaxSourceType.SalaryPayroll);
        var case3 = CreateSampleCase("TRC-103", "شرکت ج", 1402, TaxSourceType.CorporateIncome);

        await _repository.CreateAsync(case1);
        await _repository.CreateAsync(case2);
        await _repository.CreateAsync(case3);
        await _context.SaveChangesAsync();

        // Act & Assert 1: Filter by taxYear
        var year1402Cases = await _repository.GetCasesAsync(taxYear: 1402);
        Assert.Equal(2, year1402Cases.Count());

        // Act & Assert 2: Filter by taxSource
        var salaryCases = await _repository.GetCasesAsync(taxSource: TaxSourceType.SalaryPayroll);
        Assert.Single(salaryCases);
        Assert.Equal("شرکت ب", salaryCases.First().TaxpayerName);

        // Act & Assert 3: Filter by searchTerm
        var searchCases = await _repository.GetCasesAsync(searchTerm: "شرکت الف");
        Assert.Single(searchCases);
        Assert.Equal("TRC-101", searchCases.First().CaseTrackingNumber);
    }

    [Fact]
    public async Task DeleteAsync_CascadesDeletionToChildEntities()
    {
        // Arrange
        var refundCase = CreateSampleCase("TRC-DEL-001");
        var receipt = refundCase.AddReceipt(1, "REC-DEL-1", "1403/01/01", "1403/01/01", 100_000_000);
        refundCase.AddAllocation(receipt.Id, receipt.ReceiptNumber, receipt.AmountRials, 20_000_000);
        refundCase.AddLetter(TaxRefundLetterType.InboundTaxpayerRequest, "LET-DEL-1", "1403/01/01");
        refundCase.TransitionStatus(RefundCaseStatus.Audited, Guid.NewGuid(), "کارشناس", "کارشناس", "اقدام آزمایشی");

        await _repository.CreateAsync(refundCase);
        await _context.SaveChangesAsync();

        var caseId = refundCase.Id;

        // Verify entities exist in database
        Assert.Equal(1, await _context.TaxRefundReceipts.CountAsync(r => r.TaxRefundCaseId == caseId));
        Assert.Equal(1, await _context.RefundableReceiptAllocations.CountAsync(a => a.TaxRefundCaseId == caseId));
        Assert.Equal(1, await _context.TaxRefundLetters.CountAsync(l => l.TaxRefundCaseId == caseId));
        Assert.Equal(1, await _context.TaxRefundApprovalActions.CountAsync(a => a.TaxRefundCaseId == caseId));

        // Act - Delete case
        await _repository.DeleteAsync(caseId);
        await _context.SaveChangesAsync();

        // Assert - Case and all child entities were deleted via cascade
        Assert.Null(await _context.TaxRefundCases.FindAsync(caseId));
        Assert.Equal(0, await _context.TaxRefundReceipts.CountAsync(r => r.TaxRefundCaseId == caseId));
        Assert.Equal(0, await _context.RefundableReceiptAllocations.CountAsync(a => a.TaxRefundCaseId == caseId));
        Assert.Equal(0, await _context.TaxRefundLetters.CountAsync(l => l.TaxRefundCaseId == caseId));
        Assert.Equal(0, await _context.TaxRefundApprovalActions.CountAsync(a => a.TaxRefundCaseId == caseId));
    }

    [Fact]
    public async Task ExistsAsync_ReturnsTrueForExisting_AndFalseForNonExisting()
    {
        // Arrange
        var refundCase = CreateSampleCase("TRC-EXISTS-01");
        await _repository.CreateAsync(refundCase);
        await _context.SaveChangesAsync();

        // Act & Assert
        Assert.True(await _repository.ExistsAsync(refundCase.Id));
        Assert.False(await _repository.ExistsAsync(Guid.NewGuid()));
    }
}
