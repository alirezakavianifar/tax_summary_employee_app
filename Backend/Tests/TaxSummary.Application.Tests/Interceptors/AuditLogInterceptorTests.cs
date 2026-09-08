using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;
using TaxSummary.Infrastructure.Data.Interceptors;
using Xunit;

namespace TaxSummary.Application.Tests.Interceptors;

public class AuditLogInterceptorTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly Mock<ICurrentUserService> _mockCurrentUserService;
    private readonly AuditLogInterceptor _interceptor;
    private readonly DbContextOptions<TaxSummaryDbContext> _options;

    public AuditLogInterceptorTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        _mockCurrentUserService = new Mock<ICurrentUserService>();
        _mockCurrentUserService.Setup(s => s.UserId).Returns(Guid.NewGuid());
        _mockCurrentUserService.Setup(s => s.Username).Returns("admin");
        _mockCurrentUserService.Setup(s => s.IpAddress).Returns("192.168.1.50");
        _mockCurrentUserService.Setup(s => s.UserAgent).Returns("Mozilla/5.0 TestBrowser");

        _interceptor = new AuditLogInterceptor(_mockCurrentUserService.Object);

        _options = new DbContextOptionsBuilder<TaxSummaryDbContext>()
            .UseSqlite(_connection)
            .AddInterceptors(_interceptor)
            .Options;

        using var context = new TaxSummaryDbContext(_options);
        context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    [Fact]
    public async Task SaveChangesAsync_WhenEntityCreated_CreatesAuditLogWithRedactedSensitiveFields()
    {
        // Arrange
        using var context = new TaxSummaryDbContext(_options);
        var user = User.Create("audit_test_user", "$2a$12$secretHashValueMustBeRedacted", "Employee");

        // Act
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Assert
        var logs = await context.AuditLogs.ToListAsync();
        Assert.NotEmpty(logs);

        var userLog = logs.FirstOrDefault(l => l.EntityName == "User" && l.Action == "Created");
        Assert.NotNull(userLog);
        Assert.Equal("admin", userLog.Username);
        Assert.Equal("192.168.1.50", userLog.IpAddress);
        Assert.Equal(user.Id.ToString(), userLog.EntityId);
        Assert.Contains("[REDACTED]", userLog.NewValues);
        Assert.DoesNotContain("secretHashValueMustBeRedacted", userLog.NewValues);
    }

    [Fact]
    public async Task SaveChangesAsync_WhenEntityModified_CreatesAuditLogWithOldAndNewValues()
    {
        // Arrange
        using var context = new TaxSummaryDbContext(_options);
        var user = User.Create("mod_user", "hash123", "Employee");
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Act
        user.UpdateRole("Manager");
        await context.SaveChangesAsync();

        // Assert
        var modLog = await context.AuditLogs
            .FirstOrDefaultAsync(l => l.EntityName == "User" && l.Action == "Modified");

        Assert.NotNull(modLog);
        Assert.Equal("admin", modLog.Username);
        Assert.Contains("Role", modLog.AffectedColumns);
        Assert.Contains("Employee", modLog.OldValues);
        Assert.Contains("Manager", modLog.NewValues);
    }

    [Fact]
    public async Task SaveChangesAsync_WhenEntityDeleted_CreatesDeletedAuditLog()
    {
        // Arrange
        using var context = new TaxSummaryDbContext(_options);
        var user = User.Create("delete_user", "hash123", "Employee");
        context.Users.Add(user);
        await context.SaveChangesAsync();

        // Act
        context.Users.Remove(user);
        await context.SaveChangesAsync();

        // Assert
        var deleteLog = await context.AuditLogs
            .FirstOrDefaultAsync(l => l.EntityName == "User" && l.Action == "Deleted");

        Assert.NotNull(deleteLog);
        Assert.Equal(user.Id.ToString(), deleteLog.EntityId);
        Assert.NotNull(deleteLog.OldValues);
    }
}
