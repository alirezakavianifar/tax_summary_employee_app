using System.Text.Json;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Infrastructure.Data;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class ReportingDataSeederTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly TaxSummaryDbContext _context;

    public ReportingDataSeederTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<TaxSummaryDbContext>()
            .UseSqlite(_connection)
            .Options;

        _context = new TaxSummaryDbContext(options);
        _context.Database.EnsureCreated();
    }

    [Fact]
    public async Task SeedReportingAsync_SeedsAll10StandardReports()
    {
        // Act
        await ReportingDataSeeder.SeedReportingAsync(_context);

        // Assert
        var reports = await _context.ReportDefinitions.ToListAsync();
        reports.Should().HaveCount(10);

        reports.Should().OnlyContain(r => r.IsSystemReport);
        reports.Should().OnlyContain(r => r.IsActive);

        var expectedCodes = new[]
        {
            "REP_PAYROLL_BUDGET_UTIL",
            "REP_PAYROLL_LABOR_CAP",
            "REP_PAYROLL_MONTHLY_DEPT",
            "REP_REFUND_SOURCE_SUMMARY",
            "REP_REFUND_INTEREST_LIABILITY",
            "REP_REFUND_WORKFLOW_BOTTLENECK",
            "REP_EMPLOYEE_PERF_SUMMARY",
            "REP_EMPLOYEE_ATTENDANCE_LEAVE",
            "REP_EXECUTIVE_CROSS_DEPT_KPI",
            "REP_AUDIT_SECURITY_LOGS"
        };

        reports.Select(r => r.Code).Should().BeEquivalentTo(expectedCodes);
    }

    [Fact]
    public async Task SeedReportingAsync_IsIdempotent()
    {
        // Act - Call twice
        await ReportingDataSeeder.SeedReportingAsync(_context);
        await ReportingDataSeeder.SeedReportingAsync(_context);

        // Assert - Still exactly 10 reports
        var count = await _context.ReportDefinitions.CountAsync();
        count.Should().Be(10);
    }

    [Fact]
    public async Task SeedReportingAsync_HasValidConfigurationJsonForEveryReport()
    {
        // Act
        await ReportingDataSeeder.SeedReportingAsync(_context);

        // Assert
        var reports = await _context.ReportDefinitions.ToListAsync();
        foreach (var report in reports)
        {
            report.ConfigurationJson.Should().NotBeNullOrWhiteSpace();
            var doc = JsonDocument.Parse(report.ConfigurationJson);
            doc.RootElement.TryGetProperty("columns", out var cols).Should().BeTrue();
            cols.GetArrayLength().Should().BeGreaterThan(0);
        }
    }

    [Fact]
    public async Task SeedPhysicalDatabase()
    {
        var dbPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../TaxSummary.Api/taxsummary.db"));
        if (File.Exists(dbPath))
        {
            var options = new DbContextOptionsBuilder<TaxSummaryDbContext>()
                .UseSqlite($"Data Source={dbPath}")
                .Options;

            using var context = new TaxSummaryDbContext(options);
            await ReportingDataSeeder.SeedReportingAsync(context);
        }
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
