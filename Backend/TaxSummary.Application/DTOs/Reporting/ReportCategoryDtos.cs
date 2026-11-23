using System;

namespace TaxSummary.Application.DTOs.Reporting;

public class ReportCategoryDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsSystem { get; set; }
    public int ReportCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateReportCategoryDto
{
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpdateReportCategoryDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
