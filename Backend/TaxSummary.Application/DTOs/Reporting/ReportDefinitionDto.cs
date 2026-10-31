using TaxSummary.Domain.Enums;

namespace TaxSummary.Application.DTOs.Reporting;

public class ReportDefinitionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ReportDomainSource DomainSource { get; set; }
    public ReportCategory Category { get; set; }
    public ReportType Type { get; set; }
    public bool IsSystemReport { get; set; }
    public bool IsActive { get; set; }
    public string? RequiredRole { get; set; }
    public List<ReportColumnMetadataDto> Columns { get; set; } = new();
}
