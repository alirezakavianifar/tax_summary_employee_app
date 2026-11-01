using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Infrastructure.Services.Reporting;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class AuditorPerformanceServiceTests
{
    [Fact]
    public void SemanticAuditFieldMapper_WithStandard1405Columns_MapsAllKeyFieldsCorrectly()
    {
        // Arrange
        var columns = new List<CustomDatasetColumnDto>
        {
            new() { FieldName = "c_12", OriginalHeader = "نام اداره سنیم" },
            new() { FieldName = "c_32", OriginalHeader = "وضعیت فعلی" },
            new() { FieldName = "c_122", OriginalHeader = "مالیات ابرازی" },
            new() { FieldName = "c_142", OriginalHeader = "تاریخ تخصیص به حسابرس" },
            new() { FieldName = "c_162", OriginalHeader = "کد ملی حسابرس" },
            new() { FieldName = "c_172", OriginalHeader = "نام حسابرس" },
            new() { FieldName = "c_202", OriginalHeader = "مالیات تشخیصی" },
            new() { FieldName = "c_212", OriginalHeader = "تاریخ ابلاغ برگ تشخیص" },
            new() { FieldName = "c_482", OriginalHeader = "مالیات قطعی" },
            new() { FieldName = "c_532", OriginalHeader = "ریسک اظهارنامه" },
        };

        // Act
        var mapper = SemanticAuditFieldMapper.FromColumns(columns);

        // Assert
        Assert.True(mapper.HasAuditorData);
        Assert.Equal("c_172", mapper.AuditorNameField);
        Assert.Equal("c_162", mapper.AuditorNationalIdField);
        Assert.Equal("c_12", mapper.OfficeNameField);
        Assert.Equal("c_122", mapper.DeclaredTaxField);
        Assert.Equal("c_202", mapper.AssessedTaxField);
        Assert.Equal("c_482", mapper.FinalTaxField);
        Assert.Equal("c_142", mapper.AssignmentDateField);
        Assert.Equal("c_212", mapper.NoticeDateField);
        Assert.Equal("c_532", mapper.RiskLevelField);
        Assert.Equal("c_32", mapper.AuditStatusField);
    }

    [Fact]
    public void SemanticAuditFieldMapper_WithAlternateArabicCharacters_NormalizesAndMaps()
    {
        // Arrange with Arabic Yeh and Keheh: "نام حسابرس", "ماليات تشخيصي", "ريسك"
        var columns = new List<CustomDatasetColumnDto>
        {
            new() { FieldName = "col_auditor", OriginalHeader = "نام ممیز رسیدگی‌کننده" },
            new() { FieldName = "col_tax", OriginalHeader = "ماليات تشخيصي" },
            new() { FieldName = "col_risk", OriginalHeader = "سطح ريسك" },
        };

        // Act
        var mapper = SemanticAuditFieldMapper.FromColumns(columns);

        // Assert
        Assert.True(mapper.HasAuditorData);
        Assert.Equal("col_auditor", mapper.AuditorNameField);
        Assert.Equal("col_tax", mapper.AssessedTaxField);
        Assert.Equal("col_risk", mapper.RiskLevelField);
    }

    [Fact]
    public void SemanticAuditFieldMapper_WithoutAuditorColumn_ReturnsHasAuditorDataFalse()
    {
        // Arrange
        var columns = new List<CustomDatasetColumnDto>
        {
            new() { FieldName = "col_1", OriginalHeader = "کد پرونده" },
            new() { FieldName = "col_2", OriginalHeader = "مبلغ مالیات" },
            new() { FieldName = "col_3", OriginalHeader = "نام شرکت" },
        };

        // Act
        var mapper = SemanticAuditFieldMapper.FromColumns(columns);

        // Assert
        Assert.False(mapper.HasAuditorData);
        Assert.Null(mapper.AuditorNameField);
    }

    [Fact]
    public void AuditorScorecardDto_FinalityRate_CalculatesAccuratePercentage()
    {
        // Arrange
        var scorecard = new AuditorScorecardDto
        {
            TotalAssignedCases = 100,
            FinalizedCasesCount = 68
        };

        // Act & Assert
        Assert.Equal(68.0m, scorecard.FinalityRate);
    }

    [Fact]
    public void AuditorScorecardDto_FinalityRate_WithZeroCases_ReturnsZero()
    {
        var scorecard = new AuditorScorecardDto
        {
            TotalAssignedCases = 0,
            FinalizedCasesCount = 0
        };

        Assert.Equal(0m, scorecard.FinalityRate);
    }
}
