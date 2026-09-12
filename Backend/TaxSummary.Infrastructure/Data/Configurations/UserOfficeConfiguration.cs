using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class UserOfficeConfiguration : IEntityTypeConfiguration<UserOffice>
{
    public void Configure(EntityTypeBuilder<UserOffice> builder)
    {
        builder.ToTable("UserOffices");

        builder.HasKey(uo => new { uo.UserId, uo.OfficeId });

        builder.Property(uo => uo.AssignedAt)
            .IsRequired();

        builder.HasOne(uo => uo.User)
            .WithMany(u => u.UserOffices)
            .HasForeignKey(uo => uo.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(uo => uo.Office)
            .WithMany(o => o.UserOffices)
            .HasForeignKey(uo => uo.OfficeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(uo => uo.UserId)
            .HasDatabaseName("IX_UserOffices_UserId");

        builder.HasIndex(uo => uo.OfficeId)
            .HasDatabaseName("IX_UserOffices_OfficeId");
    }
}
