namespace TaxSummary.Application.DTOs.TaxRefund;

/// <summary>
/// Represents a single parsed receipt item extracted from an uploaded Excel file.
/// </summary>
public class ParsedReceiptRowDto
{
    public int RowIndex { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public string IssueDateJalali { get; set; } = string.Empty;
    public string? PaymentDateJalali { get; set; }
    public long AmountRials { get; set; }
    public string? BankName { get; set; }
    public string? City { get; set; }
    public string? TaxOffice { get; set; }
    public string? Notes { get; set; }
    public List<string> Warnings { get; set; } = new();
    public bool IsValid { get; set; } = true;
}

/// <summary>
/// Encapsulates the overall result of parsing a bulk receipts Excel file.
/// </summary>
public class ReceiptExcelParseResultDto
{
    public string FileFormat { get; set; } = string.Empty; // e.g., "XML Spreadsheet 2003", "OpenXML Spreadsheet"
    public string DetectedStyle { get; set; } = string.Empty; // "لیست پرداخت‌های مودی (قالب ۱)", "لیست قبض‌ها (قالب ۲)", "جدول الف استاندارد"
    public int TotalRows { get; set; }
    public int ValidRows { get; set; }
    public int ErrorRows { get; set; }
    public long TotalAmountRials { get; set; }
    public List<ParsedReceiptRowDto> Receipts { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}
