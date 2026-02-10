using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

/// <summary>
/// Entity configuration for AdministrativeStatus entity
/// </summary>
public class AdministrativeStatusConfiguration : IEntityTypeConfiguration<AdministrativeStatus>
{
    public void Configure(EntityTypeBuilder<AdministrativeStatus> builder)
    {
        builder.ToTable("AdministrativeStatuses");

        // Primary Key
        builder.HasKey(a => a.Id);

        // Properties
        builder.Property(a => a.Id)
            .ValueGeneratedNever(); // We use Guid.NewGuid() in domain

        builder.Property(a => a.EmployeeId)
            .IsRequired();

        builder.Property(a => a.MissionDays)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(a => a.SickLeaveDays)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(a => a.PaidLeaveDays)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(a => a.OvertimeHours)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(a => a.DelayAndAbsenceHours)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(a => a.HourlyLeaveHours)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasColumnType("DATETIME2");

        builder.Property(a => a.UpdatedAt)
            .HasColumnType("DATETIME2");

        // Indexes
        builder.HasIndex(a => a.EmployeeId)
            .IsUnique()
            .HasDatabaseName("IX_AdministrativeStatuses_EmployeeId");

        builder.HasIndex(a => a.DelayAndAbsenceHours)
            .HasDatabaseName("IX_AdministrativeStatuses_DelayAndAbsenceHours");

        // Relationships configured in EmployeeConfiguration
    }
}
