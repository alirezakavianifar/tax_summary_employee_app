namespace TaxSummary.Domain.Entities.Reporting;

/// <summary>
/// اطلاعات رسیدگی و تشخیص پرونده‌های مالیاتی سنیم (مبتنی بر داده‌های پرونده‌های مالیاتی خوزستان)
/// </summary>
public class SanimAuditAssessment
{
    public long Id { get; private set; }
    public string UpdateDateJalali { get; private set; } = string.Empty;
    public string AuditStatus { get; private set; } = string.Empty;
    public string FinalOfficeName { get; private set; } = string.Empty;
    public string InitialOfficeName { get; private set; } = string.Empty;
    public string? DeclarationId { get; private set; }
    public string? TaxpayerTrackingCode { get; private set; }
    public string TaxpayerName { get; private set; } = string.Empty;
    public string TaxpayerTin { get; private set; } = string.Empty;
    public int FiscalYear { get; private set; }
    public string TaxSource { get; private set; } = string.Empty;
    public int? TaxPeriod { get; private set; }
    public string? RiskLevel { get; private set; }
    public string? AuditTrackingId { get; private set; }
    public string AuditorName { get; private set; } = string.Empty;
    public string? AuditorNationalId { get; private set; }
    public string? AssessmentNoticeDateJalali { get; private set; }
    public string? FinalNoticeDateJalali { get; private set; }
    public decimal AssessedTaxAmount { get; private set; }
    public decimal DeclaredTaxAmount { get; private set; }
    public decimal FinalTaxAmount { get; private set; }
    public string? Stage { get; private set; }
    public string? YearlyType { get; private set; }
    public string? CaseType { get; private set; }
    public string? WarehouseUploadDateJalali { get; private set; }
    public string? AuditorAssignmentDateJalali { get; private set; }
    public int? DaysAssignmentToNotice { get; private set; }
    public int? DaysAssignmentToFinal { get; private set; }
    public int? DaysNoticeToFinal { get; private set; }
    public string? CurrentStatus { get; private set; }
    public string? NextStatus { get; private set; }
    public string? FinalizationSource { get; private set; }
    public Guid? OfficeId { get; private set; }

    // Parameterless constructor for EF Core
    protected SanimAuditAssessment() { }

    public static SanimAuditAssessment Create(
        long id,
        string updateDateJalali,
        string auditStatus,
        string finalOfficeName,
        string initialOfficeName,
        string? declarationId,
        string? taxpayerTrackingCode,
        string taxpayerName,
        string taxpayerTin,
        int fiscalYear,
        string taxSource,
        int? taxPeriod,
        string? riskLevel,
        string? auditTrackingId,
        string auditorName,
        string? auditorNationalId,
        string? assessmentNoticeDateJalali,
        string? finalNoticeDateJalali,
        decimal assessedTaxAmount,
        decimal declaredTaxAmount,
        decimal finalTaxAmount,
        string? stage,
        string? yearlyType,
        string? caseType,
        string? warehouseUploadDateJalali,
        string? auditorAssignmentDateJalali,
        int? daysAssignmentToNotice,
        int? daysAssignmentToFinal,
        int? daysNoticeToFinal,
        string? currentStatus,
        string? nextStatus,
        string? finalizationSource,
        Guid? officeId = null)
    {
        return new SanimAuditAssessment
        {
            Id = id,
            UpdateDateJalali = updateDateJalali ?? string.Empty,
            AuditStatus = auditStatus ?? string.Empty,
            FinalOfficeName = finalOfficeName ?? string.Empty,
            InitialOfficeName = initialOfficeName ?? string.Empty,
            DeclarationId = declarationId,
            TaxpayerTrackingCode = taxpayerTrackingCode,
            TaxpayerName = taxpayerName ?? string.Empty,
            TaxpayerTin = taxpayerTin ?? string.Empty,
            FiscalYear = fiscalYear,
            TaxSource = taxSource ?? string.Empty,
            TaxPeriod = taxPeriod,
            RiskLevel = riskLevel,
            AuditTrackingId = auditTrackingId,
            AuditorName = auditorName ?? string.Empty,
            AuditorNationalId = auditorNationalId,
            AssessmentNoticeDateJalali = assessmentNoticeDateJalali,
            FinalNoticeDateJalali = finalNoticeDateJalali,
            AssessedTaxAmount = assessedTaxAmount,
            DeclaredTaxAmount = declaredTaxAmount,
            FinalTaxAmount = finalTaxAmount,
            Stage = stage,
            YearlyType = yearlyType,
            CaseType = caseType,
            WarehouseUploadDateJalali = warehouseUploadDateJalali,
            AuditorAssignmentDateJalali = auditorAssignmentDateJalali,
            DaysAssignmentToNotice = daysAssignmentToNotice,
            DaysAssignmentToFinal = daysAssignmentToFinal,
            DaysNoticeToFinal = daysNoticeToFinal,
            CurrentStatus = currentStatus,
            NextStatus = nextStatus,
            FinalizationSource = finalizationSource,
            OfficeId = officeId
        };
    }
}
