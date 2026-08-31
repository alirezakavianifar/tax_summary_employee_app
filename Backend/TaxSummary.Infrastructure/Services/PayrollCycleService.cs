using MiniExcelLibs;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using System.Drawing;
using TaxSummary.Application.DTOs.PayrollCycle;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;

namespace TaxSummary.Infrastructure.Services;

public class PayrollCycleService : IPayrollCycleService
{
    private readonly IPayrollCycleRepository _cycleRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    static PayrollCycleService()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public PayrollCycleService(
        IPayrollCycleRepository cycleRepository,
        IEmployeeRepository employeeRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork)
    {
        _cycleRepository = cycleRepository;
        _employeeRepository = employeeRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PayrollCycleSummaryDto> CreateCycleAsync(
        string title,
        string processType,
        int fiscalYear,
        int fiscalMonth,
        Guid userId,
        DateTime? deadline,
        string? notes,
        Stream? ezafe,
        Stream? refahi,
        Stream? coefficients,
        Stream? deptMapping,
        Stream? nim,
        CancellationToken cancellationToken = default)
    {
        var cycle = PayrollCycle.Create(title, processType, fiscalYear, fiscalMonth, userId, deadline, notes);

        // Parse files based on process type
        var deptRows = deptMapping != null ? ReadExcel(deptMapping) : new List<IDictionary<string, object>>();
        var coefRows = coefficients != null ? ReadExcel(coefficients) : new List<IDictionary<string, object>>();
        var deptLookup = BuildDeptLookup(deptRows);
        var coefLookup = BuildCoefLookup(coefRows);
        var employeeLookup = await BuildEmployeeLookupAsync(cancellationToken);

        if (processType == "HalfPercentBonus")
        {
            var nimRows = nim != null ? ReadExcel(nim) : new List<IDictionary<string, object>>();
            var bonusLookup = coefRows
                .GroupBy(r => NormalizeKey(GetStr(r, "اداره")))
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var deptGroups = new Dictionary<string, List<PayrollEmployeeItem>>(StringComparer.OrdinalIgnoreCase);
            var seenNumbers = new HashSet<string>();

            foreach (var n in nimRows)
            {
                var num = NormalizeKey(GetStr(n, "شماره کارمند"));
                if (string.IsNullOrEmpty(num) || seenNumbers.Contains(num)) continue;
                seenNumbers.Add(num);

                var dept = deptLookup.TryGetValue(num, out var d) ? d : "نامشخص";
                var bonusBase = bonusLookup.TryGetValue(NormalizeKey(dept), out var b)
                    ? GetDouble(b, "سرانه پاداش") : null;

                var name = GetStr(n, "نام کارمند");
                if (employeeLookup.TryGetValue(num, out var emp))
                {
                    name = $"{emp.FirstName} {emp.LastName}".Trim();
                }

                if (!deptGroups.TryGetValue(dept, out var list))
                {
                    list = new List<PayrollEmployeeItem>();
                    deptGroups[dept] = list;
                }

                // Item creation will be linked to dept entry
                var item = PayrollEmployeeItem.Create(
                    Guid.Empty,
                    num,
                    name,
                    baseBonusAmount: bonusBase
                );
                list.Add(item);
            }

            foreach (var kvp in deptGroups)
            {
                var deptName = kvp.Key;
                var bonusCap = bonusLookup.TryGetValue(NormalizeKey(deptName), out var b)
                    ? GetDouble(b, "سرانه پاداش") : null;

                var deptEntry = PayrollDepartmentEntry.Create(cycle.Id, deptName, baseBonusCap: bonusCap);
                foreach (var item in kvp.Value)
                {
                    var boundItem = PayrollEmployeeItem.Create(
                        deptEntry.Id,
                        item.PersonnelNumber,
                        item.EmployeeName,
                        baseBonusAmount: item.BaseBonusAmount
                    );
                    deptEntry.Items.Add(boundItem);
                }
                cycle.DepartmentEntries.Add(deptEntry);
            }
        }
        else
        {
            // OvertimeWelfareRated or OvertimeWelfareMonetary
            var isRated = processType == "OvertimeWelfareRated";
            var ezafeRows = ezafe != null ? ReadExcel(ezafe) : new List<IDictionary<string, object>>();
            var refahiRows = refahi != null ? ReadExcel(refahi) : new List<IDictionary<string, object>>();

            var refahiDict = refahiRows
                .GroupBy(r => NormalizeKey(GetStr(r, "شماره کارمند")))
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

            var deptGroups = new Dictionary<string, List<PayrollEmployeeItem>>(StringComparer.OrdinalIgnoreCase);
            var seenNumbers = new HashSet<string>();

            foreach (var e in ezafeRows)
            {
                var num = NormalizeKey(GetStr(e, "شماره کارمند"));
                if (string.IsNullOrEmpty(num) || seenNumbers.Contains(num)) continue;
                seenNumbers.Add(num);

                var dept = deptLookup.TryGetValue(num, out var d) ? d : "نامشخص";
                var overtimeRate = GetDouble(e, "نرخ اضافه کار");
                var welfareRate = refahiDict.TryGetValue(num, out var rf) ? GetDouble(rf, "نرخ رفاهی") : null;

                double? baseOvertime = null;
                double? baseWelfare = null;
                if (coefLookup.TryGetValue(NormalizeKey(dept), out var coef))
                {
                    baseOvertime = GetDouble(coef, "سرانه اضافه کار");
                    baseWelfare = GetDouble(coef, "سرانه رفاهی");
                }

                var name = GetStr(e, "نام کارمند");
                if (employeeLookup.TryGetValue(num, out var emp))
                {
                    name = $"{emp.FirstName} {emp.LastName}".Trim();
                }

                long? calcOvertime = null;
                long? calcWelfare = null;
                if (isRated)
                {
                    if (baseOvertime.HasValue && overtimeRate.HasValue)
                        calcOvertime = (long)Math.Ceiling(baseOvertime.Value * overtimeRate.Value);
                    if (baseWelfare.HasValue && welfareRate.HasValue)
                        calcWelfare = (long)Math.Ceiling(baseWelfare.Value * welfareRate.Value / 100.0);
                }

                if (!deptGroups.TryGetValue(dept, out var list))
                {
                    list = new List<PayrollEmployeeItem>();
                    deptGroups[dept] = list;
                }

                var item = PayrollEmployeeItem.Create(
                    Guid.Empty,
                    num,
                    name,
                    initialOvertimeRate: overtimeRate,
                    initialWelfareRate: welfareRate,
                    baseOvertimeAmount: baseOvertime,
                    baseWelfareAmount: baseWelfare,
                    calculatedOvertimeAmount: calcOvertime,
                    calculatedWelfareAmount: calcWelfare
                );
                list.Add(item);
            }

            // Also include employees present only in refahi (outer merge)
            foreach (var r in refahiRows)
            {
                var num = NormalizeKey(GetStr(r, "شماره کارمند"));
                if (string.IsNullOrEmpty(num) || seenNumbers.Contains(num)) continue;
                seenNumbers.Add(num);

                var dept = deptLookup.TryGetValue(num, out var d) ? d : "نامشخص";
                var welfareRate = GetDouble(r, "نرخ رفاهی");

                double? baseOvertime = null;
                double? baseWelfare = null;
                if (coefLookup.TryGetValue(NormalizeKey(dept), out var coef))
                {
                    baseOvertime = GetDouble(coef, "سرانه اضافه کار");
                    baseWelfare = GetDouble(coef, "سرانه رفاهی");
                }

                var name = string.Empty;
                if (employeeLookup.TryGetValue(num, out var emp))
                {
                    name = $"{emp.FirstName} {emp.LastName}".Trim();
                }

                long? calcWelfare = null;
                if (isRated && baseWelfare.HasValue && welfareRate.HasValue)
                {
                    calcWelfare = (long)Math.Ceiling(baseWelfare.Value * welfareRate.Value / 100.0);
                }

                if (!deptGroups.TryGetValue(dept, out var list))
                {
                    list = new List<PayrollEmployeeItem>();
                    deptGroups[dept] = list;
                }

                var item = PayrollEmployeeItem.Create(
                    Guid.Empty,
                    num,
                    name,
                    initialOvertimeRate: null,
                    initialWelfareRate: welfareRate,
                    baseOvertimeAmount: baseOvertime,
                    baseWelfareAmount: baseWelfare,
                    calculatedOvertimeAmount: null,
                    calculatedWelfareAmount: calcWelfare
                );
                list.Add(item);
            }

            foreach (var kvp in deptGroups)
            {
                var deptName = kvp.Key;
                double? baseOvertime = null;
                double? baseWelfare = null;
                if (coefLookup.TryGetValue(NormalizeKey(deptName), out var coef))
                {
                    baseOvertime = GetDouble(coef, "سرانه اضافه کار");
                    baseWelfare = GetDouble(coef, "سرانه رفاهی");
                }

                var deptEntry = PayrollDepartmentEntry.Create(cycle.Id, deptName, baseOvertime, baseWelfare);
                foreach (var item in kvp.Value)
                {
                    var boundItem = PayrollEmployeeItem.Create(
                        deptEntry.Id,
                        item.PersonnelNumber,
                        item.EmployeeName,
                        item.InitialOvertimeRate,
                        item.InitialWelfareRate,
                        item.BaseOvertimeAmount,
                        item.BaseWelfareAmount,
                        null,
                        item.CalculatedOvertimeAmount,
                        item.CalculatedWelfareAmount
                    );
                    deptEntry.Items.Add(boundItem);
                }
                cycle.DepartmentEntries.Add(deptEntry);
            }
        }

        await _cycleRepository.CreateCycleAsync(cycle, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToSummary(cycle);
    }

    public async Task<IEnumerable<PayrollCycleSummaryDto>> GetCyclesAsync(CancellationToken cancellationToken = default)
    {
        var cycles = await _cycleRepository.GetCyclesAsync(cancellationToken);
        return cycles.Select(MapToSummary);
    }

    public async Task<PayrollCycleDetailDto?> GetCycleByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cycle = await _cycleRepository.GetCycleByIdAsync(id, includeDetails: true, cancellationToken);
        if (cycle == null) return null;

        return new PayrollCycleDetailDto
        {
            Id = cycle.Id,
            Title = cycle.Title,
            ProcessType = cycle.ProcessType,
            FiscalYear = cycle.FiscalYear,
            FiscalMonth = cycle.FiscalMonth,
            Status = cycle.Status,
            Deadline = cycle.Deadline,
            Notes = cycle.Notes,
            CreatedAt = cycle.CreatedAt,
            CreatedByUsername = cycle.CreatedBy?.Username ?? "نامشخص",
            FinalizedAt = cycle.FinalizedAt,
            FinalizedByUsername = cycle.FinalizedBy?.Username,
            DepartmentEntries = cycle.DepartmentEntries.Select(d => MapToDepartmentSummary(d, cycle.ProcessType)).OrderBy(d => d.DepartmentName).ToList()
        };
    }

    public async Task<PayrollDepartmentEntryDto?> GetDepartmentEntryByIdAsync(
        Guid departmentEntryId,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var dept = await _cycleRepository.GetDepartmentEntryByIdAsync(departmentEntryId, includeItems: true, cancellationToken);
        if (dept == null) return null;

        // Authorization check: Admin can access any department; Manager must belong to that department
        await ValidateDepartmentAccessAsync(dept.DepartmentName, currentUserId, currentUserRole, cancellationToken);

        return MapToDepartmentDetail(dept);
    }

    public async Task<IEnumerable<PayrollDepartmentEntrySummaryDto>> GetDepartmentEntriesForOfficerAsync(
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var userResult = await _userRepository.GetByIdAsync(currentUserId, cancellationToken);
        var user = userResult.Value;
        var deptName = user?.Employee?.ServiceUnit;
        if (string.IsNullOrWhiteSpace(deptName))
        {
            return Enumerable.Empty<PayrollDepartmentEntrySummaryDto>();
        }

        var entries = await _cycleRepository.GetDepartmentEntriesForUserAsync(deptName, cancellationToken);
        return entries.Select(e => MapToDepartmentSummary(e, e.PayrollCycle?.ProcessType ?? "OvertimeWelfareRated"));
    }

    public async Task<PayrollDepartmentEntryDto> SaveDepartmentDraftAsync(
        Guid departmentEntryId,
        SaveDepartmentDraftDto dto,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var dept = await _cycleRepository.GetDepartmentEntryByIdAsync(departmentEntryId, includeItems: true, cancellationToken);
        if (dept == null) throw new KeyNotFoundException("رکورد اداره یافت نشد");

        await ValidateDepartmentAccessAsync(dept.DepartmentName, currentUserId, currentUserRole, cancellationToken);

        var isRated = dept.PayrollCycle?.ProcessType == "OvertimeWelfareRated";

        foreach (var itemUpdate in dto.Items)
        {
            var item = dept.Items.FirstOrDefault(i => i.Id == itemUpdate.Id);
            if (item != null)
            {
                item.UpdateAdjustments(
                    itemUpdate.AdjustedOvertimeRate,
                    itemUpdate.AdjustedWelfareRate,
                    itemUpdate.OfficerNotes,
                    itemUpdate.IsExcluded,
                    isRated
                );
            }
        }

        dept.SaveDraft(dto.Notes);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDepartmentDetail(dept);
    }

    public async Task<PayrollDepartmentEntryDto> SubmitDepartmentAsync(
        Guid departmentEntryId,
        SubmitDepartmentDto dto,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var dept = await _cycleRepository.GetDepartmentEntryByIdAsync(departmentEntryId, includeItems: true, cancellationToken);
        if (dept == null) throw new KeyNotFoundException("رکورد اداره یافت نشد");

        await ValidateDepartmentAccessAsync(dept.DepartmentName, currentUserId, currentUserRole, cancellationToken);

        var isRated = dept.PayrollCycle?.ProcessType == "OvertimeWelfareRated";

        if (dto.Items != null && dto.Items.Any())
        {
            foreach (var itemUpdate in dto.Items)
            {
                var item = dept.Items.FirstOrDefault(i => i.Id == itemUpdate.Id);
                if (item != null)
                {
                    item.UpdateAdjustments(
                        itemUpdate.AdjustedOvertimeRate,
                        itemUpdate.AdjustedWelfareRate,
                        itemUpdate.OfficerNotes,
                        itemUpdate.IsExcluded,
                        isRated
                    );
                }
            }
        }

        dept.Submit(currentUserId, dto.Notes);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDepartmentDetail(dept);
    }

    public async Task<PayrollDepartmentEntryDto> ReviewDepartmentAsync(
        Guid departmentEntryId,
        ReviewDepartmentDto dto,
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        var dept = await _cycleRepository.GetDepartmentEntryByIdAsync(departmentEntryId, includeItems: true, cancellationToken);
        if (dept == null) throw new KeyNotFoundException("رکورد اداره یافت نشد");

        if (dto.Approve)
        {
            dept.Approve(adminUserId);
        }
        else
        {
            dept.Reject(dto.RejectionReason ?? "عدم تایید توسط مدیر سیستم");
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return MapToDepartmentDetail(dept);
    }

    public async Task<PayrollCycleDetailDto> FinalizeCycleAsync(
        Guid cycleId,
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        var cycle = await _cycleRepository.GetCycleByIdAsync(cycleId, includeDetails: true, cancellationToken);
        if (cycle == null) throw new KeyNotFoundException("دوره محاسبه یافت نشد");

        cycle.FinalizeCycle(adminUserId);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return (await GetCycleByIdAsync(cycleId, cancellationToken))!;
    }

    public async Task DeleteCycleAsync(
        Guid cycleId,
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        await _cycleRepository.DeleteCycleAsync(cycleId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<byte[]> ExportDepartmentExcelAsync(
        Guid departmentEntryId,
        CancellationToken cancellationToken = default)
    {
        var dept = await _cycleRepository.GetDepartmentEntryByIdAsync(departmentEntryId, includeItems: true, cancellationToken);
        if (dept == null) throw new KeyNotFoundException("رکورد اداره یافت نشد");

        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add(SafeSheetName(dept.DepartmentName));
        ws.View.RightToLeft = true;

        var isBonus = dept.PayrollCycle?.ProcessType == "HalfPercentBonus";

        const string headerText =
            "توجه: متذکر می‌گردد صرفاً ستون‌های مربوط به ساعت/نرخ اضافه کار و درصد رفاهی اصلاحی تکمیل گردد.";

        ws.Cells["A1:H3"].Merge = true;
        ws.Cells["A1"].Value = headerText;
        var headerCell = ws.Cells["A1"];
        headerCell.Style.Font.Bold = true;
        headerCell.Style.Font.Color.SetColor(Color.DarkBlue);
        headerCell.Style.WrapText = true;
        headerCell.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
        headerCell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

        int headerRow = 4;
        if (isBonus)
        {
            var cols = new[] { "شماره کارمند", "نام کارمند", "سرانه پاداش", "توضیحات" };
            for (int c = 0; c < cols.Length; c++)
            {
                ws.Cells[headerRow, c + 1].Value = cols[c];
                ws.Cells[headerRow, c + 1].Style.Font.Bold = true;
            }

            int rowIdx = 5;
            foreach (var item in dept.Items)
            {
                ws.Cells[rowIdx, 1].Value = item.PersonnelNumber;
                ws.Cells[rowIdx, 2].Value = item.EmployeeName;
                ws.Cells[rowIdx, 3].Value = item.BaseBonusAmount;
                ws.Cells[rowIdx, 4].Value = item.OfficerNotes;
                rowIdx++;
            }
        }
        else
        {
            var cols = new[] { "شماره کارمند", "نام کارمند", "نرخ اضافه کار اولیه", "نرخ اضافه کار اصلاحی", "نرخ رفاهی اولیه", "نرخ رفاهی اصلاحی", "مبلغ اضافه کار", "مبلغ رفاهی", "توضیحات" };
            for (int c = 0; c < cols.Length; c++)
            {
                ws.Cells[headerRow, c + 1].Value = cols[c];
                ws.Cells[headerRow, c + 1].Style.Font.Bold = true;
            }

            int rowIdx = 5;
            foreach (var item in dept.Items)
            {
                ws.Cells[rowIdx, 1].Value = item.PersonnelNumber;
                ws.Cells[rowIdx, 2].Value = item.EmployeeName;
                ws.Cells[rowIdx, 3].Value = item.InitialOvertimeRate;
                ws.Cells[rowIdx, 4].Value = item.AdjustedOvertimeRate;
                ws.Cells[rowIdx, 5].Value = item.InitialWelfareRate;
                ws.Cells[rowIdx, 6].Value = item.AdjustedWelfareRate;
                ws.Cells[rowIdx, 7].Value = item.CalculatedOvertimeAmount;
                ws.Cells[rowIdx, 8].Value = item.CalculatedWelfareAmount;
                ws.Cells[rowIdx, 9].Value = item.OfficerNotes;
                rowIdx++;
            }
        }

        ws.Cells.AutoFitColumns();
        return package.GetAsByteArray();
    }

    public async Task<PayrollDepartmentEntryDto> ImportDepartmentExcelAsync(
        Guid departmentEntryId,
        Stream excelStream,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var dept = await _cycleRepository.GetDepartmentEntryByIdAsync(departmentEntryId, includeItems: true, cancellationToken);
        if (dept == null) throw new KeyNotFoundException("رکورد اداره یافت نشد");

        await ValidateDepartmentAccessAsync(dept.DepartmentName, currentUserId, currentUserRole, cancellationToken);

        var rows = ReadExcel(excelStream);
        var isRated = dept.PayrollCycle?.ProcessType == "OvertimeWelfareRated";

        foreach (var r in rows)
        {
            var num = NormalizeKey(GetStr(r, "شماره کارمند"));
            if (string.IsNullOrEmpty(num)) continue;

            var item = dept.Items.FirstOrDefault(i => i.PersonnelNumber.Equals(num, StringComparison.OrdinalIgnoreCase));
            if (item != null)
            {
                var adjustedOvertime = GetDouble(r, "نرخ اضافه کار اصلاحی") ?? GetDouble(r, "نرخ اضافه کار") ?? item.AdjustedOvertimeRate;
                var adjustedWelfare = GetDouble(r, "نرخ رفاهی اصلاحی") ?? GetDouble(r, "نرخ رفاهی") ?? item.AdjustedWelfareRate;
                var notes = GetStr(r, "توضیحات");

                item.UpdateAdjustments(adjustedOvertime, adjustedWelfare, notes, item.IsExcluded, isRated);
            }
        }

        dept.SaveDraft("بروزرسانی از طریق اکسل");
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDepartmentDetail(dept);
    }

    public async Task<byte[]> ExportMasterExcelAsync(
        Guid cycleId,
        CancellationToken cancellationToken = default)
    {
        var cycle = await _cycleRepository.GetCycleByIdAsync(cycleId, includeDetails: true, cancellationToken);
        if (cycle == null) throw new KeyNotFoundException("دوره محاسبه یافت نشد");

        using var package = new ExcelPackage();

        foreach (var dept in cycle.DepartmentEntries.OrderBy(d => d.DepartmentName))
        {
            var ws = package.Workbook.Worksheets.Add(SafeSheetName(dept.DepartmentName));
            ws.View.RightToLeft = true;

            const string headerText =
                "کاربرگ نهایی اضافه کار و رفاهی اداره\r\n" +
                "اطلاعات زیر توسط رییس اداره تکمیل و به تایید رسیده است.";

            ws.Cells["A1:J3"].Merge = true;
            ws.Cells["A1"].Value = headerText;
            var headerCell = ws.Cells["A1"];
            headerCell.Style.Font.Bold = true;
            headerCell.Style.Font.Color.SetColor(Color.Red);
            headerCell.Style.WrapText = true;
            headerCell.Style.VerticalAlignment = ExcelVerticalAlignment.Center;
            headerCell.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            int headerRow = 4;
            var cols = new[] { "اداره", "شماره کارمند", "نام کارمند", "نرخ اضافه کار اولیه", "نرخ اضافه کار نهایی", "نرخ رفاهی اولیه", "نرخ رفاهی نهایی", "مبلغ اضافه کار", "مبلغ رفاهی", "وضعیت/توضیحات" };
            for (int c = 0; c < cols.Length; c++)
            {
                ws.Cells[headerRow, c + 1].Value = cols[c];
                ws.Cells[headerRow, c + 1].Style.Font.Bold = true;
            }

            int rowIdx = 5;
            foreach (var item in dept.Items)
            {
                ws.Cells[rowIdx, 1].Value = dept.DepartmentName;
                ws.Cells[rowIdx, 2].Value = item.PersonnelNumber;
                ws.Cells[rowIdx, 3].Value = item.EmployeeName;
                ws.Cells[rowIdx, 4].Value = item.InitialOvertimeRate;
                ws.Cells[rowIdx, 5].Value = item.AdjustedOvertimeRate;
                ws.Cells[rowIdx, 6].Value = item.InitialWelfareRate;
                ws.Cells[rowIdx, 7].Value = item.AdjustedWelfareRate;
                ws.Cells[rowIdx, 8].Value = item.CalculatedOvertimeAmount;
                ws.Cells[rowIdx, 9].Value = item.CalculatedWelfareAmount;
                ws.Cells[rowIdx, 10].Value = item.IsExcluded ? "محروم / مستثنی" : item.OfficerNotes;
                rowIdx++;
            }

            // Summary row
            ws.Cells[rowIdx, 1].Value = "جمع کل";
            ws.Cells[rowIdx, 1].Style.Font.Bold = true;
            if (rowIdx > 5)
            {
                ws.Cells[rowIdx, 8].Formula = $"SUM(H5:H{rowIdx - 1})";
                ws.Cells[rowIdx, 8].Style.Font.Bold = true;
                ws.Cells[rowIdx, 9].Formula = $"SUM(I5:I{rowIdx - 1})";
                ws.Cells[rowIdx, 9].Style.Font.Bold = true;
            }

            ws.Cells.AutoFitColumns();
        }

        return package.GetAsByteArray();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Private Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private async Task ValidateDepartmentAccessAsync(
        string departmentName,
        Guid currentUserId,
        string currentUserRole,
        CancellationToken ct)
    {
        if (currentUserRole.Equals("Admin", StringComparison.OrdinalIgnoreCase))
        {
            return; // Admin has organization-wide access for monitoring, review and master export
        }

        var userResult = await _userRepository.GetByIdAsync(currentUserId, ct);
        var user = userResult.Value;
        var userDept = user?.Employee?.ServiceUnit;
        if (string.IsNullOrWhiteSpace(userDept) || !userDept.Equals(departmentName, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException($"دسترسی غیرمجاز: شما فقط مجاز به مشاهده و مدیریت کاربرگ اداره مربوط به خود ({userDept ?? "فاقد اداره"}) هستید.");
        }
    }

    private static PayrollCycleSummaryDto MapToSummary(PayrollCycle c)
    {
        var depts = c.DepartmentEntries.ToList();
        var allItems = depts.SelectMany(d => d.Items).ToList();
        return new PayrollCycleSummaryDto
        {
            Id = c.Id,
            Title = c.Title,
            ProcessType = c.ProcessType,
            FiscalYear = c.FiscalYear,
            FiscalMonth = c.FiscalMonth,
            Status = c.Status,
            Deadline = c.Deadline,
            CreatedAt = c.CreatedAt,
            CreatedByUsername = c.CreatedBy?.Username ?? "سیستم",
            TotalDepartments = depts.Count,
            SubmittedDepartments = depts.Count(d => d.Status == PayrollDepartmentStatus.Submitted || d.Status == PayrollDepartmentStatus.Approved),
            ApprovedDepartments = depts.Count(d => d.Status == PayrollDepartmentStatus.Approved),
            TotalEmployees = allItems.Count,
            TotalOvertimeAmount = allItems.Sum(i => i.CalculatedOvertimeAmount ?? 0),
            TotalWelfareAmount = allItems.Sum(i => i.CalculatedWelfareAmount ?? 0),
            TotalBonusAmount = allItems.Sum(i => i.BaseBonusAmount ?? 0)
        };
    }

    private static PayrollDepartmentEntrySummaryDto MapToDepartmentSummary(PayrollDepartmentEntry d, string processType)
    {
        var items = d.Items.ToList();
        return new PayrollDepartmentEntrySummaryDto
        {
            Id = d.Id,
            PayrollCycleId = d.PayrollCycleId,
            DepartmentName = d.DepartmentName,
            Status = d.Status,
            BaseOvertimeCap = d.BaseOvertimeCap,
            BaseWelfareCap = d.BaseWelfareCap,
            BaseBonusCap = d.BaseBonusCap,
            EmployeeCount = items.Count,
            TotalOvertimeAmount = items.Sum(i => i.CalculatedOvertimeAmount ?? 0),
            TotalWelfareAmount = items.Sum(i => i.CalculatedWelfareAmount ?? 0),
            TotalBonusAmount = items.Sum(i => i.BaseBonusAmount ?? 0),
            SubmittedByUsername = d.SubmittedBy?.Username,
            SubmittedAt = d.SubmittedAt,
            ApprovedByUsername = d.ApprovedBy?.Username,
            ApprovedAt = d.ApprovedAt,
            RejectionReason = d.RejectionReason,
            Notes = d.Notes
        };
    }

    private static PayrollDepartmentEntryDto MapToDepartmentDetail(PayrollDepartmentEntry d)
    {
        var items = d.Items.OrderBy(i => i.PersonnelNumber).ToList();
        return new PayrollDepartmentEntryDto
        {
            Id = d.Id,
            PayrollCycleId = d.PayrollCycleId,
            CycleTitle = d.PayrollCycle?.Title ?? string.Empty,
            ProcessType = d.PayrollCycle?.ProcessType ?? "OvertimeWelfareRated",
            CycleStatus = d.PayrollCycle?.Status ?? "OpenForSubmission",
            CycleDeadline = d.PayrollCycle?.Deadline,
            DepartmentName = d.DepartmentName,
            Status = d.Status,
            BaseOvertimeCap = d.BaseOvertimeCap,
            BaseWelfareCap = d.BaseWelfareCap,
            BaseBonusCap = d.BaseBonusCap,
            SubmittedByUsername = d.SubmittedBy?.Username,
            SubmittedAt = d.SubmittedAt,
            ApprovedByUsername = d.ApprovedBy?.Username,
            ApprovedAt = d.ApprovedAt,
            RejectionReason = d.RejectionReason,
            Notes = d.Notes,
            EmployeeCount = items.Count,
            TotalOvertimeAmount = items.Sum(i => i.CalculatedOvertimeAmount ?? 0),
            TotalWelfareAmount = items.Sum(i => i.CalculatedWelfareAmount ?? 0),
            TotalBonusAmount = items.Sum(i => i.BaseBonusAmount ?? 0),
            Items = items.Select(i => new PayrollEmployeeItemDto
            {
                Id = i.Id,
                DepartmentEntryId = i.DepartmentEntryId,
                PersonnelNumber = i.PersonnelNumber,
                EmployeeName = i.EmployeeName,
                InitialOvertimeRate = i.InitialOvertimeRate,
                AdjustedOvertimeRate = i.AdjustedOvertimeRate,
                InitialWelfareRate = i.InitialWelfareRate,
                AdjustedWelfareRate = i.AdjustedWelfareRate,
                BaseOvertimeAmount = i.BaseOvertimeAmount,
                BaseWelfareAmount = i.BaseWelfareAmount,
                BaseBonusAmount = i.BaseBonusAmount,
                CalculatedOvertimeAmount = i.CalculatedOvertimeAmount,
                CalculatedWelfareAmount = i.CalculatedWelfareAmount,
                OfficerNotes = i.OfficerNotes,
                IsExcluded = i.IsExcluded
            }).ToList()
        };
    }

    private static List<IDictionary<string, object>> ReadExcel(Stream stream)
    {
        stream.Position = 0;
        return stream.Query(useHeaderRow: true)
            .Cast<IDictionary<string, object>>()
            .ToList();
    }

    private static string NormalizeKey(string? value) => (value ?? string.Empty).Trim();

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

    private static Dictionary<string, string> BuildDeptLookup(List<IDictionary<string, object>> deptRows)
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in deptRows)
        {
            var num = NormalizeKey(GetStr(r, "شماره کارمند"));
            if (!string.IsNullOrEmpty(num))
            {
                var dept = GetStr(r, "اداره");
                dict.TryAdd(num, string.IsNullOrEmpty(dept) ? "نامشخص" : dept);
            }
        }
        return dict;
    }

    private static Dictionary<string, IDictionary<string, object>> BuildCoefLookup(List<IDictionary<string, object>> coefRows)
    {
        return coefRows
            .GroupBy(r => NormalizeKey(GetStr(r, "اداره")))
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
    }

    private async Task<Dictionary<string, Employee>> BuildEmployeeLookupAsync(CancellationToken ct)
    {
        var all = await _employeeRepository.GetAllAsync(ct);
        return all.ToDictionary(e => e.PersonnelNumber.Trim(), e => e, StringComparer.OrdinalIgnoreCase);
    }

    private static string SafeSheetName(string name)
    {
        var invalidChars = new[] { '\\', '/', '?', '*', '[', ']' };
        var safe = new string(name.Select(c => invalidChars.Contains(c) ? '_' : c).ToArray());
        return safe.Length > 31 ? safe.Substring(0, 31) : safe;
    }
}
