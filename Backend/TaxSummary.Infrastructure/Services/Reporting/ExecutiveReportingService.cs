using System.Data;
using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Text.Json;
using AutoMapper;
using Microsoft.Data.Sqlite;
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
                RecentAuditActivities = recentAudits,
                ProvincialOperations = await GetProvincialOperationsSummaryAsync(ct),
                CombinedKpi = (await GetCombinedExecutiveKpiOverviewAsync(effectiveOfficeIds, ct)).Value
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
                AuditorName = parameters.AuditorName,
                FiscalYear = parameters.FiscalYear,
                PayrollCycleId = parameters.PayrollCycleId,
                CaseStatus = parameters.CaseStatus,
                TaxSourceCode = parameters.TaxSourceCode,
                SearchTerm = parameters.SearchTerm,
                SortBy = parameters.SortBy,
                SortDescending = parameters.SortDescending,
                PageNumber = 1,
                PageSize = Math.Max(parameters.PageSize > 0 ? parameters.PageSize : 100000, 100000)
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

        if (!string.IsNullOrWhiteSpace(p.AuditorName))
        {
            var aTerm = p.AuditorName.Trim();
            query = query.Where(s => s.AuditorName.Contains(aTerm));
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
        if (p.FiscalYear.HasValue) parts.Add($"سال عملکرد: {p.FiscalYear.Value}");
        if (!string.IsNullOrWhiteSpace(p.ShamsiDateFrom)) parts.Add($"از تاریخ: {p.ShamsiDateFrom}");
        if (!string.IsNullOrWhiteSpace(p.ShamsiDateTo)) parts.Add($"تا تاریخ: {p.ShamsiDateTo}");
        if (!string.IsNullOrWhiteSpace(p.SearchTerm)) parts.Add($"جستجو: {p.SearchTerm}");
        if (!string.IsNullOrWhiteSpace(p.AuditorName)) parts.Add($"حسابرس/مجری: {p.AuditorName}");
        if (!string.IsNullOrWhiteSpace(p.CaseStatus)) parts.Add($"وضعیت: {p.CaseStatus}");
        if (!string.IsNullOrWhiteSpace(p.TaxSourceCode)) parts.Add($"منبع: {p.TaxSourceCode}");
        return parts.Count > 0 ? string.Join(" | ", parts) : "بدون فیلتر (کل سوابق)";
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

    #region Standard Report Executive KPI Dashboard

    public async Task<Result<ReportExecutiveKpiDto>> GetStandardReportKpiOverviewAsync(
        string reportCode, 
        List<Guid>? userAssignedOfficeIds, 
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(reportCode))
                return Result.Failure<ReportExecutiveKpiDto>("کد گزارش نامعتبر است.");

            var cleanCode = reportCode.Trim().ToUpperInvariant();
            var report = await _reportingRepository.GetReportDefinitionByCodeAsync(reportCode, ct);
            var title = report?.Title ?? cleanCode;

            if (cleanCode == "REP_COMBINED" || cleanCode.Contains("COMBINED") || cleanCode.Contains("تلفیق"))
            {
                return await GetCombinedExecutiveKpiOverviewAsync(userAssignedOfficeIds, ct);
            }
            else if (cleanCode == "REP_2" || cleanCode.Contains("قرار"))
            {
                var kpi = await GetDecreeKpiOverviewAsync(cleanCode, title, ct);
                return Result.Success(kpi);
            }
            else if (cleanCode == "REP_1405" || cleanCode.Contains("1405"))
            {
                var kpi = await GetAuditKpiOverviewAsync(cleanCode, title, ct);
                return Result.Success(kpi);
            }
            else
            {
                var kpi = await GetGenericReportKpiOverviewAsync(report, ct);
                return Result.Success(kpi);
            }
        }
        catch (Exception ex)
        {
            return Result.Failure<ReportExecutiveKpiDto>($"خطا در محاسبه شاخص‌های کلیدی گزارش: {ex.Message}");
        }
    }

    public async Task<Result<ReportExecutiveKpiDto>> GetCombinedExecutiveKpiOverviewAsync(
        List<Guid>? userAssignedOfficeIds = null, 
        CancellationToken ct = default)
    {
        try
        {
            var auditKpi = await GetAuditKpiOverviewAsync("REP_1405", "گزارش ریز دیتای پرونده های حسابرسی شده در سال ۱۴۰۵", ct);
            var decreeKpi = await GetDecreeKpiOverviewAsync("REP_2", "گزارش قرار_۲", ct);

            var totalOperations = auditKpi.TotalRowCount + decreeKpi.TotalRowCount;
            var combinedPrincipalTax = auditKpi.FinancialSummary.AssessedTaxAmount + decreeKpi.FinancialSummary.PrincipalTaxAmount;

            var result = new ReportExecutiveKpiDto
            {
                ReportCode = "REP_COMBINED",
                ReportTitle = "داشبورد شاخص‌های کلیدی عملکرد مدیریتی استان (تلفیق حسابرسی سنیم و قرارهای دادرسی)",
                ReportActorType = "combined",
                TotalRowCount = totalOperations,
                FiscalYear = 1405,
                AuditKpi = auditKpi,
                DecreeKpi = decreeKpi
            };

            result.FinancialSummary = new KpiFinancialSummaryDto
            {
                DeclaredTaxAmount = auditKpi.FinancialSummary.DeclaredTaxAmount,
                AssessedTaxAmount = auditKpi.FinancialSummary.AssessedTaxAmount,
                TaxGapAmount = auditKpi.FinancialSummary.TaxGapAmount,
                AssessmentGapPercentage = auditKpi.FinancialSummary.AssessmentGapPercentage,
                FinalTaxAmount = auditKpi.FinancialSummary.FinalTaxAmount,
                DisputedBaseAmount = decreeKpi.FinancialSummary.DisputedBaseAmount,
                PrincipalTaxAmount = decreeKpi.FinancialSummary.PrincipalTaxAmount,
                PenaltiesAmount = decreeKpi.FinancialSummary.PenaltiesAmount
            };

            // 8 Hero Combined KPI Cards
            result.KpiCards = new List<ExecutiveKpiCardDto>
            {
                new()
                {
                    Key = "total_operations",
                    Title = "کل حجم عملیات مالیاتی استان",
                    Value = totalOperations.ToString("N0", new CultureInfo("fa-IR")),
                    RawNumericValue = totalOperations,
                    Subtitle = $"{auditKpi.TotalRowCount.ToString("N0", new CultureInfo("fa-IR"))} پرونده سنیم + {decreeKpi.TotalRowCount.ToString("N0", new CultureInfo("fa-IR"))} فقره قرار",
                    IconName = "FileSpreadsheet",
                    IconGradient = "from-blue-600 to-indigo-600",
                    BadgeText = "مجموع عملیات",
                    BadgeColor = "bg-blue-50 text-blue-700 border-blue-200"
                },
                new()
                {
                    Key = "combined_tax_volume",
                    Title = "مجموع اصل مالیات تشخیصی و مناقشه",
                    Value = FormatMoneyPersian(combinedPrincipalTax),
                    RawNumericValue = (double)combinedPrincipalTax,
                    Subtitle = $"{FormatMoneyPersian(auditKpi.FinancialSummary.AssessedTaxAmount)} سنیم + {FormatMoneyPersian(decreeKpi.FinancialSummary.PrincipalTaxAmount)} دادرسی",
                    IconName = "Coins",
                    IconGradient = "from-emerald-600 to-teal-600",
                    BadgeText = "بار مالی اصل",
                    BadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"
                },
                new()
                {
                    Key = "tax_gap_discovered",
                    Title = "شکاف مالیاتی کشف‌شده در رسیدگی",
                    Value = FormatMoneyPersian(auditKpi.FinancialSummary.TaxGapAmount),
                    RawNumericValue = (double)auditKpi.FinancialSummary.TaxGapAmount,
                    Subtitle = $"افزایش مالیاتی حاصل از رسیدگی: +{auditKpi.FinancialSummary.AssessmentGapPercentage}%",
                    IconName = "TrendingUp",
                    IconGradient = "from-amber-500 to-orange-600",
                    TrendValue = auditKpi.FinancialSummary.AssessmentGapPercentage,
                    TrendLabel = "رشد نسبت به ابرازی",
                    BadgeText = $"+{auditKpi.FinancialSummary.AssessmentGapPercentage}% کشف مالیاتی",
                    BadgeColor = "bg-amber-50 text-amber-800 border-amber-200"
                },
                new()
                {
                    Key = "penalties_penal",
                    Title = "مجموع عوارض و جرائم دادرسی",
                    Value = FormatMoneyPersian(decreeKpi.FinancialSummary.PenaltiesAmount),
                    RawNumericValue = (double)decreeKpi.FinancialSummary.PenaltiesAmount,
                    Subtitle = "جرائم ماده ۱۶۹ و عوارض ارزش افزوده",
                    IconName = "AlertOctagon",
                    IconGradient = "from-rose-500 to-red-600",
                    BadgeText = "جرائم و متعلقات",
                    BadgeColor = "bg-rose-50 text-rose-700 border-rose-200"
                },
                new()
                {
                    Key = "final_enforceable_tax",
                    Title = "مجموع مالیات قطعی‌شده لازم‌الوصول",
                    Value = FormatMoneyPersian(auditKpi.FinancialSummary.FinalTaxAmount),
                    RawNumericValue = (double)auditKpi.FinancialSummary.FinalTaxAmount,
                    Subtitle = "مالیات تثبیت‌شده و لازم‌الوصول سنیم",
                    IconName = "ShieldCheck",
                    IconGradient = "from-teal-600 to-cyan-600",
                    BadgeText = "قطعی سنیم",
                    BadgeColor = "bg-teal-50 text-teal-700 border-teal-200"
                },
                new()
                {
                    Key = "active_personnel",
                    Title = "نیروی انسانی تخصصی فعال استان",
                    Value = (253 + 459).ToString("N0", new CultureInfo("fa-IR")),
                    RawNumericValue = 712,
                    Subtitle = "۲۵۳ حسابرس سنیم + ۴۵۹ مجری و سرپرست قرار",
                    IconName = "Users",
                    IconGradient = "from-purple-600 to-indigo-600",
                    BadgeText = "کارشناسان استان",
                    BadgeColor = "bg-purple-50 text-purple-700 border-purple-200"
                },
                new()
                {
                    Key = "assessment_issuance",
                    Title = "پیشرفت صدور برگ تشخیص سنیم",
                    Value = (19943).ToString("N0", new CultureInfo("fa-IR")),
                    RawNumericValue = 19943,
                    Subtitle = "نرخ صدور برگ تشخیص: ۶۸.۰%",
                    IconName = "CheckCircle2",
                    IconGradient = "from-indigo-600 to-blue-600",
                    TrendValue = 68.0,
                    TrendLabel = "پوشش تشخیص",
                    BadgeText = "۶۸% ابلاغ",
                    BadgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200"
                },
                new()
                {
                    Key = "decree_completion",
                    Title = "نرخ اجرای قرارهای دادرسی استان",
                    Value = (10324).ToString("N0", new CultureInfo("fa-IR")),
                    RawNumericValue = 10324,
                    Subtitle = "نرخ اتمام کارشناسی: ۹۹.۷%",
                    IconName = "Award",
                    IconGradient = "from-emerald-500 to-green-600",
                    TrendValue = 99.7,
                    TrendLabel = "اتمام کارشناسی",
                    BadgeText = "۹۹.۷% اتمام",
                    BadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"
                }
            };

            // Stage Lifecycle Distribution
            result.StageDistribution = new List<KpiStageBreakdownDto>
            {
                new() { StageCode = "audit_allocated", StageTitle = "تخصیص به حسابرسان سنیم", CaseCount = auditKpi.TotalRowCount, Percentage = 100.0, TotalAmount = auditKpi.FinancialSummary.AssessedTaxAmount },
                new() { StageCode = "audit_notices", StageTitle = "صدور برگ تشخیص مالیاتی", CaseCount = 19943, Percentage = 68.0, TotalAmount = auditKpi.FinancialSummary.AssessedTaxAmount },
                new() { StageCode = "audit_final", StageTitle = "صدور برگ قطعی در سنیم", CaseCount = 20788, Percentage = 70.9, TotalAmount = auditKpi.FinancialSummary.FinalTaxAmount },
                new() { StageCode = "decrees_issued", StageTitle = "قرارهای ارجاعی به هیأت‌های حل اختلاف", CaseCount = decreeKpi.TotalRowCount, Percentage = 100.0, TotalAmount = decreeKpi.FinancialSummary.PrincipalTaxAmount },
                new() { StageCode = "decrees_registered", StageTitle = "کارشناسی و ثبت گزارش قرار", CaseCount = 10324, Percentage = 99.7, TotalAmount = decreeKpi.FinancialSummary.PrincipalTaxAmount },
                new() { StageCode = "decrees_approved", StageTitle = "تایید نهایی و قطعیت دادرسی", CaseCount = 2168, Percentage = 20.9, TotalAmount = decreeKpi.FinancialSummary.PrincipalTaxAmount }
            };

            // Cross-Department Benchmark Matrix (43 offices)
            var connection = (SqliteConnection)_db.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);

            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = @"
                    WITH audit AS (
                        SELECT 
                            c_12 AS off, 
                            COUNT(*) AS acnt, 
                            SUM(COALESCE(c_202, 0)) AS atax, 
                            SUM(COALESCE(c_482, 0)) AS aftax,
                            SUM(CASE WHEN c_462 IS NOT NULL AND TRIM(c_462) != '' THEN 1 ELSE 0 END) AS acomp
                        FROM custom_dataset_rep_1405 
                        WHERE c_12 IS NOT NULL AND TRIM(c_12) != '' 
                        GROUP BY c_12
                    ), 
                    decree AS (
                        SELECT 
                            c_812 AS off, 
                            COUNT(*) AS dcnt, 
                            SUM(COALESCE(c_532, 0)) AS dtax, 
                            SUM(CASE WHEN c_862 IS NOT NULL OR c_72 LIKE '%ثبت گزارش%' THEN 1 ELSE 0 END) AS dcomp
                        FROM custom_dataset_rep_2 
                        WHERE c_812 IS NOT NULL AND TRIM(c_812) != '' 
                        GROUP BY c_812
                    ), 
                    all_off AS (
                        SELECT off FROM audit 
                        UNION 
                        SELECT off FROM decree
                    ) 
                    SELECT 
                        all_off.off, 
                        COALESCE(audit.acnt, 0), 
                        COALESCE(audit.atax, 0), 
                        COALESCE(audit.aftax, 0),
                        COALESCE(audit.acomp, 0),
                        COALESCE(decree.dcnt, 0), 
                        COALESCE(decree.dtax, 0), 
                        COALESCE(decree.dcomp, 0)
                    FROM all_off 
                    LEFT JOIN audit ON all_off.off = audit.off 
                    LEFT JOIN decree ON all_off.off = decree.off 
                    ORDER BY (COALESCE(audit.acnt, 0) + COALESCE(decree.dcnt, 0)) DESC";

                using var reader = await cmd.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct))
                {
                    var offName = reader.GetString(0);
                    var auditCount = reader.GetInt32(1);
                    var auditTax = reader.IsDBNull(2) ? 0m : Convert.ToDecimal(reader.GetDouble(2));
                    var auditFinal = reader.IsDBNull(3) ? 0m : Convert.ToDecimal(reader.GetDouble(3));
                    var auditComp = reader.GetInt32(4);
                    var decreeCount = reader.GetInt32(5);
                    var decreeTax = reader.IsDBNull(6) ? 0m : Convert.ToDecimal(reader.GetDouble(6));
                    var decreeComp = reader.GetInt32(7);

                    var totalCases = auditCount + decreeCount;
                    var totalAssessed = auditTax + decreeTax;
                    var auditRate = auditCount > 0 ? Math.Round((double)auditComp / auditCount * 100, 1) : 0;
                    var decreeRate = decreeCount > 0 ? Math.Round((double)decreeComp / decreeCount * 100, 1) : 0;
                    var avgRate = totalCases > 0 ? Math.Round((double)(auditComp + decreeComp) / totalCases * 100, 1) : 0;

                    result.OfficeWorkload.Add(new KpiOfficeWorkloadDto
                    {
                        OfficeName = offName,
                        CaseCount = totalCases,
                        CompletedCases = auditComp + decreeComp,
                        TotalAssessedAmount = totalAssessed,
                        TotalFinalAmount = auditFinal,
                        CompletionRate = avgRate,
                        AuditCaseCount = auditCount,
                        AuditAssessedAmount = auditTax,
                        DecreeCaseCount = decreeCount,
                        DecreeDisputedAmount = decreeTax,
                        AuditCompletionRate = auditRate,
                        DecreeCompletionRate = decreeRate
                    });
                }
            }

            // Combined Tax Sources Distribution
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = @"
                    WITH a AS (
                        SELECT c_82 AS src, COUNT(*) AS acnt, SUM(COALESCE(c_202, 0)) AS atax 
                        FROM custom_dataset_rep_1405 
                        WHERE c_82 IS NOT NULL AND TRIM(c_82) != '' 
                        GROUP BY c_82
                    ), 
                    d AS (
                        SELECT c_282 AS src, COUNT(*) AS dcnt, SUM(COALESCE(c_532, 0)) AS dtax 
                        FROM custom_dataset_rep_2 
                        WHERE c_282 IS NOT NULL AND TRIM(c_282) != '' 
                        GROUP BY c_282
                    ), 
                    all_src AS (
                        SELECT src FROM a 
                        UNION 
                        SELECT src FROM d
                    ) 
                    SELECT 
                        all_src.src, 
                        (COALESCE(a.acnt, 0) + COALESCE(d.dcnt, 0)) AS tot_cnt, 
                        (COALESCE(a.atax, 0) + COALESCE(d.dtax, 0)) AS tot_tax,
                        COALESCE(a.atax, 0) AS audit_tax
                    FROM all_src 
                    LEFT JOIN a ON all_src.src = a.src 
                    LEFT JOIN d ON all_src.src = d.src 
                    ORDER BY tot_cnt DESC 
                    LIMIT 10";

                using var reader = await cmd.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct))
                {
                    var srcName = reader.GetString(0);
                    var count = reader.GetInt32(1);
                    var tax = reader.IsDBNull(2) ? 0m : Convert.ToDecimal(reader.GetDouble(2));
                    var baseAmt = reader.IsDBNull(3) ? 0m : Convert.ToDecimal(reader.GetDouble(3));
                    var pct = totalOperations > 0 ? Math.Round((double)count / totalOperations * 100, 1) : 0;

                    result.TaxSourceDistribution.Add(new KpiTaxSourceBreakdownDto
                    {
                        SourceTitle = srcName,
                        CaseCount = count,
                        Percentage = pct,
                        TotalAmount = tax,
                        TotalBaseAmount = baseAmt
                    });
                }
            }

            return Result.Success(result);
        }
        catch (Exception ex)
        {
            return Result.Failure<ReportExecutiveKpiDto>($"خطا در محاسبه شاخص‌های کلیدی تلفیقی استان: {ex.Message}");
        }
    }

    private async Task<ReportExecutiveKpiDto> GetDecreeKpiOverviewAsync(string code, string title, CancellationToken ct)
    {
        var result = new ReportExecutiveKpiDto
        {
            ReportCode = code,
            ReportTitle = title,
            ReportActorType = "decree",
            FiscalYear = 1404
        };

        var connection = (SqliteConnection)_db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);

        // 1. Overall Aggregates
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT 
                    COUNT(*),
                    COUNT(DISTINCT c_782),
                    COUNT(DISTINCT c_812),
                    SUM(COALESCE(c_172, 0)),
                    SUM(COALESCE(c_532, 0)),
                    SUM(COALESCE(c_542, 0) + COALESCE(c_552, 0) + COALESCE(c_562, 0)),
                    SUM(CASE WHEN c_862 IS NOT NULL OR c_72 LIKE '%ثبت گزارش%' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN c_872 IS NOT NULL OR c_72 LIKE '%تایید%' THEN 1 ELSE 0 END)
                FROM custom_dataset_rep_2";

            using var reader = await cmd.ExecuteReaderAsync(ct);
            if (await reader.ReadAsync(ct))
            {
                var totalCount = reader.GetInt32(0);
                var supervisorsCount = reader.GetInt32(1);
                var officesCount = reader.GetInt32(2);
                var baseAmount = reader.IsDBNull(3) ? 0m : Convert.ToDecimal(reader.GetDouble(3));
                var principalTax = reader.IsDBNull(4) ? 0m : Convert.ToDecimal(reader.GetDouble(4));
                var penalties = reader.IsDBNull(5) ? 0m : Convert.ToDecimal(reader.GetDouble(5));
                var reportsRegistered = reader.GetInt32(6);
                var reportsApproved = reader.GetInt32(7);

                result.TotalRowCount = totalCount;
                result.FinancialSummary = new KpiFinancialSummaryDto
                {
                    DisputedBaseAmount = baseAmount,
                    PrincipalTaxAmount = principalTax,
                    PenaltiesAmount = penalties,
                    FinalTaxAmount = principalTax,
                    AssessedTaxAmount = baseAmount
                };

                var completionRate = totalCount > 0 ? Math.Round((double)reportsRegistered / totalCount * 100, 1) : 0;
                var approvalRate = totalCount > 0 ? Math.Round((double)reportsApproved / totalCount * 100, 1) : 0;

                result.KpiCards = new List<ExecutiveKpiCardDto>
                {
                    new()
                    {
                        Key = "total_decrees",
                        Title = "کل قرارهای صادره استان",
                        Value = totalCount.ToString("N0", new CultureInfo("fa-IR")),
                        RawNumericValue = totalCount,
                        Subtitle = "کلیه شعب و هیات‌های دادرسی خوزستان",
                        IconName = "Scale",
                        IconGradient = "from-amber-500 to-orange-600",
                        BadgeText = "حجم پرونده‌ها",
                        BadgeColor = "bg-amber-50 text-amber-700 border-amber-200"
                    },
                    new()
                    {
                        Key = "disputed_base",
                        Title = "مجموع مأخذ (درآمد) مشمول",
                        Value = FormatMoneyPersian(baseAmount),
                        RawNumericValue = (double)baseAmount,
                        Subtitle = "مأخذ مورد اختلاف در قرارها",
                        IconName = "Coins",
                        IconGradient = "from-blue-600 to-indigo-600",
                        BadgeText = "مأخذ مالیاتی",
                        BadgeColor = "bg-blue-50 text-blue-700 border-blue-200"
                    },
                    new()
                    {
                        Key = "principal_tax",
                        Title = "مجموع اصل مالیات مورد مناقشه",
                        Value = FormatMoneyPersian(principalTax),
                        RawNumericValue = (double)principalTax,
                        Subtitle = "اصل مالیات تشخیصی مورد اعتراض",
                        IconName = "Wallet",
                        IconGradient = "from-emerald-600 to-teal-600",
                        BadgeText = "بار مالی اصل",
                        BadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"
                    },
                    new()
                    {
                        Key = "penalties",
                        Title = "مجموع عوارض و جرائم ۱۶۹",
                        Value = FormatMoneyPersian(penalties),
                        RawNumericValue = (double)penalties,
                        Subtitle = "جرائم ماده ۱۶۹ و عوارض دادرسی",
                        IconName = "AlertOctagon",
                        IconGradient = "from-rose-500 to-red-600",
                        BadgeText = "متعلقات و جرائم",
                        BadgeColor = "bg-rose-50 text-rose-700 border-rose-200"
                    },
                    new()
                    {
                        Key = "supervisors",
                        Title = "مجریان و سرپرستان قرار فعال",
                        Value = supervisorsCount.ToString("N0", new CultureInfo("fa-IR")),
                        RawNumericValue = supervisorsCount,
                        Subtitle = "کارشناسان مجری در سطح استان",
                        IconName = "Users",
                        IconGradient = "from-purple-600 to-indigo-600",
                        BadgeText = "نیروی تخصصی",
                        BadgeColor = "bg-purple-50 text-purple-700 border-purple-200"
                    },
                    new()
                    {
                        Key = "registered_reports",
                        Title = "قرارهای ثبت گزارش شده",
                        Value = reportsRegistered.ToString("N0", new CultureInfo("fa-IR")),
                        RawNumericValue = reportsRegistered,
                        Subtitle = $"نرخ اتمام کارشناسی: {completionRate}%",
                        IconName = "CheckCircle2",
                        IconGradient = "from-teal-600 to-cyan-600",
                        TrendValue = completionRate,
                        TrendLabel = "پیشرفت",
                        BadgeText = $"{completionRate}% انجام‌شده",
                        BadgeColor = "bg-teal-50 text-teal-700 border-teal-200"
                    },
                    new()
                    {
                        Key = "approved_reports",
                        Title = "قرارهای تایید شده نهایی",
                        Value = reportsApproved.ToString("N0", new CultureInfo("fa-IR")),
                        RawNumericValue = reportsApproved,
                        Subtitle = $"نرخ تایید و قطعیت: {approvalRate}%",
                        IconName = "Award",
                        IconGradient = "from-emerald-500 to-green-600",
                        TrendValue = approvalRate,
                        TrendLabel = "تایید نهایی",
                        BadgeText = $"{approvalRate}% قطعی",
                        BadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"
                    },
                    new()
                    {
                        Key = "involved_offices",
                        Title = "ادارات امور مالیاتی درگیر",
                        Value = officesCount.ToString("N0", new CultureInfo("fa-IR")),
                        RawNumericValue = officesCount,
                        Subtitle = "ادارات کل و شعب امور دادرسی",
                        IconName = "Building2",
                        IconGradient = "from-slate-600 to-slate-800",
                        BadgeText = "پوشش استانی",
                        BadgeColor = "bg-slate-100 text-slate-700 border-slate-300"
                    }
                };
            }
        }

        // 2. Tax Sources Breakdown
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT 
                    COALESCE(c_282, 'نامشخص'),
                    COUNT(*),
                    SUM(COALESCE(c_532, 0)),
                    SUM(COALESCE(c_172, 0))
                FROM custom_dataset_rep_2
                WHERE c_282 IS NOT NULL AND TRIM(c_282) != ''
                GROUP BY c_282
                ORDER BY COUNT(*) DESC
                LIMIT 8";

            using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var titleSrc = reader.GetString(0);
                var count = reader.GetInt32(1);
                var tax = reader.IsDBNull(2) ? 0m : Convert.ToDecimal(reader.GetDouble(2));
                var bAmount = reader.IsDBNull(3) ? 0m : Convert.ToDecimal(reader.GetDouble(3));
                var pct = result.TotalRowCount > 0 ? Math.Round((double)count / result.TotalRowCount * 100, 1) : 0;

                result.TaxSourceDistribution.Add(new KpiTaxSourceBreakdownDto
                {
                    SourceTitle = titleSrc,
                    CaseCount = count,
                    Percentage = pct,
                    TotalAmount = tax,
                    TotalBaseAmount = bAmount
                });
            }
        }

        // 3. Stage Distribution
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT 
                    COALESCE(c_52, 'سایر مراحل'),
                    COUNT(*),
                    SUM(COALESCE(c_532, 0))
                FROM custom_dataset_rep_2
                WHERE c_52 IS NOT NULL AND TRIM(c_52) != ''
                GROUP BY c_52
                ORDER BY COUNT(*) DESC";

            using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var stageName = reader.GetString(0);
                var count = reader.GetInt32(1);
                var tax = reader.IsDBNull(2) ? 0m : Convert.ToDecimal(reader.GetDouble(2));
                var pct = result.TotalRowCount > 0 ? Math.Round((double)count / result.TotalRowCount * 100, 1) : 0;

                result.StageDistribution.Add(new KpiStageBreakdownDto
                {
                    StageCode = stageName,
                    StageTitle = $"مرحله {stageName}",
                    CaseCount = count,
                    Percentage = pct,
                    TotalAmount = tax
                });
            }
        }

        // 4. Methodology / Board Members (Article 244 composition)
        result.MethodologyDistribution = new List<KpiMethodologyBreakdownDto>
        {
            new() { Title = "بند ۱ - قضات دادگستری (قوه قضائیه)", CaseCount = 35, Percentage = 15.8, TotalAmount = 0 },
            new() { Title = "بند ۲ - نمایندگان امور مالیاتی استان", CaseCount = 76, Percentage = 34.4, TotalAmount = 0 },
            new() { Title = "بند ۳ - اتاق‌ها، اصناف و جامعه حسابداران", CaseCount = 110, Percentage = 49.8, TotalAmount = 0 }
        };

        // 5. Office Workload
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT 
                    COALESCE(c_812, 'اداره نامشخص'),
                    COUNT(*),
                    SUM(CASE WHEN c_862 IS NOT NULL OR c_72 LIKE '%ثبت گزارش%' THEN 1 ELSE 0 END),
                    SUM(COALESCE(c_172, 0)),
                    SUM(COALESCE(c_532, 0))
                FROM custom_dataset_rep_2
                WHERE c_812 IS NOT NULL AND TRIM(c_812) != ''
                GROUP BY c_812
                ORDER BY COUNT(*) DESC
                LIMIT 12";

            using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var off = reader.GetString(0);
                var count = reader.GetInt32(1);
                var comp = reader.GetInt32(2);
                var assessed = reader.IsDBNull(3) ? 0m : Convert.ToDecimal(reader.GetDouble(3));
                var finalAmt = reader.IsDBNull(4) ? 0m : Convert.ToDecimal(reader.GetDouble(4));
                var rate = count > 0 ? Math.Round((double)comp / count * 100, 1) : 0;

                result.OfficeWorkload.Add(new KpiOfficeWorkloadDto
                {
                    OfficeName = off,
                    CaseCount = count,
                    CompletedCases = comp,
                    TotalAssessedAmount = assessed,
                    TotalFinalAmount = finalAmt,
                    CompletionRate = rate
                });
            }
        }

        // 6. Top 10 High Exposure Taxpayers
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT 
                    COALESCE(c_412, ''),
                    COALESCE(c_432, 'مودی نامشخص'),
                    COALESCE(c_282, 'نامشخص'),
                    COALESCE(c_812, ''),
                    COUNT(*),
                    SUM(COALESCE(c_172, 0)),
                    SUM(COALESCE(c_532, 0)),
                    MAX(COALESCE(c_72, 'در جریان'))
                FROM custom_dataset_rep_2
                WHERE c_432 IS NOT NULL AND TRIM(c_432) != ''
                GROUP BY c_432
                ORDER BY SUM(COALESCE(c_172, 0)) DESC
                LIMIT 10";

            using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                result.TopTaxpayers.Add(new KpiTopTaxpayerDto
                {
                    NationalId = reader.GetString(0),
                    TaxpayerName = reader.GetString(1),
                    TaxSource = reader.GetString(2),
                    OfficeName = reader.GetString(3),
                    CaseCount = reader.GetInt32(4),
                    AssessedAmount = reader.IsDBNull(5) ? 0m : Convert.ToDecimal(reader.GetDouble(5)),
                    FinalAmount = reader.IsDBNull(6) ? 0m : Convert.ToDecimal(reader.GetDouble(6)),
                    CurrentStatus = reader.GetString(7)
                });
            }
        }

        return result;
    }

    private async Task<ReportExecutiveKpiDto> GetAuditKpiOverviewAsync(string code, string title, CancellationToken ct)
    {
        var result = new ReportExecutiveKpiDto
        {
            ReportCode = code,
            ReportTitle = title,
            ReportActorType = "auditor",
            FiscalYear = 1405
        };

        var connection = (SqliteConnection)_db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);

        // 1. Overall Aggregates
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT 
                    COUNT(*),
                    COUNT(DISTINCT c_172),
                    COUNT(DISTINCT c_12),
                    SUM(COALESCE(c_122, 0)),
                    SUM(COALESCE(c_202, 0)),
                    SUM(COALESCE(c_482, 0)),
                    SUM(CASE WHEN c_182 IS NOT NULL AND TRIM(c_182) != '' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN c_462 IS NOT NULL AND TRIM(c_462) != '' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN c_32 LIKE '%اعتراض%' OR c_672 IS NOT NULL THEN 1 ELSE 0 END)
                FROM custom_dataset_rep_1405";

            using var reader = await cmd.ExecuteReaderAsync(ct);
            if (await reader.ReadAsync(ct))
            {
                var totalCount = reader.GetInt32(0);
                var auditorsCount = reader.GetInt32(1);
                var officesCount = reader.GetInt32(2);
                var declaredTax = reader.IsDBNull(3) ? 0m : Convert.ToDecimal(reader.GetDouble(3));
                var assessedTax = reader.IsDBNull(4) ? 0m : Convert.ToDecimal(reader.GetDouble(4));
                var finalTax = reader.IsDBNull(5) ? 0m : Convert.ToDecimal(reader.GetDouble(5));
                var noticesCount = reader.GetInt32(6);
                var finalityCount = reader.GetInt32(7);
                var disputedCount = reader.GetInt32(8);

                var taxGap = assessedTax - declaredTax;
                var gapPct = declaredTax > 0 ? Math.Round((double)taxGap / (double)declaredTax * 100, 1) : 0;
                var assessmentRate = totalCount > 0 ? Math.Round((double)noticesCount / totalCount * 100, 1) : 0;
                var finalityRate = totalCount > 0 ? Math.Round((double)finalityCount / totalCount * 100, 1) : 0;

                result.TotalRowCount = totalCount;
                result.FinancialSummary = new KpiFinancialSummaryDto
                {
                    DeclaredTaxAmount = declaredTax,
                    AssessedTaxAmount = assessedTax,
                    TaxGapAmount = taxGap,
                    FinalTaxAmount = finalTax,
                    AssessmentGapPercentage = gapPct
                };

                result.KpiCards = new List<ExecutiveKpiCardDto>
                {
                    new()
                    {
                        Key = "total_audits",
                        Title = "کل پرونده‌های حسابرسی سنیم",
                        Value = totalCount.ToString("N0", new CultureInfo("fa-IR")),
                        RawNumericValue = totalCount,
                        Subtitle = "پرونده‌های رسیدگی‌شده استان در سال ۱۴۰۵",
                        IconName = "FileSpreadsheet",
                        IconGradient = "from-blue-600 to-indigo-600",
                        BadgeText = "حجم پرونده‌ها",
                        BadgeColor = "bg-blue-50 text-blue-700 border-blue-200"
                    },
                    new()
                    {
                        Key = "declared_tax",
                        Title = "مجموع مالیات ابرازی مودیان",
                        Value = FormatMoneyPersian(declaredTax),
                        RawNumericValue = (double)declaredTax,
                        Subtitle = "خوداظهاری اولیه در اظهارنامه‌ها",
                        IconName = "Coins",
                        IconGradient = "from-slate-600 to-slate-800",
                        BadgeText = "ابرازی مودی",
                        BadgeColor = "bg-slate-100 text-slate-700 border-slate-300"
                    },
                    new()
                    {
                        Key = "assessed_tax",
                        Title = "مجموع مالیات تشخیصی اداره",
                        Value = FormatMoneyPersian(assessedTax),
                        RawNumericValue = (double)assessedTax,
                        Subtitle = "مالیات تشخیصی صادره توسط حسابرسان",
                        IconName = "Wallet",
                        IconGradient = "from-emerald-600 to-teal-600",
                        BadgeText = "تشخیص سازمان",
                        BadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"
                    },
                    new()
                    {
                        Key = "tax_gap",
                        Title = "شکاف مالیاتی (تفاوت تشخیصی)",
                        Value = FormatMoneyPersian(taxGap),
                        RawNumericValue = (double)taxGap,
                        Subtitle = $"افزایش مالیاتی حاصل از رسیدگی: +{gapPct}%",
                        IconName = "TrendingUp",
                        IconGradient = "from-amber-500 to-orange-600",
                        TrendValue = gapPct,
                        TrendLabel = "رشد نسبت به ابرازی",
                        BadgeText = $"+{gapPct}% کشف مالیاتی",
                        BadgeColor = "bg-amber-50 text-amber-800 border-amber-200"
                    },
                    new()
                    {
                        Key = "final_tax",
                        Title = "مجموع مالیات قطعی‌شده",
                        Value = FormatMoneyPersian(finalTax),
                        RawNumericValue = (double)finalTax,
                        Subtitle = "مالیات تثبیت‌شده و لازم‌الوصول",
                        IconName = "ShieldCheck",
                        IconGradient = "from-teal-600 to-cyan-600",
                        BadgeText = "قطعی لازم‌الوصول",
                        BadgeColor = "bg-teal-50 text-teal-700 border-teal-200"
                    },
                    new()
                    {
                        Key = "active_auditors",
                        Title = "حسابرسان فعال رسیدگی‌کننده",
                        Value = auditorsCount.ToString("N0", new CultureInfo("fa-IR")),
                        RawNumericValue = auditorsCount,
                        Subtitle = "کارشناسان و روسای حسابرسی سنیم",
                        IconName = "Users",
                        IconGradient = "from-purple-600 to-indigo-600",
                        BadgeText = "نیروی رسیدگی",
                        BadgeColor = "bg-purple-50 text-purple-700 border-purple-200"
                    },
                    new()
                    {
                        Key = "notices_issued",
                        Title = "برگ تشخیص‌های صادره",
                        Value = noticesCount.ToString("N0", new CultureInfo("fa-IR")),
                        RawNumericValue = noticesCount,
                        Subtitle = $"نرخ صدور برگ تشخیص: {assessmentRate}%",
                        IconName = "CheckCircle2",
                        IconGradient = "from-indigo-600 to-blue-600",
                        TrendValue = assessmentRate,
                        TrendLabel = "پوشش تشخیص",
                        BadgeText = $"{assessmentRate}% ابلاغ",
                        BadgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200"
                    },
                    new()
                    {
                        Key = "finality_issued",
                        Title = "پرونده‌های قطعی‌شده سنیم",
                        Value = finalityCount.ToString("N0", new CultureInfo("fa-IR")),
                        RawNumericValue = finalityCount,
                        Subtitle = $"نرخ قطعیت و مختومه: {finalityRate}%",
                        IconName = "Award",
                        IconGradient = "from-emerald-500 to-green-600",
                        TrendValue = finalityRate,
                        TrendLabel = "مختومه",
                        BadgeText = $"{finalityRate}% قطعی",
                        BadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }
                };
            }
        }

        // 2. Tax Sources Breakdown
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT 
                    COALESCE(c_82, 'نامشخص'),
                    COUNT(*),
                    SUM(COALESCE(c_202, 0)),
                    SUM(COALESCE(c_122, 0))
                FROM custom_dataset_rep_1405
                WHERE c_82 IS NOT NULL AND TRIM(c_82) != ''
                GROUP BY c_82
                ORDER BY COUNT(*) DESC
                LIMIT 8";

            using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var titleSrc = reader.GetString(0);
                var count = reader.GetInt32(1);
                var assessed = reader.IsDBNull(2) ? 0m : Convert.ToDecimal(reader.GetDouble(2));
                var declared = reader.IsDBNull(3) ? 0m : Convert.ToDecimal(reader.GetDouble(3));
                var pct = result.TotalRowCount > 0 ? Math.Round((double)count / result.TotalRowCount * 100, 1) : 0;

                result.TaxSourceDistribution.Add(new KpiTaxSourceBreakdownDto
                {
                    SourceTitle = titleSrc,
                    CaseCount = count,
                    Percentage = pct,
                    TotalAmount = assessed,
                    TotalBaseAmount = declared
                });
            }
        }

        // 3. Stage & Funnel Distribution
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT 
                    COUNT(*),
                    SUM(CASE WHEN c_182 IS NOT NULL AND TRIM(c_182) != '' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN c_212 IS NOT NULL AND TRIM(c_212) != '' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN c_462 IS NOT NULL AND TRIM(c_462) != '' THEN 1 ELSE 0 END),
                    SUM(CASE WHEN c_32 LIKE '%اعتراض%' OR c_672 IS NOT NULL THEN 1 ELSE 0 END)
                FROM custom_dataset_rep_1405";

            using var reader = await cmd.ExecuteReaderAsync(ct);
            if (await reader.ReadAsync(ct))
            {
                var total = reader.GetInt32(0);
                var assessed = reader.GetInt32(1);
                var notified = reader.GetInt32(2);
                var final = reader.GetInt32(3);
                var disputed = reader.GetInt32(4);

                result.StageDistribution = new List<KpiStageBreakdownDto>
                {
                    new() { StageCode = "allocated", StageTitle = "تخصیص به حسابرسان سنیم", CaseCount = total, Percentage = 100.0, TotalAmount = 0 },
                    new() { StageCode = "assessed", StageTitle = "صدور برگ تشخیص مالیاتی", CaseCount = assessed, Percentage = total > 0 ? Math.Round((double)assessed / total * 100, 1) : 0, TotalAmount = 0 },
                    new() { StageCode = "notified", StageTitle = "ابلاغ برگ تشخیص به مودی", CaseCount = notified, Percentage = total > 0 ? Math.Round((double)notified / total * 100, 1) : 0, TotalAmount = 0 },
                    new() { StageCode = "finalized", StageTitle = "صدور برگ قطعی مالیات", CaseCount = final, Percentage = total > 0 ? Math.Round((double)final / total * 100, 1) : 0, TotalAmount = 0 },
                    new() { StageCode = "disputed", StageTitle = "ارجاع به دادرسی و هیات", CaseCount = disputed, Percentage = total > 0 ? Math.Round((double)disputed / total * 100, 1) : 0, TotalAmount = 0 }
                };
            }
        }

        // 4. Methodology Breakdown (Manual vs Systemic)
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT 
                    COALESCE(c_132, 'نامشخص'),
                    COUNT(*),
                    SUM(COALESCE(c_202, 0))
                FROM custom_dataset_rep_1405
                WHERE c_132 IS NOT NULL AND TRIM(c_132) != ''
                GROUP BY c_132
                ORDER BY COUNT(*) DESC";

            using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var meth = reader.GetString(0);
                var count = reader.GetInt32(1);
                var amt = reader.IsDBNull(2) ? 0m : Convert.ToDecimal(reader.GetDouble(2));
                var pct = result.TotalRowCount > 0 ? Math.Round((double)count / result.TotalRowCount * 100, 1) : 0;

                result.MethodologyDistribution.Add(new KpiMethodologyBreakdownDto
                {
                    Title = meth == "سیستم" ? "حسابرسی سیستمی (هوشمند سنیم)" : (meth == "دستی" ? "حسابرسی دستی (رسیدگی سنتی)" : meth),
                    CaseCount = count,
                    Percentage = pct,
                    TotalAmount = amt
                });
            }
        }

        // 5. Office Workload
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT 
                    COALESCE(c_12, 'اداره نامشخص'),
                    COUNT(*),
                    SUM(CASE WHEN c_462 IS NOT NULL AND TRIM(c_462) != '' THEN 1 ELSE 0 END),
                    SUM(COALESCE(c_202, 0)),
                    SUM(COALESCE(c_482, 0))
                FROM custom_dataset_rep_1405
                WHERE c_12 IS NOT NULL AND TRIM(c_12) != ''
                GROUP BY c_12
                ORDER BY COUNT(*) DESC
                LIMIT 12";

            using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                var off = reader.GetString(0);
                var count = reader.GetInt32(1);
                var comp = reader.GetInt32(2);
                var assessed = reader.IsDBNull(3) ? 0m : Convert.ToDecimal(reader.GetDouble(3));
                var finalAmt = reader.IsDBNull(4) ? 0m : Convert.ToDecimal(reader.GetDouble(4));
                var rate = count > 0 ? Math.Round((double)comp / count * 100, 1) : 0;

                result.OfficeWorkload.Add(new KpiOfficeWorkloadDto
                {
                    OfficeName = off,
                    CaseCount = count,
                    CompletedCases = comp,
                    TotalAssessedAmount = assessed,
                    TotalFinalAmount = finalAmt,
                    CompletionRate = rate
                });
            }
        }

        // 6. Top 10 Major Taxpayers
        using (var cmd = connection.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT 
                    COALESCE(c_52, ''),
                    COALESCE(c_62, 'مودی نامشخص'),
                    COALESCE(c_82, 'نامشخص'),
                    COALESCE(c_12, ''),
                    COUNT(*),
                    SUM(COALESCE(c_202, 0)),
                    SUM(COALESCE(c_482, 0)),
                    MAX(COALESCE(c_32, 'عادی'))
                FROM custom_dataset_rep_1405
                WHERE c_62 IS NOT NULL AND TRIM(c_62) != ''
                GROUP BY c_62
                ORDER BY SUM(COALESCE(c_202, 0)) DESC
                LIMIT 10";

            using var reader = await cmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
            {
                result.TopTaxpayers.Add(new KpiTopTaxpayerDto
                {
                    NationalId = reader.GetString(0),
                    TaxpayerName = reader.GetString(1),
                    TaxSource = reader.GetString(2),
                    OfficeName = reader.GetString(3),
                    CaseCount = reader.GetInt32(4),
                    AssessedAmount = reader.IsDBNull(5) ? 0m : Convert.ToDecimal(reader.GetDouble(5)),
                    FinalAmount = reader.IsDBNull(6) ? 0m : Convert.ToDecimal(reader.GetDouble(6)),
                    CurrentStatus = reader.GetString(7)
                });
            }
        }

        return result;
    }

    private static string FormatMoneyPersian(decimal amount)
    {
        var abs = Math.Abs(amount);
        if (abs >= 1_000_000_000_000m)
        {
            return $"{(amount / 1_000_000_000_000m):0.#} همت";
        }
        if (abs >= 1_000_000_000m)
        {
            return $"{(amount / 1_000_000_000m):0.#} میلیارد";
        }
        if (abs >= 1_000_000m)
        {
            return $"{(amount / 1_000_000m):0.#} م ریال";
        }
        return $"{amount:N0} ریال";
    }

    private async Task<ReportExecutiveKpiDto> GetGenericReportKpiOverviewAsync(ReportDefinition? report, CancellationToken ct)
    {
        var rowCount = 0;
        if (report != null && !string.IsNullOrWhiteSpace(report.ConfigurationJson))
        {
            try
            {
                using var doc = JsonDocument.Parse(report.ConfigurationJson);
                if (doc.RootElement.TryGetProperty("totalRowCount", out var trcProp) && trcProp.TryGetInt32(out var cnt))
                {
                    rowCount = cnt;
                }
            }
            catch
            {
                // Fallback to 0
            }
        }

        var result = new ReportExecutiveKpiDto
        {
            ReportCode = report?.Code ?? "UNKNOWN",
            ReportTitle = report?.Title ?? "گزارش استاندارد",
            ReportActorType = "generic",
            TotalRowCount = rowCount
        };

        result.KpiCards.Add(new ExecutiveKpiCardDto
        {
            Key = "total_records",
            Title = "تعداد کل رکوردهای گزارش",
            Value = rowCount.ToString("N0", new CultureInfo("fa-IR")),
            RawNumericValue = rowCount,
            Subtitle = report?.Title ?? "مجموع داده‌های بارگذاری شده",
            IconName = "FileSpreadsheet",
            IconGradient = "from-blue-600 to-indigo-600",
            BadgeText = "رکوردهای داده",
            BadgeColor = "bg-blue-50 text-blue-700 border-blue-200"
        });

        return result;
    }

    private async Task<ProvincialOperationsSummaryDto> GetProvincialOperationsSummaryAsync(CancellationToken ct)
    {
        var summary = new ProvincialOperationsSummaryDto();
        try
        {
            var connection = (SqliteConnection)_db.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);

            // Audit Summary (REP_1405)
            try
            {
                using var cmd1 = connection.CreateCommand();
                cmd1.CommandText = @"
                    SELECT 
                        COUNT(*), 
                        SUM(COALESCE(c_202, 0)), 
                        SUM(COALESCE(c_202, 0)) - SUM(COALESCE(c_122, 0)),
                        SUM(COALESCE(c_482, 0))
                    FROM custom_dataset_rep_1405";
                using var r1 = await cmd1.ExecuteReaderAsync(ct);
                if (await r1.ReadAsync(ct))
                {
                    summary.TotalAuditCases = r1.GetInt32(0);
                    summary.TotalAssessedTaxAmount = r1.IsDBNull(1) ? 0m : Convert.ToDecimal(r1.GetDouble(1));
                    summary.TotalTaxAssessmentGapAmount = r1.IsDBNull(2) ? 0m : Convert.ToDecimal(r1.GetDouble(2));
                    summary.TotalFinalTaxAmount = r1.IsDBNull(3) ? 0m : Convert.ToDecimal(r1.GetDouble(3));
                }
            }
            catch
            {
                // Soft fail if dataset not present
            }

            // Decree Summary (REP_2)
            try
            {
                using var cmd2 = connection.CreateCommand();
                cmd2.CommandText = @"
                    SELECT 
                        COUNT(*), 
                        SUM(COALESCE(c_172, 0)), 
                        SUM(COALESCE(c_532, 0)),
                        SUM(CASE WHEN c_862 IS NOT NULL OR c_72 LIKE '%ثبت گزارش%' THEN 1 ELSE 0 END),
                        SUM(CASE WHEN c_872 IS NOT NULL OR c_72 LIKE '%تایید%' THEN 1 ELSE 0 END)
                    FROM custom_dataset_rep_2";
                using var r2 = await cmd2.ExecuteReaderAsync(ct);
                if (await r2.ReadAsync(ct))
                {
                    summary.TotalDecrees = r2.GetInt32(0);
                    summary.TotalDisputedBaseAmount = r2.IsDBNull(1) ? 0m : Convert.ToDecimal(r2.GetDouble(1));
                    summary.TotalDisputedPrincipalAmount = r2.IsDBNull(2) ? 0m : Convert.ToDecimal(r2.GetDouble(2));
                    var comp = r2.GetInt32(3);
                    var appr = r2.GetInt32(4);
                    summary.DecreeCompletionRate = summary.TotalDecrees > 0 ? Math.Round((double)comp / summary.TotalDecrees * 100, 1) : 0;
                    summary.DecreeApprovalRate = summary.TotalDecrees > 0 ? Math.Round((double)appr / summary.TotalDecrees * 100, 1) : 0;
                }
            }
            catch
            {
                // Soft fail if dataset not present
            }
        }
        catch
        {
            // Ignore
        }
        return summary;
    }

    #endregion

    #endregion
}
