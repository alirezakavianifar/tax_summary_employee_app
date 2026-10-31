namespace TaxSummary.Application.DTOs.Reporting;

public class ExecutiveDashboardDto
{
    public ExecutiveKpiMetricsDto KpiMetrics { get; set; } = new();
    public List<MonthlyTrendPointDto> MonthlyTrends { get; set; } = new();
    public List<TopDepartmentBudgetDto> TopDepartmentBudgets { get; set; } = new();
    public List<TaxSourceDistributionDto> TaxSourceRefundDistribution { get; set; } = new();
    public List<RecentAuditActivityDto> RecentAuditActivities { get; set; } = new();
}
