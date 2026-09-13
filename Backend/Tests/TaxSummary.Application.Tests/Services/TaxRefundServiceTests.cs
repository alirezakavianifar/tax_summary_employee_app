using AutoMapper;
using Microsoft.Extensions.Logging;
using Moq;
using TaxSummary.Application.DTOs.TaxRefund;
using TaxSummary.Application.Mapping;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class TaxRefundServiceTests
{
    private readonly Mock<ITaxRefundRepository> _mockRepo;
    private readonly Mock<IUnitOfWork> _mockUow;
    private readonly IMapper _mapper;
    private readonly RefundCalculationEngine _calcEngine;
    private readonly Mock<IRefundDocumentStorageService> _mockDocStorage;
    private readonly Mock<ILogger<TaxRefundService>> _mockLogger;
    private readonly Mock<IUserRepository> _mockUserRepo;
    private readonly TaxRefundService _service;

    public TaxRefundServiceTests()
    {
        _mockRepo = new Mock<ITaxRefundRepository>();
        _mockUow = new Mock<IUnitOfWork>();
        _mockDocStorage = new Mock<IRefundDocumentStorageService>();

        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<TaxRefundMappingProfile>();
        });
        _mapper = config.CreateMapper();

        _calcEngine = new RefundCalculationEngine();
        _mockLogger = new Mock<ILogger<TaxRefundService>>();
        _mockUserRepo = new Mock<IUserRepository>();
        _mockUserRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(TaxSummary.Domain.Common.Result.Success(User.Create("admin", "admin@tax.gov.ir", "hash", "Admin")));
        var mockOfficeService = new Mock<IOfficeService>();
        mockOfficeService.Setup(o => o.GetAllOfficesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Enumerable.Empty<TaxSummary.Application.DTOs.Office.OfficeDto>());

        _service = new TaxRefundService(
            _mockRepo.Object,
            _mockUserRepo.Object,
            mockOfficeService.Object,
            _mockUow.Object,
            _mapper,
            _calcEngine,
            _mockDocStorage.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task GetByIdAsync_WhenCaseNotFound_ReturnsFailure()
    {
        // Arrange
        var id = Guid.NewGuid();
        _mockRepo.Setup(r => r.GetByIdAsync(id, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaxRefundCase?)null);

        // Act
        var result = await _service.GetByIdAsync(id);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("یافت نشد", result.Error);
    }

    [Fact]
    public async Task GetByIdAsync_WhenCaseExists_ReturnsSuccessWithCalculations()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var refundCase = TaxRefundCase.Create(
            "REF-1402-001",
            "87",
            "شرکت نمونه",
            "1234567890",
            "160300",
            "خوزستان",
            "اهواز",
            "اهواز",
            "ملی",
            "IR160120000000001234567890",
            1402,
            1,
            TaxSourceType.CorporateIncome,
            "اشتباه واریزی",
            "غلامرضا اسلامی",
            "مسعود بصیر",
            "مهدی دلفی",
            Guid.NewGuid());

        refundCase.AddReceipt(1, "RCP1", "1403/05/01", "1403/05/01", 315_000_000);
        refundCase.UpdateAssessmentInfo(TaxAssessmentInfo.Create(
            true, "654321987", "1403/04/31", FinalizationMethod.AliRas, "326541789", "1403/10/20",
            assessedIncome: 1_000_000_000, exemptions: 0, assessedTax: 250_000_000));

        _mockRepo.Setup(r => r.GetByIdAsync(refundCase.Id, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refundCase);

        // Act
        var result = await _service.GetByIdAsync(refundCase.Id);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("شرکت نمونه", result.Value.TaxpayerName);
        Assert.Equal(65_000_000, result.Value.Calculation.PrincipalTaxRefund);
    }

    [Fact]
    public async Task CreateAsync_ValidDto_CreatesAndSavesCase()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var dto = new CreateTaxRefundCaseDto
        {
            CaseTrackingNumber = "REF-1402-9999",
            DocketNumber = "87",
            TaxpayerName = "شرکت تست",
            EconomicCode = "1234567890",
            TaxUnitCode = "160300",
            Province = "خوزستان",
            City = "اهواز",
            Address = "کیانپارس",
            BankName = "ملی",
            ShebaNumber = "IR160120000000001234567890",
            TaxYear = 1402,
            Period = 1,
            TaxSource = TaxSourceType.CorporateIncome,
            RefundReason = "اشتباه واریزی",
            AdministrationHeadName = "غلامرضا اسلامی",
            GroupHeadName = "مسعود بصیر",
            SeniorAuditorName = "مهدی دلفی",
            Receipts = new List<CreateTaxRefundReceiptDto>
            {
                new() { RowIndex = 1, ReceiptNumber = "RCP1", IssueDateJalali = "1403/05/01", PaymentDateJalali = "1403/05/01", AmountRials = 315_000_000 }
            }
        };

        _mockRepo.Setup(r => r.CreateAsync(It.IsAny<TaxRefundCase>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaxRefundCase c, CancellationToken _) => c);
        _mockUow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _service.CreateAsync(dto, currentUserId);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotEqual(Guid.Empty, result.Value);
        _mockRepo.Verify(r => r.CreateAsync(It.IsAny<TaxRefundCase>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockUow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CalculateSandboxAsync_ComputesCorrectlyWithoutDatabase()
    {
        // Arrange
        var request = new CalculateRefundRequestDto
        {
            AssessedIncome = 1_000_000_000,
            AssessedTax = 250_000_000,
            TotalPaidAmount = 315_000_000,
            TotalDiscoveredDebts = 0
        };

        // Act
        var result = await _service.CalculateSandboxAsync(request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(-65_000_000, result.Value!.SurplusPaid);
        Assert.Equal(65_000_000, result.Value.PrincipalTaxRefund);
        Assert.Equal(65_000_000, result.Value.GrandTotalRefundable);
    }

    [Fact]
    public async Task CreateAsync_WithAllocationsOmittedReceiptId_ResolvesReceiptAndSucceeds()
    {
        // Arrange
        var currentUserId = Guid.NewGuid();
        var dto = new CreateTaxRefundCaseDto
        {
            TaxpayerName = "شرکت آزمایشی",
            EconomicCode = "1234567890",
            TaxUnitCode = "1234",
            Province = "خوزستان",
            City = "اهواز",
            BankName = "ملی",
            ShebaNumber = "IR123456789012345678901234",
            TaxYear = 1402,
            TaxSource = TaxSourceType.CorporateIncome,
            Receipts = new List<CreateTaxRefundReceiptDto>
            {
                new()
                {
                    RowIndex = 1,
                    ReceiptNumber = "RCPT-001",
                    IssueDateJalali = "1403/01/01",
                    PaymentDateJalali = "1403/01/01",
                    AmountRials = 100_000_000
                }
            },
            Allocations = new List<CreateRefundableReceiptAllocationDto>
            {
                new()
                {
                    TaxRefundReceiptId = Guid.Empty, // Omitted or empty
                    ReceiptNumber = "RCPT-001",
                    TotalReceiptAmount = 100_000_000,
                    RefundableAmount = 50_000_000
                }
            }
        };

        TaxRefundCase? capturedCase = null;
        _mockRepo.Setup(r => r.CreateAsync(It.IsAny<TaxRefundCase>(), It.IsAny<CancellationToken>()))
            .Callback<TaxRefundCase, CancellationToken>((c, _) => capturedCase = c)
            .ReturnsAsync((TaxRefundCase c, CancellationToken _) => c);
        _mockUow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _service.CreateAsync(dto, currentUserId);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(capturedCase);
        Assert.Single(capturedCase.Allocations);
        var alloc = capturedCase.Allocations.First();
        Assert.Equal("RCPT-001", alloc.ReceiptNumber);
        Assert.Equal(50_000_000, alloc.RefundableAmount);
        Assert.NotEqual(Guid.Empty, alloc.TaxRefundReceiptId);
    }

    [Fact]
    public async Task AddAllocationAsync_WithOmittedReceiptId_ResolvesByReceiptNumber()
    {
        // Arrange
        var testCase = TaxRefundCase.Create(
            "REF-1402-TEST", "10", "مودی نمونه", "1234567890", "1234",
            "تهران", "تهران", "خیابان آزادی", "ملی", "IR123456789012345678901234",
            1402, 1, TaxSourceType.CorporateIncome, "اضافه پرداختی",
            "مدیر", "رئیس گروه", "ممیز", Guid.NewGuid());

        var receipt = testCase.AddReceipt(1, "RCPT-999", "1403/01/01", "1403/01/01", 80_000_000);

        _mockRepo.Setup(r => r.GetByIdAsync(testCase.Id, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(testCase);
        _mockRepo.Setup(r => r.UpdateAsync(testCase, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _mockUow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var dto = new CreateRefundableReceiptAllocationDto
        {
            TaxRefundReceiptId = Guid.Empty, // Empty GUID from UI
            ReceiptNumber = "RCPT-999",
            TotalReceiptAmount = 80_000_000,
            RefundableAmount = 40_000_000
        };

        // Act
        var result = await _service.AddAllocationAsync(testCase.Id, dto);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(receipt.Id, result.Value!.TaxRefundReceiptId);
        Assert.Equal("RCPT-999", result.Value.ReceiptNumber);
        Assert.Equal(40_000_000, result.Value.RefundableAmount);
    }

    [Fact]
    public async Task UploadDocumentAsync_WithValidFile_SuccessfullyAttachesDocument()
    {
        // Arrange
        var testCase = TaxRefundCase.Create(
            "REF-1402-TEST", "10", "مودی نمونه", "1234567890", "1234",
            "تهران", "تهران", "خیابان آزادی", "ملی", "IR123456789012345678901234",
            1402, 1, TaxSourceType.CorporateIncome, "اضافه پرداختی",
            "مدیر", "رئیس گروه", "ممیز", Guid.NewGuid());
        _mockRepo.Setup(r => r.GetByIdAsync(testCase.Id, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(testCase);
        _mockUow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var mockFile = new Mock<Microsoft.AspNetCore.Http.IFormFile>();
        mockFile.Setup(f => f.FileName).Returns("darkhast_taxpayer.pdf");
        mockFile.Setup(f => f.Length).Returns(50000);

        _mockDocStorage.Setup(s => s.SavePdfAsync(mockFile.Object, testCase.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(("stored_123.pdf", "App_Data/uploads/stored_123.pdf", 50000));

        var dto = new UploadTaxRefundDocumentDto
        {
            Title = "درخواست مودی جهت استرداد",
            DocumentType = TaxRefundDocumentType.TaxpayerPetition,
            Description = "ثبت شده در دبیرخانه"
        };

        // Act
        var result = await _service.UploadDocumentAsync(
            testCase.Id,
            mockFile.Object,
            dto,
            Guid.NewGuid(),
            "کارشناس ارشد");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("درخواست مودی جهت استرداد", result.Value!.Title);
        Assert.Equal(TaxRefundDocumentType.TaxpayerPetition, result.Value.DocumentType);
        Assert.Equal("darkhast_taxpayer.pdf", result.Value.OriginalFileName);
        Assert.Single(testCase.Documents);
    }

    [Fact]
    public async Task GetByIdAsync_WhenUserAssignedToOffice160200_CanAccessCaseWithUnit160211()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var refundCase = TaxRefundCase.Create(
            "REF-1402-001", "87", "شرکت پتروشیمی کارون", "1234567890", "160211",
            "خوزستان", "اهواز", "کیانپارس", "ملی", "IR123456789012345678901234",
            1402, 1, TaxSourceType.CorporateIncome, "اضافه پرداختی",
            "رئیس امور", "رئیس گروه", "کارشناس ارشد", Guid.NewGuid());

        _mockRepo.Setup(r => r.GetByIdAsync(caseId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refundCase);

        var userId = Guid.NewGuid();
        var user = User.Create("office_head", "oh@tax.gov.ir", "hash", "OfficeHead");
        user.AssignOffice(Office.Create("160200", "اداره ۲ اهواز"));
        _mockUserRepo.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TaxSummary.Domain.Common.Result.Success(user));

        // Act
        var result = await _service.GetByIdAsync(caseId, userId);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("160200", result.Value.OfficeCode);
        Assert.Equal("160210", result.Value.GroupCode);
        Assert.Equal("160211", result.Value.TaxUnitCode);
    }

    [Fact]
    public async Task GetByIdAsync_WhenUserAssignedToOffice160100_IsDeniedAccessToUnit160211()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var refundCase = TaxRefundCase.Create(
            "REF-1402-001", "87", "شرکت پتروشیمی کارون", "1234567890", "160211",
            "خوزستان", "اهواز", "کیانپارس", "ملی", "IR123456789012345678901234",
            1402, 1, TaxSourceType.CorporateIncome, "اضافه پرداختی",
            "رئیس امور", "رئیس گروه", "کارشناس ارشد", Guid.NewGuid());

        _mockRepo.Setup(r => r.GetByIdAsync(caseId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refundCase);

        var userId = Guid.NewGuid();
        // User assigned to Office 160100 (Different office from 160200!)
        var user = User.Create("office1_head", "oh1@tax.gov.ir", "hash", "OfficeHead");
        user.AssignOffice(Office.Create("160100", "اداره ۱ اهواز"));
        _mockUserRepo.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TaxSummary.Domain.Common.Result.Success(user));

        // Act
        var result = await _service.GetByIdAsync(caseId, userId);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("دسترسی لازم", result.Error);
    }

    [Fact]
    public async Task TransitionStatusAsync_WhenOfficeHead160200VerifiesUnit160211_Succeeds()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var refundCase = TaxRefundCase.Create(
            "REF-1402-001", "87", "شرکت نمونه", "1234567890", "160211",
            "خوزستان", "اهواز", "کیانپارس", "ملی", "IR123456789012345678901234",
            1402, 1, TaxSourceType.CorporateIncome, "اضافه پرداختی",
            "رئیس امور", "رئیس گروه", "کارشناس ارشد", Guid.NewGuid());

        // Fast forward to GroupHeadApproved
        refundCase.TransitionStatus(RefundCaseStatus.Audited, Guid.NewGuid(), "Auditor", "Expert");
        refundCase.TransitionStatus(RefundCaseStatus.GroupHeadApproved, Guid.NewGuid(), "GroupHead", "GroupHead");

        _mockRepo.Setup(r => r.GetByIdAsync(caseId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refundCase);
        _mockUow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var userId = Guid.NewGuid();
        var officeHead = User.Create("office_head", "oh@tax.gov.ir", "hash", "OfficeHead");
        officeHead.AssignOffice(Office.Create("160200", "اداره ۲ اهواز"));
        _mockUserRepo.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TaxSummary.Domain.Common.Result.Success(officeHead));

        // Act: Office Head approves stage 3 (AdministrationHeadApproved)
        var result = await _service.TransitionStatusAsync(
            caseId,
            new TransitionStatusDto { NewStatus = RefundCaseStatus.AdministrationHeadApproved, Notes = "صدور دستور استرداد" },
            userId,
            "غلامرضا اسلامی",
            "OfficeHead");

        // Assert
        Assert.True(result.IsSuccess, result.Error);
        Assert.Equal(RefundCaseStatus.AdministrationHeadApproved, refundCase.Status);
    }

    [Fact]
    public async Task TransitionStatusAsync_WhenDifferentOfficeHeadVerifiesUnit160211_Fails()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var refundCase = TaxRefundCase.Create(
            "REF-1402-001", "87", "شرکت نمونه", "1234567890", "160211",
            "خوزستان", "اهواز", "کیانپارس", "ملی", "IR123456789012345678901234",
            1402, 1, TaxSourceType.CorporateIncome, "اضافه پرداختی",
            "رئیس امور", "رئیس گروه", "کارشناس ارشد", Guid.NewGuid());

        refundCase.TransitionStatus(RefundCaseStatus.Audited, Guid.NewGuid(), "Auditor", "Expert");
        refundCase.TransitionStatus(RefundCaseStatus.GroupHeadApproved, Guid.NewGuid(), "GroupHead", "GroupHead");

        _mockRepo.Setup(r => r.GetByIdAsync(caseId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(refundCase);

        var userId = Guid.NewGuid();
        // Office Head of 160100 (different office!)
        var otherHead = User.Create("office1_head", "oh1@tax.gov.ir", "hash", "OfficeHead");
        otherHead.AssignOffice(Office.Create("160100", "اداره ۱ اهواز"));
        _mockUserRepo.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(TaxSummary.Domain.Common.Result.Success(otherHead));

        // Act
        var result = await _service.TransitionStatusAsync(
            caseId,
            new TransitionStatusDto { NewStatus = RefundCaseStatus.AdministrationHeadApproved, Notes = "صدور دستور استرداد" },
            userId,
            "مدیر اداره دیگر",
            "OfficeHead");

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("مجاز به تایید این پرونده", result.Error);
    }
}
