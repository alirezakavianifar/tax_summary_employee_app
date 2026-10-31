using TaxSummary.Domain.Enums;

namespace TaxSummary.Application.DTOs.Reporting;

public class DynamicReportQueryRequestDto
{
    public ReportDomainSource DomainSource { get; set; }
    public List<string> SelectedFields { get; set; } = new();
    public List<DynamicFilterConditionDto> Filters { get; set; } = new();
    public string? GroupByField { get; set; }
    public List<DynamicAggregateSpecDto> Aggregates { get; set; } = new();
    public string? SortField { get; set; }
    public bool SortDescending { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}
