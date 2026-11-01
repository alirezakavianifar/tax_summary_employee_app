using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities.Reporting;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class SanimAuditAssessmentConfiguration : IEntityTypeConfiguration<SanimAuditAssessment>
{
    public void Configure(EntityTypeBuilder<SanimAuditAssessment> builder)
    {
        builder.ToTable("SanimAuditAssessments");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).ValueGeneratedNever();

        builder.Property(s => s.UpdateDateJalali).HasMaxLength(32);
        builder.Property(s => s.AuditStatus).HasMaxLength(64);
        builder.Property(s => s.FinalOfficeName).HasMaxLength(128);
        builder.Property(s => s.InitialOfficeName).HasMaxLength(128);
        builder.Property(s => s.DeclarationId).HasMaxLength(64);
        builder.Property(s => s.TaxpayerTrackingCode).HasMaxLength(64);
        builder.Property(s => s.TaxpayerName).HasMaxLength(256);
        builder.Property(s => s.TaxpayerTin).HasMaxLength(64);
        builder.Property(s => s.TaxSource).HasMaxLength(128);
        builder.Property(s => s.RiskLevel).HasMaxLength(64);
        builder.Property(s => s.AuditTrackingId).HasMaxLength(64);
        builder.Property(s => s.AuditorName).HasMaxLength(128);
        builder.Property(s => s.AuditorNationalId).HasMaxLength(32);
        builder.Property(s => s.AssessmentNoticeDateJalali).HasMaxLength(32);
        builder.Property(s => s.FinalNoticeDateJalali).HasMaxLength(32);
        builder.Property(s => s.Stage).HasMaxLength(64);
        builder.Property(s => s.YearlyType).HasMaxLength(64);
        builder.Property(s => s.CaseType).HasMaxLength(64);
        builder.Property(s => s.WarehouseUploadDateJalali).HasMaxLength(32);
        builder.Property(s => s.AuditorAssignmentDateJalali).HasMaxLength(32);
        builder.Property(s => s.CurrentStatus).HasMaxLength(64);
        builder.Property(s => s.NextStatus).HasMaxLength(64);
        builder.Property(s => s.FinalizationSource).HasMaxLength(128);

        builder.Property(s => s.AssessedTaxAmount).HasColumnType("decimal(18,2)");
        builder.Property(s => s.DeclaredTaxAmount).HasColumnType("decimal(18,2)");
        builder.Property(s => s.FinalTaxAmount).HasColumnType("decimal(18,2)");

        builder.HasIndex(s => s.FiscalYear);
        builder.HasIndex(s => s.TaxSource);
        builder.HasIndex(s => s.AuditStatus);
        builder.HasIndex(s => s.FinalOfficeName);
        builder.HasIndex(s => s.TaxpayerTin);
        builder.HasIndex(s => s.AuditorName);
        builder.HasIndex(s => s.OfficeId);
    }
}
