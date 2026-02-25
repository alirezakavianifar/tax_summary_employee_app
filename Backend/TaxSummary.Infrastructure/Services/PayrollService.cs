using System.Text.Json;
using MiniExcelLibs;
using TaxSummary.Application.DTOs.Payroll;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Infrastructure.Services;

/// <summary>
/// Implements payroll processing logic, replicating the three Streamlit workflows.
/// Excel parsing uses MiniExcelLibs; DB enrichment uses IEmployeeRepository.
/// </summary>
public class PayrollService : IPayrollService
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IPayrollRepository _payrollRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PayrollService(
        IEmployeeRepository employeeRepository,
        IPayrollRepository payrollRepository,
        IUnitOfWork unitOfWork)
    {
        _employeeRepository = employeeRepository;
        _payrollRepository = payrollRepository;
        _unitOfWork = unitOfWork;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Process 1: OvertimeWelfareRated
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<PayrollProcessResultDto> ProcessOvertimeWelfareRatedAsync(
        Stream ezafe, Stream refahi, Stream coefficients, Stream deptMapping,
        CancellationToken cancellationToken = default)
    {
        var ezafeRows = ReadExcel(ezafe);
        var refahiRows = ReadExcel(refahi);
        var deptRows = ReadExcel(deptMapping);
        var coefRows = ReadExcel(coefficients);

        // Build lookup dictionaries
        var deptLookup = BuildDeptLookup(deptRows);
        var coefLookup = BuildCoefLookup(coefRows);
        var employeeLookup = await BuildEmployeeLookupAsync(cancellationToken);

        // Outer-merge ezafe+refahi on شماره کارمند
        var refahiDict = refahiRows
            .GroupBy(r => NormalizeKey(GetStr(r, "شماره کارمند")))
            .ToDictionary(g => g.Key, g => g.First());

        var merged = new List<MergedOvertimeRow>();
        var seenNumbers = new HashSet<string>();

        foreach (var e in ezafeRows)
        {
            var num = NormalizeKey(GetStr(e, "شماره کارمند"));
            if (seenNumbers.Contains(num)) continue;
            seenNumbers.Add(num);

            var row = new MergedOvertimeRow
            {
                PersonnelNumber = num,
                EmployeeName = GetStr(e, "نام کارمند"),
                OvertimeRate = GetDouble(e, "نرخ اضافه کار"),
                WelfareRate = refahiDict.TryGetValue(num, out var rf) ? GetDouble(rf, "نرخ رفاهی") : null
            };
            merged.Add(row);
        }

        // rows only in refahi (outer join)
        foreach (var r in refahiRows)
        {
            var num = NormalizeKey(GetStr(r, "شماره کارمند"));
            if (!seenNumbers.Contains(num))
            {
                seenNumbers.Add(num);
                merged.Add(new MergedOvertimeRow
                {
                    PersonnelNumber = num,
                    WelfareRate = GetDouble(r, "نرخ رفاهی")
                });
            }
        }

        // Left-join with dept mapping and coefficients
        EnrichWithDeptAndCoefficients(merged, deptLookup, coefLookup);

        // DB enrichment
        EnrichNamesFromDb(merged, employeeLookup);

        // Calculate amounts
        foreach (var row in merged)
        {
            if (row.BaseOvertimeAmount.HasValue && row.OvertimeRate.HasValue)
                row.CalculatedOvertimeAmount = (long)Math.Ceiling(row.BaseOvertimeAmount.Value * row.OvertimeRate.Value);
            if (row.BaseWelfareAmount.HasValue && row.WelfareRate.HasValue)
                row.CalculatedWelfareAmount = (long)Math.Ceiling(row.BaseWelfareAmount.Value * row.WelfareRate.Value / 100.0);
        }

        return BuildOvertimeResult(PayrollProcessType.OvertimeWelfareRated, merged, isRated: true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Process 2: OvertimeWelfareMonetary
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<PayrollProcessResultDto> ProcessOvertimeWelfareMonetaryAsync(
        Stream ezafe, Stream refahi, Stream coefficients, Stream deptMapping,
        CancellationToken cancellationToken = default)
    {
        var ezafeRows = ReadExcel(ezafe);
        var refahiRows = ReadExcel(refahi);
        var deptRows = ReadExcel(deptMapping);
        var coefRows = ReadExcel(coefficients);

        var deptLookup = BuildDeptLookup(deptRows);
        var coefLookup = BuildCoefLookup(coefRows);
        var employeeLookup = await BuildEmployeeLookupAsync(cancellationToken);

        var refahiDict = refahiRows
            .GroupBy(r => NormalizeKey(GetStr(r, "شماره کارمند")))
            .ToDictionary(g => g.Key, g => g.First());

        var merged = new List<MergedOvertimeRow>();
        var seenNumbers = new HashSet<string>();

        foreach (var e in ezafeRows)
        {
            var num = NormalizeKey(GetStr(e, "شماره کارمند"));
            if (seenNumbers.Contains(num)) continue;
            seenNumbers.Add(num);

            merged.Add(new MergedOvertimeRow
            {
                PersonnelNumber = num,
                EmployeeName = GetStr(e, "نام کارمند"),
                OvertimeRate = GetDouble(e, "نرخ اضافه کار"),
                WelfareRate = refahiDict.TryGetValue(num, out var rf) ? GetDouble(rf, "نرخ رفاهی") : null
            });
        }

        foreach (var r in refahiRows)
        {
            var num = NormalizeKey(GetStr(r, "شماره کارمند"));
            if (!seenNumbers.Contains(num))
            {
                seenNumbers.Add(num);
                merged.Add(new MergedOvertimeRow
                {
                    PersonnelNumber = num,
                    WelfareRate = GetDouble(r, "نرخ رفاهی")
                });
            }
        }

        EnrichWithDeptAndCoefficients(merged, deptLookup, coefLookup);
        EnrichNamesFromDb(merged, employeeLookup);

        // Monetary: no rate multiplication — سرانه values used directly
        foreach (var row in merged)
        {
            row.CalculatedOvertimeAmount = null;
            row.CalculatedWelfareAmount = null;
        }

        return BuildOvertimeResult(PayrollProcessType.OvertimeWelfareMonetary, merged, isRated: false);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Process 3: HalfPercentBonus
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<PayrollProcessResultDto> ProcessHalfPercentBonusAsync(
        Stream nim, Stream coefficients, Stream deptMapping,
        CancellationToken cancellationToken = default)
    {
        var nimRows = ReadExcel(nim);
        var deptRows = ReadExcel(deptMapping);
        var coefRows = ReadExcel(coefficients);

        var deptLookup = BuildDeptLookup(deptRows);
        var bonusLookup = coefRows
            .GroupBy(r => NormalizeKey(GetStr(r, "اداره")))
            .ToDictionary(g => g.Key, g => g.First());
        var employeeLookup = await BuildEmployeeLookupAsync(cancellationToken);

        var mergedRows = new List<MergedBonusRow>();
        var seenNumbers = new HashSet<string>();

        foreach (var n in nimRows)
        {
            var num = NormalizeKey(GetStr(n, "شماره کارمند"));
            if (seenNumbers.Contains(num)) continue;
            seenNumbers.Add(num);

            var dept = deptLookup.TryGetValue(num, out var d) ? d : "نامشخص";
            var bonusBase = bonusLookup.TryGetValue(NormalizeKey(dept), out var b)
                ? GetDouble(b, "سرانه پاداش") : null;

            var row = new MergedBonusRow
            {
                PersonnelNumber = num,
                EmployeeName = GetStr(n, "نام کارمند"),
                Department = dept,
                BaseBonusAmount = bonusBase
            };

            // DB enrichment
            if (employeeLookup.TryGetValue(num, out var emp))
            {
                row.EmployeeName = $"{emp.FirstName} {emp.LastName}".Trim();
            }

            mergedRows.Add(row);
        }

        // Build detail rows
        var detailRows = mergedRows.Select(r => new PayrollDetailRowDto
        {
            PersonnelNumber = r.PersonnelNumber,
            EmployeeName = r.EmployeeName,
            Department = r.Department,
            BaseBonusAmount = r.BaseBonusAmount
        }).ToList();

        // Build grouped rows per department
        var groupedRows = mergedRows
            .GroupBy(r => r.Department)
            .Select(g => new PayrollGroupedRowDto
            {
                Department = g.Key,
                EmployeeCount = g.Count(),
                BonusPerPerson = g.Select(x => x.BaseBonusAmount).FirstOrDefault(x => x.HasValue),
                TotalBonusSum = g.Where(x => x.BaseBonusAmount.HasValue).Sum(x => x.BaseBonusAmount!.Value) is double s and > 0 ? (double?)s : null
            })
            .OrderBy(g => g.Department)
            .ToList();

        // Convert TotalBonusSum
        foreach (var g in groupedRows)
        {
            if (g.TotalBonusSum.HasValue)
                g.TotalBonusSum = g.TotalBonusSum;
        }

        return new PayrollProcessResultDto
        {
            ProcessType = PayrollProcessType.HalfPercentBonus,
            DetailRows = detailRows,
            GroupedRows = groupedRows
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Persistence
    // ─────────────────────────────────────────────────────────────────────────
    public async Task<PayrollRunSummaryDto> SaveRunAsync(
        SavePayrollRunRequestDto dto, Guid userId,
        CancellationToken cancellationToken = default)
    {
        var json = JsonSerializer.Serialize(dto.Result);
        var run = PayrollRun.Create(dto.ProcessType, dto.RunLabel, userId, json, dto.Result.DetailRows.Count);
        await _payrollRepository.SaveRunAsync(run, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new PayrollRunSummaryDto
        {
            Id = run.Id,
            ProcessType = run.ProcessType,
            RunLabel = run.RunLabel,
            RowCount = run.RowCount,
            CreatedAt = run.CreatedAt
        };
    }

    public async Task<IEnumerable<PayrollRunSummaryDto>> GetRunsAsync(CancellationToken cancellationToken = default)
    {
        var runs = await _payrollRepository.GetRunsAsync(cancellationToken);
        return runs.Select(r => new PayrollRunSummaryDto
        {
            Id = r.Id,
            ProcessType = r.ProcessType,
            RunLabel = r.RunLabel,
            RowCount = r.RowCount,
            CreatedAt = r.CreatedAt
        });
    }

    public async Task<PayrollProcessResultDto?> GetRunByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var run = await _payrollRepository.GetRunByIdAsync(id, cancellationToken);
        if (run == null) return null;
        return JsonSerializer.Deserialize<PayrollProcessResultDto>(run.ResultJson);
    }

    public async Task DeleteRunAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await _payrollRepository.DeleteRunAsync(id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private static List<IDictionary<string, object>> ReadExcel(Stream stream)
    {
        stream.Position = 0;
        return stream.Query(useHeaderRow: true)
            .Cast<IDictionary<string, object>>()
            .ToList();
    }

    private static string NormalizeKey(string? value) =>
        (value ?? string.Empty).Trim();

    private static string GetStr(IDictionary<string, object> row, string key)
    {
        if (row.TryGetValue(key, out var val) && val != null)
            return val.ToString()?.Trim() ?? string.Empty;
        return string.Empty;
    }

    private static double? GetDouble(IDictionary<string, object> row, string key)
    {
        if (!row.TryGetValue(key, out var val) || val == null) return null;
        if (val is double d) return d;
        if (val is decimal dec) return (double)dec;
        if (val is int i) return i;
        if (val is long l) return l;
        if (double.TryParse(val.ToString(), out var parsed)) return parsed;
        return null;
    }

    /// <summary>Returns dict: personnelNumber → department string</summary>
    private static Dictionary<string, string> BuildDeptLookup(List<IDictionary<string, object>> deptRows)
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in deptRows)
        {
            var num = NormalizeKey(GetStr(r, "شماره کارمند"));
            if (!string.IsNullOrEmpty(num))
                dict.TryAdd(num, GetStr(r, "اداره").NullIfEmpty() ?? "نامشخص");
        }
        return dict;
    }

    /// <summary>Returns dict: department → coefficient row</summary>
    private static Dictionary<string, IDictionary<string, object>> BuildCoefLookup(
        List<IDictionary<string, object>> coefRows)
    {
        return coefRows
            .GroupBy(r => NormalizeKey(GetStr(r, "اداره")))
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
    }

    private async Task<Dictionary<string, Domain.Entities.Employee>> BuildEmployeeLookupAsync(
        CancellationToken ct)
    {
        var all = await _employeeRepository.GetAllAsync(ct);
        return all.ToDictionary(
            e => e.PersonnelNumber.Trim(),
            e => e,
            StringComparer.OrdinalIgnoreCase);
    }

    private static void EnrichWithDeptAndCoefficients(
        List<MergedOvertimeRow> rows,
        Dictionary<string, string> deptLookup,
        Dictionary<string, IDictionary<string, object>> coefLookup)
    {
        foreach (var row in rows)
        {
            var dept = deptLookup.TryGetValue(row.PersonnelNumber, out var d) ? d : "نامشخص";
            row.Department = dept;

            if (coefLookup.TryGetValue(NormalizeKey(dept), out var coef))
            {
                row.BaseOvertimeAmount = GetDouble(coef, "سرانه اضافه کار");
                row.BaseWelfareAmount = GetDouble(coef, "سرانه رفاهی");
            }
        }
    }

    private static void EnrichNamesFromDb(
        List<MergedOvertimeRow> rows,
        Dictionary<string, Domain.Entities.Employee> employeeLookup)
    {
        foreach (var row in rows)
        {
            if (employeeLookup.TryGetValue(row.PersonnelNumber, out var emp))
                row.EmployeeName = $"{emp.FirstName} {emp.LastName}".Trim();
        }
    }

    private static PayrollProcessResultDto BuildOvertimeResult(
        string processType,
        List<MergedOvertimeRow> merged,
        bool isRated)
    {
        var detailRows = merged.Select(r => new PayrollDetailRowDto
        {
            PersonnelNumber = r.PersonnelNumber,
            EmployeeName = r.EmployeeName,
            Department = r.Department,
            OvertimeRate = r.OvertimeRate,
            WelfareRate = r.WelfareRate,
            BaseOvertimeAmount = r.BaseOvertimeAmount,
            BaseWelfareAmount = r.BaseWelfareAmount,
            CalculatedOvertimeAmount = isRated ? r.CalculatedOvertimeAmount : null,
            CalculatedWelfareAmount = isRated ? r.CalculatedWelfareAmount : null
        }).ToList();

        var groupedRows = merged
            .GroupBy(r => r.Department)
            .Select(g => new PayrollGroupedRowDto
            {
                Department = g.Key,
                EmployeeCount = g.Count(),
                BaseOvertimePerPerson = g.Select(x => x.BaseOvertimeAmount).FirstOrDefault(x => x.HasValue),
                BaseOvertimeSum = g.Where(x => x.BaseOvertimeAmount.HasValue).Sum(x => x.BaseOvertimeAmount!.Value) is double os and > 0 ? (double?)os : 0,
                BaseWelfarePerPerson = g.Select(x => x.BaseWelfareAmount).FirstOrDefault(x => x.HasValue),
                BaseWelfareSum = g.Where(x => x.BaseWelfareAmount.HasValue).Sum(x => x.BaseWelfareAmount!.Value) is double ws and > 0 ? (double?)ws : 0,
                TotalOvertimeAmount = isRated
                    ? (g.Sum(x => x.CalculatedOvertimeAmount ?? 0) is long ot and > 0 ? (long?)ot : 0)
                    : null,
                TotalWelfareAmount = isRated
                    ? (g.Sum(x => x.CalculatedWelfareAmount ?? 0) is long wt and > 0 ? (long?)wt : 0)
                    : null
            })
            .OrderBy(g => g.Department)
            .ToList();

        return new PayrollProcessResultDto
        {
            ProcessType = processType,
            DetailRows = detailRows,
            GroupedRows = groupedRows
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Inner types for intermediate mapping
    // ─────────────────────────────────────────────────────────────────────────

    private class MergedOvertimeRow
    {
        public string PersonnelNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public double? OvertimeRate { get; set; }
        public double? WelfareRate { get; set; }
        public double? BaseOvertimeAmount { get; set; }
        public double? BaseWelfareAmount { get; set; }
        public long? CalculatedOvertimeAmount { get; set; }
        public long? CalculatedWelfareAmount { get; set; }
    }

    private class MergedBonusRow
    {
        public string PersonnelNumber { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public double? BaseBonusAmount { get; set; }
    }
}

internal static class StringExtensions
{
    public static string? NullIfEmpty(this string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value;
}
