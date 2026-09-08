using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class TaxRefundDocumentConfiguration : IEntityTypeConfiguration<TaxRefundDocument>
{
    public void Configure(EntityTypeBuilder<TaxRefundDocument> builder)
    {
        builder.ToTable("TaxRefundDocuments");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.DocumentType)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(d => d.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(d => d.OriginalFileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(d => d.StoredFileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(d => d.FilePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(d => d.FileSize)
            .IsRequired();

        builder.Property(d => d.ContentType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(d => d.UploadDateJalali)
            .IsRequired()
            .HasMaxLength(15);

        builder.Property(d => d.UploadedByUserName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(d => d.Description)
            .HasMaxLength(1000);

        builder.HasIndex(d => d.TaxRefundCaseId);
        builder.HasIndex(d => new { d.TaxRefundCaseId, d.DocumentType });
        builder.HasIndex(d => d.RelatedReceiptId);
        builder.HasIndex(d => d.RelatedLetterId);

        builder.HasOne(d => d.TaxRefundCase)
            .WithMany(c => c.Documents)
            .HasForeignKey(d => d.TaxRefundCaseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
