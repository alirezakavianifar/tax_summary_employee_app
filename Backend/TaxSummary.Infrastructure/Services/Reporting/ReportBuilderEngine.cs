using System.Globalization;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Entities.Reporting;
using TaxSummary.Domain.Enums;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Services.Reporting;

/// <summary>
/// Dynamic Report Builder Engine providing ad-hoc query capabilities, custom filters, and aggregation
/// </summary>
public class ReportBuilderEngine : IReportBuilderEngine
{
    private readonly TaxSummaryDbContext _db;
    private readonly IReportExportService _exportService;

    public ReportBuilderEngine(TaxSummaryDbContext db, IReportExportService exportService)
    {
        _db = db;
        _exportService = exportService;
    }

    public async Task<Result<DynamicReportResultDto>> ExecuteDynamicQueryAsync(
        DynamicReportQueryRequestDto request, 
        List<Guid>? userAssignedOfficeIds, 
        CancellationToken ct = default)
    {
        try
        {
            return request.DomainSource switch
            {
                ReportDomainSource.PayrollAndWelfare => await ExecutePayrollQueryAsync(request, userAssignedOfficeIds, ct),
                ReportDomainSource.TaxRefunds => await ExecuteRefundQueryAsync(request, userAssignedOfficeIds, ct),
                ReportDomainSource.HumanResources => await ExecuteEmployeeQueryAsync(request, userAssignedOfficeIds, ct),
                ReportDomainSource.TaxAudit => await ExecuteTaxAuditQueryAsync(request, userAssignedOfficeIds, ct),
                _ => await ExecutePayrollQueryAsync(request, userAssignedOfficeIds, ct)
            };
        }
        catch (Exception ex)
        {
            return Result.Failure<DynamicReportResultDto>($"خطا در اجرای کوئری پویا: {ex.Message}");
        }
    }

    public async Task<Result<byte[]>> ExportDynamicQueryAsync(
        DynamicReportQueryRequestDto request, 
        ExportFormat format, 
        List<Guid>? userAssignedOfficeIds, 
        CancellationToken ct = default)
    {
        try
        {
            var exportRequest = new DynamicReportQueryRequestDto
            {
                DomainSource = request.DomainSource,
                SelectedFields = request.SelectedFields,
                Filters = request.Filters,
                GroupByField = request.GroupByField,
                Aggregates = request.Aggregates,
                SortField = request.SortField,
                SortDescending = request.SortDescending,
                PageNumber = 1,
                PageSize = 5000
            };

            var queryResult = await ExecuteDynamicQueryAsync(exportRequest, userAssignedOfficeIds, ct);
            if (!queryResult.IsSuccess || queryResult.Value == null)
            {
                return Result.Failure<byte[]>(queryResult.Error ?? "خطا در استخراج داده‌های گزارش پویا جهت صدور");
            }

            var metadata = await GetQueryableSchemaMetadataAsync(request.DomainSource, ct);
            var domainTitle = metadata.Value?.DomainSourceTitle ?? "گزارش ساز پویا";

            if (format == ExportFormat.Pdf)
            {
                return await _exportService.ExportToPdfAsync(
                    domainTitle,
                    "DYNAMIC_REPORT",
                    queryResult.Value.Columns,
                    queryResult.Value.Rows,
                    queryResult.Value.GlobalAggregates,
                    null,
                    ct);
            }

            return await _exportService.ExportToExcelAsync(
                domainTitle,
                "DYNAMIC_REPORT",
                queryResult.Value.Columns,
                queryResult.Value.Rows,
                queryResult.Value.GlobalAggregates,
                null,
                ct);
        }
        catch (Exception ex)
        {
            return Result.Failure<byte[]>($"خطا در صدور فایل گزارش پویا: {ex.Message}");
        }
    }

