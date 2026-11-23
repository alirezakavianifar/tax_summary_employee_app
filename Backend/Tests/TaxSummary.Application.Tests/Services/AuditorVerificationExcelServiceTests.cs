using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using OfficeOpenXml;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Infrastructure.Data;
using TaxSummary.Infrastructure.Services.Reporting;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class AuditorVerificationExcelServiceTests
{
    private readonly TaxSummaryDbContext _db;
    private readonly Mock<IAuditorPerformanceService> _performanceServiceMock;
    private readonly AuditorVerificationExcelService _service;

    public AuditorVerificationExcelServiceTests()
    {
        var options = new DbContextOptionsBuilder<TaxSummaryDbContext>()
            .UseInMemoryDatabase(databaseName: $"AuditorVerificationTests_{Guid.NewGuid()}")
            .Options;

        _db = new TaxSummaryDbContext(options);
        _performanceServiceMock = new Mock<IAuditorPerformanceService>();

        _service = new AuditorVerificationExcelService(
            _db,
            _performanceServiceMock.Object,
            NullLogger<AuditorVerificationExcelService>.Instance);
    }

    private static SrsRuleSetConfigDto CreateSampleRules()
    {
        var categories = new[]
        {
            "Corporate300", "CorporateOther", "Vat300", "VatLegalOther",
            "BusinessIncome", "VatIndividual", "PropertyTax"
        };

        var weights = new Dictionary<string, Dictionary<string, decimal>>
        {
            ["AssessmentsIssued"] = categories.ToDictionary(c => c, _ => 4.0m),
            ["FinalizedAssessments"] = categories.ToDictionary(c => c, _ => 4.0m),
            ["TaxpayerAcceptance"] = categories.ToDictionary(c => c, _ => 4.0m),
            ["Article238Agreements"] = categories.ToDictionary(c => c, _ => 4.0m),
            ["AssessmentGrowth"] = categories.ToDictionary(c => c, _ => 4.0m),
            ["TaxAdjustment"] = categories.ToDictionary(c => c, _ => -4.0m),
            ["IssuanceSpeed"] = categories.ToDictionary(c => c, _ => 4.0m),
            ["FinalizationSpeed"] = categories.ToDictionary(c => c, _ => 4.0m),
        };

        var allowedDays = categories.ToDictionary(c => c, _ => new AllowedDaysLimitDto
        {
            IssuanceAllowedDays = 45,
            FinalizationAllowedDays = 45
        });

        return new SrsRuleSetConfigDto
        {
            Title = "قواعد ارزیابی عملکرد مصوب",
            MajorCasesLabel = "۳۰۰ پرونده مهم",
            MajorCasesTag = "300Parvande, 100Parvande",
            GrowthThresholdLegalEntity = 700m,
            GrowthThresholdIndividual = 500m,
            AdjustmentThreshold = 15m,
            DailyDelayPenalty = 0.25m,
            WeightsMatrix = weights,
            AllowedDays = allowedDays
        };
    }

    private static List<AuditorCaseRecord> CreateSampleCases()
    {
        return new List<AuditorCaseRecord>
        {
            new()
            {
                AuditorName = "حسابرس الف",
                AuditorNationalId = "1234567890",
                FinalOfficeName = "اداره امور مالیاتی اهواز",
                CaseType = "اشخاص حقوقی",
                TaxSource = "شرکت‌ها",
                TaxpayerTin = "10101010101",
                ImportanceType = "300Parvande",
                DeclaredTaxAmount = 100_000_000m,
                AssessedTaxAmount = 900_000_000m,
                FinalTaxAmount = 850_000_000m,
                AssessmentNoticeDateJalali = "1403/05/10",
                FinalNoticeDateJalali = "1403/06/15",
                DaysAssignmentToNotice = 25.0,
                DaysNoticeToFinal = 35.0,
                CurrentStatus = "قطعیت یافته",
                FinalizationSource = "تمکین مودی"
            },
            new()
            {
                AuditorName = "حسابرس الف",
                AuditorNationalId = "1234567890",
                FinalOfficeName = "اداره امور مالیاتی اهواز",
                CaseType = "اشخاص حقیقی",
                TaxSource = "مشاغل",
                TaxpayerTin = "1234567890",
                DeclaredTaxAmount = 20_000_000m,
                AssessedTaxAmount = 50_000_000m,
                FinalTaxAmount = 45_000_000m,
                DaysAssignmentToNotice = 55.0, // Delay of 10 days
                DaysNoticeToFinal = 20.0,
                CurrentStatus = "برگ تشخیص صادر شده"
            },
            new()
            {
                AuditorName = "حسابرس ب",
                AuditorNationalId = "0987654321",
                FinalOfficeName = "اداره امور مالیاتی آبادان",
                CaseType = "اشخاص حقوقی",
                TaxSource = "ارزش افزوده",
                TaxpayerTin = "10203040506",
                DeclaredTaxAmount = 50_000_000m,
                AssessedTaxAmount = 120_000_000m,
                FinalTaxAmount = 80_000_000m,
                AssessmentNoticeDateJalali = "1403/04/01",
                DaysAssignmentToNotice = 20.0,
                CurrentStatus = "رسیدگی شده"
            }
        };
    }

    [Fact]
    public async Task ExportVerificationExcelAsync_GeneratesValidTwoSheetWorkbook_WithFormulas()
    {
        // Arrange
        var rules = CreateSampleRules();
        var cases = CreateSampleCases();

        _performanceServiceMock
            .Setup(p => p.GetSrsRuleConfigurationAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(rules));

        _performanceServiceMock
            .Setup(p => p.LoadAuditCasesAsync(It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(cases));

        // Act
        var result = await _service.ExportVerificationExcelAsync(null, null, "SYSTEM");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.True(result.Value.Length > 0);

        using var ms = new MemoryStream(result.Value);
        using var package = new ExcelPackage(ms);

        // Verify Worksheets
        Assert.Equal(2, package.Workbook.Worksheets.Count);

        var wsRaw = package.Workbook.Worksheets["داده‌های خام رسیدگی"];
        Assert.NotNull(wsRaw);
        Assert.True(wsRaw.View.RightToLeft);

        var wsRank = package.Workbook.Worksheets["رتبه‌بندی و محاسبات فرمولی"];
        Assert.NotNull(wsRank);
        Assert.True(wsRank.View.RightToLeft);

        // Verify Raw Data Rows
        Assert.Equal("حسابرس الف", wsRaw.Cells["B5"].Value?.ToString());
        Assert.Equal("حسابرس الف", wsRaw.Cells["B6"].Value?.ToString());
        Assert.Equal("حسابرس ب", wsRaw.Cells["B7"].Value?.ToString());

        // Verify Ranking Table & Formulas in Sheet 2
        // Row 15: Auditor 1 ("حسابرس الف")
        Assert.Equal("حسابرس الف", wsRank.Cells["B15"].Value?.ToString());
        string formulaCases = wsRank.Cells["E15"].Formula;
        Assert.Contains("COUNTIF", formulaCases);
        Assert.Contains("داده‌های خام رسیدگی", formulaCases);

        // Positive Points Formula
        string formulaFr01 = wsRank.Cells["F15"].Formula;
        Assert.Contains("COUNTIFS", formulaFr01);
        Assert.Contains("Corporate300", formulaFr01);
        Assert.Contains("$W", formulaFr01);

        // Total Positive Sum
        string formulaPosSum = wsRank.Cells["M15"].Formula;
        Assert.Contains("SUM(F15:L15)", formulaPosSum);

        // Net Score
        string formulaNetScore = wsRank.Cells["R15"].Formula;
        Assert.Contains("M15 - Q15", formulaNetScore);

        // Provincial Rank
        string formulaRank = wsRank.Cells["A15"].Formula;
        Assert.Contains("RANK(R15", formulaRank);

        // Performance Tier
        string formulaTier = wsRank.Cells["S15"].Formula;
        Assert.Contains("IF(A15<=", formulaTier);
    }

    [Fact]
    public async Task GenerateVerificationExcelFromStreamAsync_ParsesRawExcel_AndBuildsWorkbook()
    {
        // Arrange
        var rules = CreateSampleRules();
        _performanceServiceMock
            .Setup(p => p.GetSrsRuleConfigurationAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(rules));

        // Create in-memory Excel input file simulating a raw Sanim export
        using var inputPkg = new ExcelPackage();
        var wsIn = inputPkg.Workbook.Worksheets.Add("Sheet1");
        wsIn.Cells["A1"].Value = "نام حسابرس";
        wsIn.Cells["B1"].Value = "کد ملی حسابرس";
        wsIn.Cells["C1"].Value = "نام اداره سنیم";
        wsIn.Cells["D1"].Value = "مالیات تشخیصی";
        wsIn.Cells["E1"].Value = "مالیات ابرازی";
        wsIn.Cells["F1"].Value = "وضعیت فعلی";

        wsIn.Cells["A2"].Value = "رضا محمدی";
        wsIn.Cells["B2"].Value = "1751112233";
        wsIn.Cells["C2"].Value = "اداره دزفول";
        wsIn.Cells["D2"].Value = "500000000";
        wsIn.Cells["E2"].Value = "50000000";
        wsIn.Cells["F2"].Value = "برگ تشخیص صادر شده";

        wsIn.Cells["A3"].Value = "علی اکبری";
        wsIn.Cells["B3"].Value = "1759998877";
        wsIn.Cells["C3"].Value = "اداره ماهشهر";
        wsIn.Cells["D3"].Value = "800000000";
        wsIn.Cells["E3"].Value = "100000000";
        wsIn.Cells["F3"].Value = "قطعیت یافته";

        var inputBytes = inputPkg.GetAsByteArray();
        using var stream = new MemoryStream(inputBytes);

        // Act
        var result = await _service.GenerateVerificationExcelFromStreamAsync(stream, "Sanim_Test.xlsx");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);

        using var outPkg = new ExcelPackage(new MemoryStream(result.Value));
        Assert.Equal(2, outPkg.Workbook.Worksheets.Count);

        var wsRaw = outPkg.Workbook.Worksheets["داده‌های خام رسیدگی"];
        Assert.NotNull(wsRaw);
        Assert.Equal("رضا محمدی", wsRaw.Cells["B5"].Value?.ToString());
        Assert.Equal("علی اکبری", wsRaw.Cells["B6"].Value?.ToString());

        var wsRank = outPkg.Workbook.Worksheets["رتبه‌بندی و محاسبات فرمولی"];
        Assert.NotNull(wsRank);
        Assert.Equal("رضا محمدی", wsRank.Cells["B15"].Value?.ToString());
        Assert.Equal("علی اکبری", wsRank.Cells["B16"].Value?.ToString());
    }

    [Fact]
    public async Task ExportVerificationExcelAsync_LargeDataset_CompletesFastAndPreservesFormulas()
    {
        // Arrange
        var rules = CreateSampleRules();
        var largeCases = new List<AuditorCaseRecord>();
        int totalTestCases = 10000;
        int totalAuditors = 100;

        for (int i = 0; i < totalTestCases; i++)
        {
            int auditorNum = (i % totalAuditors) + 1;
            largeCases.Add(new AuditorCaseRecord
            {
                AuditorName = $"حسابرس آزمایشی {auditorNum}",
                AuditorNationalId = $"1000000{auditorNum:D3}",
                FinalOfficeName = "اداره امور مالیاتی اهواز",
                CaseType = (i % 2 == 0) ? "اشخاص حقوقی" : "اشخاص حقیقی",
                TaxSource = (i % 3 == 0) ? "شرکت‌ها" : "مشاغل",
                TaxpayerTin = $"1010000{i:D5}",
                ImportanceType = (i % 20 == 0) ? "300Parvande" : "عادی",
                DeclaredTaxAmount = 50_000_000m,
                AssessedTaxAmount = 150_000_000m,
                FinalTaxAmount = 140_000_000m,
                DaysAssignmentToNotice = 20.0 + (i % 40),
                DaysNoticeToFinal = 15.0 + (i % 30),
                CurrentStatus = "قطعیت یافته",
                FinalizationSource = "تمکین مودی"
            });
        }

        _performanceServiceMock
            .Setup(p => p.GetSrsRuleConfigurationAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(rules));

        _performanceServiceMock
            .Setup(p => p.LoadAuditCasesAsync(It.IsAny<string?>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Result.Success(largeCases));

        // Act & Assert Performance: Must complete in < 5 seconds
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var result = await _service.ExportVerificationExcelAsync(null, null, "LARGE_TEST");
        sw.Stop();

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.True(sw.ElapsedMilliseconds < 10000, $"Export took too long: {sw.ElapsedMilliseconds}ms");

        using var pkg = new ExcelPackage(new MemoryStream(result.Value));
        var wsRaw = pkg.Workbook.Worksheets["داده‌های خام رسیدگی"];
        var wsRank = pkg.Workbook.Worksheets["رتبه‌بندی و محاسبات فرمولی"];

        Assert.NotNull(wsRaw);
        Assert.NotNull(wsRank);

        // Check bounded range formula on Row 15
        string formulaFr01 = wsRank.Cells["F15"].Formula;
        Assert.Contains("$B$5:$B$10004", formulaFr01);
        Assert.Contains("$W$5:$W$10004", formulaFr01);

        // Check formulas populated on Row 15
        Assert.Contains("RANK(R15", wsRank.Cells["A15"].Formula);
        Assert.Contains("COUNTIF('داده‌های خام رسیدگی'!$B$5:$B$10004, B15)", wsRank.Cells["E15"].Formula);
        Assert.Contains("ROUND(M15 - Q15, 2)", wsRank.Cells["R15"].Formula);
        Assert.Contains("IF(A15<=", wsRank.Cells["S15"].Formula);

        // Check auditor identity values
        Assert.Equal("حسابرس آزمایشی 1", wsRank.Cells["B15"].Value?.ToString());
        Assert.Equal("1000000001", wsRank.Cells["C15"].Value?.ToString());
        Assert.Equal("اداره امور مالیاتی اهواز", wsRank.Cells["D15"].Value?.ToString());
    }
}
