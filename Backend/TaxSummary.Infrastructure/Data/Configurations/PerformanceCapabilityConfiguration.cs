using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

/// <summary>
/// Entity configuration for PerformanceCapability entity
/// </summary>
public class PerformanceCapabilityConfiguration : IEntityTypeConfiguration<PerformanceCapability>
{
    public void Configure(EntityTypeBuilder<PerformanceCapability> builder)
    {
        builder.ToTable("PerformanceCapabilities");

        // Primary Key
        builder.HasKey(p => p.Id);

        // Properties
        builder.Property(p => p.Id)
            .ValueGeneratedNever(); // We use Guid.NewGuid() in domain

        builder.Property(p => p.EmployeeId)
            .IsRequired();

        builder.Property(p => p.SystemRole)
            .IsRequired()
            .HasMaxLength(200)
            .HasColumnType("NVARCHAR(200)");

        builder.Property(p => p.DetectionOfTaxIssues)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.DetectionOfTaxEvasion)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.CompanyIdentification)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.ValueAddedRecognition)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.ReferredOrExecuted)
            .IsRequired()
            .HasDefaultValue(false);

        // NEW: Numerical tracking properties - تعداد (Quantity) and مبلغ (Amount)
        builder.Property(p => p.DetectionOfTaxIssues_Quantity)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(p => p.DetectionOfTaxIssues_Amount)
            .IsRequired()
            .HasColumnType("DECIMAL(18,2)")
            .HasDefaultValue(0);

        builder.Property(p => p.DetectionOfTaxEvasion_Quantity)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(p => p.DetectionOfTaxEvasion_Amount)
            .IsRequired()
            .HasColumnType("DECIMAL(18,2)")
            .HasDefaultValue(0);

        builder.Property(p => p.CompanyIdentification_Quantity)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(p => p.CompanyIdentification_Amount)
            .IsRequired()
            .HasColumnType("DECIMAL(18,2)")
            .HasDefaultValue(0);

        builder.Property(p => p.ValueAddedRecognition_Quantity)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(p => p.ValueAddedRecognition_Amount)
            .IsRequired()
            .HasColumnType("DECIMAL(18,2)")
            .HasDefaultValue(0);

        builder.Property(p => p.ReferredOrExecuted_Quantity)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(p => p.ReferredOrExecuted_Amount)
            .IsRequired()
            .HasColumnType("DECIMAL(18,2)")
            .HasDefaultValue(0);

        builder.Property(p => p.CreatedAt)
            .IsRequired()
            .HasColumnType("DATETIME2");

        builder.Property(p => p.UpdatedAt)
            .HasColumnType("DATETIME2");

        // Indexes
        builder.HasIndex(p => p.EmployeeId)
            .HasDatabaseName("IX_PerformanceCapabilities_EmployeeId");

        builder.HasIndex(p => p.SystemRole)
            .HasDatabaseName("IX_PerformanceCapabilities_SystemRole");

        // Relationships configured in EmployeeConfiguration
    }
}
