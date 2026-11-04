namespace TaxSummary.Application.DTOs.Reporting;

public class ReportExecutiveKpiDto
{
    public string ReportCode { get; set; } = string.Empty;
    public string ReportTitle { get; set; } = string.Empty;
    public string ReportActorType { get; set; } = string.Empty; // "decree" | "auditor" | "generic"
    public int TotalRowCount { get; set; }
    public int? FiscalYear { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public List<ExecutiveKpiCardDto> KpiCards { get; set; } = new();
    public KpiFinancialSummaryDto FinancialSummary { get; set; } = new();
    public List<KpiTaxSourceBreakdownDto> TaxSourceDistribution { get; set; } = new();
    public List<KpiStageBreakdownDto> StageDistribution { get; set; } = new();
    public List<KpiMethodologyBreakdownDto> MethodologyDistribution { get; set; } = new();
    public List<KpiOfficeWorkloadDto> OfficeWorkload { get; set; } = new();
    public List<KpiTopTaxpayerDto> TopTaxpayers { get; set; } = new();
    public ReportExecutiveKpiDto? AuditKpi { get; set; }
    public ReportExecutiveKpiDto? DecreeKpi { get; set; }
}

public class ExecutiveKpiCardDto
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public double RawNumericValue { get; set; }
    public string Subtitle { get; set; } = string.Empty;
    public string IconName { get; set; } = string.Empty;
    public string IconGradient { get; set; } = string.Empty;
    public string BadgeText { get; set; } = string.Empty;
    public string BadgeColor { get; set; } = string.Empty;
    public double? TrendValue { get; set; }
    public string? TrendLabel { get; set; }
    public bool TrendInverted { get; set; }
}

public class KpiFinancialSummaryDto
{
    public decimal DeclaredTaxAmount { get; set; }
    public decimal AssessedTaxAmount { get; set; }
    public decimal TaxGapAmount { get; set; }
    public decimal FinalTaxAmount { get; set; }
    public decimal DisputedBaseAmount { get; set; }
    public decimal PrincipalTaxAmount { get; set; }
    public decimal PenaltiesAmount { get; set; }
    public double AssessmentGapPercentage { get; set; }
}

public class KpiTaxSourceBreakdownDto
{
    public string SourceTitle { get; set; } = string.Empty;
    public int CaseCount { get; set; }
    public double Percentage { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TotalBaseAmount { get; set; }
}

public class KpiStageBreakdownDto
{
    public string StageCode { get; set; } = string.Empty;
    public string StageTitle { get; set; } = string.Empty;
    public int CaseCount { get; set; }
    public double Percentage { get; set; }
    public decimal TotalAmount { get; set; }
}

public class KpiMethodologyBreakdownDto
{
    public string Title { get; set; } = string.Empty;
    public int CaseCount { get; set; }
    public double Percentage { get; set; }
    public decimal TotalAmount { get; set; }
}

public class KpiOfficeWorkloadDto
{
    public string OfficeName { get; set; } = string.Empty;
    public int CaseCount { get; set; }
    public int CompletedCases { get; set; }
    public decimal TotalAssessedAmount { get; set; }
    public decimal TotalFinalAmount { get; set; }
    public double CompletionRate { get; set; }
    public int AuditCaseCount { get; set; }
    public decimal AuditAssessedAmount { get; set; }
    public int DecreeCaseCount { get; set; }
    public decimal DecreeDisputedAmount { get; set; }
    public double AuditCompletionRate { get; set; }
    public double DecreeCompletionRate { get; set; }
}

public class KpiTopTaxpayerDto
{
    public string NationalId { get; set; } = string.Empty;
    public string TaxpayerName { get; set; } = string.Empty;
    public string TaxSource { get; set; } = string.Empty;
    public string OfficeName { get; set; } = string.Empty;
    public int CaseCount { get; set; }
    public decimal AssessedAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public string CurrentStatus { get; set; } = string.Empty;
}
