using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Entities.Reporting;
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Services.Reporting;

/// <summary>
/// Executive Reporting and Business Intelligence Application Service
/// Provides cached KPI dashboards, parametric standard report execution, and catalog management
/// </summary>
public class ExecutiveReportingService : IExecutiveReportingService
{
    private readonly TaxSummaryDbContext _db;
    private readonly IExecutiveAnalyticsRepository _analyticsRepository;
    private readonly IReportingRepository _reportingRepository;
    private readonly IReportExportService _exportService;
    private readonly IMemoryCache _cache;
    private readonly IMapper _mapper;
    private readonly ICustomDatasetService _customDatasetService;

    public ExecutiveReportingService(
        TaxSummaryDbContext db,
        IExecutiveAnalyticsRepository analyticsRepository,
        IReportingRepository reportingRepository,
        IReportExportService exportService,
        IMemoryCache cache,
        IMapper mapper,
        ICustomDatasetService customDatasetService)
    {
        _db = db;
        _analyticsRepository = analyticsRepository;
        _reportingRepository = reportingRepository;
        _exportService = exportService;
        _cache = cache;
        _mapper = mapper;
        _customDatasetService = customDatasetService;
    }

    public async Task<Result<ExecutiveDashboardDto>> GetExecutiveDashboardOverviewAsync(
        DashboardFilterDto filter, 
        List<Guid>? userAssignedOfficeIds, 
        CancellationToken ct = default)
    {
        try
        {
            var officeIdsKey = userAssignedOfficeIds != null && userAssignedOfficeIds.Count > 0
                ? string.Join("-", userAssignedOfficeIds.OrderBy(x => x))
                : "ALL";

            var cacheKey = $"EXECUTIVE_DASHBOARD_OVERVIEW_{filter.FiscalYear}_{filter.PayrollCycleId}_{filter.OfficeId}_{officeIdsKey}";

            if (_cache.TryGetValue(cacheKey, out ExecutiveDashboardDto? cachedDashboard) && cachedDashboard != null)
            {
                return Result.Success<ExecutiveDashboardDto>(cachedDashboard);
            }

            // Determine effective office scope
            List<Guid>? effectiveOfficeIds = userAssignedOfficeIds;
            if (filter.OfficeId.HasValue)
            {
                if (userAssignedOfficeIds != null && userAssignedOfficeIds.Count > 0 && !userAssignedOfficeIds.Contains(filter.OfficeId.Value))
                {
                    return Result.Failure<ExecutiveDashboardDto>("شما مجوز دسترسی به آمار این اداره را ندارید.");
                }
                effectiveOfficeIds = new List<Guid> { filter.OfficeId.Value };
            }

            // 1. KPI Snapshot
            var snapshot = await _analyticsRepository.GetExecutiveKpiSnapshotAsync(null, null, effectiveOfficeIds, ct);

            var kpiMetrics = new ExecutiveKpiMetricsDto
            {
                TotalEmployeesActive = snapshot.TotalEmployeesActive,
                TotalEvaluationsRecorded = snapshot.TotalEvaluationsRecorded,
                TotalEvasionIdentifiedAmount = snapshot.TotalEvasionIdentifiedAmount,
                CurrentMonthApprovedBudget = snapshot.CurrentMonthApprovedBudget,
                CurrentMonthActualSpent = snapshot.CurrentMonthActualSpent,
                BudgetUtilizationPercentage = snapshot.CurrentMonthApprovedBudget > 0 
                    ? Math.Round((snapshot.CurrentMonthActualSpent / snapshot.CurrentMonthApprovedBudget) * 100, 2) 
                    : 0,
                TotalOvertimeHoursRecorded = snapshot.TotalOvertimeHoursRecorded,
                LaborCapViolationsCount = snapshot.LaborCapViolationsCount,
                ActiveRefundCasesCount = snapshot.ActiveRefundCasesCount,
                TotalRefundClaimedAmount = snapshot.TotalRefundClaimedAmount,
                TotalRefundApprovedAmount = snapshot.TotalRefundApprovedAmount,
                TotalDelayInterestPaid = snapshot.TotalDelayInterestPaid,
                AverageProcessingDays = snapshot.AverageProcessingDays
            };

            // 2. Department Budget Variances
            var variances = await _analyticsRepository.GetDepartmentBudgetVariancesAsync(filter.PayrollCycleId, effectiveOfficeIds, ct);
            var topDepartments = variances.Take(10).Select(v => new TopDepartmentBudgetDto
            {
                DepartmentName = v.DepartmentName,
                AllocatedBudget = v.AllocatedBudget,
                ConsumedAmount = v.ConsumedAmount,
                Variance = v.Variance,
                HasViolation = v.HasViolation,
                EmployeeCount = v.EmployeeCount,
                AverageOvertimePerCapita = v.AverageOvertimePerCapita
            }).ToList();

            // 3. Tax Source Refund Distribution
            var distributions = await _analyticsRepository.GetTaxSourceDistributionsAsync(filter.FiscalYear, effectiveOfficeIds, ct);
            var sourceDistributions = distributions.Select(d => new TaxSourceDistributionDto
            {
                TaxSourceCode = d.TaxSourceCode,
                TaxSourcePersianTitle = d.TaxSourcePersianTitle,
                CaseCount = d.CaseCount,
                TotalApprovedRefundAmount = d.TotalApprovedRefundAmount,
                TotalDelayInterestAmount = d.TotalDelayInterestAmount
            }).ToList();

            // 4. Monthly Trend Points (Recent 6 payroll cycles)
            var monthlyTrends = await GetMonthlyTrendPointsAsync(filter.FiscalYear, effectiveOfficeIds, ct);

            // 5. Recent Audit Activity
            var recentAudits = await GetRecentAuditActivitiesAsync(ct);

            var dashboard = new ExecutiveDashboardDto
            {
                KpiMetrics = kpiMetrics,
                MonthlyTrends = monthlyTrends,
                TopDepartmentBudgets = topDepartments,
                TaxSourceRefundDistribution = sourceDistributions,
                RecentAuditActivities = recentAudits
            };

            // Cache for 5 minutes sliding TTL
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetSlidingExpiration(TimeSpan.FromMinutes(5))
                .SetAbsoluteExpiration(TimeSpan.FromHours(1));

            _cache.Set(cacheKey, dashboard, cacheOptions);

            return Result.Success<ExecutiveDashboardDto>(dashboard);
        }
        catch (Exception ex)
        {
            return Result.Failure<ExecutiveDashboardDto>($"خطا در دریافت اطلاعات داشبورد مدیریتی: {ex.Message}");
        }
    }

