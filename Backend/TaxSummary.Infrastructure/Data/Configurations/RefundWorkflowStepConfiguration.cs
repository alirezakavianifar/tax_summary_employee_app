using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class RefundWorkflowStepConfiguration : IEntityTypeConfiguration<RefundWorkflowStep>
{
    public void Configure(EntityTypeBuilder<RefundWorkflowStep> builder)
    {
        builder.ToTable("RefundWorkflowSteps");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Stage)
            .IsRequired();

        builder.HasIndex(s => s.Stage)
            .IsUnique();

        builder.Property(s => s.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Description)
            .HasMaxLength(500);

        builder.Property(s => s.StepOrder)
            .IsRequired();

        builder.Property(s => s.IsEnabled)
            .IsRequired();

        builder.Property(s => s.IsMandatory)
            .IsRequired();

        builder.Property(s => s.AllowedRoles)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        builder.Property(s => s.UpdatedAt)
            .IsRequired();

        builder.Property(s => s.UpdatedByUserId)
            .IsRequired(false);

        builder.HasIndex(s => s.StepOrder);
    }
}
