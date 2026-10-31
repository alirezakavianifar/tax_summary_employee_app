using TaxSummary.Domain.Enums;

namespace TaxSummary.Application.DTOs.Reporting;

public class DynamicAggregateSpecDto
{
    public string FieldName { get; set; } = string.Empty;
    public AggregationType Function { get; set; }
    public string Alias { get; set; } = string.Empty;
}
