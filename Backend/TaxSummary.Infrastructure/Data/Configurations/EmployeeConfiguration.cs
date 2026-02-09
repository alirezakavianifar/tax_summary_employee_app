using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

/// <summary>
/// Entity configuration for Employee entity
/// </summary>
public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees");

        // Primary Key
        builder.HasKey(e => e.Id);

        // Properties
        builder.Property(e => e.Id)
            .ValueGeneratedNever(); // We use Guid.NewGuid() in domain

        builder.Property(e => e.PersonnelNumber)
            .IsRequired()
            .HasMaxLength(50)
            .HasColumnType("NVARCHAR(50)");

        builder.Property(e => e.FirstName)
            .IsRequired()
            .HasMaxLength(100)
            .HasColumnType("NVARCHAR(100)");

        builder.Property(e => e.LastName)
            .IsRequired()
            .HasMaxLength(100)
            .HasColumnType("NVARCHAR(100)");

        builder.Property(e => e.Education)
            .HasMaxLength(200)
            .HasColumnType("NVARCHAR(200)");

        builder.Property(e => e.ServiceUnit)
            .HasMaxLength(200)
            .HasColumnType("NVARCHAR(200)");

        builder.Property(e => e.CurrentPosition)
            .HasMaxLength(200)
            .HasColumnType("NVARCHAR(200)");

        builder.Property(e => e.AppointmentPosition)
            .HasMaxLength(200)
            .HasColumnType("NVARCHAR(200)");

        builder.Property(e => e.PreviousExperienceYears)
            .IsRequired();

        builder.Property(e => e.PhotoUrl)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(e => e.StatusDescription)
            .HasMaxLength(2000)
            .IsRequired(false);

        builder.Property(e => e.CreatedAt)
            .IsRequired()
            .HasColumnType("DATETIME2");

        builder.Property(e => e.UpdatedAt)
            .HasColumnType("DATETIME2");

        // Indexes
        builder.HasIndex(e => e.PersonnelNumber)
            .IsUnique()
            .HasDatabaseName("IX_Employees_PersonnelNumber");

        builder.HasIndex(e => e.LastName)
            .HasDatabaseName("IX_Employees_LastName");

        builder.HasIndex(e => e.ServiceUnit)
            .HasDatabaseName("IX_Employees_ServiceUnit");

        builder.HasIndex(e => e.CreatedAt)
            .HasDatabaseName("IX_Employees_CreatedAt");

        // Relationships
        builder.HasOne(e => e.AdministrativeStatus)
            .WithOne(a => a.Employee)
            .HasForeignKey<AdministrativeStatus>(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(e => e.PerformanceCapabilities)
            .WithOne(p => p.Employee)
            .HasForeignKey(p => p.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
