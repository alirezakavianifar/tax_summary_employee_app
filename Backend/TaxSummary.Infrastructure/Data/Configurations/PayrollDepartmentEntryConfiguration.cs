using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class PayrollDepartmentEntryConfiguration : IEntityTypeConfiguration<PayrollDepartmentEntry>
{
    public void Configure(EntityTypeBuilder<PayrollDepartmentEntry> builder)
    {
        builder.ToTable("PayrollDepartmentEntries");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.DepartmentName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(d => d.Status)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(d => d.RejectionReason)
            .HasMaxLength(1000);

        builder.Property(d => d.Notes)
            .HasMaxLength(1000);

        builder.HasOne(d => d.SubmittedBy)
            .WithMany()
            .HasForeignKey(d => d.SubmittedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.ApprovedBy)
            .WithMany()
            .HasForeignKey(d => d.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(d => d.Items)
            .WithOne(i => i.DepartmentEntry)
            .HasForeignKey(i => i.DepartmentEntryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(d => new { d.PayrollCycleId, d.DepartmentName }).IsUnique();
        builder.HasIndex(d => d.Status);
    }
}
