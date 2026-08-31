using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class PayrollCycleConfiguration : IEntityTypeConfiguration<PayrollCycle>
{
    public void Configure(EntityTypeBuilder<PayrollCycle> builder)
    {
        builder.ToTable("PayrollCycles");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.ProcessType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Status)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Notes)
            .HasMaxLength(1000);

        builder.HasOne(c => c.CreatedBy)
            .WithMany()
            .HasForeignKey(c => c.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.FinalizedBy)
            .WithMany()
            .HasForeignKey(c => c.FinalizedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.DepartmentEntries)
            .WithOne(d => d.PayrollCycle)
            .HasForeignKey(d => d.PayrollCycleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => new { c.FiscalYear, c.FiscalMonth });
        builder.HasIndex(c => c.Status);
    }
}
