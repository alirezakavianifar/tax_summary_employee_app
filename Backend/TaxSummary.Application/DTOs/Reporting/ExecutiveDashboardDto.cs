namespace TaxSummary.Application.DTOs.Reporting;

public class ExecutiveDashboardDto
{
    public ExecutiveKpiMetricsDto KpiMetrics { get; set; } = new();
    public List<MonthlyTrendPointDto> MonthlyTrends { get; set; } = new();
    public List<TopDepartmentBudgetDto> TopDepartmentBudgets { get; set; } = new();
    public List<TaxSourceDistributionDto> TaxSourceRefundDistribution { get; set; } = new();
    public List<RecentAuditActivityDto> RecentAuditActivities { get; set; } = new();
    public ProvincialOperationsSummaryDto? ProvincialOperations { get; set; }
}

public class ProvincialOperationsSummaryDto
{
    public int TotalAuditCases { get; set; }
    public decimal TotalAssessedTaxAmount { get; set; }
    public decimal TotalTaxAssessmentGapAmount { get; set; }
    public decimal TotalFinalTaxAmount { get; set; }
    public int TotalDecrees { get; set; }
    public decimal TotalDisputedBaseAmount { get; set; }
    public decimal TotalDisputedPrincipalAmount { get; set; }
    public double DecreeCompletionRate { get; set; }
    public double DecreeApprovalRate { get; set; }
    public string AuditReportCode { get; set; } = "REP_1405";
    public string DecreeReportCode { get; set; } = "REP_2";
}