    public Task<Result<DynamicQueryMetadataDto>> GetQueryableSchemaMetadataAsync(
        ReportDomainSource source, 
        CancellationToken ct = default)
    {
        var metadata = new DynamicQueryMetadataDto
        {
            DomainSource = source,
            SupportedOperators = new List<string>
            {
                "equals", "notequals", "greaterthan", "greaterthanorequal", 
                "lessthan", "lessthanorequal", "contains", "startswith", "between"
            },
            SupportedAggregations = new List<string> { "Sum", "Average", "Count", "Min", "Max" }
        };

        switch (source)
        {
            case ReportDomainSource.PayrollAndWelfare:
                metadata.DomainSourceTitle = "حقوق، اضافه کار و رفاهی";
                metadata.AvailableFields = new List<ReportColumnMetadataDto>
                {
                    new() { FieldName = "PersonnelNumber", PersianLabel = "شماره پرسنلی", DataType = "string" },
                    new() { FieldName = "EmployeeName", PersianLabel = "نام و نام خانوادگی", DataType = "string" },
                    new() { FieldName = "DepartmentName", PersianLabel = "اداره", DataType = "string" },
                    new() { FieldName = "OvertimeHours", PersianLabel = "ساعت اضافه کار", DataType = "number", HasAggregateSum = true },
                    new() { FieldName = "OvertimeRate", PersianLabel = "نرخ اضافه کار (ریال)", DataType = "currency" },
                    new() { FieldName = "OvertimeAmount", PersianLabel = "مبلغ اضافه کار (ریال)", DataType = "currency", HasAggregateSum = true },
                    new() { FieldName = "WelfareRate", PersianLabel = "نرخ رفاهی (ریال)", DataType = "currency" },
                    new() { FieldName = "WelfareAmount", PersianLabel = "مبلغ رفاهی (ریال)", DataType = "currency", HasAggregateSum = true },
                    new() { FieldName = "TotalPaymentAmount", PersianLabel = "کل پرداختی (ریال)", DataType = "currency", HasAggregateSum = true },
                    new() { FieldName = "IsLaborPosition", PersianLabel = "شغل کارگری", DataType = "badge" },
                    new() { FieldName = "HasCapViolation", PersianLabel = "تخلف سقف ۱۲۰ ساعت", DataType = "badge" }
                };
                break;

            case ReportDomainSource.TaxRefunds:
                metadata.DomainSourceTitle = "استرداد مالیاتی (مواد ۲۴۲ و ۲۴۳)";
                metadata.AvailableFields = new List<ReportColumnMetadataDto>
                {
                    new() { FieldName = "CaseTrackingNumber", PersianLabel = "کد رهگیری", DataType = "string" },
                    new() { FieldName = "DocketNumber", PersianLabel = "شماره پرونده", DataType = "string" },
                    new() { FieldName = "TaxpayerName", PersianLabel = "نام مودی", DataType = "string" },
                    new() { FieldName = "EconomicCode", PersianLabel = "کد اقتصادی", DataType = "string" },
                    new() { FieldName = "TaxSourceTitle", PersianLabel = "منبع مالیاتی", DataType = "string" },
                    new() { FieldName = "TaxYear", PersianLabel = "سال مالیاتی", DataType = "year" },
                    new() { FieldName = "StatusTitle", PersianLabel = "وضعیت پرونده", DataType = "badge" },
                    new() { FieldName = "PrincipalTaxRefund", PersianLabel = "اصل استرداد (ریال)", DataType = "currency", HasAggregateSum = true },
                    new() { FieldName = "DelayDamages", PersianLabel = "خسارت تاخیر (ریال)", DataType = "currency", HasAggregateSum = true },
                    new() { FieldName = "GrandTotalRefundable", PersianLabel = "مجموع پرداختی (ریال)", DataType = "currency", HasAggregateSum = true }
                };
                break;

            case ReportDomainSource.CustomUploadedDataset:
                metadata.DomainSourceTitle = "مجموعه‌داده‌های بارگذاری شده از اکسل";
                metadata.AvailableFields = new List<ReportColumnMetadataDto>();
                break;

            case ReportDomainSource.HumanResources:
            default:
                metadata.DomainSourceTitle = "منابع انسانی و ارزیابی شایستگی";
                metadata.AvailableFields = new List<ReportColumnMetadataDto>
                {
                    new() { FieldName = "PersonnelNumber", PersianLabel = "شماره پرسنلی", DataType = "string" },
                    new() { FieldName = "FullName", PersianLabel = "نام و نام خانوادگی", DataType = "string" },
                    new() { FieldName = "ServiceUnit", PersianLabel = "واحد سازمانی", DataType = "string" },
                    new() { FieldName = "CurrentPosition", PersianLabel = "پست فعلی", DataType = "string" },
                    new() { FieldName = "MissionDays", PersianLabel = "روزهای ماموریت", DataType = "number", HasAggregateSum = true },
                    new() { FieldName = "SickLeaveDays", PersianLabel = "مرخصی استعلاجی", DataType = "number", HasAggregateSum = true },
                    new() { FieldName = "AbsenceHours", PersianLabel = "ساعات غیبت و تاخیر", DataType = "number", HasAggregateSum = true },
                    new() { FieldName = "TaxEvasionDetectionAmount", PersianLabel = "کشف فرار مالیاتی (ریال)", DataType = "currency", HasAggregateSum = true }
                };
                break;

            case ReportDomainSource.TaxAudit:
                metadata.DomainSourceTitle = "رسیدگی و حسابرسی مالیاتی سنیم";
                metadata.AvailableFields = new List<ReportColumnMetadataDto>
                {
                    new() { FieldName = "Id", PersianLabel = "شناسه رکورد", DataType = "id" },
                    new() { FieldName = "TaxpayerTin", PersianLabel = "تین سنیم / شناسه ملی", DataType = "string" },
                    new() { FieldName = "TaxpayerName", PersianLabel = "نام مودی", DataType = "string" },
                    new() { FieldName = "FinalOfficeName", PersianLabel = "اداره مالیاتی", DataType = "string" },
                    new() { FieldName = "FiscalYear", PersianLabel = "سال عملکرد", DataType = "year" },
                    new() { FieldName = "TaxSource", PersianLabel = "منبع مالیاتی", DataType = "string" },
                    new() { FieldName = "TaxPeriod", PersianLabel = "دوره مالیاتی", DataType = "number" },
                    new() { FieldName = "RiskLevel", PersianLabel = "سطح ریسک", DataType = "badge" },
                    new() { FieldName = "AuditorName", PersianLabel = "نام حسابرس / ممیز", DataType = "string" },
                    new() { FieldName = "AuditStatus", PersianLabel = "وضعیت رسیدگی", DataType = "badge" },
                    new() { FieldName = "DeclaredTaxAmount", PersianLabel = "مالیات ابرازی (ریال)", DataType = "currency", HasAggregateSum = true },
                    new() { FieldName = "AssessedTaxAmount", PersianLabel = "مالیات تشخیصی (ریال)", DataType = "currency", HasAggregateSum = true },
                    new() { FieldName = "FinalTaxAmount", PersianLabel = "مالیات قطعی (ریال)", DataType = "currency", HasAggregateSum = true },
                    new() { FieldName = "AssessmentNoticeDateJalali", PersianLabel = "تاریخ ابلاغ برگ تشخیص", DataType = "string" },
                    new() { FieldName = "FinalNoticeDateJalali", PersianLabel = "تاریخ ابلاغ برگ قطعی", DataType = "string" },
                    new() { FieldName = "DaysAssignmentToNotice", PersianLabel = "فاصله تخصیص تا تشخیص (روز)", DataType = "number" },
                    new() { FieldName = "DaysNoticeToFinal", PersianLabel = "فاصله تشخیص تا قطعی (روز)", DataType = "number" },
                    new() { FieldName = "DaysAssignmentToFinal", PersianLabel = "کل فرآیند تا قطعی (روز)", DataType = "number" }
                };
                break;
        }

        return Task.FromResult(Result.Success<DynamicQueryMetadataDto>(metadata));
    }

