using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class ReportDefinitionConfiguration : IEntityTypeConfiguration<ReportDefinition>
{
    public void Configure(EntityTypeBuilder<ReportDefinition> builder)
    {
        builder.ToTable("ReportDefinitions");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Code)
            .IsRequired()
            .HasMaxLength(64);
        builder.HasIndex(r => r.Code)
            .IsUnique()
            .HasDatabaseName("IX_ReportDefinitions_Code");

        builder.Property(r => r.Title)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(r => r.Description)
            .HasMaxLength(1000)
            .HasDefaultValue(string.Empty);

        builder.Property(r => r.DomainSource)
            .IsRequired();

        builder.Property(r => r.Category)
            .IsRequired();

        builder.Property(r => r.Type)
            .IsRequired();

        builder.Property(r => r.ConfigurationJson)
            .IsRequired()
            .HasColumnType("TEXT");

        builder.Property(r => r.IsSystemReport)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(r => r.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(r => r.RequiredRole)
            .HasMaxLength(64);

        builder.Property(r => r.CreatedAt)
            .IsRequired();

        builder.HasIndex(r => r.DomainSource).HasDatabaseName("IX_ReportDefinitions_DomainSource");
        builder.HasIndex(r => r.Category).HasDatabaseName("IX_ReportDefinitions_Category");
        builder.HasIndex(r => r.IsActive).HasDatabaseName("IX_ReportDefinitions_IsActive");

        builder.HasOne(r => r.CreatedByUser)
            .WithMany()
            .HasForeignKey(r => r.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
