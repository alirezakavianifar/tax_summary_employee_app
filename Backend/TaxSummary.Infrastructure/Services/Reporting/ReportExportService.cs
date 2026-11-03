using System.Drawing;
using System.Globalization;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;

namespace TaxSummary.Infrastructure.Services.Reporting;

/// <summary>
/// Service implementation for EPPlus 7 Persian RTL Excel generation and export
/// </summary>
public class ReportExportService : IReportExportService
{
    public Task<Result<byte[]>> ExportToExcelAsync(
        string reportTitle,
        string reportCode,
        List<ReportColumnMetadataDto> columns,
        List<Dictionary<string, object?>> rows,
        Dictionary<string, object?>? summaryAggregates,
        string? appliedFilterSummary,
        CancellationToken ct = default)
    {
        try
        {
            var bytes = GenerateRtlExcel(
                reportTitle,
                reportCode,
                columns,
                rows,
                summaryAggregates,
                appliedFilterSummary);

            return Task.FromResult(Result.Success<byte[]>(bytes));
        }
        catch (Exception ex)
        {
            return Task.FromResult(Result.Failure<byte[]>($"خطا در صدور فایل اکسل گزارش: {ex.Message}"));
        }
    }

    public Task<Result<byte[]>> ExportToPdfAsync(
        string reportTitle,
        string reportCode,
        List<ReportColumnMetadataDto> columns,
        List<Dictionary<string, object?>> rows,
        Dictionary<string, object?>? summaryAggregates,
        string? appliedFilterSummary,
        CancellationToken ct = default)
    {
        // Reserved for future PDF generator integration; return informative message
        return Task.FromResult(Result.Failure<byte[]>("امکان خروجی PDF در حال حاضر فعال نیست. لطفاً از خروجی اکسل استفاده فرمایید."));
    }

    public static byte[] GenerateRtlExcel(
        string reportTitle,
        string reportCode,
        List<ReportColumnMetadataDto> columns,
        List<Dictionary<string, object?>> rows,
        Dictionary<string, object?>? summaryAggregates,
        string? appliedFilterSummary)
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

        using var package = new ExcelPackage();
        var sheetName = string.IsNullOrWhiteSpace(reportCode) 
            ? "Report" 
            : (reportCode.Length > 30 ? reportCode[..30] : reportCode);
        var worksheet = package.Workbook.Worksheets.Add(sheetName);

        // Enforce RTL Layout & Typography
        worksheet.View.RightToLeft = true;
        worksheet.Cells.Style.Font.Name = "Vazirmatn";
        worksheet.Cells.Style.Font.Size = 10;

        int colCount = Math.Max(columns.Count, 1);
        int currentRow = 1;

