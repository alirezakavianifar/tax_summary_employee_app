using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class TaxFinalityStageConfiguration : IEntityTypeConfiguration<TaxFinalityStage>
{
    public void Configure(EntityTypeBuilder<TaxFinalityStage> builder)
    {
        builder.ToTable("TaxFinalityStages");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .ValueGeneratedNever();

        builder.Property(t => t.Code)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(t => t.Code)
            .IsUnique();

        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Description)
            .HasMaxLength(500);

        builder.Property(t => t.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(t => t.DisplayOrder)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(t => t.IsSystem)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(t => t.CreatedAt)
            .IsRequired();

        builder.Property(t => t.UpdatedAt)
            .IsRequired();
    }
}
