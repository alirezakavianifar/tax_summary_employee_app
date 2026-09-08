using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using TaxSummary.Api.Controllers;
using TaxSummary.Application.DTOs.TaxRefund;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Application.Tests.Controllers;

public class TaxRefundsControllerTests
{
    private readonly Mock<ITaxRefundService> _mockService = new();
    private readonly Mock<ITaxRefundExcelService> _mockExcelService = new();
    private readonly Mock<ILogger<TaxRefundsController>> _mockLogger = new();
    private readonly TaxRefundsController _controller;

    public TaxRefundsControllerTests()
    {
        _controller = new TaxRefundsController(_mockService.Object, _mockExcelService.Object, _mockLogger.Object);

        // Setup mock user context
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Name, "مهدی دلفی"),
            new Claim(ClaimTypes.Role, "Auditor")
        }, "mock"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };
    }

    [Fact]
    public async Task CalculateSandbox_WithValidRequest_ReturnsOkWithCalculationResult()
    {
        // Arrange
        var request = new CalculateRefundRequestDto
        {
            AssessedTax = 250_000_000,
            ReceiptAmounts = new List<decimal> { 300_000_000, 15_000_000 },
            TotalPaidAmount = 315_000_000
        };

        var expectedResult = new RefundCalculationResultDto
        {
            TotalAssessedTax = 250_000_000,
            TotalPaidAmount = 315_000_000,
            SurplusPaid = -65_000_000,
            PrincipalTaxRefund = 65_000_000,
            GrandTotalRefundable = 65_000_000
        };

        _mockService.Setup(s => s.CalculateSandboxAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(expectedResult));

        // Act
        var actionResult = await _controller.CalculateSandbox(request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var value = Assert.IsType<RefundCalculationResultDto>(okResult.Value);
        Assert.Equal(65_000_000, value.GrandTotalRefundable);
        Assert.Equal(-65_000_000, value.SurplusPaid);
    }

    [Fact]
    public async Task GetById_WhenFound_ReturnsOkWithCase()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var caseDto = new TaxRefundCaseDto
        {
            Id = caseId,
            CaseTrackingNumber = "TRC-1402-001",
            TaxpayerName = "شرکت نمونه",
            EconomicCode = "1234567890",
            TaxYear = 1402
        };

        _mockService.Setup(s => s.GetByIdAsync(caseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(caseDto));

        // Act
        var actionResult = await _controller.GetById(caseId, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var value = Assert.IsType<TaxRefundCaseDto>(okResult.Value);
        Assert.Equal("شرکت نمونه", value.TaxpayerName);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        _mockService.Setup(s => s.GetByIdAsync(caseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Failure<TaxRefundCaseDto>("پرونده یافت نشد"));

        // Act
        var actionResult = await _controller.GetById(caseId, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundObjectResult>(actionResult.Result);
    }

    [Fact]
    public async Task GetByTrackingNumber_WhenFound_ReturnsOk()
    {
        // Arrange
        var caseDto = new TaxRefundCaseDto { CaseTrackingNumber = "TRC-999" };
        _mockService.Setup(s => s.GetByTrackingNumberAsync("TRC-999", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(caseDto));

        // Act
        var actionResult = await _controller.GetByTrackingNumber("TRC-999", CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var value = Assert.IsType<TaxRefundCaseDto>(okResult.Value);
        Assert.Equal("TRC-999", value.CaseTrackingNumber);
    }

    [Fact]
    public async Task Create_WithValidDto_ReturnsCreatedAtAction()
    {
        // Arrange
        var createDto = new CreateTaxRefundCaseDto
        {
            TaxpayerName = "شرکت پتروشیمی نمونه",
            EconomicCode = "1234567890",
            TaxYear = 1402,
            TaxUnitCode = "160300",
            Province = "خوزستان",
            City = "اهواز",
            BankName = "ملی",
            ShebaNumber = "IR160120000000001234567890",
            RefundReason = "اضافه پرداختی عملکرد"
        };

        var newId = Guid.NewGuid();
        var caseDto = new TaxRefundCaseDto { Id = newId, TaxpayerName = "شرکت پتروشیمی نمونه" };

        _mockService.Setup(s => s.CreateAsync(createDto, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(newId));

        _mockService.Setup(s => s.GetByIdAsync(newId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(caseDto));

        // Act
        var actionResult = await _controller.Create(createDto, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(actionResult.Result);
        Assert.Equal(nameof(TaxRefundsController.GetById), createdResult.ActionName);
    }

    [Fact]
    public async Task Update_WhenServiceSucceeds_ReturnsNoContent()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var updateDto = new UpdateTaxRefundCaseDto { TaxpayerName = "نام جدید" };

        _mockService.Setup(s => s.UpdateAsync(caseId, updateDto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        // Act
        var result = await _controller.Update(caseId, updateDto, CancellationToken.None);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_WhenServiceSucceeds_ReturnsNoContent()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        _mockService.Setup(s => s.DeleteAsync(caseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        // Act
        var result = await _controller.Delete(caseId, CancellationToken.None);

        // Assert
        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task TransitionStatus_WhenSuccessful_ReturnsOk()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var transitionDto = new TransitionStatusDto
        {
            NewStatus = RefundCaseStatus.Audited,
            Notes = "تایید شد"
        };

        _mockService.Setup(s => s.TransitionStatusAsync(caseId, transitionDto, It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success());

        // Act
        var result = await _controller.TransitionStatus(caseId, transitionDto, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetPrintableDocument_WhenFound_ReturnsOk()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var printable = new PrintableDocumentDto
        {
            FormType = "form5",
            FormTitle = "برگ استرداد مالیات اضافه دریافتی (ماده ۲۴۲)",
            TaxpayerName = "شرکت نمونه",
            GrandTotalRefundableFormatted = "۶۵,۰۰۰,۰۰۰"
        };

        _mockService.Setup(s => s.GetPrintableDocumentAsync(caseId, "form5", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(printable));

        // Act
        var actionResult = await _controller.GetPrintableDocument(caseId, "form5", CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var value = Assert.IsType<PrintableDocumentDto>(okResult.Value);
        Assert.Equal("form5", value.FormType);
    }

    [Fact]
    public async Task ExportExcel_WhenSuccessful_ReturnsFileResult()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var mockBytes = new byte[] { 1, 2, 3, 4, 5 };

        _mockExcelService.Setup(s => s.ExportToExcelAsync(caseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(mockBytes));

        // Act
        var result = await _controller.ExportExcel(caseId, CancellationToken.None);

        // Assert
        var fileResult = Assert.IsType<FileContentResult>(result);
        Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileResult.ContentType);
        Assert.Equal(mockBytes, fileResult.FileContents);
    }
}
