using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class TaxRefundLetterConfiguration : IEntityTypeConfiguration<TaxRefundLetter>
{
    public void Configure(EntityTypeBuilder<TaxRefundLetter> builder)
    {
        builder.ToTable("TaxRefundLetters");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.LetterType)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(l => l.LetterNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(l => l.LetterDateJalali)
            .IsRequired()
            .HasMaxLength(15);

        builder.Property(l => l.Description)
            .HasMaxLength(500);

        builder.Property(l => l.DebtAmount)
            .HasPrecision(18, 0);

        builder.Property(l => l.DebtYear)
            .HasMaxLength(10);

        builder.HasIndex(l => new { l.TaxRefundCaseId, l.LetterType });
    }
}