        // 1. Organization Header Block
        worksheet.Cells[currentRow, 1, currentRow, colCount].Merge = true;
        worksheet.Cells[currentRow, 1].Value = "اداره کل امور مالیاتی استان خوزستان";
        worksheet.Cells[currentRow, 1].Style.Font.Size = 14;
        worksheet.Cells[currentRow, 1].Style.Font.Bold = true;
        worksheet.Cells[currentRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        worksheet.Row(currentRow).Height = 25;
        currentRow++;

        // 2. Report Title & Generation Time
        worksheet.Cells[currentRow, 1, currentRow, colCount].Merge = true;
        var persianCalendar = new PersianCalendar();
        var now = DateTime.UtcNow;
        var shamsiDate = $"{persianCalendar.GetYear(now):0000}/{persianCalendar.GetMonth(now):00}/{persianCalendar.GetDayOfMonth(now):00}";
        worksheet.Cells[currentRow, 1].Value = $"{reportTitle} (کد: {reportCode}) | تاریخ گزارش: {shamsiDate}";
        worksheet.Cells[currentRow, 1].Style.Font.Size = 11;
        worksheet.Cells[currentRow, 1].Style.Font.Bold = true;
        worksheet.Cells[currentRow, 1].Style.Font.Color.SetColor(Color.FromArgb(71, 85, 105)); // Slate 600
        worksheet.Cells[currentRow, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        currentRow++;

        // 3. Filter Parameters Box (if provided)
        if (!string.IsNullOrWhiteSpace(appliedFilterSummary))
        {
            worksheet.Cells[currentRow, 1, currentRow, colCount].Merge = true;
            worksheet.Cells[currentRow, 1].Value = $"فیلترهای اعمال‌شده: {appliedFilterSummary}";
            worksheet.Cells[currentRow, 1].Style.Font.Size = 9;
            worksheet.Cells[currentRow, 1].Style.Font.Italic = true;
            worksheet.Cells[currentRow, 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[currentRow, 1].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(241, 245, 249)); // Slate 100
            currentRow++;
        }

        currentRow++; // Blank spacer row

        // 4. Column Headers
        int headerRow = currentRow;
        for (int i = 0; i < columns.Count; i++)
        {
            var col = columns[i];
            var cell = worksheet.Cells[headerRow, i + 1];
            cell.Value = col.PersianLabel;
            cell.Style.Font.Bold = true;
            cell.Style.Font.Color.SetColor(Color.White);
            cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(30, 41, 59)); // Slate 800
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            cell.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
            cell.Style.Border.BorderAround(ExcelBorderStyle.Thin, Color.FromArgb(15, 23, 42));
        }
        worksheet.Row(headerRow).Height = 26;
        currentRow++;

        // 5. Data Rows
        int dataStartRow = currentRow;
        foreach (var row in rows)
        {
            for (int i = 0; i < columns.Count; i++)
            {
                var col = columns[i];
                var cell = worksheet.Cells[currentRow, i + 1];
                row.TryGetValue(col.FieldName, out var val);

                FormatAndSetCellValue(cell, val, col.DataType);
            }
            currentRow++;
        }
        int dataEndRow = currentRow - 1;

        // Apply bulk lightweight borders across the entire data range at once (1000x faster than cell-by-cell)
        if (dataEndRow >= dataStartRow)
        {
            var dataRange = worksheet.Cells[dataStartRow, 1, dataEndRow, colCount];
            dataRange.Style.Border.Top.Style = ExcelBorderStyle.Hair;
            dataRange.Style.Border.Bottom.Style = ExcelBorderStyle.Hair;
            dataRange.Style.Border.Left.Style = ExcelBorderStyle.Hair;
            dataRange.Style.Border.Right.Style = ExcelBorderStyle.Hair;
            dataRange.Style.Border.Top.Color.SetColor(Color.FromArgb(226, 232, 240));
            dataRange.Style.Border.Bottom.Color.SetColor(Color.FromArgb(226, 232, 240));
            dataRange.Style.Border.Left.Color.SetColor(Color.FromArgb(226, 232, 240));
            dataRange.Style.Border.Right.Color.SetColor(Color.FromArgb(226, 232, 240));
        }

        // 6. Summary Aggregates Row (with Native Excel SUM Formulas)
        if (dataEndRow >= dataStartRow)
        {
            worksheet.Cells[currentRow, 1].Value = "جمع کل";
            worksheet.Cells[currentRow, 1].Style.Font.Bold = true;

            for (int i = 0; i < columns.Count; i++)
            {
                var col = columns[i];
                var cell = worksheet.Cells[currentRow, i + 1];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.PatternType = ExcelFillStyle.Solid;
                cell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(226, 232, 240)); // Slate 200
                cell.Style.Border.Top.Style = ExcelBorderStyle.Double;
                cell.Style.Border.Bottom.Style = ExcelBorderStyle.Double;

                if (col.HasAggregateSum)
                {
                    var colLetter = GetExcelColumnLetter(i + 1);
                    cell.Formula = $"SUM({colLetter}{dataStartRow}:{colLetter}{dataEndRow})";
                    cell.Style.Numberformat.Format = "#,##0";
                }
                else if (i > 0 && summaryAggregates != null && summaryAggregates.TryGetValue(col.FieldName, out var sumVal) && sumVal != null)
                {
                    FormatAndSetCellValue(cell, sumVal, col.DataType);
                }
            }
        }

        // Freeze Panes
        worksheet.View.FreezePanes(dataStartRow, 1);

        // Fast sample-based AutoFit (samples first 80 rows instead of 30,000 to prevent 90s freeze)
        if (dataEndRow >= dataStartRow)
        {
            int sampleEndRow = Math.Min(dataStartRow + 80, dataEndRow);
            worksheet.Cells[headerRow, 1, sampleEndRow, colCount].AutoFitColumns(13, 50);
        }
        else
        {
            for (int i = 1; i <= colCount; i++)
            {
                worksheet.Column(i).Width = 16;
            }
        }

        return package.GetAsByteArray();
    }

    private static void FormatAndSetCellValue(ExcelRange cell, object? val, string dataType)
    {
        if (val == null || val == DBNull.Value)
        {
            cell.Value = "-";
            cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
            return;
        }

        switch (dataType.ToLowerInvariant())
        {
            case "year" or "id" or "code":
                if (long.TryParse(val.ToString(), out var idVal))
                {
                    cell.Value = idVal;
                    cell.Style.Numberformat.Format = "0";
                }
                else
                {
                    cell.Value = val.ToString();
                }
                cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                break;

            case "currency":
                if (decimal.TryParse(val.ToString(), out var decCurr))
                {
                    cell.Value = decCurr;
                    cell.Style.Numberformat.Format = "#,##0";
                    cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
                }
                else 
                {
                    cell.Value = val.ToString();
                }
                break;

            case "number":
                if (decimal.TryParse(val.ToString(), out var dec))
                {
                    if (dec >= 1300 && dec <= 1500 && Math.Floor(dec) == dec)
                    {
                        cell.Value = (int)dec;
                        cell.Style.Numberformat.Format = "0000";
                        cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                    }
                    else
                    {
                        cell.Value = dec;
                        cell.Style.Numberformat.Format = "#,##0";
                        cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
                    }
                }
                else 
                {
                    cell.Value = val.ToString();
                }
                break;

            case "date":
                cell.Value = val.ToString();
                cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                break;

            case "badge" or "bool":
                cell.Value = val.ToString();
                cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                break;

            default:
                cell.Value = val.ToString();
                cell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
                break;
        }
    }

    private static string GetExcelColumnLetter(int columnNumber)
    {
        int dividend = columnNumber;
        string columnLabel = string.Empty;
        while (dividend > 0)
        {
            int modulo = (dividend - 1) % 26;
            columnLabel = Convert.ToChar(65 + modulo) + columnLabel;
            dividend = (dividend - modulo) / 26;
        }
        return columnLabel;
    }
}