    private async Task<Result<DynamicReportResultDto>> ExecutePayrollQueryAsync(
        DynamicReportQueryRequestDto request, 
        List<Guid>? userAssignedOfficeIds, 
        CancellationToken ct)
    {
        var fieldTypeMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "PersonnelNumber", "string" },
            { "EmployeeName", "string" },
            { "DepartmentName", "string" },
            { "OvertimeHours", "number" },
            { "OvertimeRate", "currency" },
            { "OvertimeAmount", "currency" },
            { "WelfareRate", "currency" },
            { "WelfareAmount", "currency" },
            { "TotalPaymentAmount", "currency" },
            { "IsLaborPosition", "bool" },
            { "HasCapViolation", "bool" }
        };

        var query = _db.PayrollEmployeeItems.AsNoTracking()
            .Include(i => i.DepartmentEntry)
            .AsQueryable();

        if (userAssignedOfficeIds != null && userAssignedOfficeIds.Count > 0)
        {
            var allowedOfficeNames = await _db.Offices.AsNoTracking()
                .Where(o => userAssignedOfficeIds.Contains(o.Id))
                .Select(o => o.Name)
                .ToListAsync(ct);

            query = query.Where(i => i.DepartmentEntry != null && allowedOfficeNames.Contains(i.DepartmentEntry.DepartmentName));
        }

        var projected = query.Select(i => new PayrollQueryableRecord
        {
            Id = i.Id,
            PersonnelNumber = i.PersonnelNumber,
            EmployeeName = i.EmployeeName,
            DepartmentName = i.DepartmentEntry != null ? i.DepartmentEntry.DepartmentName : "",
            OvertimeHours = (decimal)(i.AdjustedOvertimeRate ?? i.InitialOvertimeRate ?? 0),
            OvertimeRate = (decimal)(i.BaseOvertimeAmount ?? 0),
            OvertimeAmount = (decimal)(i.CalculatedOvertimeAmount ?? 0),
            WelfareRate = (decimal)(i.AdjustedWelfareRate ?? i.InitialWelfareRate ?? 0),
            WelfareAmount = (decimal)(i.CalculatedWelfareAmount ?? 0),
            TotalPaymentAmount = (decimal)((i.CalculatedOvertimeAmount ?? 0) + (i.CalculatedWelfareAmount ?? 0)),
            IsLaborPosition = i.IsLaborPosition,
            HasCapViolation = i.IsLaborPosition && (i.AdjustedOvertimeRate ?? i.InitialOvertimeRate ?? 0) > 120
        });

        var filterPredicate = DynamicExpressionBuilder.BuildFilterPredicate<PayrollQueryableRecord>(request.Filters, fieldTypeMap);
        projected = projected.Where(filterPredicate);

        int totalCount = await projected.CountAsync(ct);

        if (!string.IsNullOrWhiteSpace(request.SortField) && fieldTypeMap.ContainsKey(request.SortField))
        {
            projected = ApplySorting(projected, request.SortField, request.SortDescending);
        }
        else
        {
            projected = projected.OrderBy(p => p.DepartmentName).ThenBy(p => p.PersonnelNumber);
        }

        var globalAggregates = new Dictionary<string, object?>();
        if (request.Aggregates != null && request.Aggregates.Count > 0)
        {
            foreach (var agg in request.Aggregates)
            {
                var val = await ComputePayrollAggregateAsync(projected, agg, ct);
                var key = string.IsNullOrWhiteSpace(agg.Alias) ? $"{agg.FieldName}_{agg.Function}" : agg.Alias;
                globalAggregates[key] = val;
            }
        }
        else
        {
            globalAggregates["totalOvertimeHours"] = await projected.SumAsync(p => p.OvertimeHours, ct);
            globalAggregates["totalOvertimeAmount"] = await projected.SumAsync(p => p.OvertimeAmount, ct);
            globalAggregates["totalWelfareAmount"] = await projected.SumAsync(p => p.WelfareAmount, ct);
            globalAggregates["totalPaymentAmount"] = await projected.SumAsync(p => p.TotalPaymentAmount, ct);
        }

        int pageNumber = Math.Max(1, request.PageNumber);
        int pageSize = Math.Clamp(request.PageSize, 1, 5000);
        var pageItems = await projected
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var schemaMetadata = (await GetQueryableSchemaMetadataAsync(ReportDomainSource.PayrollAndWelfare, ct)).Value!;
        var selectedColumns = GetSelectedColumns(schemaMetadata.AvailableFields, request.SelectedFields);

        var rows = pageItems.Select(item =>
        {
            var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var col in selectedColumns)
            {
                dict[col.FieldName] = col.FieldName switch
                {
                    "PersonnelNumber" => item.PersonnelNumber,
                    "EmployeeName" => item.EmployeeName,
                    "DepartmentName" => item.DepartmentName,
                    "OvertimeHours" => item.OvertimeHours,
                    "OvertimeRate" => item.OvertimeRate,
                    "OvertimeAmount" => item.OvertimeAmount,
                    "WelfareRate" => item.WelfareRate,
                    "WelfareAmount" => item.WelfareAmount,
                    "TotalPaymentAmount" => item.TotalPaymentAmount,
                    "IsLaborPosition" => item.IsLaborPosition ? "کارگری" : "کارمندی",
                    "HasCapViolation" => item.HasCapViolation ? "تخلف (>120h)" : "مجاز",
                    _ => null
                };
            }
            return dict;
        }).ToList();

        return Result.Success<DynamicReportResultDto>(new DynamicReportResultDto
        {
            Columns = selectedColumns,
            Rows = rows,
            GlobalAggregates = globalAggregates,
            TotalRows = totalCount
        });
    }

    private async Task<Result<DynamicReportResultDto>> ExecuteRefundQueryAsync(
        DynamicReportQueryRequestDto request, 
        List<Guid>? userAssignedOfficeIds, 
        CancellationToken ct)
    {
        var fieldTypeMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "CaseTrackingNumber", "string" },
            { "DocketNumber", "string" },
            { "TaxpayerName", "string" },
            { "EconomicCode", "string" },
            { "TaxSourceTitle", "string" },
            { "TaxYear", "year" },
            { "StatusTitle", "string" },
            { "PrincipalTaxRefund", "currency" },
            { "DelayDamages", "currency" },
            { "GrandTotalRefundable", "currency" }
        };

        var query = _db.TaxRefundCases.AsNoTracking().AsQueryable();

        if (userAssignedOfficeIds != null && userAssignedOfficeIds.Count > 0)
        {
            query = query.Where(r => r.OfficeId.HasValue && userAssignedOfficeIds.Contains(r.OfficeId.Value));
        }

        var projected = query.Select(r => new TaxRefundQueryableRecord
        {
            Id = r.Id,
            CaseTrackingNumber = r.CaseTrackingNumber,
            DocketNumber = r.DocketNumber,
            TaxpayerName = r.TaxpayerName,
            EconomicCode = r.EconomicCode,
            TaxSourceTitle = r.TaxSource == TaxSourceType.CorporateIncome ? "عملکرد شرکت‌ها" :
                             r.TaxSource == TaxSourceType.PersonalBusiness ? "عملکرد مشاغل" :
                             r.TaxSource == TaxSourceType.SalaryPayroll ? "مالیات بر حقوق" :
                             r.TaxSource == TaxSourceType.ValueAddedTax ? "ارزش افزوده" :
                             r.TaxSource == TaxSourceType.PropertyRental ? "اجاره املاک" :
                             r.TaxSource == TaxSourceType.PropertyTransfer ? "نقل و انتقال" : "سایر",
            TaxYear = r.TaxYear,
            StatusTitle = r.Status.ToString(),
            OfficeId = r.OfficeId,
            PrincipalTaxRefund = r.Breakdown.PrincipalTaxRefund,
            DelayDamages = r.Breakdown.DelayDamages,
            GrandTotalRefundable = r.Breakdown.PrincipalTaxRefund + r.Breakdown.StampDutyRefund + r.Breakdown.OtherRefund + r.Breakdown.PenaltiesRefund + r.Breakdown.DelayDamages
        });

        var filterPredicate = DynamicExpressionBuilder.BuildFilterPredicate<TaxRefundQueryableRecord>(request.Filters, fieldTypeMap);
        projected = projected.Where(filterPredicate);

        int totalCount = await projected.CountAsync(ct);

        if (!string.IsNullOrWhiteSpace(request.SortField) && fieldTypeMap.ContainsKey(request.SortField))
        {
            projected = ApplySorting(projected, request.SortField, request.SortDescending);
        }
        else
        {
            projected = projected.OrderByDescending(p => p.TaxYear).ThenBy(p => p.CaseTrackingNumber);
        }

        var globalAggregates = new Dictionary<string, object?>
        {
            ["totalPrincipalTaxRefund"] = await projected.SumAsync(p => p.PrincipalTaxRefund, ct),
            ["totalDelayDamages"] = await projected.SumAsync(p => p.DelayDamages, ct),
            ["totalGrandRefundable"] = await projected.SumAsync(p => p.GrandTotalRefundable, ct)
        };

        int pageNumber = Math.Max(1, request.PageNumber);
        int pageSize = Math.Clamp(request.PageSize, 1, 5000);
        var pageItems = await projected
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var schemaMetadata = (await GetQueryableSchemaMetadataAsync(ReportDomainSource.TaxRefunds, ct)).Value!;
        var selectedColumns = GetSelectedColumns(schemaMetadata.AvailableFields, request.SelectedFields);

        var rows = pageItems.Select(item =>
        {
            var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var col in selectedColumns)
            {
                dict[col.FieldName] = col.FieldName switch
                {
                    "CaseTrackingNumber" => item.CaseTrackingNumber,
                    "DocketNumber" => item.DocketNumber,
                    "TaxpayerName" => item.TaxpayerName,
                    "EconomicCode" => item.EconomicCode,
                    "TaxSourceTitle" => item.TaxSourceTitle,
                    "TaxYear" => item.TaxYear,
                    "StatusTitle" => item.StatusTitle,
                    "PrincipalTaxRefund" => item.PrincipalTaxRefund,
                    "DelayDamages" => item.DelayDamages,
                    "GrandTotalRefundable" => item.GrandTotalRefundable,
                    _ => null
                };
            }
            return dict;
        }).ToList();

        return Result.Success<DynamicReportResultDto>(new DynamicReportResultDto
        {
            Columns = selectedColumns,
            Rows = rows,
            GlobalAggregates = globalAggregates,
            TotalRows = totalCount
        });
    }

    private async Task<Result<DynamicReportResultDto>> ExecuteEmployeeQueryAsync(
        DynamicReportQueryRequestDto request, 
        List<Guid>? userAssignedOfficeIds, 
        CancellationToken ct)
    {
        var fieldTypeMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "PersonnelNumber", "string" },
            { "FullName", "string" },
            { "ServiceUnit", "string" },
            { "CurrentPosition", "string" },
            { "MissionDays", "number" },
            { "SickLeaveDays", "number" },
            { "AbsenceHours", "number" },
            { "TaxEvasionDetectionAmount", "currency" }
        };

        var query = _db.Employees.AsNoTracking()
            .Include(e => e.AdministrativeStatus)
            .Include(e => e.PerformanceCapabilities)
            .AsQueryable();

        if (userAssignedOfficeIds != null && userAssignedOfficeIds.Count > 0)
        {
            query = query.Where(e => e.OfficeId.HasValue && userAssignedOfficeIds.Contains(e.OfficeId.Value));
        }

        var projected = query.Select(e => new EmployeeEvaluationQueryableRecord
        {
            Id = e.Id,
            PersonnelNumber = e.PersonnelNumber,
            FullName = e.FirstName + " " + e.LastName,
            ServiceUnit = e.ServiceUnit,
            CurrentPosition = e.CurrentPosition,
            OfficeId = e.OfficeId,
            MissionDays = e.AdministrativeStatus != null ? e.AdministrativeStatus.MissionDays : 0,
            SickLeaveDays = e.AdministrativeStatus != null ? e.AdministrativeStatus.SickLeaveDays : 0,
            AbsenceHours = e.AdministrativeStatus != null ? e.AdministrativeStatus.DelayAndAbsenceHours : 0,
            TaxEvasionDetectionAmount = e.PerformanceCapabilities.Sum(p => p.DetectionOfTaxEvasion_Amount)
        });

        var filterPredicate = DynamicExpressionBuilder.BuildFilterPredicate<EmployeeEvaluationQueryableRecord>(request.Filters, fieldTypeMap);
        projected = projected.Where(filterPredicate);

        int totalCount = await projected.CountAsync(ct);

        if (!string.IsNullOrWhiteSpace(request.SortField) && fieldTypeMap.ContainsKey(request.SortField))
        {
            projected = ApplySorting(projected, request.SortField, request.SortDescending);
        }
        else
        {
            projected = projected.OrderBy(p => p.ServiceUnit).ThenBy(p => p.PersonnelNumber);
        }

        var globalAggregates = new Dictionary<string, object?>
        {
            ["totalMissionDays"] = await projected.SumAsync(p => p.MissionDays, ct),
            ["totalSickLeaveDays"] = await projected.SumAsync(p => p.SickLeaveDays, ct),
            ["totalAbsenceHours"] = await projected.SumAsync(p => p.AbsenceHours, ct),
            ["totalTaxEvasionDetectionAmount"] = await projected.SumAsync(p => p.TaxEvasionDetectionAmount, ct)
        };

        int pageNumber = Math.Max(1, request.PageNumber);
        int pageSize = Math.Clamp(request.PageSize, 1, 5000);
        var pageItems = await projected
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var schemaMetadata = (await GetQueryableSchemaMetadataAsync(ReportDomainSource.HumanResources, ct)).Value!;
        var selectedColumns = GetSelectedColumns(schemaMetadata.AvailableFields, request.SelectedFields);

        var rows = pageItems.Select(item =>
        {
            var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var col in selectedColumns)
            {
                dict[col.FieldName] = col.FieldName switch
                {
                    "PersonnelNumber" => item.PersonnelNumber,
                    "FullName" => item.FullName,
                    "ServiceUnit" => item.ServiceUnit,
                    "CurrentPosition" => item.CurrentPosition,
                    "MissionDays" => item.MissionDays,
                    "SickLeaveDays" => item.SickLeaveDays,
                    "AbsenceHours" => item.AbsenceHours,
                    "TaxEvasionDetectionAmount" => item.TaxEvasionDetectionAmount,
                    _ => null
                };
            }
            return dict;
        }).ToList();

        return Result.Success<DynamicReportResultDto>(new DynamicReportResultDto
        {
            Columns = selectedColumns,
            Rows = rows,
            GlobalAggregates = globalAggregates,
            TotalRows = totalCount
        });
    }

    private async Task<Result<DynamicReportResultDto>> ExecuteTaxAuditQueryAsync(
        DynamicReportQueryRequestDto request, 
        List<Guid>? userAssignedOfficeIds, 
        CancellationToken ct)
    {
        var fieldTypeMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "Id", "id" },
            { "TaxpayerTin", "string" },
            { "TaxpayerName", "string" },
            { "FinalOfficeName", "string" },
            { "FiscalYear", "year" },
            { "TaxSource", "string" },
            { "TaxPeriod", "number" },
            { "RiskLevel", "string" },
            { "AuditorName", "string" },
            { "AuditStatus", "string" },
            { "DeclaredTaxAmount", "currency" },
            { "AssessedTaxAmount", "currency" },
            { "FinalTaxAmount", "currency" },
            { "AssessmentNoticeDateJalali", "string" },
            { "FinalNoticeDateJalali", "string" },
            { "DaysAssignmentToNotice", "number" },
            { "DaysNoticeToFinal", "number" },
            { "DaysAssignmentToFinal", "number" }
        };

        var query = _db.SanimAuditAssessments.AsNoTracking().AsQueryable();

        if (userAssignedOfficeIds != null && userAssignedOfficeIds.Count > 0)
        {
            var allowedOfficeNames = await _db.Offices.AsNoTracking()
                .Where(o => userAssignedOfficeIds.Contains(o.Id))
                .Select(o => o.Name)
                .ToListAsync(ct);

            query = query.Where(s => (s.OfficeId.HasValue && userAssignedOfficeIds.Contains(s.OfficeId.Value)) 
                                  || allowedOfficeNames.Any(n => s.FinalOfficeName.Contains(n)));
        }

        var projected = query.Select(s => new TaxAuditQueryableRecord
        {
            Id = s.Id,
            TaxpayerTin = s.TaxpayerTin,
            TaxpayerName = s.TaxpayerName,
            FinalOfficeName = s.FinalOfficeName,
            FiscalYear = s.FiscalYear,
            TaxSource = s.TaxSource,
            TaxPeriod = s.TaxPeriod,
            RiskLevel = s.RiskLevel ?? "-",
            AuditorName = s.AuditorName,
            AuditStatus = s.AuditStatus,
            DeclaredTaxAmount = s.DeclaredTaxAmount,
            AssessedTaxAmount = s.AssessedTaxAmount,
            FinalTaxAmount = s.FinalTaxAmount,
            AssessmentNoticeDateJalali = s.AssessmentNoticeDateJalali ?? "-",
            FinalNoticeDateJalali = s.FinalNoticeDateJalali ?? "-",
            DaysAssignmentToNotice = s.DaysAssignmentToNotice,
            DaysNoticeToFinal = s.DaysNoticeToFinal,
            DaysAssignmentToFinal = s.DaysAssignmentToFinal,
            OfficeId = s.OfficeId
        });

        var filterPredicate = DynamicExpressionBuilder.BuildFilterPredicate<TaxAuditQueryableRecord>(request.Filters, fieldTypeMap);
        projected = projected.Where(filterPredicate);

        int totalCount = await projected.CountAsync(ct);

        if (!string.IsNullOrWhiteSpace(request.SortField) && fieldTypeMap.ContainsKey(request.SortField))
        {
            projected = ApplySorting(projected, request.SortField, request.SortDescending);
        }
        else
        {
            projected = projected.OrderBy(p => p.Id);
        }

        var globalAggregates = new Dictionary<string, object?>
        {
            ["totalDeclaredTax"] = (decimal)await projected.SumAsync(p => (double)p.DeclaredTaxAmount, ct),
            ["totalAssessedTax"] = (decimal)await projected.SumAsync(p => (double)p.AssessedTaxAmount, ct),
            ["totalFinalTax"] = (decimal)await projected.SumAsync(p => (double)p.FinalTaxAmount, ct)
        };

        int pageNumber = Math.Max(1, request.PageNumber);
        int pageSize = Math.Clamp(request.PageSize, 1, 5000);
        var pageItems = await projected
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var schemaMetadata = (await GetQueryableSchemaMetadataAsync(ReportDomainSource.TaxAudit, ct)).Value!;
        var selectedColumns = GetSelectedColumns(schemaMetadata.AvailableFields, request.SelectedFields);

        var rows = pageItems.Select(item =>
        {
            var dict = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            foreach (var col in selectedColumns)
            {
                dict[col.FieldName] = col.FieldName switch
                {
                    "Id" => item.Id,
                    "TaxpayerTin" => item.TaxpayerTin,
                    "TaxpayerName" => item.TaxpayerName,
                    "FinalOfficeName" => item.FinalOfficeName,
                    "FiscalYear" => item.FiscalYear,
                    "TaxSource" => item.TaxSource,
                    "TaxPeriod" => item.TaxPeriod,
                    "RiskLevel" => item.RiskLevel,
                    "AuditorName" => item.AuditorName,
                    "AuditStatus" => item.AuditStatus,
                    "DeclaredTaxAmount" => item.DeclaredTaxAmount,
                    "AssessedTaxAmount" => item.AssessedTaxAmount,
                    "FinalTaxAmount" => item.FinalTaxAmount,
                    "AssessmentNoticeDateJalali" => item.AssessmentNoticeDateJalali,
                    "FinalNoticeDateJalali" => item.FinalNoticeDateJalali,
                    "DaysAssignmentToNotice" => item.DaysAssignmentToNotice,
                    "DaysNoticeToFinal" => item.DaysNoticeToFinal,
                    "DaysAssignmentToFinal" => item.DaysAssignmentToFinal,
                    _ => null
                };
            }
            return dict;
        }).ToList();

        return Result.Success<DynamicReportResultDto>(new DynamicReportResultDto
        {
            Columns = selectedColumns,
            Rows = rows,
            GlobalAggregates = globalAggregates,
            TotalRows = totalCount
        });
    }

    private static IQueryable<T> ApplySorting<T>(IQueryable<T> query, string sortField, bool sortDescending)
    {
        var param = Expression.Parameter(typeof(T), "p");
        var property = typeof(T).GetProperty(sortField);
        if (property == null) return query;

        var propAccess = Expression.Property(param, property);
        var lambda = Expression.Lambda(propAccess, param);

        string methodName = sortDescending ? "OrderByDescending" : "OrderBy";
        var resultExpression = Expression.Call(
            typeof(Queryable),
            methodName,
            new[] { typeof(T), property.PropertyType },
            query.Expression,
            Expression.Quote(lambda));

        return query.Provider.CreateQuery<T>(resultExpression);
    }

    private static List<ReportColumnMetadataDto> GetSelectedColumns(
        List<ReportColumnMetadataDto> availableColumns, 
        List<string>? requestedFields)
    {
        if (requestedFields == null || requestedFields.Count == 0)
            return availableColumns;

        var set = new HashSet<string>(requestedFields, StringComparer.OrdinalIgnoreCase);
        var filtered = availableColumns.Where(c => set.Contains(c.FieldName)).ToList();

        return filtered.Count > 0 ? filtered : availableColumns;
    }

    private static async Task<object?> ComputePayrollAggregateAsync(
        IQueryable<PayrollQueryableRecord> query, 
        DynamicAggregateSpecDto agg, 
        CancellationToken ct)
    {
        return agg.Function switch
        {
            AggregationType.Count => await query.CountAsync(ct),
            AggregationType.Sum when agg.FieldName == "OvertimeHours" => await query.SumAsync(p => p.OvertimeHours, ct),
            AggregationType.Sum when agg.FieldName == "OvertimeAmount" => await query.SumAsync(p => p.OvertimeAmount, ct),
            AggregationType.Sum when agg.FieldName == "WelfareAmount" => await query.SumAsync(p => p.WelfareAmount, ct),
            AggregationType.Sum => await query.SumAsync(p => p.TotalPaymentAmount, ct),
            AggregationType.Average when agg.FieldName == "OvertimeHours" => await query.AverageAsync(p => p.OvertimeHours, ct),
            AggregationType.Average => await query.AverageAsync(p => p.TotalPaymentAmount, ct),
            AggregationType.Max => await query.MaxAsync(p => p.TotalPaymentAmount, ct),
            AggregationType.Min => await query.MinAsync(p => p.TotalPaymentAmount, ct),
            _ => null
        };
    }
}

