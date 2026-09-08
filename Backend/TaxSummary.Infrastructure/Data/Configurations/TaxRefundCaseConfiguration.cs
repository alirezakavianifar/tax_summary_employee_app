using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Data.Configurations;

public class TaxRefundCaseConfiguration : IEntityTypeConfiguration<TaxRefundCase>
{
    public void Configure(EntityTypeBuilder<TaxRefundCase> builder)
    {
        builder.ToTable("TaxRefundCases");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.CaseTrackingNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.DocketNumber)
            .HasMaxLength(50);

        builder.Property(c => c.TaxpayerName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.EconomicCode)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.NationalId)
            .HasMaxLength(20);

        builder.Property(c => c.TaxUnitCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Province)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.Address)
            .HasMaxLength(500);

        builder.Property(c => c.BankName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.ShebaNumber)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(c => c.RefundReason)
            .HasMaxLength(500);

        builder.Property(c => c.AdministrationHeadName)
            .HasMaxLength(150);

        builder.Property(c => c.GroupHeadName)
            .HasMaxLength(150);

        builder.Property(c => c.SeniorAuditorName)
            .HasMaxLength(150);

        builder.Property(c => c.TaxSource)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(c => c.Status)
            .HasConversion<int>()
            .IsRequired();

        // Owned AssessmentInfo
        builder.OwnsOne(c => c.AssessmentInfo, a =>
        {
            a.Property(p => p.HasReturnFiled).HasColumnName("Assessment_HasReturnFiled");
            a.Property(p => p.ReturnNumber).HasColumnName("Assessment_ReturnNumber").HasMaxLength(50);
            a.Property(p => p.ReturnDateJalali).HasColumnName("Assessment_ReturnDateJalali").HasMaxLength(15);
            a.Property(p => p.FinalizationMethod).HasColumnName("Assessment_FinalizationMethod").HasConversion<int>();
            a.Property(p => p.FinalityStage).HasColumnName("Assessment_FinalityStage").HasConversion<int>().HasDefaultValue(FinalityStage.Tamkin);
            a.Property(p => p.FinalNoticeNumber).HasColumnName("Assessment_FinalNoticeNumber").HasMaxLength(50);
            a.Property(p => p.FinalNoticeDateJalali).HasColumnName("Assessment_FinalNoticeDateJalali").HasMaxLength(15);
            a.Property(p => p.AssessedIncome).HasColumnName("Assessment_AssessedIncome").HasPrecision(18, 0);
            a.Property(p => p.Exemptions).HasColumnName("Assessment_Exemptions").HasPrecision(18, 0);
            a.Property(p => p.AssessedTax).HasColumnName("Assessment_AssessedTax").HasPrecision(18, 0);
            a.Property(p => p.NonWaivablePenalties).HasColumnName("Assessment_NonWaivablePenalties").HasPrecision(18, 0);
            a.Property(p => p.TimelyPaymentBonus).HasColumnName("Assessment_TimelyPaymentBonus").HasPrecision(18, 0);
        });

        // Owned RefundBreakdown
        builder.OwnsOne(c => c.Breakdown, b =>
        {
            b.Property(p => p.PrincipalTaxRefund).HasColumnName("Breakdown_PrincipalTaxRefund").HasPrecision(18, 0);
            b.Property(p => p.StampDutyRefund).HasColumnName("Breakdown_StampDutyRefund").HasPrecision(18, 0);
            b.Property(p => p.OtherRefund).HasColumnName("Breakdown_OtherRefund").HasPrecision(18, 0);
            b.Property(p => p.PenaltiesRefund).HasColumnName("Breakdown_PenaltiesRefund").HasPrecision(18, 0);
            b.Property(p => p.DelayDamages).HasColumnName("Breakdown_DelayDamages").HasPrecision(18, 0);
        });

        // Owned JustificationReport
        builder.OwnsOne(c => c.JustificationReport, j =>
        {
            j.Property(p => p.ReportNumber).HasColumnName("JustificationReport_ReportNumber").HasMaxLength(50);
            j.Property(p => p.ReportDateJalali).HasColumnName("JustificationReport_ReportDateJalali").HasMaxLength(15);
            j.Property(p => p.AuditExaminationFindings).HasColumnName("JustificationReport_AuditExaminationFindings").HasMaxLength(4000);
            j.Property(p => p.LegalGroundsAndReasoning).HasColumnName("JustificationReport_LegalGroundsAndReasoning").HasMaxLength(4000);
            j.Property(p => p.InquiriesAndDebtClearanceSummary).HasColumnName("JustificationReport_InquiriesAndDebtClearanceSummary").HasMaxLength(4000);
            j.Property(p => p.ReceiptsVerificationNotes).HasColumnName("JustificationReport_ReceiptsVerificationNotes").HasMaxLength(4000);
            j.Property(p => p.AuditorConclusion).HasColumnName("JustificationReport_AuditorConclusion").HasMaxLength(4000);
            j.Property(p => p.RecommendedRefundAmount).HasColumnName("JustificationReport_RecommendedRefundAmount").HasPrecision(18, 0);
            j.Property(p => p.AuditorSignatureDate).HasColumnName("JustificationReport_AuditorSignatureDate").HasMaxLength(15);
            j.Property(p => p.AuditorUserId).HasColumnName("JustificationReport_AuditorUserId");
            j.Property(p => p.AuditorUserName).HasColumnName("JustificationReport_AuditorUserName").HasMaxLength(150);
            j.Property(p => p.IsFinalized).HasColumnName("JustificationReport_IsFinalized");
            j.Property(p => p.FinalizedAt).HasColumnName("JustificationReport_FinalizedAt");
            j.Property(p => p.GroupHeadOpinionText).HasColumnName("JustificationReport_GroupHeadOpinionText").HasMaxLength(2000);
            j.Property(p => p.AdministrationHeadApprovalText).HasColumnName("JustificationReport_AdministrationHeadApprovalText").HasMaxLength(2000);
        });

        // Indexes
        builder.HasIndex(c => c.CaseTrackingNumber).IsUnique();
        builder.HasIndex(c => new { c.TaxpayerName, c.TaxYear });
        builder.HasIndex(c => c.EconomicCode);
        builder.HasIndex(c => c.Status);
        builder.HasIndex(c => c.TaxYear);

        // One-to-Many Relationships
        builder.HasMany(c => c.Receipts)
            .WithOne(r => r.TaxRefundCase)
            .HasForeignKey(r => r.TaxRefundCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Allocations)
            .WithOne(a => a.TaxRefundCase)
            .HasForeignKey(a => a.TaxRefundCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Letters)
            .WithOne(l => l.TaxRefundCase)
            .HasForeignKey(l => l.TaxRefundCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Approvals)
            .WithOne(a => a.TaxRefundCase)
            .HasForeignKey(a => a.TaxRefundCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Documents)
            .WithOne(d => d.TaxRefundCase)
            .HasForeignKey(d => d.TaxRefundCaseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
