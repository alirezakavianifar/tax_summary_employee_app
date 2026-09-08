namespace TaxSummary.Application.DTOs.TaxRefund;

public class UpdateJustificationReportDto
{
    public string ReportNumber { get; set; } = string.Empty;
    public string ReportDateJalali { get; set; } = string.Empty;
    public string AuditExaminationFindings { get; set; } = string.Empty;
    public string LegalGroundsAndReasoning { get; set; } = string.Empty;
    public string InquiriesAndDebtClearanceSummary { get; set; } = string.Empty;
    public string ReceiptsVerificationNotes { get; set; } = string.Empty;
    public string AuditorConclusion { get; set; } = string.Empty;
    public decimal RecommendedRefundAmount { get; set; }
    public string? GroupHeadOpinionText { get; set; }
    public string? AdministrationHeadApprovalText { get; set; }
}