public class PayrollQueryableRecord
{
    public Guid Id { get; set; }
    public string PersonnelNumber { get; set; } = string.Empty;
    public string EmployeeName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public decimal OvertimeHours { get; set; }
    public decimal OvertimeRate { get; set; }
    public decimal OvertimeAmount { get; set; }
    public decimal WelfareRate { get; set; }
    public decimal WelfareAmount { get; set; }
    public decimal TotalPaymentAmount { get; set; }
    public bool IsLaborPosition { get; set; }
    public bool HasCapViolation { get; set; }
}

public class TaxRefundQueryableRecord
{
    public Guid Id { get; set; }
    public string CaseTrackingNumber { get; set; } = string.Empty;
    public string DocketNumber { get; set; } = string.Empty;
    public string TaxpayerName { get; set; } = string.Empty;
    public string EconomicCode { get; set; } = string.Empty;
    public string TaxSourceTitle { get; set; } = string.Empty;
    public int TaxYear { get; set; }
    public string StatusTitle { get; set; } = string.Empty;
    public Guid? OfficeId { get; set; }
    public decimal PrincipalTaxRefund { get; set; }
    public decimal DelayDamages { get; set; }
    public decimal GrandTotalRefundable { get; set; }
}

public class EmployeeEvaluationQueryableRecord
{
    public Guid Id { get; set; }
    public string PersonnelNumber { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string ServiceUnit { get; set; } = string.Empty;
    public string CurrentPosition { get; set; } = string.Empty;
    public Guid? OfficeId { get; set; }
    public int MissionDays { get; set; }
    public int SickLeaveDays { get; set; }
    public int AbsenceHours { get; set; }
    public decimal TaxEvasionDetectionAmount { get; set; }
}

public class TaxAuditQueryableRecord
{
    public long Id { get; set; }
    public string TaxpayerTin { get; set; } = string.Empty;
    public string TaxpayerName { get; set; } = string.Empty;
    public string FinalOfficeName { get; set; } = string.Empty;
    public int FiscalYear { get; set; }
    public string TaxSource { get; set; } = string.Empty;
    public int? TaxPeriod { get; set; }
    public string RiskLevel { get; set; } = string.Empty;
    public string AuditorName { get; set; } = string.Empty;
    public string AuditStatus { get; set; } = string.Empty;
    public decimal DeclaredTaxAmount { get; set; }
    public decimal AssessedTaxAmount { get; set; }
    public decimal FinalTaxAmount { get; set; }
    public string AssessmentNoticeDateJalali { get; set; } = string.Empty;
    public string FinalNoticeDateJalali { get; set; } = string.Empty;
    public int? DaysAssignmentToNotice { get; set; }
    public int? DaysNoticeToFinal { get; set; }
    public int? DaysAssignmentToFinal { get; set; }
    public Guid? OfficeId { get; set; }
}
