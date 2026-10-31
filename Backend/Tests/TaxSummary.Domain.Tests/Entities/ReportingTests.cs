using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.ValueObjects.Reporting;
using Xunit;

namespace TaxSummary.Domain.Tests.Entities;

public class ReportingTests
{
    // ==========================================
    // 1. ReportDefinition Tests
    // ==========================================

    [Fact]
    public void ReportDefinition_Create_NormalizesCodeToUppercase_AndSetsDefaults()
    {
        var report = ReportDefinition.Create(
            code: "rep_test_code",
            title: "  عنوان گزارش آزمایشی  ",
            description: "  توضیحات آزمایشی  ",
            source: ReportDomainSource.PayrollAndWelfare,
            category: ReportCategory.Financial,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\": []}");

        Assert.NotEqual(Guid.Empty, report.Id);
        Assert.Equal("REP_TEST_CODE", report.Code);
        Assert.Equal("عنوان گزارش آزمایشی", report.Title);
        Assert.Equal("توضیحات آزمایشی", report.Description);
        Assert.Equal(ReportDomainSource.PayrollAndWelfare, report.DomainSource);
        Assert.Equal(ReportCategory.Financial, report.Category);
        Assert.Equal(ReportType.Tabular, report.Type);
        Assert.Equal("{\"columns\": []}", report.ConfigurationJson);
        Assert.True(report.IsActive);
        Assert.False(report.IsSystemReport);
        Assert.Null(report.RequiredRole);
        Assert.True(report.CreatedAt <= DateTime.UtcNow);
        Assert.Null(report.UpdatedAt);
    }

