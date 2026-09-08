using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using OfficeOpenXml;
using TaxSummary.Domain.Entities;
using TaxSummary.Infrastructure.Data;
using TaxSummary.Infrastructure.Repositories;
using TaxSummary.Infrastructure.Services;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class TaxRefundExcelServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly TaxSummaryDbContext _context;
    private readonly TaxRefundRepository _repository;
    private readonly UnitOfWork _unitOfWork;
    private readonly Mock<IHostEnvironment> _mockEnv = new();
    private readonly Mock<ILogger<TaxRefundExcelService>> _mockLogger = new();
    private readonly TaxRefundExcelService _service;

    public TaxRefundExcelServiceTests()
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

        _service = new TaxRefundExcelService(_repository, _unitOfWork, _mockEnv.Object, _mockLogger.Object);
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
            if (File.Exists(c)) return c;
        }

        return candidates[0];
    }

    [Fact]
    public async Task ImportFromExcelAsync_WithSampleExcelFile_ImportsAllBenchmarkDataSuccessfully()
    {
        // Arrange
        var samplePath = FindSampleFilePath("tax_refund_delfi نمونه.xlsm");
        if (!File.Exists(samplePath))
        {
            // Skip gracefully if run outside repository path
            return;
        }

        using var fileStream = File.OpenRead(samplePath);
        var currentUserId = Guid.NewGuid();

        // Act
        var result = await _service.ImportFromExcelAsync(fileStream, currentUserId, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess, result.Error);
        var caseId = result.Value;

        var importedCase = await _repository.GetByIdAsync(caseId, includeDetails: true);
        Assert.NotNull(importedCase);
        Assert.Equal("شرکت نمونه", importedCase.TaxpayerName);
        Assert.Equal("0123456789", importedCase.EconomicCode);
        Assert.Equal(1402, importedCase.TaxYear);
        Assert.Equal(250_000_000, importedCase.AssessmentInfo.AssessedTax);
        Assert.Equal(65_000_000, importedCase.Breakdown.PrincipalTaxRefund);
        Assert.Equal(2, importedCase.Receipts.Count);
        Assert.Equal(315_000_000, importedCase.Receipts.Sum(r => r.AmountRials));
        Assert.Single(importedCase.Allocations);
        Assert.Equal(65_000_000, importedCase.Allocations.First().RefundableAmount);
    }

    [Fact]
    public async Task ExportToExcelAsync_WithValidCase_GeneratesValidExcelWorkbook()
    {
        // Arrange
        var refundCase = TaxRefundCase.Create(
            caseTrackingNumber: "TRC-EXPORT-001",
            docketNumber: "100",
            taxpayerName: "شرکت صادرکننده آزمایشی",
            economicCode: "1234567890",
            taxUnitCode: "160300",
            province: "تهران",
            city: "تهران",
            address: "میدان ونک",
            bankName: "ملت",
            shebaNumber: "IR160120000000001234567890",
            taxYear: 1402,
            period: 1,
            taxSource: TaxSourceType.CorporateIncome,
            refundReason: "اشتباه واریزی",
            administrationHeadName: "مدیر کل",
            groupHeadName: "رئیس گروه",
            seniorAuditorName: "کارشناس",
            createdByUserId: Guid.NewGuid());

        refundCase.AddReceipt(1, "REC-EXP-1", "1403/01/01", "1403/01/01", 100_000_000);
        refundCase.UpdateAssessmentInfo(TaxAssessmentInfo.Create(true, "1", "1403/01/01", FinalizationMethod.AliRas, "2", "1403/02/01", 100_000_000, 0, 25_000_000, 0, 0));
        refundCase.UpdateBreakdown(RefundBreakdown.Create(75_000_000, 0, 0, 0, 0));

        await _repository.CreateAsync(refundCase);
        await _unitOfWork.SaveChangesAsync();

        // Act
        var result = await _service.ExportToExcelAsync(refundCase.Id, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess, result.Error);
        Assert.NotNull(result.Value);
        Assert.True(result.Value.Length > 0);

        // Verify generated bytes in EPPlus
        using var memStream = new MemoryStream(result.Value);
        using var package = new ExcelPackage(memStream);
        var dataSheet = package.Workbook.Worksheets["data"];
        Assert.NotNull(dataSheet);
        Assert.Equal("شرکت صادرکننده آزمایشی", dataSheet.Cells["D4"].Value?.ToString());
        Assert.Equal("1234567890", dataSheet.Cells["D5"].Value?.ToString());
    }
}
