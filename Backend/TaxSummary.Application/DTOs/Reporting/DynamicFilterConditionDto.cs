namespace TaxSummary.Application.DTOs.Reporting;

public class DynamicFilterConditionDto
{
    public string FieldName { get; set; } = string.Empty;
    public string Operator { get; set; } = "equals";
    public string Value { get; set; } = string.Empty;
    public string? SecondValue { get; set; }
}