    [Fact]
    public void ReportDefinition_Create_WithSystemReportAndRole_SetsProperties()
    {
        var userId = Guid.NewGuid();
        var report = ReportDefinition.Create(
            code: "REP_EXECUTIVE_KPI",
            title: "داشبورد مدیران",
            description: "شاخص‌های کلیدی",
            source: ReportDomainSource.CrossSystem,
            category: ReportCategory.ExecutiveKpi,
            type: ReportType.SummaryKpi,
            configurationJson: "{}",
            isSystemReport: true,
            requiredRole: "Admin",
            createdByUserId: userId);

        Assert.Equal("REP_EXECUTIVE_KPI", report.Code);
        Assert.True(report.IsSystemReport);
        Assert.Equal("Admin", report.RequiredRole);
        Assert.Equal(userId, report.CreatedByUserId);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void ReportDefinition_Create_ThrowsOnEmptyCode(string? code)
    {
        var ex = Assert.Throws<ArgumentException>(() => ReportDefinition.Create(
            code!, "عنوان", "شرح", ReportDomainSource.HumanResources,
            ReportCategory.Operational, ReportType.Tabular, "{}"));

        Assert.Equal("code", ex.ParamName);
    }

    [Theory]
    [InlineData("ab")] // Too short (< 3)
    [InlineData("REP-WITH-DASH")] // Hyphen not allowed
    [InlineData("REP WITH SPACE")] // Space not allowed
    [InlineData("REP@SPECIAL#")] // Special chars not allowed
    [InlineData("THIS_CODE_IS_WAY_TOO_LONG_EXCEEDING_THE_MAXIMUM_ALLOWED_SIXTY_FOUR_CHARACTERS_LIMIT_FOR_REPORT_CODES")]
    public void ReportDefinition_Create_ThrowsOnInvalidCodeRegex(string invalidCode)
    {
        var ex = Assert.Throws<ArgumentException>(() => ReportDefinition.Create(
            invalidCode, "عنوان", "شرح", ReportDomainSource.HumanResources,
            ReportCategory.Operational, ReportType.Tabular, "{}"));

        Assert.Contains("۳ تا ۶۴ کاراکتر", ex.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void ReportDefinition_Create_ThrowsOnEmptyTitle(string? title)
    {
        var ex = Assert.Throws<ArgumentException>(() => ReportDefinition.Create(
            "REP_CODE", title!, "شرح", ReportDomainSource.HumanResources,
            ReportCategory.Operational, ReportType.Tabular, "{}"));

        Assert.Equal("title", ex.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void ReportDefinition_Create_ThrowsOnEmptyConfigurationJson(string? configJson)
    {
        var ex = Assert.Throws<ArgumentException>(() => ReportDefinition.Create(
            "REP_CODE", "عنوان", "شرح", ReportDomainSource.HumanResources,
            ReportCategory.Operational, ReportType.Tabular, configJson!));

        Assert.Equal("configurationJson", ex.ParamName);
    }

    [Fact]
    public void ReportDefinition_Update_ModifiesFieldsAndSetsUpdatedAt()
    {
        var report = ReportDefinition.Create(
            "REP_CUSTOM", "عنوان اولیه", "شرح اولیه",
            ReportDomainSource.PayrollAndWelfare, ReportCategory.Financial,
            ReportType.Tabular, "{}");

        report.Update("عنوان جدید", "شرح جدید", "{\"columns\": [\"A\"]}", "Manager");

        Assert.Equal("عنوان جدید", report.Title);
        Assert.Equal("شرح جدید", report.Description);
        Assert.Equal("{\"columns\": [\"A\"]}", report.ConfigurationJson);
        Assert.Equal("Manager", report.RequiredRole);
        Assert.NotNull(report.UpdatedAt);
    }

    [Theory]
    [InlineData("", "{}")]
    [InlineData("عنوان", "")]
    public void ReportDefinition_Update_ThrowsOnEmptyTitleOrConfig(string title, string configJson)
    {
        var report = ReportDefinition.Create(
            "REP_CUSTOM", "عنوان اولیه", "شرح اولیه",
            ReportDomainSource.PayrollAndWelfare, ReportCategory.Financial,
            ReportType.Tabular, "{}");

        Assert.Throws<ArgumentException>(() => report.Update(title, "شرح", configJson, null));
    }

    [Fact]
    public void ReportDefinition_SetActive_ThrowsWhenSystemReportIsDeactivated()
    {
        var report = ReportDefinition.Create(
            "REP_SYS", "گزارش پایه", "شرح",
            ReportDomainSource.PayrollAndWelfare, ReportCategory.Financial,
            ReportType.Tabular, "{}", isSystemReport: true);

        var ex = Assert.Throws<InvalidOperationException>(() => report.SetActive(false));
        Assert.Contains("پایه سیستمی", ex.Message);
        Assert.True(report.IsActive); // Remains active
    }

    [Fact]
    public void ReportDefinition_SetActive_SucceedsForNonSystemReport()
    {
        var report = ReportDefinition.Create(
            "REP_NON_SYS", "گزارش عادی", "شرح",
            ReportDomainSource.PayrollAndWelfare, ReportCategory.Financial,
            ReportType.Tabular, "{}", isSystemReport: false);

        report.SetActive(false);
        Assert.False(report.IsActive);
        Assert.NotNull(report.UpdatedAt);

        report.SetActive(true);
        Assert.True(report.IsActive);
    }

    // ==========================================
    // 2. SavedReportPreset Tests
    // ==========================================

    [Fact]
    public void SavedReportPreset_Create_SetsPropertiesCorrectly()
    {
        var defId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var officeId = Guid.NewGuid();

        var preset = SavedReportPreset.Create(
            defId, userId, "  الگوی اختصاصی فروردین  ",
            "{\"fiscalYear\": 1403}", "[\"Col1\", \"Col2\"]",
            isShared: true, officeId: officeId);

        Assert.NotEqual(Guid.Empty, preset.Id);
        Assert.Equal(defId, preset.ReportDefinitionId);
        Assert.Equal(userId, preset.UserId);
        Assert.Equal("الگوی اختصاصی فروردین", preset.PresetName);
        Assert.Equal("{\"fiscalYear\": 1403}", preset.FilterCriteriaJson);
        Assert.Equal("[\"Col1\", \"Col2\"]", preset.VisibleColumnsJson);
        Assert.True(preset.IsSharedWithOffice);
        Assert.Equal(officeId, preset.OfficeId);
        Assert.True(preset.CreatedAt <= DateTime.UtcNow);
        Assert.Null(preset.UpdatedAt);
    }

    [Theory]
    [InlineData("", "{}")]
    [InlineData("   ", "{}")]
    [InlineData(null, "{}")]
    public void SavedReportPreset_Create_ThrowsOnEmptyName(string? name, string criteria)
    {
        var ex = Assert.Throws<ArgumentException>(() => SavedReportPreset.Create(
            Guid.NewGuid(), Guid.NewGuid(), name!, criteria));

        Assert.Equal("presetName", ex.ParamName);
    }

    [Theory]
    [InlineData("الگو", "")]
    [InlineData("الگو", "   ")]
    [InlineData("الگو", null)]
    public void SavedReportPreset_Create_ThrowsOnEmptyCriteria(string name, string? criteria)
    {
        var ex = Assert.Throws<ArgumentException>(() => SavedReportPreset.Create(
            Guid.NewGuid(), Guid.NewGuid(), name, criteria!));

        Assert.Equal("filterCriteriaJson", ex.ParamName);
    }

    [Fact]
    public void SavedReportPreset_Update_ModifiesFieldsAndSetsUpdatedAt()
    {
        var preset = SavedReportPreset.Create(
            Guid.NewGuid(), Guid.NewGuid(), "الگوی اولیه", "{}");

        preset.Update("الگوی به‌روزشده", "{\"dept\": \"IT\"}", "[\"ColA\"]", true);

        Assert.Equal("الگوی به‌روزشده", preset.PresetName);
        Assert.Equal("{\"dept\": \"IT\"}", preset.FilterCriteriaJson);
        Assert.Equal("[\"ColA\"]", preset.VisibleColumnsJson);
        Assert.True(preset.IsSharedWithOffice);
        Assert.NotNull(preset.UpdatedAt);
    }

    // ==========================================
    // 3. ReportExecutionLog Tests
    // ==========================================

    [Fact]
    public void ReportExecutionLog_Record_SetsAllProperties_AndSanitizesValues()
    {
        var defId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var log = ReportExecutionLog.Record(
            defId, "REP_PAYROLL_BUDGET", userId, "akavian",
            durationMs: 345, rowCount: 120,
            filtersSummary: "  ماه: فروردین  ",
            exportFormat: "Excel",
            ipAddress: "192.168.1.50");

        Assert.NotEqual(Guid.Empty, log.Id);
        Assert.Equal(defId, log.ReportDefinitionId);
        Assert.Equal("REP_PAYROLL_BUDGET", log.ReportCode);
        Assert.Equal(userId, log.UserId);
        Assert.Equal("akavian", log.Username);
        Assert.Equal(345, log.ExecutionDurationMs);
        Assert.Equal(120, log.ResultRowCount);
        Assert.Equal("ماه: فروردین", log.AppliedFiltersSummary);
        Assert.Equal("Excel", log.ExportFormat);
        Assert.Equal("192.168.1.50", log.ClientIpAddress);
        Assert.True(log.ExecutedAt <= DateTime.UtcNow);
    }

    [Fact]
    public void ReportExecutionLog_Record_GuardsAgainstNegativeDurationAndRowCount()
    {
        var log = ReportExecutionLog.Record(
            null, "", Guid.NewGuid(), null!,
            durationMs: -50, rowCount: -10,
            filtersSummary: null);

        Assert.Equal("DYNAMIC_QUERY", log.ReportCode);
        Assert.Equal("unknown", log.Username);
        Assert.Equal(0, log.ExecutionDurationMs);
        Assert.Equal(0, log.ResultRowCount);
    }

    // ==========================================
    // 4. Value Objects Tests
    // ==========================================

    [Fact]
    public void ExecutiveKpiSnapshot_BudgetUtilizationPercentage_CalculatesCorrectly()
    {
        var snapshot = new ExecutiveKpiSnapshot(
            TotalEmployeesActive: 150,
            TotalEvaluationsRecorded: 140,
            TotalEvasionIdentifiedAmount: 50_000_000m,
            CurrentMonthApprovedBudget: 1_000_000_000m,
            CurrentMonthActualSpent: 850_000_000m,
            TotalOvertimeHoursRecorded: 450,
            LaborCapViolationsCount: 2,
            ActiveRefundCasesCount: 15,
            TotalRefundClaimedAmount: 200_000_000m,
            TotalRefundApprovedAmount: 180_000_000m,
            TotalDelayInterestPaid: 5_000_000m,
            AverageProcessingDays: 14.5
        );

        Assert.Equal(85.0m, snapshot.BudgetUtilizationPercentage);
    }

    [Fact]
    public void ExecutiveKpiSnapshot_BudgetUtilizationPercentage_ZeroWhenBudgetIsZero()
    {
        var snapshot = new ExecutiveKpiSnapshot(
            TotalEmployeesActive: 0,
            TotalEvaluationsRecorded: 0,
            TotalEvasionIdentifiedAmount: 0,
            CurrentMonthApprovedBudget: 0,
            CurrentMonthActualSpent: 0,
            TotalOvertimeHoursRecorded: 0,
            LaborCapViolationsCount: 0,
            ActiveRefundCasesCount: 0,
            TotalRefundClaimedAmount: 0,
            TotalRefundApprovedAmount: 0,
            TotalDelayInterestPaid: 0,
            AverageProcessingDays: 0
        );

        Assert.Equal(0m, snapshot.BudgetUtilizationPercentage);
    }

    [Fact]
    public void DepartmentBudgetVariance_RecordEquality_WorksAsExpected()
    {
        var v1 = new DepartmentBudgetVariance("امور مالی", 100_000_000m, 90_000_000m, 10_000_000m, false, 25, 45.5m);
        var v2 = new DepartmentBudgetVariance("امور مالی", 100_000_000m, 90_000_000m, 10_000_000m, false, 25, 45.5m);

        Assert.Equal(v1, v2);
        Assert.Equal("امور مالی", v1.DepartmentName);
        Assert.False(v1.HasViolation);
    }

    [Fact]
    public void TaxSourceDistribution_RecordEquality_WorksAsExpected()
    {
        var d1 = new TaxSourceDistribution("101", "مالیات بر شرکت‌ها", 45, 500_000_000m, 12_000_000m);
        var d2 = new TaxSourceDistribution("101", "مالیات بر شرکت‌ها", 45, 500_000_000m, 12_000_000m);

        Assert.Equal(d1, d2);
        Assert.Equal("101", d1.TaxSourceCode);
        Assert.Equal(45, d1.CaseCount);
    }

    [Fact]
    public void ReportColumnDefinition_Defaults_AreCorrect()
    {
        var col = new ReportColumnDefinition("nationalCode", "کد ملی", "string");

        Assert.Equal("nationalCode", col.FieldName);
        Assert.Equal("کد ملی", col.PersianLabel);
        Assert.Equal("string", col.DataType);
        Assert.True(col.IsVisible);
        Assert.True(col.IsSortable);
        Assert.False(col.HasAggregateSum);
        Assert.Equal("right", col.Alignment);
    }
}
