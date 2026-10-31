using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Mapping;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Domain.ValueObjects.Reporting;
using TaxSummary.Infrastructure.Data;
using TaxSummary.Infrastructure.Services.Reporting;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class ExecutiveReportingServiceTests
{
    private readonly IMapper _mapper;
    private readonly IMemoryCache _cache;
    private readonly Mock<IExecutiveAnalyticsRepository> _analyticsRepoMock;
    private readonly Mock<IReportingRepository> _reportingRepoMock;
    private readonly Mock<IReportExportService> _exportServiceMock;
    private readonly TaxSummaryDbContext _dbContext;

    public ExecutiveReportingServiceTests()
    {
        var mapperConfig = new MapperConfiguration(cfg => cfg.AddProfile<ReportingMappingProfile>());
        _mapper = mapperConfig.CreateMapper();

        _cache = new MemoryCache(new MemoryCacheOptions());
        _analyticsRepoMock = new Mock<IExecutiveAnalyticsRepository>();
        _reportingRepoMock = new Mock<IReportingRepository>();
        _exportServiceMock = new Mock<IReportExportService>();

        var options = new DbContextOptionsBuilder<TaxSummaryDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _dbContext = new TaxSummaryDbContext(options);
    }

    [Fact]
    public async Task GetExecutiveDashboardOverviewAsync_UsesMemoryCache_OnSecondCall()
    {
        // Arrange
        var snapshot = new ExecutiveKpiSnapshot(
            TotalEmployeesActive: 450,
            TotalEvaluationsRecorded: 380,
            TotalEvasionIdentifiedAmount: 5000000000m,
            CurrentMonthApprovedBudget: 1200000000m,
            CurrentMonthActualSpent: 1150000000m,
            TotalOvertimeHoursRecorded: 8200,
            LaborCapViolationsCount: 3,
            ActiveRefundCasesCount: 42,
            TotalRefundClaimedAmount: 8500000000m,
            TotalRefundApprovedAmount: 7800000000m,
            TotalDelayInterestPaid: 150000000m,
            AverageProcessingDays: 18.5
        );

        _analyticsRepoMock
            .Setup(r => r.GetExecutiveKpiSnapshotAsync(null, null, It.IsAny<List<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        _analyticsRepoMock
            .Setup(r => r.GetDepartmentBudgetVariancesAsync(It.IsAny<Guid?>(), It.IsAny<List<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DepartmentBudgetVariance>());

        _analyticsRepoMock
            .Setup(r => r.GetTaxSourceDistributionsAsync(It.IsAny<int?>(), It.IsAny<List<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<TaxSourceDistribution>());

        var service = new ExecutiveReportingService(
            _dbContext,
            _analyticsRepoMock.Object,
            _reportingRepoMock.Object,
            _exportServiceMock.Object,
            _cache,
            _mapper);

        var filter = new DashboardFilterDto { FiscalYear = 1404 };

        // Act: First Call (Cache Miss)
        var result1 = await service.GetExecutiveDashboardOverviewAsync(filter, null);

        // Act: Second Call (Cache Hit)
        var result2 = await service.GetExecutiveDashboardOverviewAsync(filter, null);

        // Assert
        Assert.True(result1.IsSuccess);
        Assert.True(result2.IsSuccess);
        Assert.NotNull(result1.Value);
        Assert.NotNull(result2.Value);
        Assert.Equal(450, result1.Value.KpiMetrics.TotalEmployeesActive);
        Assert.Equal(450, result2.Value.KpiMetrics.TotalEmployeesActive);

        // Analytics repo was called exactly ONCE due to memory cache!
        _analyticsRepoMock.Verify(
            r => r.GetExecutiveKpiSnapshotAsync(null, null, It.IsAny<List<Guid>>(), It.IsAny<CancellationToken>()), 
            Times.Once);
    }

    [Fact]
    public async Task GetExecutiveDashboardOverviewAsync_DisallowedOfficeId_ReturnsForbiddenError()
    {
        // Arrange
        var service = new ExecutiveReportingService(
            _dbContext,
            _analyticsRepoMock.Object,
            _reportingRepoMock.Object,
            _exportServiceMock.Object,
            _cache,
            _mapper);

        var allowedOfficeId = Guid.NewGuid();
        var forbiddenOfficeId = Guid.NewGuid();

        var filter = new DashboardFilterDto { OfficeId = forbiddenOfficeId };
        var managerAssignedOffices = new List<Guid> { allowedOfficeId };

        // Act
        var result = await service.GetExecutiveDashboardOverviewAsync(filter, managerAssignedOffices);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("مجوز دسترسی", result.Error);
    }

    [Fact]
    public async Task SavedReportsService_SaveAndUpdate_EnforcesOwnership()
    {
        // Arrange
        var reportId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var unauthorizedUserId = Guid.NewGuid();

        var report = ReportDefinition.Create(
            "TEST_REP_01",
            "گزارش آزمایشی",
            "شرح آزمایشی",
            ReportDomainSource.PayrollAndWelfare,
            ReportCategory.Financial,
            ReportType.Tabular,
            "{}");

        var preset = SavedReportPreset.Create(
            reportId,
            ownerUserId,
            "پیش‌تنظیم من",
            "{\"department\":\"امور مالی\"}");

        _reportingRepoMock
            .Setup(r => r.GetReportDefinitionByIdAsync(reportId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(report);

        _reportingRepoMock
            .Setup(r => r.GetPresetByIdAsync(preset.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(preset);

        var service = new SavedReportsService(_reportingRepoMock.Object, _mapper);

        // Act: Save
        var saveRequest = new SaveReportPresetRequestDto
        {
            ReportDefinitionId = reportId,
            PresetName = "فیلتر ذخیره شده ۱",
            FilterCriteriaJson = "{}"
        };
        var saveResult = await service.SavePresetAsync(saveRequest, ownerUserId);
        Assert.True(saveResult.IsSuccess);

        // Act: Unauthorized update attempt
        var updateRequest = new UpdateReportPresetRequestDto
        {
            PresetName = "تلاش ویرایش غیرمجاز",
            FilterCriteriaJson = "{}"
        };
        var updateResult = await service.UpdatePresetAsync(preset.Id, updateRequest, unauthorizedUserId);

        // Assert: Access denied
        Assert.False(updateResult.IsSuccess);
        Assert.Contains("مجوز ویرایش", updateResult.Error);
    }

    [Fact]
    public async Task GetCatalogAsync_ReturnsDefinitionsWithParsedColumns()
    {
        // Arrange
        var reports = new List<ReportDefinition>
        {
            ReportDefinition.Create(
                "REP_SAMPLE_1",
                "گزارش نمونه",
                "توضیحات",
                ReportDomainSource.PayrollAndWelfare,
                ReportCategory.Financial,
                ReportType.Tabular,
                "{\"columns\":[{\"fieldName\":\"departmentName\",\"persianLabel\":\"اداره\",\"dataType\":\"string\",\"hasAggregateSum\":false}]}")
        };

        _reportingRepoMock
            .Setup(r => r.GetAvailableReportsAsync("Manager", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(reports);

        var service = new ExecutiveReportingService(
            _dbContext,
            _analyticsRepoMock.Object,
            _reportingRepoMock.Object,
            _exportServiceMock.Object,
            _cache,
            _mapper);

        // Act
        var result = await service.GetCatalogAsync("Manager");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Single(result.Value);
        Assert.Equal("REP_SAMPLE_1", result.Value[0].Code);
        Assert.Single(result.Value[0].Columns);
        Assert.Equal("departmentName", result.Value[0].Columns[0].FieldName);
        Assert.Equal("اداره", result.Value[0].Columns[0].PersianLabel);
    }
}
