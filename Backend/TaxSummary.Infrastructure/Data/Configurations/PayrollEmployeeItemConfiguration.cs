using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class PayrollEmployeeItemConfiguration : IEntityTypeConfiguration<PayrollEmployeeItem>
{
    public void Configure(EntityTypeBuilder<PayrollEmployeeItem> builder)
    {
        builder.ToTable("PayrollEmployeeItems");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.PersonnelNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(i => i.EmployeeName)
            .HasMaxLength(200);

        builder.Property(i => i.OfficerNotes)
            .HasMaxLength(500);

        builder.HasIndex(i => new { i.DepartmentEntryId, i.PersonnelNumber });
    }
}
