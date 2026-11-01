using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities.Reporting;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class AuditorPerformanceMetricDefinitionConfiguration : IEntityTypeConfiguration<AuditorPerformanceMetricDefinition>
{
    public void Configure(EntityTypeBuilder<AuditorPerformanceMetricDefinition> builder)
    {
        builder.ToTable("AuditorPerformanceMetricDefinitions");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).ValueGeneratedNever();

        builder.Property(m => m.MetricCode).HasMaxLength(64).IsRequired();
        builder.HasIndex(m => m.MetricCode).IsUnique();

        builder.Property(m => m.Title).HasMaxLength(256).IsRequired();
        builder.Property(m => m.Description).HasMaxLength(1000);
        builder.Property(m => m.PrimaryField).HasMaxLength(128).IsRequired();
        builder.Property(m => m.SecondaryField).HasMaxLength(128);
        builder.Property(m => m.Unit).HasMaxLength(32);

        builder.Property(m => m.Multiplier).HasColumnType("decimal(18,4)");
        builder.Property(m => m.WeightPercentage).HasColumnType("decimal(18,2)");
        builder.Property(m => m.TargetValue).HasColumnType("decimal(18,4)");
        builder.Property(m => m.WarningThreshold).HasColumnType("decimal(18,4)");
        builder.Property(m => m.CriticalThreshold).HasColumnType("decimal(18,4)");

        builder.Property(m => m.TierThresholdsJson).HasColumnType("TEXT");

        builder.HasIndex(m => m.IsActive);
        builder.HasIndex(m => m.DisplayOrder);
    }
}
