namespace TaxSummary.Application.DTOs.TaxRefund;

public class JustificationReportDto
{
    public string ReportNumber { get; set; } = string.Empty;
    public string ReportDateJalali { get; set; } = string.Empty;
    public string AuditExaminationFindings { get; set; } = string.Empty;
    public string LegalGroundsAndReasoning { get; set; } = string.Empty;
    public string InquiriesAndDebtClearanceSummary { get; set; } = string.Empty;
    public string ReceiptsVerificationNotes { get; set; } = string.Empty;
    public string AuditorConclusion { get; set; } = string.Empty;
    public decimal RecommendedRefundAmount { get; set; }
    public string? AuditorSignatureDate { get; set; }
    public Guid? AuditorUserId { get; set; }
    public string? AuditorUserName { get; set; }
    public bool IsFinalized { get; set; }
    public DateTime? FinalizedAt { get; set; }
    public string? GroupHeadOpinionText { get; set; }
    public string? AdministrationHeadApprovalText { get; set; }
}
