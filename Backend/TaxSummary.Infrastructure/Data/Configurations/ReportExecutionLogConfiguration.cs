using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class ReportExecutionLogConfiguration : IEntityTypeConfiguration<ReportExecutionLog>
{
    public void Configure(EntityTypeBuilder<ReportExecutionLog> builder)
    {
        builder.ToTable("ReportExecutionLogs");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.ReportCode)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(l => l.Username)
            .IsRequired()
            .HasMaxLength(128);

        builder.Property(l => l.ExecutionDurationMs)
            .IsRequired();

        builder.Property(l => l.ResultRowCount)
            .IsRequired();

        builder.Property(l => l.AppliedFiltersSummary)
            .HasMaxLength(1000);

        builder.Property(l => l.ExportFormat)
            .HasMaxLength(32);

        builder.Property(l => l.ClientIpAddress)
            .HasMaxLength(64);

        builder.Property(l => l.ExecutedAt)
            .IsRequired();

        builder.HasIndex(l => l.ExecutedAt).HasDatabaseName("IX_ReportExecutionLogs_ExecutedAt");
        builder.HasIndex(l => l.UserId).HasDatabaseName("IX_ReportExecutionLogs_UserId");
        builder.HasIndex(l => l.ReportCode).HasDatabaseName("IX_ReportExecutionLogs_ReportCode");
    }
}
