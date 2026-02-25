using OfficeOpenXml;
using OfficeOpenXml.Style;
using System.Drawing;
using TaxSummary.Application.DTOs.Payroll;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Services;

/// <summary>
/// Generates multi-sheet RTL Excel workbooks from payroll processing results using EPPlus.
/// Equivalent to the xlsxwriter output produced by the Streamlit application.
/// </summary>
public class PayrollExcelExportService : IPayrollExcelExportService
{
    static PayrollExcelExportService()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public Task<byte[]> ExportToExcelAsync(
        PayrollProcessResultDto result,
        CancellationToken cancellationToken = default)
    {
        using var package = new ExcelPackage();

        switch (result.ProcessType)
        {
            case PayrollProcessType.OvertimeWelfareRated:
                BuildOvertimeWelfareRatedSheets(package, result);
                break;
            case PayrollProcessType.OvertimeWelfareMonetary:
                BuildOvertimeWelfareMonetarySheets(package, result);
                break;
            case PayrollProcessType.HalfPercentBonus:
                BuildHalfPercentBonusSheets(package, result);
                break;
            default:
                BuildOvertimeWelfareRatedSheets(package, result);
                break;
        }

        var bytes = package.GetAsByteArray();
        return Task.FromResult(bytes);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  OvertimeWelfareRated — per-department sheets with formulas
    // ─────────────────────────────────────────────────────────────────────────
    private static void BuildOvertimeWelfareRatedSheets(ExcelPackage package, PayrollProcessResultDto result)
    {
        const string headerText =
            "توجه: متذکر می‌گردد صرفاً ستون‌های مربوط به ساعت اضافه کار و درصد رفاهی تکمیل گردد.\r\n" +
            "سقف اضافه کار همکاران مشاغل کارگری حداکثر 120 ساعت می‌باشد.\r\n" +
            "ساعت اضافه کار و ضریب رفاهی بین 0 تا 29، صفر محاسبه می‌گردد.";

        var depts = result.DetailRows.Select(r => r.Department).Distinct().OrderBy(x => x).ToList();

        foreach (var dept in depts)
        {
            var rows = result.DetailRows.Where(r => r.Department == dept).ToList();
            var grouped = result.GroupedRows.FirstOrDefault(g => g.Department == dept);

            var sheetName = SafeSheetName(dept);
            var ws = package.Workbook.Worksheets.Add(sheetName);
            ws.View.RightToLeft = true;

            // Header – merged A1:L4, red bold
            ws.Cells["A1:L4"].Merge = true;
            ws.Cells["A1"].Value = headerText;
            var headerCell = ws.Cells["A1"];
            headerCell.Style.Font.Bold = true;
            headerCell.Style.Font.Color.SetColor(Color.Red);
            headerCell.Style.WrapText = true;
            headerCell.Style.VerticalAlignment = ExcelVerticalAlignment.Top;
            headerCell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            // Column headers at row 5
            int headerRow = 5;
            var columns = new[] { "اداره", "شماره کارمند", "نام کارمند", "نرخ اضافه کار", "نرخ رفاهی",
                                   "ساعت اضافه کار", "درصد رفاهی", "مبلغ اضافه", "مبلغ رفاهی" };
            for (int c = 0; c < columns.Length; c++)
            {
                ws.Cells[headerRow, c + 1].Value = columns[c];
                ws.Cells[headerRow, c + 1].Style.Font.Bold = true;
            }

            // Data rows start at row 6 (Excel row index)
            int dataStartRow = 6;
            for (int i = 0; i < rows.Count; i++)
            {
                int excelRow = dataStartRow + i;
                var row = rows[i];
                ws.Cells[excelRow, 1].Value = row.Department;
                ws.Cells[excelRow, 2].Value = row.PersonnelNumber;
                ws.Cells[excelRow, 3].Value = row.EmployeeName;
                ws.Cells[excelRow, 4].Value = row.OvertimeRate;
                ws.Cells[excelRow, 5].Value = row.WelfareRate;
                // Columns 6 & 7 (ساعت اضافه کار / درصد رفاهی) left blank for user input
                ws.Cells[excelRow, 6].Value = null;
                ws.Cells[excelRow, 7].Value = null;
                // Column 8: مبلغ اضافه = =IF(F{r}="","",F{r}*D{r})
                ws.Cells[excelRow, 8].Formula = $"IF(F{excelRow}=\"\",\"\",F{excelRow}*D{excelRow})";
                // Column 9: مبلغ رفاهی = =IF(G{r}="","",G{r}*E{r}/100)
                ws.Cells[excelRow, 9].Formula = $"IF(G{excelRow}=\"\",\"\",G{excelRow}*E{excelRow}/100)";

                ApplyNumberFormat(ws, excelRow, new[] { 4, 5, 8, 9 });
            }

            // SUM row
            int sumRow = dataStartRow + rows.Count;
            ws.Cells[sumRow, 8].Formula = $"SUM(H{dataStartRow}:H{sumRow - 1})";
            ws.Cells[sumRow, 9].Formula = $"SUM(I{dataStartRow}:I{sumRow - 1})";
            ApplyNumberFormat(ws, sumRow, new[] { 8, 9 });
            ws.Cells[sumRow, 8].Style.Font.Bold = true;
            ws.Cells[sumRow, 9].Style.Font.Bold = true;

            // Summary block (columns M=13, N=14)
            if (grouped != null)
            {
                ws.Cells[5, 13].Value = "جمع ساعت اضافه کار قابل تخصیص";
                ws.Cells[5, 14].Value = "جمع درصد رفاهی تخصیصی";
                ws.Cells[6, 13].Value = grouped.BaseOvertimeSum;
                ws.Cells[6, 14].Value = grouped.BaseWelfareSum;
                ws.Cells[6, 13].Style.Numberformat.Format = "#,##0";
                ws.Cells[6, 14].Style.Numberformat.Format = "#,##0";

                ws.Cells[8, 13].Value = "سرانه اضافه کار هر نفر";
                ws.Cells[8, 14].Value = "سرانه رفاهی هر نفر";
                ws.Cells[9, 13].Value = grouped.BaseOvertimePerPerson;
                ws.Cells[9, 14].Value = grouped.BaseWelfarePerPerson;
                ws.Cells[9, 13].Style.Numberformat.Format = "#,##0";
                ws.Cells[9, 14].Style.Numberformat.Format = "#,##0";
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  OvertimeWelfareMonetary — same layout but monetary labels
    // ─────────────────────────────────────────────────────────────────────────
    private static void BuildOvertimeWelfareMonetarySheets(ExcelPackage package, PayrollProcessResultDto result)
    {
        const string headerText =
            "توجه: متذکر می‌گردد صرفاً ستون‌های مربوط به ساعت اضافه کار و درصد رفاهی تکمیل گردد.\r\n" +
            "سقف اضافه کار همکاران مشاغل کارگری حداکثر 120 ساعت می‌باشد.\r\n" +
            "ساعت اضافه کار و ضریب رفاهی بین 0 تا 29، صفر محاسبه می‌گردد.";

        var depts = result.DetailRows.Select(r => r.Department).Distinct().OrderBy(x => x).ToList();

        foreach (var dept in depts)
        {
            var rows = result.DetailRows.Where(r => r.Department == dept).ToList();
            var grouped = result.GroupedRows.FirstOrDefault(g => g.Department == dept);

            var sheetName = SafeSheetName(dept);
            var ws = package.Workbook.Worksheets.Add(sheetName);
            ws.View.RightToLeft = true;

            ws.Cells["A1:L4"].Merge = true;
            ws.Cells["A1"].Value = headerText;
            ws.Cells["A1"].Style.Font.Bold = true;
            ws.Cells["A1"].Style.Font.Color.SetColor(Color.Red);
            ws.Cells["A1"].Style.WrapText = true;

            int headerRow = 5;
            var columns = new[] { "اداره", "شماره کارمند", "نام کارمند", "نرخ اضافه کار", "نرخ رفاهی",
                                   "ساعت اضافه کار", "درصد رفاهی", "مبلغ اضافه", "مبلغ رفاهی" };
            for (int c = 0; c < columns.Length; c++)
            {
                ws.Cells[headerRow, c + 1].Value = columns[c];
                ws.Cells[headerRow, c + 1].Style.Font.Bold = true;
            }

            int dataStartRow = 6;
            for (int i = 0; i < rows.Count; i++)
            {
                int excelRow = dataStartRow + i;
                var row = rows[i];
                ws.Cells[excelRow, 1].Value = row.Department;
                ws.Cells[excelRow, 2].Value = row.PersonnelNumber;
                ws.Cells[excelRow, 3].Value = row.EmployeeName;
                ws.Cells[excelRow, 4].Value = row.OvertimeRate;
                ws.Cells[excelRow, 5].Value = row.WelfareRate;
                ws.Cells[excelRow, 8].Formula = $"IF(F{excelRow}=\"\",\"\",F{excelRow}*D{excelRow})";
                ws.Cells[excelRow, 9].Formula = $"IF(G{excelRow}=\"\",\"\",G{excelRow}*E{excelRow}/100)";
                ApplyNumberFormat(ws, excelRow, new[] { 4, 5, 8, 9 });
            }

            int sumRow = dataStartRow + rows.Count;
            ws.Cells[sumRow, 8].Formula = $"SUM(H{dataStartRow}:H{sumRow - 1})";
            ws.Cells[sumRow, 9].Formula = $"SUM(I{dataStartRow}:I{sumRow - 1})";
            ApplyNumberFormat(ws, sumRow, new[] { 8, 9 });
            ws.Cells[sumRow, 8].Style.Font.Bold = true;
            ws.Cells[sumRow, 9].Style.Font.Bold = true;

            if (grouped != null)
            {
                ws.Cells[5, 13].Value = "کل مبلغ قابل توزیع اضافه کار";
                ws.Cells[5, 14].Value = "کل مبلغ قابل توزیع رفاهی";
                ws.Cells[6, 13].Value = grouped.BaseOvertimePerPerson;
                ws.Cells[6, 14].Value = grouped.BaseWelfarePerPerson;
                ws.Cells[6, 13].Style.Numberformat.Format = "#,##0";
                ws.Cells[6, 14].Style.Numberformat.Format = "#,##0";
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  HalfPercentBonus — per-department sheets
    // ─────────────────────────────────────────────────────────────────────────
    private static void BuildHalfPercentBonusSheets(ExcelPackage package, PayrollProcessResultDto result)
    {
        var depts = result.DetailRows.Select(r => r.Department).Distinct().OrderBy(x => x).ToList();

        foreach (var dept in depts)
        {
            var rows = result.DetailRows.Where(r => r.Department == dept).ToList();
            var grouped = result.GroupedRows.FirstOrDefault(g => g.Department == dept);

            var sheetName = SafeSheetName(dept);
            var ws = package.Workbook.Worksheets.Add(sheetName);
            ws.View.RightToLeft = true;

            // Column headers at row 1
            var columns = new[] { "اداره", "شماره کارمند", "نام کارمند", "مبلغ پاداش" };
            for (int c = 0; c < columns.Length; c++)
            {
                ws.Cells[1, c + 1].Value = columns[c];
                ws.Cells[1, c + 1].Style.Font.Bold = true;
            }

            // Summary block in column F (index 6)
            if (grouped != null)
            {
                ws.Cells[1, 6].Value = "جمع سرانه پاداش";
                ws.Cells[1, 6].Style.Font.Bold = true;
                ws.Cells[2, 6].Value = grouped.TotalBonusSum;
                ws.Cells[2, 6].Style.Numberformat.Format = "#,##0";
            }

            int dataStartRow = 2;
            for (int i = 0; i < rows.Count; i++)
            {
                int excelRow = dataStartRow + i;
                var row = rows[i];
                ws.Cells[excelRow, 1].Value = row.Department;
                ws.Cells[excelRow, 2].Value = row.PersonnelNumber;
                ws.Cells[excelRow, 3].Value = row.EmployeeName;
                ws.Cells[excelRow, 4].Value = null; // مبلغ پاداش — user fills
                ApplyNumberFormat(ws, excelRow, new[] { 4 });
            }

            // SUM for مبلغ پاداش column
            int sumRow = dataStartRow + rows.Count;
            ws.Cells[sumRow, 4].Formula = $"SUM(D{dataStartRow}:D{sumRow - 1})";
            ws.Cells[sumRow, 4].Style.Numberformat.Format = "#,##0";
            ws.Cells[sumRow, 4].Style.Font.Bold = true;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private static void ApplyNumberFormat(ExcelWorksheet ws, int row, int[] colIndexes)
    {
        foreach (var col in colIndexes)
            ws.Cells[row, col].Style.Numberformat.Format = "#,##0";
    }

    private static string SafeSheetName(string name)
    {
        // Excel sheet names: max 31 chars, no special chars
        var invalid = new[] { ':', '\\', '/', '?', '*', '[', ']' };
        foreach (var c in invalid)
            name = name.Replace(c, '-');
        return name.Length > 31 ? name[..31] : name;
    }
}
