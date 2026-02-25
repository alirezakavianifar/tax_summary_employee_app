using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

/// <summary>
/// Entity configuration for PayrollRun entity
/// </summary>
public class PayrollRunConfiguration : IEntityTypeConfiguration<PayrollRun>
{
    public void Configure(EntityTypeBuilder<PayrollRun> builder)
    {
        builder.ToTable("PayrollRuns");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .ValueGeneratedNever();

        builder.Property(r => r.ProcessType)
            .IsRequired()
            .HasMaxLength(50)
            .HasColumnType("NVARCHAR(50)");

        builder.Property(r => r.RunLabel)
            .IsRequired()
            .HasMaxLength(200)
            .HasColumnType("NVARCHAR(200)");

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        builder.Property(r => r.CreatedByUserId)
            .IsRequired();

        builder.Property(r => r.ResultJson)
            .IsRequired()
            .HasColumnType("TEXT");

        builder.Property(r => r.RowCount)
            .IsRequired();

        // Index for listing runs by user/date
        builder.HasIndex(r => r.CreatedAt);
        builder.HasIndex(r => r.CreatedByUserId);
    }
}
