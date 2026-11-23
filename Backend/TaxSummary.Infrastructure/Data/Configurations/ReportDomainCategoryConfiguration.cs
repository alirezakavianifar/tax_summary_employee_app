using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities.Reporting;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class ReportDomainCategoryConfiguration : IEntityTypeConfiguration<ReportDomainCategory>
{
    public void Configure(EntityTypeBuilder<ReportDomainCategory> builder)
    {
        builder.ToTable("ReportCategories");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .ValueGeneratedNever();

        builder.Property(c => c.Code)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(c => c.Code)
            .IsUnique();

        builder.Property(c => c.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Description)
            .HasMaxLength(500);

        builder.Property(c => c.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(c => c.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        builder.HasIndex(c => c.DisplayOrder);
        builder.HasIndex(c => c.IsActive);
    }
}
