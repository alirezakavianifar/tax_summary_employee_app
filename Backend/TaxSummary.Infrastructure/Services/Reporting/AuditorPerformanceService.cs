using System.Data;
using System.Text;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities.Reporting;
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Services.Reporting;

public class AuditorPerformanceService : IAuditorPerformanceService
{
    private readonly TaxSummaryDbContext _db;
    private readonly IReportingRepository _reportingRepository;
    private readonly ILogger<AuditorPerformanceService> _logger;
    private readonly IHostEnvironment? _environment;

    public AuditorPerformanceService(
        TaxSummaryDbContext db, 
        IReportingRepository reportingRepository,
        ILogger<AuditorPerformanceService> logger,
        IHostEnvironment? environment = null)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _reportingRepository = reportingRepository ?? throw new ArgumentNullException(nameof(reportingRepository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _environment = environment;
    }

    private string? ResolveAuditorPhotoUrl(string? nationalId)
    {
        if (string.IsNullOrWhiteSpace(nationalId)) return null;
        var cleanNid = nationalId.Trim();

        if (_environment != null && !string.IsNullOrEmpty(_environment.ContentRootPath))
        {
            var jpgPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "employee-photos", $"{cleanNid}.jpg");
            if (File.Exists(jpgPath))
            {
                return $"/uploads/employee-photos/{cleanNid}.jpg";
            }
            var pngPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "employee-photos", $"{cleanNid}.png");
            if (File.Exists(pngPath))
            {
                return $"/uploads/employee-photos/{cleanNid}.png";
            }
        }
        else
        {
            var baseDir = AppContext.BaseDirectory;
            var jpgPath = Path.Combine(baseDir, "wwwroot", "uploads", "employee-photos", $"{cleanNid}.jpg");
            if (File.Exists(jpgPath))
            {
                return $"/uploads/employee-photos/{cleanNid}.jpg";
            }
        }

