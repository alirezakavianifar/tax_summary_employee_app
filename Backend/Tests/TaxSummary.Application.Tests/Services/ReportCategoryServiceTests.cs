using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Entities.Reporting;
using TaxSummary.Domain.Enums;
using TaxSummary.Infrastructure.Data;
using TaxSummary.Infrastructure.Services.Reporting;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class ReportCategoryServiceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly TaxSummaryDbContext _context;
    private readonly ReportCategoryService _service;

    public ReportCategoryServiceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<TaxSummaryDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new TaxSummaryDbContext(options);
        _context.Database.EnsureCreated();

        _service = new ReportCategoryService(_context, NullLogger<ReportCategoryService>.Instance);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task SeedReportingAsync_SeedsDefault6ReportCategories()
    {
        // Act
        await ReportingDataSeeder.SeedReportingAsync(_context);

        // Assert
        var categories = await _context.ReportCategories.OrderBy(c => c.DisplayOrder).ToListAsync();
        categories.Should().HaveCount(6);
        categories.Should().OnlyContain(c => c.IsSystem);
        categories.Should().OnlyContain(c => c.IsActive);

        var codes = categories.Select(c => c.Code).ToList();
        codes.Should().Contain(new[] { "CUSTOM_DATASET", "TAX_AUDIT", "PAYROLL", "REFUNDS", "HR", "CROSS_SYSTEM" });
    }

    [Fact]
    public async Task GetActiveCategoriesAsync_ReturnsOnlyActiveCategoriesInDisplayOrder()
    {
        // Arrange
        await ReportingDataSeeder.SeedReportingAsync(_context);
        var custom = ReportDomainCategory.Create(7, "INACTIVE_CAT", "غیرفعال تست", isActive: false, displayOrder: 100);
        await _context.ReportCategories.AddAsync(custom);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetActiveCategoriesAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().HaveCount(6);
        result.Value.Should().NotContain(c => c.Code == "INACTIVE_CAT");
    }

    [Fact]
    public async Task GetAllForManagementAsync_ComputesReportCountsAccurately()
    {
        // Arrange
        await ReportingDataSeeder.SeedReportingAsync(_context);

        // Add 2 custom reports with DomainSource = 6 (CustomUploadedDataset)
        var rep1 = ReportDefinition.Create("REP_TEST_1", "گزارش تست ۱", "شرح", ReportDomainSource.CustomUploadedDataset, ReportCategory.Operational, ReportType.Tabular, "{}");
        var rep2 = ReportDefinition.Create("REP_TEST_2", "گزارش تست ۲", "شرح", ReportDomainSource.CustomUploadedDataset, ReportCategory.Operational, ReportType.Tabular, "{}");
        await _context.ReportDefinitions.AddRangeAsync(rep1, rep2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetAllForManagementAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();
        var cat6 = result.Value.First(c => c.Id == 6);
        cat6.ReportCount.Should().Be(2);

        var cat2 = result.Value.First(c => c.Id == 2); // Payroll
        cat2.ReportCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task CreateAsync_CreatesNewCustomCategoryWithUniqueId()
    {
        // Arrange
        await ReportingDataSeeder.SeedReportingAsync(_context);

        var dto = new CreateReportCategoryDto
        {
            Code = "SPECIAL_PROJECTS",
            Title = "پروژه‌های ویژه",
            Description = "دسته‌بندی جدید برای پایش پروژه‌های خاص",
            DisplayOrder = 10
        };

        // Act
        var result = await _service.CreateAsync(dto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Id.Should().BeGreaterThanOrEqualTo(7);
        result.Value.Code.Should().Be("SPECIAL_PROJECTS");
        result.Value.Title.Should().Be("پروژه‌های ویژه");
        result.Value.IsSystem.Should().BeFalse();
        result.Value.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task CreateAsync_RejectsDuplicateCodeOrTitle()
    {
        // Arrange
        await ReportingDataSeeder.SeedReportingAsync(_context);

        var dtoDuplicateCode = new CreateReportCategoryDto
        {
            Code = "CUSTOM_DATASET", // Already exists
            Title = "عنوان جدید",
            DisplayOrder = 10
        };

        var dtoDuplicateTitle = new CreateReportCategoryDto
        {
            Code = "NEW_CODE",
            Title = "داده‌های بارگذاری شده از اکسل", // Already exists
            DisplayOrder = 10
        };

        // Act
        var resCode = await _service.CreateAsync(dtoDuplicateCode);
        var resTitle = await _service.CreateAsync(dtoDuplicateTitle);

        // Assert
        resCode.IsFailure.Should().BeTrue();
        resCode.Error.Should().Contain("قبلاً ثبت شده است");

        resTitle.IsFailure.Should().BeTrue();
        resTitle.Error.Should().Contain("قبلاً ثبت شده است");
    }

    [Fact]
    public async Task UpdateAsync_ModifiesTitleAndDetails()
    {
        // Arrange
        await ReportingDataSeeder.SeedReportingAsync(_context);

        var updateDto = new UpdateReportCategoryDto
        {
            Title = "داده‌های بارگذاری شده از فایل اکسل (ویرایش شده)",
            Description = "توضیح به‌روز شده",
            DisplayOrder = 1,
            IsActive = true
        };

        // Act
        var result = await _service.UpdateAsync(6, updateDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Title.Should().Be("داده‌های بارگذاری شده از فایل اکسل (ویرایش شده)");
        result.Value.Description.Should().Be("توضیح به‌روز شده");

        var updatedInDb = await _context.ReportCategories.FindAsync(6);
        updatedInDb!.Title.Should().Be("داده‌های بارگذاری شده از فایل اکسل (ویرایش شده)");
    }

    [Fact]
    public async Task DeleteAsync_PreventsDeletingSystemCategory()
    {
        // Arrange
        await ReportingDataSeeder.SeedReportingAsync(_context);

        // Act
        var result = await _service.DeleteAsync(6);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("پایه سیستمی");
    }

    [Fact]
    public async Task DeleteAsync_PreventsDeletingCategoryWithAssignedReports()
    {
        // Arrange
        await ReportingDataSeeder.SeedReportingAsync(_context);
        var customCat = ReportDomainCategory.Create(7, "CUSTOM_TEST", "حوزه تستی", isSystem: false);
        await _context.ReportCategories.AddAsync(customCat);

        // Add report to this category
        var report = ReportDefinition.Create("REP_CUSTOM_ASSIGNED", "گزارش اختصاصی", "شرح", (ReportDomainSource)7, ReportCategory.Operational, ReportType.Tabular, "{}");
        await _context.ReportDefinitions.AddAsync(report);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.DeleteAsync(7);

        // Assert
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("گزارش به آن اختصاص دارند");
        result.Error.Should().Contain("هیچ گزارشی نباید بدون دسته‌بندی بماند");
    }

    [Fact]
    public async Task DeleteAsync_SuccessfullyDeletesUnusedCustomCategory()
    {
        // Arrange
        await ReportingDataSeeder.SeedReportingAsync(_context);
        var customCat = ReportDomainCategory.Create(8, "UNUSED_CAT", "حوزه بلااستفاده", isSystem: false);
        await _context.ReportCategories.AddAsync(customCat);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.DeleteAsync(8);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var deleted = await _context.ReportCategories.FindAsync(8);
        deleted.Should().BeNull();
    }
}
