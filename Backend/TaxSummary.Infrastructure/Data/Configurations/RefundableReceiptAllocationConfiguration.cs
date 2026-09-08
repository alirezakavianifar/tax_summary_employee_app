using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class RefundableReceiptAllocationConfiguration : IEntityTypeConfiguration<RefundableReceiptAllocation>
{
    public void Configure(EntityTypeBuilder<RefundableReceiptAllocation> builder)
    {
        builder.ToTable("RefundableReceiptAllocations");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.ReceiptNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.TotalReceiptAmount)
            .HasPrecision(18, 0)
            .IsRequired();

        builder.Property(a => a.RefundableAmount)
            .HasPrecision(18, 0)
            .IsRequired();

        builder.Property(a => a.BankBranch)
            .HasMaxLength(100);

        builder.Property(a => a.City)
            .HasMaxLength(100);

        builder.Property(a => a.RevenueLedgerRow)
            .HasMaxLength(50);

        builder.HasOne(a => a.TaxRefundReceipt)
            .WithMany()
            .HasForeignKey(a => a.TaxRefundReceiptId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => new { a.TaxRefundCaseId, a.TaxRefundReceiptId });
    }
}
