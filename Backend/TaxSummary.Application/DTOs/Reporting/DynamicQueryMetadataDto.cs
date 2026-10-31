using TaxSummary.Domain.Enums;

namespace TaxSummary.Application.DTOs.Reporting;

public class DynamicQueryMetadataDto
{
    public ReportDomainSource DomainSource { get; set; }
    public string DomainSourceTitle { get; set; } = string.Empty;
    public List<ReportColumnMetadataDto> AvailableFields { get; set; } = new();
    public List<string> SupportedOperators { get; set; } = new();
    public List<string> SupportedAggregations { get; set; } = new();
}
