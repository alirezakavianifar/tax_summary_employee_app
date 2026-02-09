using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data;

/// <summary>
/// Database context for Tax Summary application
/// </summary>
public class TaxSummaryDbContext : DbContext
{
    public TaxSummaryDbContext(DbContextOptions<TaxSummaryDbContext> options)
        : base(options)
    {
    }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<AdministrativeStatus> AdministrativeStatuses => Set<AdministrativeStatus>();
    public DbSet<PerformanceCapability> PerformanceCapabilities => Set<PerformanceCapability>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaxSummaryDbContext).Assembly);
    }
}
