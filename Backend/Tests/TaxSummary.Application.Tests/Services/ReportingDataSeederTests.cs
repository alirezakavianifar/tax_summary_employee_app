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
        reports.Should().HaveCount(11);

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
            "REP_AUDIT_SECURITY_LOGS",
            "REP_SANIM_AUDIT_ASSESSMENT"
        };

        reports.Select(r => r.Code).Should().BeEquivalentTo(expectedCodes);
    }

    [Fact]
    public async Task SeedReportingAsync_IsIdempotent()
    {
        // Act - Call twice
        await ReportingDataSeeder.SeedReportingAsync(_context);
        await ReportingDataSeeder.SeedReportingAsync(_context);

        // Assert - Still exactly 11 reports
        var count = await _context.ReportDefinitions.CountAsync();
        count.Should().Be(11);
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
    public async Task InitializeAsync_AutomaticallyMigratesMissingExecutiveColumnsOnExistingDatabase()
    {
        var tempDbPath = Path.Combine(Path.GetTempPath(), $"tax_mig_{Guid.NewGuid():N}.db");
        try
        {
            var sourceDb = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../TaxSummary.Api/taxsummary.db"));
            if (!File.Exists(sourceDb)) return;

            File.Copy(sourceDb, tempDbPath, true);

            // Drop executive columns and migration record to simulate the un-migrated remote server database
            using (var conn = new Microsoft.Data.Sqlite.SqliteConnection($"Data Source={tempDbPath}"))
            {
                await conn.OpenAsync();
                var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    ALTER TABLE Employees DROP COLUMN AppointmentDate;
                    ALTER TABLE Employees DROP COLUMN EmploymentDate;
                    ALTER TABLE Employees DROP COLUMN ServiceMonths;
                    ALTER TABLE PerformanceCapabilities DROP COLUMN Collections1404_Amount;
                    ALTER TABLE PerformanceCapabilities DROP COLUMN Collections1405_Amount;
                    ALTER TABLE PerformanceCapabilities DROP COLUMN TotalObjections_Quantity;
                    ALTER TABLE PerformanceCapabilities DROP COLUMN IssuedRulings_Quantity;
                    ALTER TABLE PerformanceCapabilities DROP COLUMN IssuedRulings_Percentage;
                    ALTER TABLE PerformanceCapabilities DROP COLUMN FinalizedObjections_Quantity;
                    ALTER TABLE PerformanceCapabilities DROP COLUMN FinalizedRulings_Percentage;
                    DELETE FROM __EFMigrationsHistory WHERE MigrationId = '20261102050338_AddExecutiveServiceDatesAndPerformanceMetrics';";
                await cmd.ExecuteNonQueryAsync();
            }

            var options = new DbContextOptionsBuilder<TaxSummaryDbContext>()
                .UseSqlite($"Data Source={tempDbPath}")
                .Options;

            using (var context = new TaxSummaryDbContext(options))
            {
                // Calling InitializeAsync should NOT crash and should auto-add the missing columns
                await DbInitializer.InitializeAsync(context);
            }

            // Verify columns now exist
            using (var conn = new Microsoft.Data.Sqlite.SqliteConnection($"Data Source={tempDbPath}"))
            {
                await conn.OpenAsync();
                var cmd = conn.CreateCommand();
                cmd.CommandText = "PRAGMA table_info(Employees);";
                var cols = new List<string>();
                using (var r = await cmd.ExecuteReaderAsync())
                {
                    while (await r.ReadAsync()) cols.Add(r.GetString(1));
                }
                cols.Should().Contain("AppointmentDate");
                cols.Should().Contain("EmploymentDate");
                cols.Should().Contain("ServiceMonths");
            }
        }
        finally
        {
            if (File.Exists(tempDbPath))
            {
                try { File.Delete(tempDbPath); } catch { }
            }
        }
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }
}
