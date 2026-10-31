using System.Text;
using FluentAssertions;
using OfficeOpenXml;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Infrastructure.Services.Reporting;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class ReportExportServiceTests
{
    private readonly ReportExportService _sut = new();

    [Fact]
    public async Task ExportToExcelAsync_ShouldGenerateValidRtlWorkbook_WithHeadersAndFormulas()
    {
        // Arrange
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        var columns = new List<ReportColumnMetadataDto>
        {
            new() { FieldName = "DepartmentName", PersianLabel = "نام اداره", DataType = "string" },
            new() { FieldName = "EmployeeCount", PersianLabel = "تعداد پرسنل", DataType = "number", HasAggregateSum = true },
            new() { FieldName = "TotalAmount", PersianLabel = "مبلغ کل", DataType = "currency", HasAggregateSum = true }
        };

        var rows = new List<Dictionary<string, object?>>
        {
            new()
            {
                ["DepartmentName"] = "اداره فناوری",
                ["EmployeeCount"] = 25,
                ["TotalAmount"] = 150000000L
            },
            new()
            {
                ["DepartmentName"] = "اداره حسابرسی",
                ["EmployeeCount"] = 40,
                ["TotalAmount"] = 320000000L
            }
        };

        // Act
        var result = await _sut.ExportToExcelAsync(
            "گزارش عملکرد ماهانه",
            "REP_MONTHLY_SUMMARY",
            columns,
            rows,
            summaryAggregates: null,
            appliedFilterSummary: "دفتر: اهواز");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeNull();
        result.Value.Length.Should().BeGreaterThan(100);

        using var stream = new MemoryStream(result.Value);
        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets[0];

        worksheet.Should().NotBeNull();
        worksheet.View.RightToLeft.Should().BeTrue("Workbook must be configured for RTL reading");
        worksheet.Cells[1, 1].Text.Should().Contain("اداره کل امور مالیاتی استان خوزستان");
        worksheet.Cells[2, 1].Text.Should().Contain("گزارش عملکرد ماهانه");

        // Check header row (row 5 because row 1 org, row 2 title, row 3 filter, row 4 spacer, row 5 header)
        worksheet.Cells[5, 1].Text.Should().Be("نام اداره");
        worksheet.Cells[5, 2].Text.Should().Be("تعداد پرسنل");
        worksheet.Cells[5, 3].Text.Should().Be("مبلغ کل");

        // Check data rows
        worksheet.Cells[6, 1].Text.Should().Be("اداره فناوری");
        worksheet.Cells[7, 1].Text.Should().Be("اداره حسابرسی");

        // Check summary row (row 8)
        worksheet.Cells[8, 1].Text.Should().Be("جمع کل");
        worksheet.Cells[8, 2].Formula.Should().Be("SUM(B6:B7)");
        worksheet.Cells[8, 3].Formula.Should().Be("SUM(C6:C7)");
    }

    [Fact]
    public async Task ExportToPdfAsync_ShouldReturnHelpfulFallbackMessage()
    {
        // Act
        var result = await _sut.ExportToPdfAsync("Test", "T01", new(), new(), null, null);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.Error.Should().Contain("اکسل");
    }
}
