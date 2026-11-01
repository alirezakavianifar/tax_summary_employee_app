using System.Collections.Generic;

namespace TaxSummary.Application.DTOs.Reporting;

public class CustomDatasetColumnDto
{
    public string FieldName { get; set; } = string.Empty;
    public string OriginalHeader { get; set; } = string.Empty;
    public string PersianLabel { get; set; } = string.Empty;
    public string DataType { get; set; } = "string"; // "string", "currency", "number", "id", "year", "badge", "date"
    public bool IsVisible { get; set; } = true;
    public bool IsSortable { get; set; } = true;
    public bool HasAggregateSum { get; set; }
    public string? Aggregate { get; set; } // "Sum", "Average", "Count", null
    public string Alignment { get; set; } = "right"; // "right", "center", "left"
    public int DisplayOrder { get; set; }
    public List<string> SampleValues { get; set; } = new();
}

public class ExcelInspectionResultDto
{
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public List<string> SheetNames { get; set; } = new();
    public string SelectedSheet { get; set; } = string.Empty;
    public int TotalEstimatedRows { get; set; }
    public string SuggestedReportCode { get; set; } = string.Empty;
    public string SuggestedReportTitle { get; set; } = string.Empty;
    public List<CustomDatasetColumnDto> Columns { get; set; } = new();
    public List<Dictionary<string, object?>> SampleRows { get; set; } = new();
}

public class CreateCustomDatasetRequestDto
{
    public string ReportCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? SheetName { get; set; }
    public int HeaderRowIndex { get; set; } = 1;
    public List<CustomDatasetColumnDto> Columns { get; set; } = new();
    public List<string> QuickFilterColumns { get; set; } = new();
    public string? DefaultSortField { get; set; }
    public bool DefaultSortDescending { get; set; }
    public string? RequiredRole { get; set; }
}

public class TweakCustomReportRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? RequiredRole { get; set; }
    public string? DefaultSortField { get; set; }
    public bool DefaultSortDescending { get; set; }
    public List<string> QuickFilterColumns { get; set; } = new();
    public List<CustomDatasetColumnDto> Columns { get; set; } = new();
}

public class CustomDatasetConfigJsonDto
{
    public string DatasetTableName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string UploadedSheetName { get; set; } = string.Empty;
    public int TotalRowCount { get; set; }
    public string? DefaultSortField { get; set; }
    public bool DefaultSortDescending { get; set; }
    public List<string> QuickFilterColumns { get; set; } = new();
    public List<CustomDatasetColumnDto> Columns { get; set; } = new();
}
