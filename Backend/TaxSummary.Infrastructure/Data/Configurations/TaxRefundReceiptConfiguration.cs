using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class TaxRefundReceiptConfiguration : IEntityTypeConfiguration<TaxRefundReceipt>
{
    public void Configure(EntityTypeBuilder<TaxRefundReceipt> builder)
    {
        builder.ToTable("TaxRefundReceipts");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.ReceiptNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(r => r.IssueDateJalali)
            .IsRequired()
            .HasMaxLength(15);

        builder.Property(r => r.PaymentDateJalali)
            .IsRequired()
            .HasMaxLength(15);

        builder.Property(r => r.AmountRials)
            .HasPrecision(18, 0)
            .IsRequired();

        builder.Property(r => r.BankBranch)
            .HasMaxLength(100);

        builder.Property(r => r.City)
            .HasMaxLength(100);

        builder.Property(r => r.RevenueLedgerRow)
            .HasMaxLength(50);

        builder.HasIndex(r => new { r.TaxRefundCaseId, r.RowIndex });
        builder.HasIndex(r => r.ReceiptNumber);
    }
}