        return null;
    }

    public async Task<Result<List<AuditorPerformanceMetricDto>>> GetMetricDefinitionsAsync(
        bool includeInactive = false, 
        CancellationToken ct = default)
    {
        try
        {
            var query = _db.AuditorPerformanceMetricDefinitions.AsNoTracking().AsQueryable();
            if (!includeInactive)
                query = query.Where(m => m.IsActive);

            var list = await query.OrderBy(m => m.DisplayOrder).ToListAsync(ct);

            var dtos = list.Select(m => new AuditorPerformanceMetricDto
            {
                Id = m.Id,
                MetricCode = m.MetricCode,
                Title = m.Title,
                Description = m.Description,
                Category = m.Category,
                CategoryTitle = GetCategoryTitle(m.Category),
                FormulaType = m.FormulaType,
                PrimaryField = m.PrimaryField,
                SecondaryField = m.SecondaryField,
                Multiplier = m.Multiplier,
                WeightPercentage = m.WeightPercentage,
                HigherIsBetter = m.HigherIsBetter,
                TargetValue = m.TargetValue,
                WarningThreshold = m.WarningThreshold,
                CriticalThreshold = m.CriticalThreshold,
                Unit = m.Unit,
                DisplayOrder = m.DisplayOrder,
                IsActive = m.IsActive,
                TierThresholdsJson = m.TierThresholdsJson
            }).ToList();

            return Result.Success(dtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching auditor performance metric definitions");
            return Result.Failure<List<AuditorPerformanceMetricDto>>($"خطا در دریافت تعاریف شاخص‌های ارزیابی: {ex.Message}");
        }
    }

    public async Task<Result<AuditorPerformanceMetricDto>> SaveMetricDefinitionAsync(
        SaveAuditorMetricRequestDto request, 
        CancellationToken ct = default)
    {
        try
        {
            AuditorPerformanceMetricDefinition entity;

            if (request.Id.HasValue && request.Id.Value != Guid.Empty)
            {
                entity = await _db.AuditorPerformanceMetricDefinitions.FirstOrDefaultAsync(m => m.Id == request.Id.Value, ct);
                if (entity == null)
                    return Result.Failure<AuditorPerformanceMetricDto>("شاخص مورد نظر جهت ویرایش یافت نشد");

                entity.Update(
                    request.Title,
                    request.Description,
                    request.Category,
                    request.FormulaType,
                    request.PrimaryField,
                    request.SecondaryField,
                    request.Multiplier,
                    request.WeightPercentage,
                    request.HigherIsBetter,
                    request.TargetValue,
                    request.WarningThreshold,
                    request.CriticalThreshold,
                    request.Unit,
                    request.DisplayOrder,
                    request.IsActive,
                    request.TierThresholdsJson ?? "{}"
                );
            }
            else
            {
                var existingCode = await _db.AuditorPerformanceMetricDefinitions
                    .AnyAsync(m => m.MetricCode.ToLower() == request.MetricCode.ToLower(), ct);
                if (existingCode)
                    return Result.Failure<AuditorPerformanceMetricDto>($"کد شاخص '{request.MetricCode}' قبلاً ثبت شده است");

                entity = AuditorPerformanceMetricDefinition.Create(
                    request.MetricCode,
                    request.Title,
                    request.Description,
                    request.Category,
                    request.FormulaType,
                    request.PrimaryField,
                    request.SecondaryField,
                    request.Multiplier,
                    request.WeightPercentage,
                    request.HigherIsBetter,
                    request.TargetValue,
                    request.WarningThreshold,
                    request.CriticalThreshold,
                    request.Unit,
                    request.DisplayOrder,
                    request.TierThresholdsJson ?? "{}"
                );

                await _db.AuditorPerformanceMetricDefinitions.AddAsync(entity, ct);
            }

            await _db.SaveChangesAsync(ct);

            return Result.Success(new AuditorPerformanceMetricDto
            {
                Id = entity.Id,
                MetricCode = entity.MetricCode,
                Title = entity.Title,
                Description = entity.Description,
                Category = entity.Category,
                CategoryTitle = GetCategoryTitle(entity.Category),
                FormulaType = entity.FormulaType,
                PrimaryField = entity.PrimaryField,
                SecondaryField = entity.SecondaryField,
                Multiplier = entity.Multiplier,
                WeightPercentage = entity.WeightPercentage,
                HigherIsBetter = entity.HigherIsBetter,
                TargetValue = entity.TargetValue,
                WarningThreshold = entity.WarningThreshold,
                CriticalThreshold = entity.CriticalThreshold,
                Unit = entity.Unit,
                DisplayOrder = entity.DisplayOrder,
                IsActive = entity.IsActive,
                TierThresholdsJson = entity.TierThresholdsJson
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving auditor performance metric definition");
            return Result.Failure<AuditorPerformanceMetricDto>($"خطا در ذخیره شاخص: {ex.Message}");
        }
    }

    public async Task<Result<bool>> ToggleMetricStatusAsync(Guid id, bool isActive, CancellationToken ct = default)
    {
        try
        {
            var entity = await _db.AuditorPerformanceMetricDefinitions.FirstOrDefaultAsync(m => m.Id == id, ct);
            if (entity == null)
                return Result.Failure<bool>("شاخص مورد نظر یافت نشد");

            entity.SetActive(isActive);
            await _db.SaveChangesAsync(ct);
            return Result.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling metric status for ID {Id}", id);
            return Result.Failure<bool>($"خطا در تغییر وضعیت شاخص: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteMetricDefinitionAsync(Guid id, CancellationToken ct = default)
    {
        try
        {
            var entity = await _db.AuditorPerformanceMetricDefinitions.FirstOrDefaultAsync(m => m.Id == id, ct);
            if (entity == null)
                return Result.Failure<bool>("شاخص مورد نظر یافت نشد");

            _db.AuditorPerformanceMetricDefinitions.Remove(entity);
            await _db.SaveChangesAsync(ct);
            return Result.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting metric definition {Id}", id);
            return Result.Failure<bool>($"خطا در حذف شاخص: {ex.Message}");
        }
    }

    public async Task<Result<List<AuditDataSourceDto>>> GetAuditReportSourcesAsync(CancellationToken ct = default)
    {
        try
        {
            var sources = new List<AuditDataSourceDto>();

            // 1. Built-in Sanim Audit Assessments database
            int dbCount = await _db.SanimAuditAssessments.CountAsync(ct);
            sources.Add(new AuditDataSourceDto
            {
                SourceId = "SYSTEM",
                Title = "پایگاه داده اصلی سنیم (پرونده‌های رسیدگی استانی)",
                Description = "داده‌های تجمیعی و رسمی پرونده‌های رسیدگی مالیاتی مودیان استان خوزستان در پایگاه داده اصلی",
                TotalRecords = dbCount,
                IsSystemDefault = true,
                HasAuditorData = true,
                DetectedAuditorColumn = "AuditorName",
                ColumnsCount = 20
            });

            // 2. Custom Uploaded Excel Reports
            var reports = await _reportingRepository.GetAvailableReportsAsync(null, ReportDomainSource.CustomUploadedDataset, includeInactive: false, ct);
            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            foreach (var report in reports)
            {
                try
                {
                    if (string.IsNullOrWhiteSpace(report.ConfigurationJson)) continue;
                    var config = JsonSerializer.Deserialize<CustomDatasetConfigJsonDto>(report.ConfigurationJson, jsonOptions);
                    if (config == null || config.Columns == null || !config.Columns.Any()) continue;

                    var mapper = SemanticAuditFieldMapper.FromColumns(config.Columns);
                    if (mapper.HasAuditorData)
                    {
                        var auditorCol = config.Columns.FirstOrDefault(c => c.FieldName.Equals(mapper.AuditorNameField, StringComparison.OrdinalIgnoreCase));
                        sources.Add(new AuditDataSourceDto
                        {
                            SourceId = report.Code,
                            Title = report.Title,
                            Description = string.IsNullOrWhiteSpace(report.Description) ? $"گزارش بارگذاری‌شده از فایل اکسل ({config.OriginalFileName})" : report.Description,
                            TotalRecords = config.TotalRowCount,
                            IsSystemDefault = false,
                            HasAuditorData = true,
                            DetectedAuditorColumn = auditorCol?.OriginalHeader ?? auditorCol?.PersianLabel ?? "نام حسابرس",
                            ColumnsCount = config.Columns.Count,
                            LastUpdatedDate = report.CreatedAt.ToString("yyyy/MM/dd")
                        });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not parse report definition configuration for {ReportCode}", report.Code);
                }
            }

            return Result.Success(sources);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting audit report sources");
            return Result.Failure<List<AuditDataSourceDto>>($"خطا در دریافت منابع داده ارزیابی: {ex.Message}");
        }
    }

    private async Task<Result<List<AuditorCaseRecord>>> LoadAuditCasesAsync(
        string? reportCode,
        int? fiscalYear,
        string? officeName,
        CancellationToken ct)
    {
        // 1. If no report code or SYSTEM, query standard database
        if (string.IsNullOrWhiteSpace(reportCode) || reportCode.Equals("SYSTEM", StringComparison.OrdinalIgnoreCase))
        {
            var query = _db.SanimAuditAssessments.AsNoTracking().Where(s => !string.IsNullOrEmpty(s.AuditorName));

            if (fiscalYear.HasValue)
                query = query.Where(s => s.FiscalYear == fiscalYear.Value);

            if (!string.IsNullOrWhiteSpace(officeName))
                query = query.Where(s => s.FinalOfficeName.Contains(officeName.Trim()));

            var cases = await query.Select(s => new AuditorCaseRecord
            {
                AuditorName = s.AuditorName.Trim(),
                AuditorNationalId = s.AuditorNationalId,
                FinalOfficeName = s.FinalOfficeName,
                AuditStatus = !string.IsNullOrWhiteSpace(s.CurrentStatus) ? s.CurrentStatus : s.AuditStatus,
                RiskLevel = s.RiskLevel,
                DeclaredTaxAmount = s.DeclaredTaxAmount,
                AssessedTaxAmount = s.AssessedTaxAmount,
                FinalTaxAmount = s.FinalTaxAmount,
                DaysAssignmentToNotice = s.DaysAssignmentToNotice,
                DaysNoticeToFinal = s.DaysNoticeToFinal,
                DaysAssignmentToFinal = s.DaysAssignmentToFinal,
                FiscalYear = s.FiscalYear
            }).ToListAsync(ct);

            return Result.Success(cases);
        }

        // 2. Query custom uploaded dataset
        var report = await _reportingRepository.GetReportDefinitionByCodeAsync(reportCode, ct);
        if (report == null)
            return Result.Failure<List<AuditorCaseRecord>>($"گزارش با کد '{reportCode}' یافت نشد.");

        var config = JsonSerializer.Deserialize<CustomDatasetConfigJsonDto>(
            report.ConfigurationJson, 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (config == null || string.IsNullOrWhiteSpace(config.DatasetTableName))
            return Result.Failure<List<AuditorCaseRecord>>("پیکربندی این مجموعه داده نامعتبر است.");

        var mapper = SemanticAuditFieldMapper.FromColumns(config.Columns);
        if (!mapper.HasAuditorData)
            return Result.Failure<List<AuditorCaseRecord>>("در این گزارش ستون مربوط به نام حسابرس شناسایی نشد.");

        var connection = (SqliteConnection)_db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);

        var sql = new StringBuilder();
        sql.Append($"SELECT * FROM [{config.DatasetTableName}] WHERE [{mapper.AuditorNameField}] IS NOT NULL AND TRIM([{mapper.AuditorNameField}]) != ''");

        var sqlParams = new List<SqliteParameter>();

        if (!string.IsNullOrWhiteSpace(officeName) && mapper.OfficeNameField != null)
        {
            sql.Append($" AND [{mapper.OfficeNameField}] LIKE @OfficeName");
            sqlParams.Add(new SqliteParameter("@OfficeName", $"%{officeName.Trim()}%"));
        }

        using var cmd = connection.CreateCommand();
        cmd.CommandText = sql.ToString();
        foreach (var p in sqlParams) cmd.Parameters.Add(new SqliteParameter(p.ParameterName, p.Value));

        var results = new List<AuditorCaseRecord>();
        using var reader = await cmd.ExecuteReaderAsync(ct);

        while (await reader.ReadAsync(ct))
        {
            var rawAuditor = reader[mapper.AuditorNameField]?.ToString()?.Trim();
            if (string.IsNullOrWhiteSpace(rawAuditor)) continue;

            var rec = new AuditorCaseRecord
            {
                AuditorName = rawAuditor,
                AuditorNationalId = mapper.AuditorNationalIdField != null ? reader[mapper.AuditorNationalIdField]?.ToString()?.Trim() : null,
                FinalOfficeName = mapper.OfficeNameField != null ? reader[mapper.OfficeNameField]?.ToString()?.Trim() : null,
                AuditStatus = mapper.AuditStatusField != null ? reader[mapper.AuditStatusField]?.ToString()?.Trim() : null,
                RiskLevel = mapper.RiskLevelField != null ? reader[mapper.RiskLevelField]?.ToString()?.Trim() : null,
                DeclaredTaxAmount = mapper.DeclaredTaxField != null ? ParseDecimal(reader[mapper.DeclaredTaxField]) : 0m,
                AssessedTaxAmount = mapper.AssessedTaxField != null ? ParseDecimal(reader[mapper.AssessedTaxField]) : 0m,
                FinalTaxAmount = mapper.FinalTaxField != null ? ParseDecimal(reader[mapper.FinalTaxField]) : 0m
            };

            // Parse Dates
            DateTime? assignDt = mapper.AssignmentDateField != null ? TryParsePersianDate(reader[mapper.AssignmentDateField]) : null;
            DateTime? noticeDt = mapper.NoticeDateField != null ? TryParsePersianDate(reader[mapper.NoticeDateField]) : null;

            if (assignDt.HasValue && noticeDt.HasValue)
            {
                var diff = (noticeDt.Value - assignDt.Value).TotalDays;
                if (diff >= 0 && diff <= 1500)
                    rec.DaysAssignmentToNotice = diff;
            }

            results.Add(rec);
        }

        return Result.Success(results);
    }

    public async Task<Result<List<AuditorScorecardDto>>> EvaluateAuditorsAsync(
        int? fiscalYear, 
        string? officeName, 
        string? reportCode = null,
        CancellationToken ct = default)
    {
        try
        {
            var activeMetrics = await _db.AuditorPerformanceMetricDefinitions
                .AsNoTracking()
                .Where(m => m.IsActive)
                .OrderBy(m => m.DisplayOrder)
                .ToListAsync(ct);

            var casesResult = await LoadAuditCasesAsync(reportCode, fiscalYear, officeName, ct);
            if (casesResult.IsFailure)
                return Result.Failure<List<AuditorScorecardDto>>(casesResult.Error);

            var rawCases = casesResult.Value;
            if (!rawCases.Any())
                return Result.Success(new List<AuditorScorecardDto>());

            var auditorGroups = rawCases.GroupBy(x => x.AuditorName).ToList();
            var scorecards = new List<AuditorScorecardDto>();

            foreach (var group in auditorGroups)
            {
                var auditorName = group.Key;
                var sample = group.First();
                int totalCases = group.Count();

                int completedCases = group.Count(x =>
                    x.DaysAssignmentToNotice.HasValue ||
                    (!string.IsNullOrEmpty(x.AuditStatus) &&
                     (x.AuditStatus.Contains("رسیدگی شده") || x.AuditStatus.Contains("تشخیص") || x.AuditStatus.Contains("قطعی") || x.AuditStatus.Contains("اعتراض") || x.AuditStatus.Contains("رای") || x.AuditStatus.Contains("در انتظار تایید") || x.AuditStatus.Contains("تایید گزارش")) &&
                     !x.AuditStatus.Contains("تخصیص داده شد") &&
                     !x.AuditStatus.Contains("در انتظار ثبت گزارش") &&
                     !x.AuditStatus.Contains("در انتظار تخصیص")));

                if (completedCases == 0 && totalCases > 0 && group.All(x => string.IsNullOrWhiteSpace(x.AuditStatus)))
                    completedCases = totalCases;

                int finalizedCases = group.Count(x =>
                    !string.IsNullOrEmpty(x.AuditStatus) && (x.AuditStatus.Contains("قطعی") || x.AuditStatus.Contains("تایید")));

                decimal totalDeclared = group.Sum(x => x.DeclaredTaxAmount);
                decimal totalAssessed = group.Sum(x => x.AssessedTaxAmount);
                decimal totalFinal = group.Sum(x => x.FinalTaxAmount);

                var metricValues = new List<MetricValueResultDto>();
                decimal totalWeightedScore = 0m;

                foreach (var metric in activeMetrics)
                {
                    decimal rawVal = CalculateMetricValue(metric, group);
                    decimal normalizedScore = CalculateNormalizedScore(metric, rawVal);
                    decimal weightedScore = normalizedScore * (metric.WeightPercentage / 100m);
                    totalWeightedScore += weightedScore;

                    string statusBand = DetermineStatusBand(metric, rawVal);

                    metricValues.Add(new MetricValueResultDto
                    {
                        MetricCode = metric.MetricCode,
                        Title = metric.Title,
                        RawValue = Math.Round(rawVal, 2),
                        FormattedValue = FormatMetricDisplay(rawVal, metric.Unit),
                        Unit = metric.Unit,
                        NormalizedScore = Math.Round(normalizedScore, 1),
                        WeightPercentage = metric.WeightPercentage,
                        WeightedScore = Math.Round(weightedScore, 1),
                        StatusBand = statusBand
                    });
                }

                decimal compositeScore = Math.Round(Math.Clamp(totalWeightedScore, 0m, 100m), 1);
                var (tier, tierTitle) = DetermineTier(compositeScore);

                scorecards.Add(new AuditorScorecardDto
                {
                    AuditorName = auditorName,
                    AuditorNationalId = sample.AuditorNationalId,
                    PhotoUrl = ResolveAuditorPhotoUrl(sample.AuditorNationalId),
                    OfficeName = sample.FinalOfficeName,
                    TotalAssignedCases = totalCases,
                    CompletedCases = completedCases,
                    FinalizedCasesCount = finalizedCases,
                    TotalDeclaredAmount = totalDeclared,
                    TotalAssessedAmount = totalAssessed,
                    TotalFinalAmount = totalFinal,
                    CompositeScore = compositeScore,
                    PerformanceTier = tier,
                    TierTitleFa = tierTitle,
                    MetricValues = metricValues
                });
            }

            // Sort by CompositeScore descending and assign provincial ranks
            var ranked = scorecards.OrderByDescending(s => s.CompositeScore)
                .ThenByDescending(s => s.TotalAssessedAmount)
                .ToList();

            for (int i = 0; i < ranked.Count; i++)
            {
                ranked[i].ProvincialRank = i + 1;
            }

            return Result.Success(ranked);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating auditors for reportCode: {ReportCode}", reportCode);
            return Result.Failure<List<AuditorScorecardDto>>($"خطا در ارزیابی حسابرسان: {ex.Message}");
        }
    }

    public async Task<Result<Auditor360ProfileDto>> GetAuditor360ProfileAsync(
        string auditorName, 
        int? fiscalYear = null, 
        string? reportCode = null,
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(auditorName))
                return Result.Failure<Auditor360ProfileDto>("نام حسابرس الزامی است");

            var evaluateResult = await EvaluateAuditorsAsync(fiscalYear, null, reportCode, ct);
            if (evaluateResult.IsFailure)
                return Result.Failure<Auditor360ProfileDto>(evaluateResult.Error);

            var scorecard = evaluateResult.Value.FirstOrDefault(s => s.AuditorName.Trim() == auditorName.Trim());
            if (scorecard == null)
                return Result.Failure<Auditor360ProfileDto>($"حسابرس با نام '{auditorName}' یافت نشد");

            var casesResult = await LoadAuditCasesAsync(reportCode, fiscalYear, null, ct);
            if (casesResult.IsFailure)
                return Result.Failure<Auditor360ProfileDto>(casesResult.Error);

            var cases = casesResult.Value.Where(s => s.AuditorName.Trim() == auditorName.Trim()).ToList();

            int highRisk = cases.Count(c => c.RiskLevel != null && (c.RiskLevel.Contains("پرریسک") || c.RiskLevel.Contains("ریسک بالا") || c.RiskLevel.Contains("بالا")));
            int medRisk = cases.Count(c => c.RiskLevel != null && c.RiskLevel.Contains("متوسط"));
            int lowRisk = cases.Count(c => c.RiskLevel != null && (c.RiskLevel.Contains("کم") || c.RiskLevel.Contains("پایین")));

            var validNoticeDays = cases.Where(c => c.DaysAssignmentToNotice.HasValue).Select(c => c.DaysAssignmentToNotice!.Value).ToList();
            var validFinalDays = cases.Where(c => c.DaysNoticeToFinal.HasValue).Select(c => c.DaysNoticeToFinal!.Value).ToList();

            double avgNoticeDays = validNoticeDays.Any() ? Math.Round(validNoticeDays.Average(), 1) : 0;
            double avgFinalDays = validFinalDays.Any() ? Math.Round(validFinalDays.Average(), 1) : 0;

            decimal netGap = scorecard.TotalAssessedAmount - scorecard.TotalDeclaredAmount;
            decimal defensibilityRate = scorecard.TotalAssessedAmount > 0 
                ? Math.Round((scorecard.TotalFinalAmount / scorecard.TotalAssessedAmount) * 100m, 1) 
                : 0m;

            int finalizedCases = cases.Count(c => !string.IsNullOrEmpty(c.AuditStatus) && c.AuditStatus.Contains("قطعی"));
            decimal caseFinalityRate = cases.Count > 0 
                ? Math.Round(((decimal)finalizedCases / cases.Count) * 100m, 1) 
                : 0m;

            var officeBreakdowns = cases.GroupBy(c => c.FinalOfficeName ?? "نامشخص")
                .Select(g => new AuditorOfficeBreakdownDto
                {
                    OfficeName = g.Key,
                    CaseCount = g.Count(),
                    TotalAssessed = g.Sum(x => x.AssessedTaxAmount),
                    TotalFinal = g.Sum(x => x.FinalTaxAmount)
                }).ToList();

            var profile = new Auditor360ProfileDto
            {
                Scorecard = scorecard,
                HighRiskCasesCount = highRisk,
                MediumRiskCasesCount = medRisk,
                LowRiskCasesCount = lowRisk,
                AverageDaysAssignmentToNotice = avgNoticeDays,
                AverageDaysNoticeToFinal = avgFinalDays,
                NetTaxGapAddition = netGap,
                DefensibilityRate = defensibilityRate,
                CaseFinalityRate = caseFinalityRate,
                OfficeBreakdowns = officeBreakdowns
            };

            return Result.Success(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching 360 profile for auditor {AuditorName}", auditorName);
            return Result.Failure<Auditor360ProfileDto>($"خطا در دریافت مشخصات ۳۶۰ درجه حسابرس: {ex.Message}");
        }
    }

    public async Task<Result<AuditorMetricsSimulationResultDto>> SimulateMetricAsync(
        SaveAuditorMetricRequestDto request, 
        int? fiscalYear = null, 
        string? reportCode = null,
        CancellationToken ct = default)
    {
        try
        {
            var tempMetric = AuditorPerformanceMetricDefinition.Create(
                request.MetricCode ?? "SIMULATION",
                request.Title ?? "شبیه‌سازی",
                request.Description ?? string.Empty,
                request.Category,
                request.FormulaType,
                request.PrimaryField,
                request.SecondaryField,
                request.Multiplier,
                request.WeightPercentage,
                request.HigherIsBetter,
                request.TargetValue,
                request.WarningThreshold,
                request.CriticalThreshold,
                request.Unit,
                1,
                request.TierThresholdsJson ?? "{}"
            );

            var casesResult = await LoadAuditCasesAsync(reportCode, fiscalYear, null, ct);
            if (casesResult.IsFailure)
                return Result.Failure<AuditorMetricsSimulationResultDto>(casesResult.Error);

            var rawCases = casesResult.Value;
            if (!rawCases.Any())
                return Result.Failure<AuditorMetricsSimulationResultDto>("هیچ پرونده‌ای برای شبیه‌سازی یافت نشد");

            var auditorGroups = rawCases.GroupBy(x => x.AuditorName).ToList();
            var simulationResults = new List<(string Name, decimal Value)>();

            foreach (var g in auditorGroups)
            {
                decimal val = CalculateMetricValue(tempMetric, g);
                simulationResults.Add((g.Key, val));
            }

            var values = simulationResults.Select(x => x.Value).ToList();
            decimal avg = values.Any() ? values.Average() : 0m;
            decimal min = values.Any() ? values.Min() : 0m;
            decimal max = values.Any() ? values.Max() : 0m;

            var sorted = request.HigherIsBetter
                ? simulationResults.OrderByDescending(x => x.Value).ToList()
                : simulationResults.OrderBy(x => x.Value).ToList();

            var topAuditors = sorted.Take(3).Select(x => new AuditorScorecardDto
            {
                AuditorName = x.Name,
                CompositeScore = Math.Round(x.Value, 2)
            }).ToList();

            var bottomAuditors = sorted.TakeLast(3).Reverse().Select(x => new AuditorScorecardDto
            {
                AuditorName = x.Name,
                CompositeScore = Math.Round(x.Value, 2)
            }).ToList();

            return Result.Success(new AuditorMetricsSimulationResultDto
            {
                MetricCode = request.MetricCode ?? "SIMULATION",
                ProvincialAverage = Math.Round(avg, 2),
                MinValue = Math.Round(min, 2),
                MaxValue = Math.Round(max, 2),
                TotalAuditorsEvaluated = auditorGroups.Count,
                TopPerformers = topAuditors,
                BottomPerformers = bottomAuditors
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error simulating metric formula");
            return Result.Failure<AuditorMetricsSimulationResultDto>($"خطا در شبیه‌سازی فرمول: {ex.Message}");
        }
    }

    // Helper calculation methods
    private static decimal CalculateMetricValue(AuditorPerformanceMetricDefinition metric, IEnumerable<AuditorCaseRecord> group)
    {
        switch (metric.FormulaType)
        {
            case AuditorMetricFormulaType.Ratio:
                decimal num = SumField(metric.PrimaryField, group);
                decimal den = SumField(metric.SecondaryField ?? string.Empty, group);
                if (den <= 0m) return 0m;
                if (num <= 0m && metric.PrimaryField.Equals("FinalTaxAmount", StringComparison.OrdinalIgnoreCase))
                {
                    // Fallback to completed/assigned case ratio when final tax is not individually recorded
                    int completedCount = group.Count(x => x.DaysAssignmentToNotice.HasValue || (!string.IsNullOrEmpty(x.AuditStatus) && (x.AuditStatus.Contains("تایید") || x.AuditStatus.Contains("در انتظار تایید"))));
                    int totalCount = group.Count();
                    if (totalCount > 0 && completedCount > 0)
                    {
                        return Math.Clamp(((decimal)completedCount / totalCount) * 100m, 0m, 100m);
                    }
                }
                decimal ratio = (num / den) * metric.Multiplier;
                if (metric.Unit == "%" || metric.Unit == "درصد" || metric.MetricCode.Contains("DEFENSIBILITY", StringComparison.OrdinalIgnoreCase))
                {
                    return Math.Clamp(ratio, 0m, 100m);
                }
                return ratio;

            case AuditorMetricFormulaType.Difference:
                decimal p = SumField(metric.PrimaryField, group);
                decimal s = SumField(metric.SecondaryField ?? string.Empty, group);
                return (p - s) * metric.Multiplier;

            case AuditorMetricFormulaType.Average:
                var daysList = new List<double>();
                foreach (var item in group)
                {
                    if (metric.PrimaryField.Equals("DaysAssignmentToNotice", StringComparison.OrdinalIgnoreCase) && item.DaysAssignmentToNotice != null)
                        daysList.Add(item.DaysAssignmentToNotice.Value);
                    else if (metric.PrimaryField.Equals("DaysNoticeToFinal", StringComparison.OrdinalIgnoreCase) && item.DaysNoticeToFinal != null)
                        daysList.Add(item.DaysNoticeToFinal.Value);
                    else if (metric.PrimaryField.Equals("DaysAssignmentToFinal", StringComparison.OrdinalIgnoreCase) && item.DaysAssignmentToFinal != null)
                        daysList.Add(item.DaysAssignmentToFinal.Value);
                }
                return daysList.Any() ? (decimal)daysList.Average() * metric.Multiplier : 0m;

            case AuditorMetricFormulaType.Count:
                int count = 0;
                foreach (var item in group)
                {
                    if (metric.PrimaryField.Equals("AuditStatus", StringComparison.OrdinalIgnoreCase))
                    {
                        if (item.DaysAssignmentToNotice.HasValue ||
                            (item.AuditStatus != null &&
                             (item.AuditStatus.Contains("رسیدگی شده") || item.AuditStatus.Contains("تشخیص") || item.AuditStatus.Contains("قطعی") || item.AuditStatus.Contains("اعتراض") || item.AuditStatus.Contains("رای") || item.AuditStatus.Contains("در انتظار تایید") || item.AuditStatus.Contains("تایید گزارش")) &&
                             !item.AuditStatus.Contains("تخصیص داده شد") &&
                             !item.AuditStatus.Contains("در انتظار ثبت گزارش") &&
                             !item.AuditStatus.Contains("در انتظار تخصیص")))
                        {
                            count++;
                        }
                    }
                    else
                    {
                        count++;
                    }
                }
                return count * metric.Multiplier;

            case AuditorMetricFormulaType.Percentage:
                int total = group.Count();
                if (total == 0) return 0m;
                int matches = 0;
                foreach (var item in group)
                {
                    if (metric.PrimaryField.Equals("RiskLevel", StringComparison.OrdinalIgnoreCase))
                    {
                        if (item.RiskLevel != null && 
                            (item.RiskLevel.Contains("پرریسک") || item.RiskLevel.Contains("ریسک بالا") || item.RiskLevel.Contains("بالا") ||
                             item.RiskLevel.Contains("تجدید نظر") || item.RiskLevel.Contains("تجدیدنظر") || item.RiskLevel.Contains("هم عرض") || item.RiskLevel.Contains("هم‌عرض")))
                            matches++;
                    }
                    else if (metric.PrimaryField.Equals("AuditStatus", StringComparison.OrdinalIgnoreCase) ||
                             metric.PrimaryField.Equals("FinalizedStatus", StringComparison.OrdinalIgnoreCase) ||
                             metric.PrimaryField.Equals("isCompleted", StringComparison.OrdinalIgnoreCase) ||
                             metric.PrimaryField.Equals("FinalTax", StringComparison.OrdinalIgnoreCase) ||
                             metric.PrimaryField.Equals("Status", StringComparison.OrdinalIgnoreCase))
                    {
                        if (item.DaysAssignmentToNotice.HasValue ||
                            (!string.IsNullOrEmpty(item.AuditStatus) && (item.AuditStatus.Contains("قطعی") || item.AuditStatus.Contains("تایید"))))
                            matches++;
                    }
                }
                return ((decimal)matches / total) * 100m * metric.Multiplier;

            default:
                return 0m;
        }
    }

    private static decimal SumField(string fieldName, IEnumerable<AuditorCaseRecord> group)
    {
        if (string.IsNullOrWhiteSpace(fieldName)) return 0m;

        decimal sum = 0m;
        foreach (var item in group)
        {
            if (fieldName.Equals("FinalTaxAmount", StringComparison.OrdinalIgnoreCase))
                sum += item.FinalTaxAmount;
            else if (fieldName.Equals("AssessedTaxAmount", StringComparison.OrdinalIgnoreCase))
                sum += item.AssessedTaxAmount;
            else if (fieldName.Equals("DeclaredTaxAmount", StringComparison.OrdinalIgnoreCase))
                sum += item.DeclaredTaxAmount;
        }
        return sum;
    }

    private static decimal ParseDecimal(object? val)
    {
        if (val == null || val == DBNull.Value) return 0m;
        if (val is decimal d) return d;
        if (val is double db) return (decimal)db;
        if (val is long l) return l;
        if (val is int i) return i;
        var s = val.ToString()?.Trim();
        if (string.IsNullOrWhiteSpace(s)) return 0m;
        s = s.Replace(",", "");
        return decimal.TryParse(s, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsed) ? parsed : 0m;
    }

    private static DateTime? TryParsePersianDate(object? rawVal)
    {
        if (rawVal == null || rawVal == DBNull.Value) return null;
        var s = rawVal.ToString()?.Trim();
        if (string.IsNullOrWhiteSpace(s)) return null;

        s = s.Replace("/", "-");
        var parts = s.Split('-');
        if (parts.Length == 3 &&
            int.TryParse(parts[0], out int y) &&
            int.TryParse(parts[1], out int m) &&
            int.TryParse(parts[2], out int d))
        {
            if (y is >= 1300 and <= 1500 && m is >= 1 and <= 12 && d is >= 1 and <= 31)
            {
                try
                {
                    var pc = new System.Globalization.PersianCalendar();
                    int maxDays = pc.GetDaysInMonth(y, m);
                    d = Math.Min(d, maxDays);
                    return pc.ToDateTime(y, m, d, 0, 0, 0, 0);
                }
                catch
                {
                    return null;
                }
            }
            else if (y is >= 1970 and <= 2100)
            {
                if (DateTime.TryParse(s, out var dt)) return dt;
            }
        }
        return null;
    }

    public class AuditorCaseRecord
    {
        public string AuditorName { get; set; } = string.Empty;
        public string? AuditorNationalId { get; set; }
        public string? FinalOfficeName { get; set; }
        public string? AuditStatus { get; set; }
        public string? RiskLevel { get; set; }
        public decimal DeclaredTaxAmount { get; set; }
        public decimal AssessedTaxAmount { get; set; }
        public decimal FinalTaxAmount { get; set; }
        public double? DaysAssignmentToNotice { get; set; }
        public double? DaysNoticeToFinal { get; set; }
        public double? DaysAssignmentToFinal { get; set; }
        public int? FiscalYear { get; set; }
    }

    private static decimal CalculateNormalizedScore(AuditorPerformanceMetricDefinition metric, decimal rawValue)
    {
        if (metric.HigherIsBetter)
        {
            if (rawValue >= metric.TargetValue) return 100m;
            if (rawValue <= metric.CriticalThreshold) return 0m;

            decimal span = metric.TargetValue - metric.CriticalThreshold;
            if (span == 0) return 50m;
            decimal score = ((rawValue - metric.CriticalThreshold) / span) * 100m;
            return Math.Clamp(score, 0m, 100m);
        }
        else
        {
            // Lower is better (e.g. days lag)
            if (rawValue <= metric.TargetValue) return 100m;
            if (rawValue >= metric.CriticalThreshold) return 0m;

            decimal span = metric.CriticalThreshold - metric.TargetValue;
            if (span == 0) return 50m;
            decimal score = ((metric.CriticalThreshold - rawValue) / span) * 100m;
            return Math.Clamp(score, 0m, 100m);
        }
    }

    private static string DetermineStatusBand(AuditorPerformanceMetricDefinition metric, decimal rawValue)
    {
        if (metric.HigherIsBetter)
        {
            if (rawValue >= metric.TargetValue) return "Target"; // Green
            if (rawValue >= metric.WarningThreshold) return "Warning"; // Amber
            return "Critical"; // Red
        }
        else
        {
            if (rawValue <= metric.TargetValue) return "Target"; // Green
            if (rawValue <= metric.WarningThreshold) return "Warning"; // Amber
            return "Critical"; // Red
        }
    }

    private static (string Tier, string Title) DetermineTier(decimal compositeScore)
    {
        if (compositeScore >= 85m)
            return ("A", "ممتاز");
        if (compositeScore >= 70m)
            return ("B", "مطلوب");
        if (compositeScore >= 55m)
            return ("C", "متوسط");
        return ("D", "نیازمند بهبود");
    }

    private static string FormatMetricDisplay(decimal val, string unit)
    {
        if (unit == "ریال")
        {
            if (Math.Abs(val) >= 1_000_000_000_000m)
                return $"{(val / 1_000_000_000_000m):F1} همت";
            if (Math.Abs(val) >= 1_000_000_000m)
                return $"{(val / 1_000_000_000m):F1} میلیارد";
            return $"{val:N0} ریال";
        }

        if (unit == "%")
            return $"{val:F1}٪";

        if (unit == "روز")
            return $"{val:F0} روز";

        return $"{val:N0} {unit}".Trim();
    }

    private static string GetCategoryTitle(AuditorMetricCategory category)
    {
        return category switch
        {
            AuditorMetricCategory.Quality => "کیفیت و استحکام برگ تشخیص",
            AuditorMetricCategory.Financial => "مالی و کشف ماخذ",
            AuditorMetricCategory.Speed => "سرعت و مواعد قانونی",
            AuditorMetricCategory.Productivity => "ظرفیت و بهره‌وری رسیدگی",
            _ => "عمومی"
        };
    }
}
