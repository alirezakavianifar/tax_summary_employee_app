using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class SavedReportPresetConfiguration : IEntityTypeConfiguration<SavedReportPreset>
{
    public void Configure(EntityTypeBuilder<SavedReportPreset> builder)
    {
        builder.ToTable("SavedReportPresets");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.PresetName)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(p => p.FilterCriteriaJson)
            .IsRequired()
            .HasColumnType("TEXT");

        builder.Property(p => p.VisibleColumnsJson)
            .HasColumnType("TEXT");

        builder.Property(p => p.IsSharedWithOffice)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(p => p.CreatedAt)
            .IsRequired();

        builder.HasOne(p => p.ReportDefinition)
            .WithMany()
            .HasForeignKey(p => p.ReportDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => new { p.UserId, p.ReportDefinitionId })
            .HasDatabaseName("IX_SavedReportPresets_User_Report");

        builder.HasIndex(p => p.OfficeId)
            .HasDatabaseName("IX_SavedReportPresets_OfficeId");
    }
}
