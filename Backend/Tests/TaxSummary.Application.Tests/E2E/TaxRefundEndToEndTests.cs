using AutoMapper;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using OfficeOpenXml;
using TaxSummary.Application.DTOs.TaxRefund;
using TaxSummary.Application.Mapping;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Domain.ValueObjects;
using TaxSummary.Infrastructure.Data;
using TaxSummary.Infrastructure.Repositories;
using TaxSummary.Infrastructure.Services;
using Xunit;

namespace TaxSummary.Application.Tests.E2E;

/// <summary>
/// Phase 7 End-to-End Acceptance Test Suite validating the full lifecycle
/// of Iranian Direct Taxes Act Art. 242 & 243 refund cases across all layers.
/// </summary>
public class TaxRefundEndToEndTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly TaxSummaryDbContext _context;
    private readonly TaxRefundRepository _repository;
    private readonly UnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly RefundCalculationEngine _calcEngine;
    private readonly TaxRefundService _service;
    private readonly TaxRefundExcelService _excelService;

    public TaxRefundEndToEndTests()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<TaxSummaryDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new TaxSummaryDbContext(options);
        _context.Database.EnsureCreated();

        _repository = new TaxRefundRepository(_context);
        _unitOfWork = new UnitOfWork(_context);

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<TaxRefundMappingProfile>();
        });
        _mapper = config.CreateMapper();

        _calcEngine = new RefundCalculationEngine();

        var mockServiceLogger = new Mock<ILogger<TaxRefundService>>();
        var mockDocStorage = new Mock<IRefundDocumentStorageService>();
        _service = new TaxRefundService(
            _repository,
            _unitOfWork,
            _mapper,
            _calcEngine,
            mockDocStorage.Object,
            mockServiceLogger.Object);

        var mockEnv = new Mock<IHostEnvironment>();
        var mockExcelLogger = new Mock<ILogger<TaxRefundExcelService>>();
        _excelService = new TaxRefundExcelService(
            _repository,
            _unitOfWork,
            mockEnv.Object,
            mockExcelLogger.Object);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    private string FindSampleFilePath(string fileName)
    {
        var candidates = new[]
        {
            Path.Combine("E:\\projects\\tax_summary_employee_app\\payback_sample", fileName),
            Path.Combine(Directory.GetCurrentDirectory(), "payback_sample", fileName),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", "payback_sample", fileName)
        };

        foreach (var c in candidates)
        {
            if (File.Exists(c))
                return c;
        }

        throw new FileNotFoundException($"Sample file {fileName} not found in search paths.");
    }

    [Fact]
    public async Task ImportSampleExcel_FullLifecycle_SucceedsWithExactCalculationsAndAuditTrail()
    {
        // 1. Import authentic sample workbook
        var samplePath = FindSampleFilePath("tax_refund_delfi نمونه.xlsm");
        await using var fileStream = File.OpenRead(samplePath);
        var auditorId = Guid.NewGuid();

        var importResult = await _excelService.ImportFromExcelAsync(fileStream, auditorId);
        Assert.True(importResult.IsSuccess, $"Excel import failed: {importResult.Error}");

        var caseId = importResult.Value;

        // 2. Fetch imported aggregate through service
        var caseResult = await _service.GetByIdAsync(caseId);
        Assert.True(caseResult.IsSuccess);
        var refundCase = caseResult.Value;

        // 3. Verify Exact Domain & Excel Benchmark Bindings
        Assert.Equal("شرکت نمونه", refundCase.TaxpayerName);
        Assert.Equal("0123456789", refundCase.EconomicCode);
        Assert.Equal(1402, refundCase.TaxYear);
        Assert.Equal(TaxSourceType.CorporateIncome, refundCase.TaxSource);
        Assert.Equal("160300", refundCase.TaxUnitCode);
        Assert.Equal("اهواز", refundCase.City);
        Assert.Equal("IR160120000000001234567890", refundCase.ShebaNumber);

        // Receipts (Table A)
        Assert.Equal(2, refundCase.Receipts.Count);
        var totalReceipts = refundCase.Receipts.Sum(r => r.AmountRials);
        Assert.Equal(315_000_000m, totalReceipts);

        // Assessment Info
        Assert.Equal(1_000_000_000m, refundCase.AssessmentInfo.AssessedIncome);
        Assert.Equal(0m, refundCase.AssessmentInfo.Exemptions);
        Assert.Equal(250_000_000m, refundCase.AssessmentInfo.AssessedTax);
        Assert.Equal(0m, refundCase.AssessmentInfo.NonWaivablePenalties);

        // Mathematical Breakdown & Surplus Assertion
        Assert.Equal(65_000_000m, refundCase.Breakdown.PrincipalTaxRefund);
        Assert.Equal(0m, refundCase.Breakdown.DelayDamages);

        // Table B Allocation Assertion
        Assert.NotEmpty(refundCase.Allocations);
        var totalAllocated = refundCase.Allocations.Sum(a => a.RefundableAmount);
        Assert.Equal(65_000_000m, totalAllocated);

        // 4. Progress through All 4 Workflow Gates
        // Gate 1: Draft -> Audited (Senior Auditor)
        var transition1 = await _service.TransitionStatusAsync(
            caseId,
            new TransitionStatusDto { NewStatus = RefundCaseStatus.Audited, Notes = "بررسی اولیه و انطباق اسناد با پرونده فیزیکی" },
            auditorId,
            "مهدی دلفی",
            "کارشناس ارشد مالیاتی");
        Assert.True(transition1.IsSuccess, transition1.Error);

        // Gate 2: Audited -> GroupHeadApproved (Group Head)
        var transition2 = await _service.TransitionStatusAsync(
            caseId,
            new TransitionStatusDto { NewStatus = RefundCaseStatus.GroupHeadApproved, Notes = "تایید گزارش توجیهی و محاسبات اضافه دریافتی" },
            Guid.NewGuid(),
            "مسعود بصیر",
            "رئیس گروه مالیاتی");
        Assert.True(transition2.IsSuccess, transition2.Error);

        // Gate 3: GroupHeadApproved -> AdministrationHeadApproved (Tax Administration Head)
        var transition3 = await _service.TransitionStatusAsync(
            caseId,
            new TransitionStatusDto { NewStatus = RefundCaseStatus.AdministrationHeadApproved, Notes = "صدور دستور استرداد ماده ۲۴۲ قانون مالیات‌ها" },
            Guid.NewGuid(),
            "غلامرضا اسلامی",
            "رئیس امور مالیاتی");
        Assert.True(transition3.IsSuccess, transition3.Error);

        // Gate 4: AdministrationHeadApproved -> TreasuryDisbursed (Treasury)
        var transition4 = await _service.TransitionStatusAsync(
            caseId,
            new TransitionStatusDto { NewStatus = RefundCaseStatus.TreasuryDisbursed, Notes = "واریز وجه استرداد به شماره شبا نزد بانک ملی" },
            Guid.NewGuid(),
            "ذیحساب و مدیر مالی",
            "ذیحساب");
        Assert.True(transition4.IsSuccess, transition4.Error);

        // 5. Verify Final Aggregate State and Audit Trail
        var finalCase = await _repository.GetByIdAsync(caseId, includeDetails: true);
        Assert.NotNull(finalCase);
        Assert.Equal(RefundCaseStatus.TreasuryDisbursed, finalCase.Status);
        Assert.Equal(4, finalCase.Approvals.Count);

        // 6. Test Excel Export Roundtrip
        var exportResult = await _excelService.ExportToExcelAsync(caseId);
        Assert.True(exportResult.IsSuccess, exportResult.Error);
        Assert.NotNull(exportResult.Value);
        Assert.True(exportResult.Value.Length > 0);

        using var memoryStream = new MemoryStream(exportResult.Value);
        using var exportedPackage = new ExcelPackage(memoryStream);
        var dataSheet = exportedPackage.Workbook.Worksheets["data"];
        Assert.NotNull(dataSheet);
        Assert.Equal("شرکت نمونه", dataSheet.Cells["D4"].Value?.ToString());
    }

    [Fact]
    public void DebtOffsets_ReducesPrincipalRefund_Correctly()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: true,
            returnNumber: "1001",
            returnDateJalali: "1403/04/31",
            finalizationMethod: FinalizationMethod.AuditBooks,
            finalNoticeNumber: "5001",
            finalNoticeDateJalali: "1403/10/20",
            assessedIncome: 1_000_000_000m,
            exemptions: 0m,
            assessedTax: 250_000_000m,
            nonWaivablePenalties: 0m,
            timelyPaymentBonus: 0m);

        var receipts = new List<TaxRefundReceipt>
        {
            TaxRefundReceipt.Create(caseId, 1, "REC-01", "1403/05/01", "1403/05/01", 300_000_000m, "شعبه مرکزی", "اهواز"),
            TaxRefundReceipt.Create(caseId, 2, "REC-02", "1403/05/02", "1403/05/02", 15_000_000m, "شعبه مرکزی", "اهواز")
        };

        // Discovered debt: 15,000,000 Rials in Collection & Enforcement
        var letters = new List<TaxRefundLetter>
        {
            TaxRefundLetter.Create(
                caseId,
                TaxRefundLetterType.CollectionAndEnforcementInquiry,
                "ENF-101",
                "1403/11/01",
                "بدهی وصول و اجرا",
                debtAmount: 15_000_000m,
                debtYear: "1401")
        };

        // Act
        var calc = _calcEngine.Compute(assessment, receipts, letters);

        // Assert: Gross Surplus is 65M, minus 15M debt = 50M Principal Refund
        Assert.Equal(315_000_000m, calc.TotalPaidAmount);
        Assert.Equal(-65_000_000m, calc.SurplusPaid);
        Assert.Equal(65_000_000m, calc.GrossSurplus);
        Assert.Equal(15_000_000m, calc.TotalDiscoveredDebts);
        Assert.Equal(50_000_000m, calc.PrincipalTaxRefund);
        Assert.Equal(50_000_000m, calc.GrandTotalRefundable);
    }

    [Fact]
    public void ZeroOverpayment_WhenTaxExceedsPayments_RefundIsZero()
    {
        // Arrange: Taxpayer owes 350M, paid only 315M
        var caseId = Guid.NewGuid();
        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: true,
            returnNumber: "1001",
            returnDateJalali: "1403/04/31",
            finalizationMethod: FinalizationMethod.AuditBooks,
            finalNoticeNumber: "5001",
            finalNoticeDateJalali: "1403/10/20",
            assessedIncome: 1_400_000_000m,
            exemptions: 0m,
            assessedTax: 350_000_000m,
            nonWaivablePenalties: 0m,
            timelyPaymentBonus: 0m);

        var receipts = new List<TaxRefundReceipt>
        {
            TaxRefundReceipt.Create(caseId, 1, "REC-01", "1403/05/01", "1403/05/01", 315_000_000m)
        };

        // Act
        var calc = _calcEngine.Compute(assessment, receipts, Enumerable.Empty<TaxRefundLetter>());

        // Assert: SurplusPaid is positive (Taxpayer in debt +35M), Refund is 0
        Assert.Equal(35_000_000m, calc.SurplusPaid);
        Assert.Equal(0m, calc.GrossSurplus);
        Assert.Equal(0m, calc.PrincipalTaxRefund);
        Assert.Equal(0m, calc.GrandTotalRefundable);
    }

    [Fact]
    public void Article243DelayDamages_CalculatesCorrectMonthlyInterest()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: true,
            returnNumber: "1001",
            returnDateJalali: "1403/04/31",
            finalizationMethod: FinalizationMethod.AuditBooks,
            finalNoticeNumber: "5001",
            finalNoticeDateJalali: "1403/10/20",
            assessedIncome: 1_000_000_000m,
            exemptions: 0m,
            assessedTax: 250_000_000m,
            nonWaivablePenalties: 0m,
            timelyPaymentBonus: 0m);

        var receipts = new List<TaxRefundReceipt>
        {
            TaxRefundReceipt.Create(caseId, 1, "REC-01", "1403/05/01", "1403/05/01", 315_000_000m)
        };

        // 2 months delay: 1.5% per month = 3% of 65,000,000 = 1,950,000 Rials
        var calc = _calcEngine.Compute(
            assessment,
            receipts,
            Enumerable.Empty<TaxRefundLetter>(),
            stampDuty: 0,
            other: 0,
            penalties: 0,
            delayMonths: 2);

        Assert.Equal(65_000_000m, calc.PrincipalTaxRefund);
        Assert.Equal(2, calc.DelayMonths);
        Assert.Equal(1_950_000m, calc.DelayDamages);
        Assert.Equal(66_950_000m, calc.GrandTotalRefundable);
    }

    [Theory]
    [InlineData("cheklist")]
    [InlineData("form1")]
    [InlineData("form2")]
    [InlineData("form3")]
    [InlineData("form4")]
    [InlineData("form5")]
    [InlineData("form6")]
    [InlineData("form7")]
    public async Task PrintableDocument_GeneratesCompleteBindingsForAll8Forms(string formType)
    {
        // 1. Create a benchmark case in database
        var refundCase = TaxRefundCase.Create(
            "TRC-TEST-001",
            "87",
            "شرکت آزمون البرز",
            "0123456789",
            "160300",
            "خوزستان",
            "اهواز",
            "اهواز کیانپارس خ ۱۷",
            "ملی",
            "IR160120000000001234567890",
            1402,
            1,
            TaxSourceType.CorporateIncome,
            "استرداد مازاد پرداختی عملکرد",
            "غلامرضا اسلامی",
            "مسعود بصیر",
            "مهدی دلفی",
            Guid.NewGuid(),
            "1010101010");

        refundCase.AddReceipt(1, "REC-1", "1403/05/01", "1403/05/01", 300_000_000m, "مرکزی", "اهواز");
        refundCase.AddReceipt(2, "REC-2", "1403/05/02", "1403/05/02", 15_000_000m, "مرکزی", "اهواز");

        refundCase.UpdateAssessmentInfo(TaxAssessmentInfo.Create(
            true, "RET-1", "1403/04/31", FinalizationMethod.AuditBooks,
            "NOT-1", "1403/10/20", 1_000_000_000m, 0m, 250_000_000m, 0m, 0m));

        refundCase.UpdateBreakdown(RefundBreakdown.Create(65_000_000m, 0, 0, 0, 0));

        await _repository.CreateAsync(refundCase);
        await _unitOfWork.SaveChangesAsync();

        // 2. Fetch pre-formatted printable document
        var result = await _service.GetPrintableDocumentAsync(refundCase.Id, formType);
        Assert.True(result.IsSuccess, result.Error);

        var doc = result.Value;
        Assert.NotNull(doc);
        Assert.Equal(formType.ToLowerInvariant(), doc.FormType);
        Assert.False(string.IsNullOrWhiteSpace(doc.FormTitle));
        Assert.Equal("شرکت آزمون البرز", doc.TaxpayerName);
        Assert.Equal("0123456789", doc.EconomicCode);
        Assert.Equal("IR160120000000001234567890", doc.ShebaNumber);
        Assert.Equal("65,000,000", doc.GrandTotalRefundableFormatted);
        Assert.False(string.IsNullOrWhiteSpace(doc.GrandTotalRefundableInWords));
        Assert.Equal(2, doc.Receipts.Count);
    }
}
