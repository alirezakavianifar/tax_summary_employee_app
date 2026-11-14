using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> builder)
    {
        builder.ToTable("SystemSettings");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SettingKey)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(x => x.SettingKey)
            .IsUnique();

        builder.Property(x => x.OrganizationName)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(x => x.SystemTitle)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(x => x.LogoPath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.ReportingModuleTitle)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(x => x.ReportingModuleSubtitle)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(x => x.FooterCopyrightText)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.FooterVersionText)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.FooterBadgeText)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.FooterLinksJson)
            .IsRequired()
            .HasMaxLength(4000);

        builder.Property(x => x.UpdatedBy)
            .HasMaxLength(150);
    }
}

