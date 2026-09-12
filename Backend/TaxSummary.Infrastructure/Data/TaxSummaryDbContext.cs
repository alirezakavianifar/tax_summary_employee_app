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
    public DbSet<PayrollRun> PayrollRuns => Set<PayrollRun>();
    public DbSet<PayrollCycle> PayrollCycles => Set<PayrollCycle>();
    public DbSet<PayrollDepartmentEntry> PayrollDepartmentEntries => Set<PayrollDepartmentEntry>();
    public DbSet<PayrollEmployeeItem> PayrollEmployeeItems => Set<PayrollEmployeeItem>();
    public DbSet<Office> Offices => Set<Office>();
    public DbSet<UserOffice> UserOffices => Set<UserOffice>();

    // Tax Refund System DbSets
    public DbSet<TaxRefundCase> TaxRefundCases => Set<TaxRefundCase>();
    public DbSet<TaxRefundReceipt> TaxRefundReceipts => Set<TaxRefundReceipt>();
    public DbSet<RefundableReceiptAllocation> RefundableReceiptAllocations => Set<RefundableReceiptAllocation>();
    public DbSet<TaxRefundLetter> TaxRefundLetters => Set<TaxRefundLetter>();
    public DbSet<TaxRefundApprovalAction> TaxRefundApprovalActions => Set<TaxRefundApprovalAction>();
    public DbSet<TaxRefundDocument> TaxRefundDocuments => Set<TaxRefundDocument>();

    // System & Navigation Configuration DbSets
    public DbSet<MenuSetting> MenuSettings => Set<MenuSetting>();

    // Audit Logging
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaxSummaryDbContext).Assembly);
    }
}
