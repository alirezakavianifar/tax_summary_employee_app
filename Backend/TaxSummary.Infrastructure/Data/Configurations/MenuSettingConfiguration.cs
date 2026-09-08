using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class MenuSettingConfiguration : IEntityTypeConfiguration<MenuSetting>
{
    public void Configure(EntityTypeBuilder<MenuSetting> builder)
    {
        builder.ToTable("MenuSettings");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.MenuKey)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(m => m.MenuKey)
            .IsUnique();

        builder.Property(m => m.ParentKey)
            .HasMaxLength(100);

        builder.Property(m => m.Title)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(m => m.Route)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(m => m.IconName)
            .HasMaxLength(100);

        builder.Property(m => m.Description)
            .HasMaxLength(500);

        builder.Property(m => m.IsVisible)
            .IsRequired();

        builder.Property(m => m.AdminOnly)
            .IsRequired();

        builder.Property(m => m.AllowedRoles)
            .IsRequired()
            .HasMaxLength(200)
            .HasDefaultValue("Admin,Manager,Employee");

        builder.Property(m => m.DisplayOrder)
            .IsRequired();

        builder.HasIndex(m => m.ParentKey);
        builder.HasIndex(m => m.DisplayOrder);
    }
}
