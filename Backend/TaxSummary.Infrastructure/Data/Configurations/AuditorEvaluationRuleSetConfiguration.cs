using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities.Reporting;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class AuditorEvaluationRuleSetConfiguration : IEntityTypeConfiguration<AuditorEvaluationRuleSet>
{
    public void Configure(EntityTypeBuilder<AuditorEvaluationRuleSet> builder)
    {
        builder.ToTable("AuditorEvaluationRuleSets");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();

        builder.Property(r => r.Code).HasMaxLength(64).IsRequired();
        builder.HasIndex(r => r.Code).IsUnique();

        builder.Property(r => r.Title).HasMaxLength(256).IsRequired();
        builder.Property(r => r.Description).HasMaxLength(1000);

        builder.Property(r => r.WeightsMatrixJson).HasColumnType("TEXT").IsRequired();
        builder.Property(r => r.AllowedDaysJson).HasColumnType("TEXT").IsRequired();

        builder.Property(r => r.GrowthThresholdLegalEntity).HasColumnType("decimal(18,2)");
        builder.Property(r => r.GrowthThresholdIndividual).HasColumnType("decimal(18,2)");
        builder.Property(r => r.AdjustmentThreshold).HasColumnType("decimal(18,2)");
        builder.Property(r => r.DailyDelayPenalty).HasColumnType("decimal(18,4)");

        builder.Property(r => r.IsActive).IsRequired();
    }
}