    public async Task<Result<ReportExecutionResultDto>> ExecuteStandardReportAsync(
        string reportCode, 
        ReportFilterParametersDto parameters, 
        List<Guid>? userAssignedOfficeIds, 
        CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            if (string.IsNullOrWhiteSpace(reportCode))
                return Result.Failure<ReportExecutionResultDto>("کد گزارش نامعتبر است.");

            var report = await _reportingRepository.GetReportDefinitionByCodeAsync(reportCode, ct);
            if (report == null)
            {
                return Result.Failure<ReportExecutionResultDto>($"گزارش استاندارد با کد '{reportCode}' یافت نشد.");
            }

            // Resolve effective offices
            List<Guid>? effectiveOfficeIds = userAssignedOfficeIds;
            if (parameters.OfficeId.HasValue)
            {
                if (userAssignedOfficeIds != null && userAssignedOfficeIds.Count > 0 && !userAssignedOfficeIds.Contains(parameters.OfficeId.Value))
                {
                    return Result.Failure<ReportExecutionResultDto>("شما مجوز دسترسی به این اداره را ندارید.");
                }
                effectiveOfficeIds = new List<Guid> { parameters.OfficeId.Value };
            }

            // Parse Column Configuration from JSON
            var columns = ParseColumnsFromConfigurationJson(report.ConfigurationJson);

            // Dispatch to custom dataset or standard report query implementation
            List<Dictionary<string, object?>> rows;
            Dictionary<string, object?> summaryAggregates;
            int totalCount;

            if (report.DomainSource == ReportDomainSource.CustomUploadedDataset || report.Code.StartsWith("REP_CUSTOM_", StringComparison.OrdinalIgnoreCase))
            {
                var customRes = await _customDatasetService.QueryCustomDatasetAsync(report.Code, parameters, ct);
                if (!customRes.IsSuccess)
                {
                    return Result.Failure<ReportExecutionResultDto>(customRes.Error ?? "خطا در استخراج داده‌های گزارش اختصاصی");
                }
                rows = customRes.Value.Rows;
                summaryAggregates = customRes.Value.Summary;
                totalCount = customRes.Value.TotalCount;
            }
            else
            {
                var queryRes = await ExecuteStandardQueryAsync(
                    report.Code, 
                    parameters, 
                    effectiveOfficeIds, 
                    ct);
                rows = queryRes.Rows;
                summaryAggregates = queryRes.Summary;
                totalCount = queryRes.TotalCount;
            }

            sw.Stop();

            // Audit log execution asynchronously (fire & forget style safe handling)
            try
            {
                var executionLog = ReportExecutionLog.Record(
                    report.Id,
                    report.Code,
                    Guid.Empty,
                    "SystemUser",
                    sw.ElapsedMilliseconds,
                    totalCount,
                    parameters.SearchTerm ?? parameters.Department);

                await _reportingRepository.LogExecutionAsync(executionLog, ct);
            }
            catch
            {
                // Never fail the report result if audit logging encounters an exception
            }

            var result = new ReportExecutionResultDto
            {
                ReportCode = report.Code,
                ReportTitle = report.Title,
                ExecutedAt = DateTime.UtcNow,
                Columns = columns,
                Rows = rows,
                SummaryAggregates = summaryAggregates,
                TotalRowCount = totalCount,
                PageNumber = parameters.PageNumber,
                PageSize = parameters.PageSize
            };

            return Result.Success<ReportExecutionResultDto>(result);
        }
        catch (Exception ex)
        {
            return Result.Failure<ReportExecutionResultDto>($"خطا در اجرای گزارش '{reportCode}': {ex.Message}");
        }
    }

    public async Task<Result<byte[]>> ExportStandardReportAsync(
        string reportCode, 
        ReportFilterParametersDto parameters, 
        ExportFormat format, 
        List<Guid>? userAssignedOfficeIds, 
        CancellationToken ct = default)
    {
        try
        {
            var exportParams = new ReportFilterParametersDto
            {
                ShamsiDateFrom = parameters.ShamsiDateFrom,
                ShamsiDateTo = parameters.ShamsiDateTo,
                OfficeId = parameters.OfficeId,
                Department = parameters.Department,
                PayrollCycleId = parameters.PayrollCycleId,
                CaseStatus = parameters.CaseStatus,
                TaxSourceCode = parameters.TaxSourceCode,
                SearchTerm = parameters.SearchTerm,
                SortBy = parameters.SortBy,
                SortDescending = parameters.SortDescending,
                PageNumber = 1,
                PageSize = 5000
            };

            var executionResult = await ExecuteStandardReportAsync(reportCode, exportParams, userAssignedOfficeIds, ct);
            if (!executionResult.IsSuccess || executionResult.Value == null)
            {
                return Result.Failure<byte[]>(executionResult.Error ?? "خطا در استخراج اطلاعات گزارش جهت خروجی");
            }

            var data = executionResult.Value;
            string filterSummary = BuildFilterSummary(parameters);

            if (format == ExportFormat.Pdf)
            {
                return await _exportService.ExportToPdfAsync(
                    data.ReportTitle,
                    data.ReportCode,
                    data.Columns,
                    data.Rows,
                    data.SummaryAggregates,
                    filterSummary,
                    ct);
            }

            return await _exportService.ExportToExcelAsync(
                data.ReportTitle,
                data.ReportCode,
                data.Columns,
                data.Rows,
                data.SummaryAggregates,
                filterSummary,
                ct);
        }
        catch (Exception ex)
        {
            return Result.Failure<byte[]>($"خطا در صدور فایل گزارش: {ex.Message}");
        }
    }

    public async Task<Result<List<ReportDefinitionDto>>> GetCatalogAsync(
        string? userRole, 
        ReportDomainSource? source = null, 
        bool includeInactive = false,
        CancellationToken ct = default)
    {
        try
        {
            var reports = await _reportingRepository.GetAvailableReportsAsync(userRole, source, includeInactive, ct);
            var dtos = _mapper.Map<List<ReportDefinitionDto>>(reports);

            foreach (var dto in dtos)
            {
                var report = reports.FirstOrDefault(r => r.Id == dto.Id);
                if (report != null && !string.IsNullOrWhiteSpace(report.ConfigurationJson))
                {
                    dto.Columns = ParseColumnsFromConfigurationJson(report.ConfigurationJson);
                }
            }

            return Result.Success<List<ReportDefinitionDto>>(dtos);
        }
        catch (Exception ex)
        {
            return Result.Failure<List<ReportDefinitionDto>>($"خطا در دریافت فهرست گزارش‌ها: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ToggleReportStatusAsync(
        string reportCode, 
        bool? explicitStatus = null, 
        string? userRole = null, 
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(reportCode))
                return Result.Failure<bool>("کد گزارش مشخص نشده است.");

            var isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);
            if (!isAdmin)
                return Result.Failure<bool>("تنها مدیر ارشد سامانه (Admin) مجاز به فعال یا غیرفعال‌سازی گزارش‌ها می‌باشد.");

            var cleanCode = reportCode.Trim().ToUpperInvariant();
            var report = await _reportingRepository.GetReportDefinitionByCodeAsync(cleanCode, ct);
            if (report == null)
                return Result.Failure<bool>($"گزارش با کد '{cleanCode}' یافت نشد.");

            var newStatus = explicitStatus ?? !report.IsActive;
            report.SetActive(newStatus, byAdmin: true);
            await _reportingRepository.UpdateReportDefinitionAsync(report, ct);

            return Result.Success(report.IsActive);
        }
        catch (Exception ex)
        {
            return Result.Failure<bool>($"خطا در به‌روزرسانی وضعیت گزارش: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteReportAsync(
        string reportCode, 
        string? userRole = null, 
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(reportCode))
                return Result.Failure<bool>("کد گزارش مشخص نشده است.");

            var isAdmin = string.Equals(userRole, "Admin", StringComparison.OrdinalIgnoreCase);
            if (!isAdmin)
                return Result.Failure<bool>("تنها مدیر ارشد سامانه (Admin) مجاز به حذف گزارش‌ها می‌باشد.");

            var cleanCode = reportCode.Trim().ToUpperInvariant();
            var report = await _reportingRepository.GetReportDefinitionByCodeAsync(cleanCode, ct);
            if (report == null)
                return Result.Failure<bool>($"گزارش با کد '{cleanCode}' یافت نشد.");

            // 1. If custom dataset report, delegate to CustomDatasetService (drops SQLite physical table & removes row)
            if (report.DomainSource == ReportDomainSource.CustomUploadedDataset || cleanCode.StartsWith("REP_CUSTOM_"))
            {
                var customDeleteResult = await _customDatasetService.DeleteCustomDatasetAsync(cleanCode, ct);
                if (customDeleteResult.IsFailure)
                    return Result.Failure<bool>(customDeleteResult.Error);

                return Result.Success(true);
            }

            // 2. If system report, guard against hard deletion, advise deactivation
            if (report.IsSystemReport)
            {
                return Result.Failure<bool>("گزارش‌های مصوب پایه سیستمی قابل حذف فیزیکی نیستند؛ در صورت تمایل می‌توانید آن‌ها را بایگانی/غیرفعال نمایید.");
            }

            // 3. Custom builder report (non-system, non-dataset)
            await _reportingRepository.DeleteReportDefinitionAsync(report.Id, ct);
            return Result.Success(true);
        }
        catch (Exception ex)
        {
            return Result.Failure<bool>($"خطا در حذف گزارش: {ex.Message}");
        }
    }

    private async Task<(List<Dictionary<string, object?>> Rows, Dictionary<string, object?> Summary, int TotalCount)> ExecuteStandardQueryAsync(
        string reportCode, 
        ReportFilterParametersDto parameters, 
        List<Guid>? effectiveOfficeIds, 
        CancellationToken ct)
    {
        return reportCode.ToUpperInvariant() switch
        {
            "REP_PAYROLL_BUDGET_UTIL" => await QueryPayrollBudgetUtilAsync(parameters, effectiveOfficeIds, ct),
            "REP_PAYROLL_LABOR_CAP" => await QueryPayrollLaborCapAsync(parameters, effectiveOfficeIds, ct),
            "REP_PAYROLL_MONTHLY_DEPT" => await QueryPayrollMonthlyDeptAsync(parameters, effectiveOfficeIds, ct),
            "REP_REFUND_SOURCE_SUMMARY" => await QueryRefundSourceSummaryAsync(parameters, effectiveOfficeIds, ct),
            "REP_REFUND_INTEREST_LIABILITY" => await QueryRefundInterestLiabilityAsync(parameters, effectiveOfficeIds, ct),
            "REP_REFUND_WORKFLOW_BOTTLENECK" => await QueryRefundWorkflowBottleneckAsync(parameters, effectiveOfficeIds, ct),
            "REP_EMPLOYEE_PERF_SUMMARY" => await QueryEmployeePerfSummaryAsync(parameters, effectiveOfficeIds, ct),
            "REP_EMPLOYEE_ATTENDANCE_LEAVE" => await QueryEmployeeAttendanceLeaveAsync(parameters, effectiveOfficeIds, ct),
            "REP_EXECUTIVE_CROSS_DEPT_KPI" => await QueryExecutiveCrossDeptKpiAsync(parameters, effectiveOfficeIds, ct),
            "REP_AUDIT_SECURITY_LOGS" => await QueryAuditSecurityLogsAsync(parameters, effectiveOfficeIds, ct),
            "REP_SANIM_AUDIT_ASSESSMENT" => await QuerySanimAuditAssessmentAsync(parameters, effectiveOfficeIds, ct),
            _ => (new List<Dictionary<string, object?>>(), new Dictionary<string, object?>(), 0)
        };
    }

    #region Standard Report Query Implementations

    private async Task<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)> QueryPayrollBudgetUtilAsync(
        ReportFilterParametersDto p, List<Guid>? officeIds, CancellationToken ct)
    {
        var cycleId = p.PayrollCycleId;
        if (!cycleId.HasValue)
        {
            var latest = await _db.PayrollCycles.OrderByDescending(c => c.FiscalYear).ThenByDescending(c => c.FiscalMonth).FirstOrDefaultAsync(ct);
            cycleId = latest?.Id;
        }

        var query = _db.PayrollDepartmentEntries.AsNoTracking()
            .Include(d => d.Items)
            .AsQueryable();

        if (cycleId.HasValue)
            query = query.Where(d => d.PayrollCycleId == cycleId.Value);

        if (officeIds != null && officeIds.Count > 0)
        {
            var allowedOfficeNames = await _db.Offices.AsNoTracking()
                .Where(o => officeIds.Contains(o.Id))
                .Select(o => o.Name)
                .ToListAsync(ct);

            query = query.Where(d => allowedOfficeNames.Contains(d.DepartmentName));
        }

        if (!string.IsNullOrWhiteSpace(p.Department))
            query = query.Where(d => d.DepartmentName.Contains(p.Department));

        var depts = await query.ToListAsync(ct);
        int totalCount = depts.Count;

        var projected = depts.Select(d =>
        {
            var allocated = (decimal)(d.BaseOvertimeCap ?? 0);
            var consumed = (decimal)d.Items.Sum(i => i.CalculatedOvertimeAmount ?? 0);
            return new
            {
                d.DepartmentName,
                Allocated = allocated,
                Consumed = consumed,
                Variance = consumed - allocated,
                EmployeeCount = d.Items.Count
            };
        })
        .OrderByDescending(d => d.Variance)
        .Skip((p.PageNumber - 1) * p.PageSize)
        .Take(p.PageSize)
        .ToList();

        var rows = projected.Select(d => new Dictionary<string, object?>
        {
            ["departmentName"] = d.DepartmentName,
            ["allocatedBudget"] = d.Allocated,
            ["consumedAmount"] = d.Consumed,
            ["variance"] = d.Variance,
            ["employeeCount"] = d.EmployeeCount
        }).ToList();

        var summary = new Dictionary<string, object?>
        {
            ["allocatedBudget"] = (decimal)depts.Sum(d => d.BaseOvertimeCap ?? 0),
            ["consumedAmount"] = depts.Sum(d => (decimal)d.Items.Sum(i => i.CalculatedOvertimeAmount ?? 0)),
            ["variance"] = depts.Sum(d => (decimal)d.Items.Sum(i => i.CalculatedOvertimeAmount ?? 0)) - (decimal)depts.Sum(d => d.BaseOvertimeCap ?? 0),
            ["employeeCount"] = depts.Sum(d => d.Items.Count)
        };

        return (rows, summary, totalCount);
    }

    private async Task<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)> QueryPayrollLaborCapAsync(
        ReportFilterParametersDto p, List<Guid>? officeIds, CancellationToken ct)
    {
        var query = _db.PayrollEmployeeItems.AsNoTracking()
            .Include(i => i.DepartmentEntry)
            .Where(i => i.IsLaborPosition);

        if (p.PayrollCycleId.HasValue)
            query = query.Where(i => i.DepartmentEntry != null && i.DepartmentEntry.PayrollCycleId == p.PayrollCycleId.Value);

        if (officeIds != null && officeIds.Count > 0)
        {
            var allowedOfficeNames = await _db.Offices.AsNoTracking()
                .Where(o => officeIds.Contains(o.Id))
                .Select(o => o.Name)
                .ToListAsync(ct);

            query = query.Where(i => i.DepartmentEntry != null && allowedOfficeNames.Contains(i.DepartmentEntry.DepartmentName));
        }

        if (!string.IsNullOrWhiteSpace(p.SearchTerm))
            query = query.Where(i => i.PersonnelNumber.Contains(p.SearchTerm) || i.EmployeeName.Contains(p.SearchTerm));

        int totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(i => i.AdjustedOvertimeRate ?? i.InitialOvertimeRate ?? 0)
            .Skip((p.PageNumber - 1) * p.PageSize)
            .Take(p.PageSize)
            .ToListAsync(ct);

        var rows = items.Select(i =>
        {
            var hours = (decimal)(i.AdjustedOvertimeRate ?? i.InitialOvertimeRate ?? 0);
            return new Dictionary<string, object?>
            {
                ["personnelNumber"] = i.PersonnelNumber,
                ["employeeName"] = i.EmployeeName,
                ["department"] = i.DepartmentEntry?.DepartmentName ?? "",
                ["overtimeHours"] = hours,
                ["violationStatus"] = hours > 120 ? "تخلف (بیش از ۱۲۰ ساعت)" : "رعایت شده (مجاز)"
            };
        }).ToList();

        var allItems = await query.ToListAsync(ct);
        var summary = new Dictionary<string, object?>
        {
            ["overtimeHours"] = (decimal)allItems.Sum(i => i.AdjustedOvertimeRate ?? i.InitialOvertimeRate ?? 0)
        };

        return (rows, summary, totalCount);
    }

    private async Task<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)> QueryPayrollMonthlyDeptAsync(
        ReportFilterParametersDto p, List<Guid>? officeIds, CancellationToken ct)
    {
        var query = _db.PayrollEmployeeItems.AsNoTracking()
            .Include(i => i.DepartmentEntry)
            .AsQueryable();

        if (p.PayrollCycleId.HasValue)
            query = query.Where(i => i.DepartmentEntry != null && i.DepartmentEntry.PayrollCycleId == p.PayrollCycleId.Value);

        if (officeIds != null && officeIds.Count > 0)
        {
            var allowedOfficeNames = await _db.Offices.AsNoTracking()
                .Where(o => officeIds.Contains(o.Id))
                .Select(o => o.Name)
                .ToListAsync(ct);

            query = query.Where(i => i.DepartmentEntry != null && allowedOfficeNames.Contains(i.DepartmentEntry.DepartmentName));
        }

        if (!string.IsNullOrWhiteSpace(p.Department))
            query = query.Where(i => i.DepartmentEntry != null && i.DepartmentEntry.DepartmentName.Contains(p.Department));

        int totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderBy(i => i.DepartmentEntry != null ? i.DepartmentEntry.DepartmentName : "")
            .ThenBy(i => i.PersonnelNumber)
            .Skip((p.PageNumber - 1) * p.PageSize)
            .Take(p.PageSize)
            .ToListAsync(ct);

        var rows = items.Select(i =>
        {
            var otHours = (decimal)(i.AdjustedOvertimeRate ?? i.InitialOvertimeRate ?? 0);
            var otRate = (decimal)(i.BaseOvertimeAmount ?? 0);
            var otAmount = (decimal)(i.CalculatedOvertimeAmount ?? 0);
            var wfRate = (decimal)(i.AdjustedWelfareRate ?? i.InitialWelfareRate ?? 0);
            var wfAmount = (decimal)(i.CalculatedWelfareAmount ?? 0);
            var total = otAmount + wfAmount;

            return new Dictionary<string, object?>
            {
                ["personnelNumber"] = i.PersonnelNumber,
                ["employeeName"] = i.EmployeeName,
                ["departmentName"] = i.DepartmentEntry?.DepartmentName ?? "",
                ["overtimeRate"] = otRate,
                ["overtimeHours"] = otHours,
                ["overtimeAmount"] = otAmount,
                ["welfareRate"] = wfRate,
                ["welfareAmount"] = wfAmount,
                ["totalPaymentAmount"] = total
            };
        }).ToList();

        var summary = new Dictionary<string, object?>
        {
            ["overtimeHours"] = await query.SumAsync(i => (decimal)(i.AdjustedOvertimeRate ?? i.InitialOvertimeRate ?? 0), ct),
            ["overtimeAmount"] = await query.SumAsync(i => (decimal)(i.CalculatedOvertimeAmount ?? 0), ct),
            ["welfareAmount"] = await query.SumAsync(i => (decimal)(i.CalculatedWelfareAmount ?? 0), ct),
            ["totalPaymentAmount"] = await query.SumAsync(i => (decimal)((i.CalculatedOvertimeAmount ?? 0) + (i.CalculatedWelfareAmount ?? 0)), ct)
        };

        return (rows, summary, totalCount);
    }

    private async Task<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)> QueryRefundSourceSummaryAsync(
        ReportFilterParametersDto p, List<Guid>? officeIds, CancellationToken ct)
    {
        var query = _db.TaxRefundCases.AsNoTracking().AsQueryable();

        if (officeIds != null && officeIds.Count > 0)
            query = query.Where(r => r.OfficeId.HasValue && officeIds.Contains(r.OfficeId.Value));

        var cases = await query.ToListAsync(ct);
        var grouped = cases
            .GroupBy(r => r.TaxSource)
            .Select(g => new
            {
                Source = g.Key,
                Count = g.Count(),
                ApprovedAmount = g.Sum(r => r.Breakdown.PrincipalTaxRefund + r.Breakdown.StampDutyRefund + r.Breakdown.OtherRefund + r.Breakdown.PenaltiesRefund + r.Breakdown.DelayDamages),
                DelayInterest = g.Sum(r => r.Breakdown.DelayDamages)
            })
            .ToList();

        var rows = grouped.Select(g => new Dictionary<string, object?>
        {
            ["taxSourceTitle"] = GetPersianTaxSourceTitle(g.Source),
            ["caseCount"] = g.Count,
            ["totalApprovedRefund"] = g.ApprovedAmount,
            ["totalDelayInterest"] = g.DelayInterest
        }).ToList();

        var summary = new Dictionary<string, object?>
        {
            ["caseCount"] = grouped.Sum(g => g.Count),
            ["totalApprovedRefund"] = grouped.Sum(g => g.ApprovedAmount),
            ["totalDelayInterest"] = grouped.Sum(g => g.DelayInterest)
        };

        return (rows, summary, rows.Count);
    }

    private async Task<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)> QueryRefundInterestLiabilityAsync(
        ReportFilterParametersDto p, List<Guid>? officeIds, CancellationToken ct)
    {
        var query = _db.TaxRefundCases.AsNoTracking()
            .Where(r => r.Breakdown.DelayDamages > 0);

        if (officeIds != null && officeIds.Count > 0)
            query = query.Where(r => r.OfficeId.HasValue && officeIds.Contains(r.OfficeId.Value));

        int totalCount = await query.CountAsync(ct);

        var cases = await query
            .OrderByDescending(r => r.Breakdown.DelayDamages)
            .Skip((p.PageNumber - 1) * p.PageSize)
            .Take(p.PageSize)
            .ToListAsync(ct);

        var rows = cases.Select(r => new Dictionary<string, object?>
        {
            ["caseTrackingNumber"] = r.CaseTrackingNumber,
            ["taxpayerName"] = r.TaxpayerName,
            ["requestDate"] = r.AssessmentInfo?.ReturnDateJalali ?? "-",
            ["finalNoticeDate"] = r.AssessmentInfo?.FinalNoticeDateJalali ?? "-",
            ["delayInterestAmount"] = r.Breakdown.DelayDamages
        }).ToList();

        var summary = new Dictionary<string, object?>
        {
            ["delayInterestAmount"] = (decimal)await query.SumAsync(r => (double)r.Breakdown.DelayDamages, ct)
        };

        return (rows, summary, totalCount);
    }

    private async Task<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)> QueryRefundWorkflowBottleneckAsync(
        ReportFilterParametersDto p, List<Guid>? officeIds, CancellationToken ct)
    {
        var query = _db.TaxRefundCases.AsNoTracking()
            .Where(r => r.Status != RefundCaseStatus.TreasuryDisbursed && r.Status != RefundCaseStatus.Rejected);

        if (officeIds != null && officeIds.Count > 0)
            query = query.Where(r => r.OfficeId.HasValue && officeIds.Contains(r.OfficeId.Value));

        int totalCount = await query.CountAsync(ct);

        var list = await query
            .OrderBy(r => r.CreatedAt)
            .Skip((p.PageNumber - 1) * p.PageSize)
            .Take(p.PageSize)
            .ToListAsync(ct);

        var now = DateTime.UtcNow;
        var rows = list.Select(r =>
        {
            var days = (int)(now - r.CreatedAt).TotalDays;
            return new Dictionary<string, object?>
            {
                ["caseTrackingNumber"] = r.CaseTrackingNumber,
                ["taxpayerName"] = r.TaxpayerName,
                ["currentStatus"] = r.Status.ToString(),
                ["daysInStage"] = days,
                ["alertStatus"] = days > 30 ? "بحرانی (>30 روز)" : days > 15 ? "هشدار (>15 روز)" : "عادی"
            };
        }).ToList();

        return (rows, new Dictionary<string, object?>(), totalCount);
    }

    private async Task<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)> QueryEmployeePerfSummaryAsync(
        ReportFilterParametersDto p, List<Guid>? officeIds, CancellationToken ct)
    {
        var query = _db.Employees.AsNoTracking()
            .Include(e => e.PerformanceCapabilities)
            .AsQueryable();

        if (officeIds != null && officeIds.Count > 0)
            query = query.Where(e => e.OfficeId.HasValue && officeIds.Contains(e.OfficeId.Value));

        if (!string.IsNullOrWhiteSpace(p.SearchTerm))
            query = query.Where(e => e.PersonnelNumber.Contains(p.SearchTerm) || (e.FirstName + " " + e.LastName).Contains(p.SearchTerm));

        int totalCount = await query.CountAsync(ct);

        var employees = await query
            .OrderBy(e => e.ServiceUnit)
            .ThenBy(e => e.PersonnelNumber)
            .Skip((p.PageNumber - 1) * p.PageSize)
            .Take(p.PageSize)
            .ToListAsync(ct);

        var rows = employees.Select(e => new Dictionary<string, object?>
        {
            ["personnelNumber"] = e.PersonnelNumber,
            ["employeeName"] = e.FirstName + " " + e.LastName,
            ["serviceUnit"] = e.ServiceUnit,
            ["detectionOfTaxEvasionAmount"] = e.PerformanceCapabilities.Sum(pc => pc.DetectionOfTaxEvasion_Amount),
            ["referredOrExecutedCount"] = e.PerformanceCapabilities.Sum(pc => pc.ReferredOrExecuted_Quantity)
        }).ToList();

        var summary = new Dictionary<string, object?>
        {
            ["detectionOfTaxEvasionAmount"] = (decimal)await _db.PerformanceCapabilities.AsNoTracking().SumAsync(p => (double)p.DetectionOfTaxEvasion_Amount, ct)
        };

        return (rows, summary, totalCount);
    }

    private async Task<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)> QueryEmployeeAttendanceLeaveAsync(
        ReportFilterParametersDto p, List<Guid>? officeIds, CancellationToken ct)
    {
        var query = _db.Employees.AsNoTracking()
            .Include(e => e.AdministrativeStatus)
            .AsQueryable();

        if (officeIds != null && officeIds.Count > 0)
            query = query.Where(e => e.OfficeId.HasValue && officeIds.Contains(e.OfficeId.Value));

        int totalCount = await query.CountAsync(ct);

        var employees = await query
            .OrderBy(e => e.PersonnelNumber)
            .Skip((p.PageNumber - 1) * p.PageSize)
            .Take(p.PageSize)
            .ToListAsync(ct);

        var rows = employees.Select(e => new Dictionary<string, object?>
        {
            ["personnelNumber"] = e.PersonnelNumber,
            ["employeeName"] = e.FirstName + " " + e.LastName,
            ["serviceUnit"] = e.ServiceUnit,
            ["missionDays"] = e.AdministrativeStatus?.MissionDays ?? 0,
            ["sickLeaveDays"] = e.AdministrativeStatus?.SickLeaveDays ?? 0,
            ["absenceHours"] = e.AdministrativeStatus?.DelayAndAbsenceHours ?? 0
        }).ToList();

        var adminQuery = _db.Employees.AsNoTracking()
            .Where(e => e.AdministrativeStatus != null)
            .Select(e => e.AdministrativeStatus!);

        var summary = new Dictionary<string, object?>
        {
            ["missionDays"] = await adminQuery.SumAsync(a => a.MissionDays, ct),
            ["sickLeaveDays"] = await adminQuery.SumAsync(a => a.SickLeaveDays, ct),
            ["absenceHours"] = await adminQuery.SumAsync(a => a.DelayAndAbsenceHours, ct)
        };

        return (rows, summary, totalCount);
    }

    private async Task<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)> QueryExecutiveCrossDeptKpiAsync(
        ReportFilterParametersDto p, List<Guid>? officeIds, CancellationToken ct)
    {
        var query = _db.PayrollDepartmentEntries.AsNoTracking()
            .Include(d => d.Items)
            .AsQueryable();

        if (officeIds != null && officeIds.Count > 0)
        {
            var allowedOfficeNames = await _db.Offices.AsNoTracking()
                .Where(o => officeIds.Contains(o.Id))
                .Select(o => o.Name)
                .ToListAsync(ct);

            query = query.Where(d => allowedOfficeNames.Contains(d.DepartmentName));
        }

        var depts = await query.ToListAsync(ct);

        var list = depts
            .GroupBy(d => d.DepartmentName)
            .Select(g => new
            {
                Department = g.Key,
                TotalBudget = (decimal)g.Sum(d => d.BaseOvertimeCap ?? 0),
                TotalSpent = g.Sum(d => (decimal)d.Items.Sum(i => i.CalculatedOvertimeAmount ?? 0)),
                StaffCount = g.Sum(d => d.Items.Count)
            })
            .ToList();

        var rows = list.Select(item => new Dictionary<string, object?>
        {
            ["departmentName"] = item.Department,
            ["staffCount"] = item.StaffCount,
            ["overtimePerCapita"] = item.StaffCount > 0 ? Math.Round(item.TotalSpent / item.StaffCount, 0) : 0,
            ["budgetVariance"] = item.TotalSpent - item.TotalBudget,
            ["performanceRank"] = item.TotalSpent <= item.TotalBudget ? "رعایت کامل بودجه" : "فراتر از سقف بودجه"
        }).ToList();

        return (rows, new Dictionary<string, object?>(), rows.Count);
    }

    private async Task<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)> QueryAuditSecurityLogsAsync(
        ReportFilterParametersDto p, List<Guid>? officeIds, CancellationToken ct)
    {
        var query = _db.AuditLogs.AsNoTracking().AsQueryable();
        int totalCount = await query.CountAsync(ct);

        var logs = await query
            .OrderByDescending(l => l.Timestamp)
            .Skip((p.PageNumber - 1) * p.PageSize)
            .Take(p.PageSize)
            .ToListAsync(ct);

        var pc = new PersianCalendar();
        var rows = logs.Select(l => new Dictionary<string, object?>
        {
            ["timestampShamsi"] = $"{pc.GetYear(l.Timestamp):0000}/{pc.GetMonth(l.Timestamp):00}/{pc.GetDayOfMonth(l.Timestamp):00} {l.Timestamp:HH:mm}",
            ["username"] = l.Username ?? "سیستم",
            ["action"] = l.Action,
            ["ipAddress"] = l.IpAddress ?? "127.0.0.1",
            ["entityName"] = l.EntityName,
            ["affectedColumns"] = l.AffectedColumns ?? "-"
        }).ToList();

        return (rows, new Dictionary<string, object?>(), totalCount);
    }

    private async Task<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)> QuerySanimAuditAssessmentAsync(
        ReportFilterParametersDto p, List<Guid>? officeIds, CancellationToken ct)
    {
        var query = _db.SanimAuditAssessments.AsNoTracking().AsQueryable();

        if (officeIds != null && officeIds.Count > 0)
        {
            var allowedOfficeNames = await _db.Offices.AsNoTracking()
                .Where(o => officeIds.Contains(o.Id))
                .Select(o => o.Name)
                .ToListAsync(ct);

            query = query.Where(s => (s.OfficeId.HasValue && officeIds.Contains(s.OfficeId.Value)) 
                                  || allowedOfficeNames.Any(n => s.FinalOfficeName.Contains(n)));
        }

        if (p.FiscalYear.HasValue)
        {
            query = query.Where(s => s.FiscalYear == p.FiscalYear.Value);
        }

        if (!string.IsNullOrWhiteSpace(p.Department))
        {
            query = query.Where(s => s.FinalOfficeName.Contains(p.Department));
        }

        if (!string.IsNullOrWhiteSpace(p.TaxSourceCode))
        {
            query = query.Where(s => s.TaxSource.Contains(p.TaxSourceCode));
        }

        if (!string.IsNullOrWhiteSpace(p.CaseStatus))
        {
            query = query.Where(s => s.AuditStatus.Contains(p.CaseStatus));
        }

        if (!string.IsNullOrWhiteSpace(p.SearchTerm))
        {
            var term = p.SearchTerm.Trim();
            query = query.Where(s => s.TaxpayerName.Contains(term)
                                  || s.TaxpayerTin.Contains(term)
                                  || s.AuditorName.Contains(term)
                                  || (s.DeclarationId != null && s.DeclarationId.Contains(term))
                                  || (s.TaxpayerTrackingCode != null && s.TaxpayerTrackingCode.Contains(term)));
        }

        int totalCount = await query.CountAsync(ct);

        IQueryable<SanimAuditAssessment> orderedQuery;
        if (!string.IsNullOrWhiteSpace(p.SortBy))
        {
            orderedQuery = p.SortBy.ToLowerInvariant() switch
            {
                "id" => p.SortDescending ? query.OrderByDescending(s => s.Id) : query.OrderBy(s => s.Id),
                "taxpayertin" => p.SortDescending ? query.OrderByDescending(s => s.TaxpayerTin) : query.OrderBy(s => s.TaxpayerTin),
                "taxpayername" => p.SortDescending ? query.OrderByDescending(s => s.TaxpayerName) : query.OrderBy(s => s.TaxpayerName),
                "finalofficename" => p.SortDescending ? query.OrderByDescending(s => s.FinalOfficeName) : query.OrderBy(s => s.FinalOfficeName),
                "fiscalyear" => p.SortDescending ? query.OrderByDescending(s => s.FiscalYear) : query.OrderBy(s => s.FiscalYear),
                "taxsource" => p.SortDescending ? query.OrderByDescending(s => s.TaxSource) : query.OrderBy(s => s.TaxSource),
                "auditorname" => p.SortDescending ? query.OrderByDescending(s => s.AuditorName) : query.OrderBy(s => s.AuditorName),
                "auditstatus" => p.SortDescending ? query.OrderByDescending(s => s.AuditStatus) : query.OrderBy(s => s.AuditStatus),
                "declaredtaxamount" => p.SortDescending ? query.OrderByDescending(s => s.DeclaredTaxAmount) : query.OrderBy(s => s.DeclaredTaxAmount),
                "assessedtaxamount" => p.SortDescending ? query.OrderByDescending(s => s.AssessedTaxAmount) : query.OrderBy(s => s.AssessedTaxAmount),
                "finaltaxamount" => p.SortDescending ? query.OrderByDescending(s => s.FinalTaxAmount) : query.OrderBy(s => s.FinalTaxAmount),
                "daysnoticetofinal" => p.SortDescending ? query.OrderByDescending(s => s.DaysNoticeToFinal) : query.OrderBy(s => s.DaysNoticeToFinal),
                _ => p.SortDescending ? query.OrderByDescending(s => s.Id) : query.OrderBy(s => s.Id)
            };
        }
        else
        {
            orderedQuery = query.OrderBy(s => s.Id);
        }

        int pageNumber = Math.Max(1, p.PageNumber);
        int pageSize = Math.Clamp(p.PageSize, 1, 5000);

        var items = await orderedQuery
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var rows = items.Select(s => new Dictionary<string, object?>
        {
            ["id"] = s.Id,
            ["taxpayerTin"] = s.TaxpayerTin,
            ["taxpayerName"] = s.TaxpayerName,
            ["finalOfficeName"] = s.FinalOfficeName,
            ["fiscalYear"] = s.FiscalYear,
            ["taxSource"] = s.TaxSource,
            ["taxPeriod"] = s.TaxPeriod,
            ["auditorName"] = s.AuditorName,
            ["auditStatus"] = s.AuditStatus,
            ["declaredTaxAmount"] = s.DeclaredTaxAmount,
            ["assessedTaxAmount"] = s.AssessedTaxAmount,
            ["finalTaxAmount"] = s.FinalTaxAmount,
            ["assessmentNoticeDateJalali"] = s.AssessmentNoticeDateJalali ?? "-",
            ["finalNoticeDateJalali"] = s.FinalNoticeDateJalali ?? "-",
            ["daysNoticeToFinal"] = s.DaysNoticeToFinal
        }).ToList();

        var summary = new Dictionary<string, object?>
        {
            ["declaredTaxAmount"] = (decimal)await query.SumAsync(s => (double)s.DeclaredTaxAmount, ct),
            ["assessedTaxAmount"] = (decimal)await query.SumAsync(s => (double)s.AssessedTaxAmount, ct),
            ["finalTaxAmount"] = (decimal)await query.SumAsync(s => (double)s.FinalTaxAmount, ct)
        };

        return (rows, summary, totalCount);
    }

    #endregion

    #region Helper Methods

    private async Task<List<MonthlyTrendPointDto>> GetMonthlyTrendPointsAsync(
        int? fiscalYear, 
        List<Guid>? officeIds, 
        CancellationToken ct)
    {
        var cycleQuery = _db.PayrollCycles.AsNoTracking()
            .Include(c => c.DepartmentEntries)
                .ThenInclude(d => d.Items)
            .AsQueryable();

        if (fiscalYear.HasValue)
            cycleQuery = cycleQuery.Where(c => c.FiscalYear == fiscalYear.Value);

        var recentCycles = await cycleQuery
            .OrderByDescending(c => c.FiscalYear)
            .ThenByDescending(c => c.FiscalMonth)
            .Take(6)
            .ToListAsync(ct);

        recentCycles.Reverse(); // Chronological order

        List<string>? allowedOfficeNames = null;
        if (officeIds != null && officeIds.Count > 0)
        {
            allowedOfficeNames = await _db.Offices.AsNoTracking()
                .Where(o => officeIds.Contains(o.Id))
                .Select(o => o.Name)
                .ToListAsync(ct);
        }

        var trends = new List<MonthlyTrendPointDto>();
        foreach (var cycle in recentCycles)
        {
            var depts = cycle.DepartmentEntries.AsEnumerable();
            if (allowedOfficeNames != null && allowedOfficeNames.Count > 0)
            {
                depts = depts.Where(d => allowedOfficeNames.Contains(d.DepartmentName));
            }

            var overtimeAmount = depts.Sum(d => (decimal)d.Items.Sum(i => i.CalculatedOvertimeAmount ?? 0));
            var welfareAmount = depts.Sum(d => (decimal)d.Items.Sum(i => i.CalculatedWelfareAmount ?? 0));

            var refundQuery = _db.TaxRefundCases.AsNoTracking().Where(r => r.TaxYear == cycle.FiscalYear);
            if (officeIds != null && officeIds.Count > 0)
                refundQuery = refundQuery.Where(r => r.OfficeId.HasValue && officeIds.Contains(r.OfficeId.Value));

            var refundAmount = (decimal)await refundQuery.SumAsync(r => (double)(r.Breakdown.PrincipalTaxRefund + r.Breakdown.DelayDamages), ct);

            trends.Add(new MonthlyTrendPointDto
            {
                MonthNameShamsi = $"{GetPersianMonthName(cycle.FiscalMonth)} {cycle.FiscalYear}",
                OvertimeAmount = overtimeAmount,
                WelfareAmount = welfareAmount,
                RefundAmount = Math.Round(refundAmount / 12, 0)
            });
        }

        if (trends.Count == 0)
        {
            var year = fiscalYear ?? 1404;
            trends.AddRange(new[]
            {
                new MonthlyTrendPointDto { MonthNameShamsi = $"فروردین {year}", OvertimeAmount = 0, WelfareAmount = 0, RefundAmount = 0 },
                new MonthlyTrendPointDto { MonthNameShamsi = $"اردیبهشت {year}", OvertimeAmount = 0, WelfareAmount = 0, RefundAmount = 0 },
                new MonthlyTrendPointDto { MonthNameShamsi = $"خرداد {year}", OvertimeAmount = 0, WelfareAmount = 0, RefundAmount = 0 },
                new MonthlyTrendPointDto { MonthNameShamsi = $"تیر {year}", OvertimeAmount = 0, WelfareAmount = 0, RefundAmount = 0 },
                new MonthlyTrendPointDto { MonthNameShamsi = $"مرداد {year}", OvertimeAmount = 0, WelfareAmount = 0, RefundAmount = 0 },
                new MonthlyTrendPointDto { MonthNameShamsi = $"شهریور {year}", OvertimeAmount = 0, WelfareAmount = 0, RefundAmount = 0 }
            });
        }

        return trends;
    }

    private async Task<List<RecentAuditActivityDto>> GetRecentAuditActivitiesAsync(CancellationToken ct)
    {
        var pc = new PersianCalendar();
        var audits = await _db.AuditLogs.AsNoTracking()
            .OrderByDescending(a => a.Timestamp)
            .Take(8)
            .ToListAsync(ct);

        return audits.Select(a => new RecentAuditActivityDto
        {
            Action = a.Action,
            Username = a.Username ?? "سیستم",
            Description = $"{a.Action} در {a.EntityName}",
            Timestamp = a.Timestamp,
            ShamsiTimestamp = $"{pc.GetYear(a.Timestamp):0000}/{pc.GetMonth(a.Timestamp):00}/{pc.GetDayOfMonth(a.Timestamp):00} {a.Timestamp:HH:mm}"
        }).ToList();
    }

    private static List<ReportColumnMetadataDto> ParseColumnsFromConfigurationJson(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            JsonElement columnsElem;
            if (doc.RootElement.TryGetProperty("columns", out columnsElem) ||
                doc.RootElement.TryGetProperty("Columns", out columnsElem))
            {
                var list = new List<ReportColumnMetadataDto>();
                foreach (var item in columnsElem.EnumerateArray())
                {
                    string fieldName = "";
                    if (item.TryGetProperty("fieldName", out var fn) || item.TryGetProperty("FieldName", out fn))
                        fieldName = fn.GetString() ?? "";

                    string persianLabel = "";
                    if (item.TryGetProperty("persianLabel", out var pl) || item.TryGetProperty("PersianLabel", out pl))
                        persianLabel = pl.GetString() ?? "";

                    string dataType = "string";
                    if (item.TryGetProperty("dataType", out var dt) || item.TryGetProperty("DataType", out dt))
                        dataType = dt.GetString() ?? "string";

                    bool hasAggregateSum = false;
                    if (item.TryGetProperty("hasAggregateSum", out var hasSum) || item.TryGetProperty("HasAggregateSum", out hasSum))
                        hasAggregateSum = hasSum.GetBoolean();

                    string? aggregate = null;
                    if (item.TryGetProperty("aggregate", out var agg) || item.TryGetProperty("Aggregate", out agg))
                        aggregate = agg.GetString();

                    string alignment = "right";
                    if (item.TryGetProperty("alignment", out var align) || item.TryGetProperty("Alignment", out align))
                        alignment = align.GetString() ?? "right";

                    bool isSortable = true;
                    if (item.TryGetProperty("isSortable", out var sort) || item.TryGetProperty("IsSortable", out sort))
                        isSortable = sort.GetBoolean();

                    bool isVisible = true;
                    if (item.TryGetProperty("isVisible", out var vis) || item.TryGetProperty("IsVisible", out vis))
                        isVisible = vis.GetBoolean();

                    int displayOrder = 0;
                    if (item.TryGetProperty("displayOrder", out var order) || item.TryGetProperty("DisplayOrder", out order))
                        displayOrder = order.GetInt32();

                    list.Add(new ReportColumnMetadataDto
                    {
                        FieldName = fieldName,
                        PersianLabel = persianLabel,
                        DataType = dataType,
                        HasAggregateSum = hasAggregateSum,
                        Aggregate = aggregate,
                        Alignment = alignment,
                        IsSortable = isSortable,
                        IsVisible = isVisible,
                        DisplayOrder = displayOrder
                    });
                }
                return list.OrderBy(c => c.DisplayOrder).ToList();
            }
        }
        catch
        {
            // fallback
        }

        return new List<ReportColumnMetadataDto>();
    }

    private static string BuildFilterSummary(ReportFilterParametersDto p)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(p.Department)) parts.Add($"اداره: {p.Department}");
        if (!string.IsNullOrWhiteSpace(p.ShamsiDateFrom)) parts.Add($"از تاریخ: {p.ShamsiDateFrom}");
        if (!string.IsNullOrWhiteSpace(p.ShamsiDateTo)) parts.Add($"تا تاریخ: {p.ShamsiDateTo}");
        if (!string.IsNullOrWhiteSpace(p.SearchTerm)) parts.Add($"جستجو: {p.SearchTerm}");
        return parts.Count > 0 ? string.Join(" | ", parts) : "بدون فیلتر";
    }

    private static string GetPersianMonthName(int month) => month switch
    {
        1 => "فروردین",
        2 => "اردیبهشت",
        3 => "خرداد",
        4 => "تیر",
        5 => "مرداد",
        6 => "شهریور",
        7 => "مهر",
        8 => "آبان",
        9 => "آذر",
        10 => "دی",
        11 => "بهمن",
        12 => "اسفند",
        _ => $"ماه {month}"
    };

    private static string GetPersianTaxSourceTitle(TaxSourceType source) => source switch
    {
        TaxSourceType.CorporateIncome => "عملکرد شرکت‌ها",
        TaxSourceType.PersonalBusiness => "عملکرد مشاغل",
        TaxSourceType.SalaryPayroll => "مالیات بر حقوق",
        TaxSourceType.ValueAddedTax => "ارزش افزوده",
        TaxSourceType.PropertyRental => "اجاره املاک",
        TaxSourceType.PropertyTransfer => "نقل و انتقال",
        TaxSourceType.Vehicles => "خودرو",
        _ => "سایر"
    };

    #endregion
}
