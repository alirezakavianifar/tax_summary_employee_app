using TaxSummary.Domain.Enums;

namespace TaxSummary.Application.DTOs.Reporting;

public class AuditorPerformanceMetricDto
{
    public Guid Id { get; set; }
    public string MetricCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AuditorMetricCategory Category { get; set; }
    public string CategoryTitle { get; set; } = string.Empty;
    public AuditorMetricFormulaType FormulaType { get; set; }
    public string PrimaryField { get; set; } = string.Empty;
    public string? SecondaryField { get; set; }
    public decimal Multiplier { get; set; }
    public decimal WeightPercentage { get; set; }
    public bool HigherIsBetter { get; set; }
    public decimal TargetValue { get; set; }
    public decimal WarningThreshold { get; set; }
    public decimal CriticalThreshold { get; set; }
    public string Unit { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public string TierThresholdsJson { get; set; } = string.Empty;
}

public class SaveAuditorMetricRequestDto
{
    public Guid? Id { get; set; }
    public string MetricCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AuditorMetricCategory Category { get; set; }
    public AuditorMetricFormulaType FormulaType { get; set; }
    public string PrimaryField { get; set; } = string.Empty;
    public string? SecondaryField { get; set; }
    public decimal Multiplier { get; set; } = 1.0m;
    public decimal WeightPercentage { get; set; }
    public bool HigherIsBetter { get; set; } = true;
    public decimal TargetValue { get; set; }
    public decimal WarningThreshold { get; set; }
    public decimal CriticalThreshold { get; set; }
    public string Unit { get; set; } = "%";
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public string TierThresholdsJson { get; set; } = "{}";
}

public class MetricValueResultDto
{
    public string MetricCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal RawValue { get; set; }
    public string FormattedValue { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal NormalizedScore { get; set; } // 0 - 100
    public decimal WeightPercentage { get; set; }
    public decimal WeightedScore { get; set; }
    public string StatusBand { get; set; } = "Target"; // Target (Green), Warning (Amber), Critical (Red)
}

public class AuditorScorecardDto
{
    public string AuditorName { get; set; } = string.Empty;
    public string? AuditorNationalId { get; set; }
    public string? PhotoUrl { get; set; }
    public string OfficeName { get; set; } = string.Empty;
    public int TotalAssignedCases { get; set; }
    public int CompletedCases { get; set; }
    public int FinalizedCasesCount { get; set; }
    public decimal FinalityRate => TotalAssignedCases > 0 ? Math.Round(((decimal)FinalizedCasesCount / TotalAssignedCases) * 100m, 1) : 0m;
    public decimal TotalDeclaredAmount { get; set; }
    public decimal TotalAssessedAmount { get; set; }
    public decimal TotalFinalAmount { get; set; }
    public decimal CompositeScore { get; set; } // 0 - 100
    public string PerformanceTier { get; set; } = "B"; // A, B, C, D
    public string TierTitleFa { get; set; } = string.Empty;
    public int ProvincialRank { get; set; }
    public List<MetricValueResultDto> MetricValues { get; set; } = new();
}

public class Auditor360ProfileDto
{
    public AuditorScorecardDto Scorecard { get; set; } = new();
    public int HighRiskCasesCount { get; set; }
    public int MediumRiskCasesCount { get; set; }
    public int LowRiskCasesCount { get; set; }
    public double AverageDaysAssignmentToNotice { get; set; }
    public double AverageDaysNoticeToFinal { get; set; }
    public decimal NetTaxGapAddition { get; set; }
    public decimal DefensibilityRate { get; set; }
    public decimal CaseFinalityRate { get; set; }
    public List<AuditorOfficeBreakdownDto> OfficeBreakdowns { get; set; } = new();
}

public class AuditorOfficeBreakdownDto
{
    public string OfficeName { get; set; } = string.Empty;
    public int CaseCount { get; set; }
    public decimal TotalAssessed { get; set; }
    public decimal TotalFinal { get; set; }
}

public class AuditorMetricsSimulationResultDto
{
    public string MetricCode { get; set; } = string.Empty;
    public decimal ProvincialAverage { get; set; }
    public decimal MinValue { get; set; }
    public decimal MaxValue { get; set; }
    public int TotalAuditorsEvaluated { get; set; }
    public List<AuditorScorecardDto> TopPerformers { get; set; } = new();
    public List<AuditorScorecardDto> BottomPerformers { get; set; } = new();
}

public class AuditDataSourceDto
{
    public string SourceId { get; set; } = string.Empty;
    public string Code { get => SourceId; set => SourceId = value; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int TotalRecords { get; set; }
    public int TotalCases { get => TotalRecords; set => TotalRecords = value; }
    public int DistinctAuditorsCount { get; set; }
    public bool IsSystemDefault { get; set; }
    public bool IsDefault { get => IsSystemDefault; set => IsSystemDefault = value; }
    public bool HasAuditorData { get; set; }
    public string DetectedAuditorColumn { get; set; } = string.Empty;
    public int ColumnsCount { get; set; }
    public string? LastUpdatedDate { get; set; }
}

