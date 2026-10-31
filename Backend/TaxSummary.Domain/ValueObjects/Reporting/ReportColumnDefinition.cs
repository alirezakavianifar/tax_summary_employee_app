namespace TaxSummary.Domain.ValueObjects.Reporting;

public record ReportColumnDefinition(
    string FieldName,
    string PersianLabel,
    string DataType, // "string", "number", "currency", "date", "badge"
    bool IsVisible = true,
    bool IsSortable = true,
    bool HasAggregateSum = false,
    string Alignment = "right"
);
