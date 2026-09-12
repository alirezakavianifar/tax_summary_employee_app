using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class OfficeConfiguration : IEntityTypeConfiguration<Office>
{
    public void Configure(EntityTypeBuilder<Office> builder)
    {
        builder.ToTable("Offices");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(o => o.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(o => o.Description)
            .HasMaxLength(500);

        builder.Property(o => o.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(o => o.CreatedAt)
            .IsRequired();

        builder.HasIndex(o => o.Code)
            .IsUnique()
            .HasDatabaseName("IX_Offices_Code");

        builder.HasMany(o => o.Employees)
            .WithOne(e => e.Office)
            .HasForeignKey(e => e.OfficeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(o => o.UserOffices)
            .WithOne(uo => uo.Office)
            .HasForeignKey(uo => uo.OfficeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
