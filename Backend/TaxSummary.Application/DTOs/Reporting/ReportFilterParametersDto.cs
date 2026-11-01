namespace TaxSummary.Application.DTOs.Reporting;

public class ReportFilterParametersDto
{
    public string? ShamsiDateFrom { get; set; }
    public string? ShamsiDateTo { get; set; }
    public Guid? OfficeId { get; set; }
    public string? Department { get; set; }
    public Guid? PayrollCycleId { get; set; }
    public string? CaseStatus { get; set; }
    public string? TaxSourceCode { get; set; }
    public int? FiscalYear { get; set; }
    public string? SearchTerm { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; }
}
