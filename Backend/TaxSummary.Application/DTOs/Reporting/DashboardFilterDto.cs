namespace TaxSummary.Application.DTOs.Reporting;

public class DashboardFilterDto
{
    public int? FiscalYear { get; set; }
    public Guid? PayrollCycleId { get; set; }
    public Guid? OfficeId { get; set; }
}
