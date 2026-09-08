using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class TaxRefundApprovalActionConfiguration : IEntityTypeConfiguration<TaxRefundApprovalAction>
{
    public void Configure(EntityTypeBuilder<TaxRefundApprovalAction> builder)
    {
        builder.ToTable("TaxRefundApprovalActions");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.FromStatus)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(a => a.ToStatus)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(a => a.ActorName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(a => a.ActorRole)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.Notes)
            .HasMaxLength(1000);

        builder.Property(a => a.ActionDate)
            .IsRequired();

        builder.HasIndex(a => new { a.TaxRefundCaseId, a.ActionDate });
    }
}
