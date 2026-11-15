using System.Data;
using System.IO;
using System.Text;
using System.Text.Json;
using MiniExcelLibs;
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
                TaxpayerTin = s.TaxpayerTin,
                CaseType = s.CaseType,
                TaxSource = s.TaxSource,
                CurrentStatus = s.CurrentStatus,
                FinalizationSource = s.FinalizationSource,
                AssessmentNoticeDateJalali = s.AssessmentNoticeDateJalali,
                FinalNoticeDateJalali = s.FinalNoticeDateJalali,
                AuditorAssignmentDateJalali = s.AuditorAssignmentDateJalali,
                DeclaredTaxAmount = s.DeclaredTaxAmount,
                AssessedTaxAmount = s.AssessedTaxAmount,
                FinalTaxAmount = s.FinalTaxAmount,
                DaysAssignmentToNotice = s.DaysAssignmentToNotice,
                DaysNoticeToFinal = s.DaysNoticeToFinal,
                DaysAssignmentToFinal = s.DaysAssignmentToFinal,
                FiscalYear = s.FiscalYear,
                ImportanceType = s.ImportanceType
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
                FinalTaxAmount = mapper.FinalTaxField != null ? ParseDecimal(reader[mapper.FinalTaxField]) : 0m,
                ImportanceType = mapper.ImportanceTypeField != null ? reader[mapper.ImportanceTypeField]?.ToString()?.Trim() : null,
                TaxpayerTin = mapper.TaxpayerTinField != null ? reader[mapper.TaxpayerTinField]?.ToString()?.Trim() : null,
                TaxSource = mapper.TaxSourceField != null ? reader[mapper.TaxSourceField]?.ToString()?.Trim() : null,
                CaseType = mapper.CaseTypeField != null ? reader[mapper.CaseTypeField]?.ToString()?.Trim() : null,
                CurrentStatus = mapper.CurrentStatusField != null ? reader[mapper.CurrentStatusField]?.ToString()?.Trim() : null,
                FinalizationSource = mapper.FinalizationSourceField != null ? reader[mapper.FinalizationSourceField]?.ToString()?.Trim() : null,
                AssessmentNoticeDateJalali = mapper.NoticeDateField != null ? reader[mapper.NoticeDateField]?.ToString()?.Trim() : null,
                FinalNoticeDateJalali = mapper.FinalNoticeDateField != null ? reader[mapper.FinalNoticeDateField]?.ToString()?.Trim() : null,
                AuditorAssignmentDateJalali = mapper.AssignmentDateField != null ? reader[mapper.AssignmentDateField]?.ToString()?.Trim() : null
            };

            // 1. Assignment to Notice Days (Direct from Sanim or calculate from dates)
            if (mapper.DaysAssignmentToNoticeField != null && reader[mapper.DaysAssignmentToNoticeField] != DBNull.Value)
            {
                if (double.TryParse(reader[mapper.DaysAssignmentToNoticeField]?.ToString(), out double dNotice) && dNotice >= 0)
                {
                    rec.DaysAssignmentToNotice = dNotice;
                }
            }
            if (!rec.DaysAssignmentToNotice.HasValue)
            {
                DateTime? assignDt = mapper.AssignmentDateField != null ? TryParsePersianDate(reader[mapper.AssignmentDateField]) : null;
                DateTime? noticeDt = mapper.NoticeDateField != null ? TryParsePersianDate(reader[mapper.NoticeDateField]) : null;

                if (assignDt.HasValue && noticeDt.HasValue)
                {
                    var diff = (noticeDt.Value - assignDt.Value).TotalDays;
                    if (diff >= 0 && diff <= 1500)
                        rec.DaysAssignmentToNotice = diff;
                }
            }

            // 2. Assignment to Final Days (Direct from Sanim or calculate from dates)
            if (mapper.DaysAssignmentToFinalField != null && reader[mapper.DaysAssignmentToFinalField] != DBNull.Value)
            {
                if (double.TryParse(reader[mapper.DaysAssignmentToFinalField]?.ToString(), out double dFinal) && dFinal >= 0)
                {
                    rec.DaysAssignmentToFinal = dFinal;
                }
            }
            if (!rec.DaysAssignmentToFinal.HasValue)
            {
                DateTime? assignDt = mapper.AssignmentDateField != null ? TryParsePersianDate(reader[mapper.AssignmentDateField]) : null;
                DateTime? finalDt = mapper.FinalNoticeDateField != null ? TryParsePersianDate(reader[mapper.FinalNoticeDateField]) : null;

                if (assignDt.HasValue && finalDt.HasValue)
                {
                    var diff = (finalDt.Value - assignDt.Value).TotalDays;
                    if (diff >= 0 && diff <= 1500)
                        rec.DaysAssignmentToFinal = diff;
                }
            }

            // 3. Notice to Final Days (Direct from Sanim or calculate from dates)
            if (mapper.DaysNoticeToFinalField != null && reader[mapper.DaysNoticeToFinalField] != DBNull.Value)
            {
                if (double.TryParse(reader[mapper.DaysNoticeToFinalField]?.ToString(), out double dNtF) && dNtF >= 0)
                {
                    rec.DaysNoticeToFinal = dNtF;
                }
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
        public string? TaxpayerTin { get; set; }
        public string? CaseType { get; set; }
        public string? TaxSource { get; set; }
        public string? CurrentStatus { get; set; }
        public string? FinalizationSource { get; set; }
        public string? AssessmentNoticeDateJalali { get; set; }
        public string? FinalNoticeDateJalali { get; set; }
        public string? AuditorAssignmentDateJalali { get; set; }
        public decimal DeclaredTaxAmount { get; set; }
        public decimal AssessedTaxAmount { get; set; }
        public decimal FinalTaxAmount { get; set; }
        public double? DaysAssignmentToNotice { get; set; }
        public double? DaysNoticeToFinal { get; set; }
        public double? DaysAssignmentToFinal { get; set; }
        public int? FiscalYear { get; set; }
        public string? ImportanceType { get; set; }
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

    #region SRS Performance Evaluation System (FR-01 to FR-08)

    public async Task<Result<SrsRuleSetConfigDto>> GetSrsRuleConfigurationAsync(CancellationToken ct = default)
    {
        try
        {
            var ruleSet = await _db.AuditorEvaluationRuleSets.FirstOrDefaultAsync(r => r.IsActive, ct);
            if (ruleSet == null)
            {
                ruleSet = AuditorEvaluationRuleSet.CreateDefault();
                await _db.AuditorEvaluationRuleSets.AddAsync(ruleSet, ct);
                await _db.SaveChangesAsync(ct);
            }

            return Result.Success(MapRuleSetToDto(ruleSet));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting SRS rule configuration");
            return Result.Failure<SrsRuleSetConfigDto>($"خطا در دریافت تنظیمات بخشنامه ارزیابی عملکرد: {ex.Message}");
        }
    }

    public async Task<Result<SrsRuleSetConfigDto>> SaveSrsRuleConfigurationAsync(
        SaveSrsRuleConfigRequestDto request, 
        CancellationToken ct = default)
    {
        try
        {
            var ruleSet = await _db.AuditorEvaluationRuleSets.FirstOrDefaultAsync(r => r.IsActive, ct);
            if (ruleSet == null)
            {
                ruleSet = AuditorEvaluationRuleSet.CreateDefault();
                await _db.AuditorEvaluationRuleSets.AddAsync(ruleSet, ct);
            }

            var weightsJson = JsonSerializer.Serialize(request.WeightsMatrix);
            var allowedDaysJson = JsonSerializer.Serialize(request.AllowedDays);

            ruleSet.Update(
                request.Title,
                request.Description,
                weightsJson,
                request.GrowthThresholdLegalEntity,
                request.GrowthThresholdIndividual,
                request.AdjustmentThreshold,
                request.DailyDelayPenalty,
                allowedDaysJson,
                request.Top300TaxpayersCount,
                request.AllowNegativeSpeedScore,
                request.IsActive,
                request.MajorCasesLabel,
                request.MajorCasesTag
            );

            await _db.SaveChangesAsync(ct);
            return Result.Success(MapRuleSetToDto(ruleSet));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving SRS rule configuration");
            return Result.Failure<SrsRuleSetConfigDto>($"خطا در ذخیره تنظیمات بخشنامه ارزیابی: {ex.Message}");
        }
    }

    public async Task<Result<SrsRuleSetConfigDto>> ResetSrsRuleConfigurationAsync(CancellationToken ct = default)
    {
        try
        {
            var ruleSet = await _db.AuditorEvaluationRuleSets.FirstOrDefaultAsync(r => r.IsActive, ct);
            if (ruleSet == null)
            {
                ruleSet = AuditorEvaluationRuleSet.CreateDefault();
                await _db.AuditorEvaluationRuleSets.AddAsync(ruleSet, ct);
            }
            else
            {
                ruleSet.ResetToDefaults();
            }

            await _db.SaveChangesAsync(ct);
            return Result.Success(MapRuleSetToDto(ruleSet));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting SRS rule configuration");
            return Result.Failure<SrsRuleSetConfigDto>($"خطا در بازنشانی تنظیمات پیش‌فرض بخشنامه: {ex.Message}");
        }
    }

    private static SrsRuleSetConfigDto MapRuleSetToDto(AuditorEvaluationRuleSet ruleSet)
    {
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var weights = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, decimal>>>(ruleSet.WeightsMatrixJson, options)
                      ?? new();
        var allowedDays = JsonSerializer.Deserialize<Dictionary<string, AllowedDaysLimitDto>>(ruleSet.AllowedDaysJson, options)
                          ?? new();

        return new SrsRuleSetConfigDto
        {
            Id = ruleSet.Id,
            Code = ruleSet.Code,
            Title = ruleSet.Title,
            Description = ruleSet.Description,
            GrowthThresholdLegalEntity = ruleSet.GrowthThresholdLegalEntity,
            GrowthThresholdIndividual = ruleSet.GrowthThresholdIndividual,
            AdjustmentThreshold = ruleSet.AdjustmentThreshold,
            DailyDelayPenalty = ruleSet.DailyDelayPenalty,
            Top300TaxpayersCount = ruleSet.Top300TaxpayersCount,
            MajorCasesLabel = ruleSet.MajorCasesLabel ?? "۳۰۰ پرونده مهم",
            MajorCasesTag = ruleSet.MajorCasesTag ?? "300Parvande, 100Parvande",
            AllowNegativeSpeedScore = ruleSet.AllowNegativeSpeedScore,
            IsActive = ruleSet.IsActive,
            WeightsMatrix = weights,
            AllowedDays = allowedDays
        };
    }

    public async Task<Result<List<SrsEmployeeScorecardDto>>> EvaluateAuditorsSrsAsync(
        int? fiscalYear, 
        string? officeName, 
        string? reportCode = null, 
        CancellationToken ct = default)
    {
        try
        {
            var ruleResult = await GetSrsRuleConfigurationAsync(ct);
            if (ruleResult.IsFailure)
                return Result.Failure<List<SrsEmployeeScorecardDto>>(ruleResult.Error);

            var rules = ruleResult.Value;

            var casesResult = await LoadAuditCasesAsync(reportCode, fiscalYear, officeName, ct);
            if (casesResult.IsFailure)
                return Result.Failure<List<SrsEmployeeScorecardDto>>(casesResult.Error);

            var rawCases = casesResult.Value;
            if (!rawCases.Any())
                return Result.Success(new List<SrsEmployeeScorecardDto>());

            // Identify Major Corporate Taxpayers based on rules.MajorCasesTag
            var allowedTags = (rules.MajorCasesTag ?? "300Parvande, 100Parvande")
                .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim())
                .Where(t => !string.IsNullOrEmpty(t))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            if (!allowedTags.Any())
            {
                allowedTags.Add("300Parvande");
                allowedTags.Add("100Parvande");
            }

            var top300Tins = rawCases
                .Where(c => !string.IsNullOrWhiteSpace(c.TaxpayerTin) && 
                            !string.IsNullOrWhiteSpace(c.ImportanceType) && 
                            allowedTags.Contains(c.ImportanceType.Trim()))
                .Select(c => c.TaxpayerTin!.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            // If rawCases did not include ImportanceType (e.g. from an older dataset), query DB for all tagged major TINs
            if (!top300Tins.Any())
            {
                var dbMajorTins = await _db.SanimAuditAssessments
                    .Where(s => s.ImportanceType != null && !string.IsNullOrWhiteSpace(s.TaxpayerTin))
                    .Select(s => new { s.TaxpayerTin, s.ImportanceType })
                    .ToListAsync(ct);

                foreach (var item in dbMajorTins)
                {
                    if (item.ImportanceType != null && allowedTags.Contains(item.ImportanceType.Trim()))
                    {
                        top300Tins.Add(item.TaxpayerTin.Trim());
                    }
                }
            }

            var categories = new[]
            {
                "Corporate300",
                "CorporateOther",
                "Vat300",
                "VatLegalOther",
                "BusinessIncome",
                "VatIndividual",
                "PropertyTax"
            };

            var indicatorsMeta = new (string Code, string Title, int Order, bool IsNegative)[]
            {
                ("AssessmentsIssued", "تعداد برگ تشخیص صادره", 1, false),
                ("FinalizedAssessments", "تعداد پرونده‌های قطعی شده", 2, false),
                ("TaxpayerAcceptance", "تمکین و قبولی برگ تشخیص", 3, false),
                ("Article238Agreements", "توافقات موضوع ماده ۲۳۸", 4, false),
                ("AssessmentGrowth", "رشد تشخیص نسبت به ابراز", 5, false),
                ("TaxAdjustment", "تعدیل مالیات قطعی نسبت به تشخیصی", 6, true),
                ("IssuanceSpeed", "سرعت صدور برگ تشخیص از مرحله ۲", 7, false),
                ("FinalizationSpeed", "سرعت قطعیت پرونده از مرحله ۲", 8, false)
            };

            var auditorGroups = rawCases.GroupBy(c => c.AuditorName).ToList();
            var scorecards = new List<SrsEmployeeScorecardDto>();

            foreach (var group in auditorGroups)
            {
                var auditorName = group.Key;
                var sample = group.First();
                int totalCases = group.Count();

                var categoryCounts = categories.ToDictionary(c => c, _ => 0);
                var categorizedCases = new List<(AuditorCaseRecord Case, string Category)>();

                foreach (var item in group)
                {
                    string cat = ClassifyTaxCase(item, top300Tins, allowedTags);
                    categorizedCases.Add((item, cat));
                    categoryCounts[cat]++;
                }

                var indicatorScores = new List<SrsIndicatorScoreDto>();
                decimal totalPositivePoints = 0m;
                decimal totalNegativeDeductions = 0m;

                foreach (var meta in indicatorsMeta)
                {
                    var details = new Dictionary<string, SrsIndicatorCategoryDetailDto>();
                    decimal indicatorTotalPoints = 0m;

                    var indWeights = rules.WeightsMatrix.ContainsKey(meta.Code) 
                        ? rules.WeightsMatrix[meta.Code] 
                        : new Dictionary<string, decimal>();

                    foreach (var cat in categories)
                    {
                        decimal weight = indWeights.ContainsKey(cat) ? indWeights[cat] : 0m;
                        var casesInCat = categorizedCases.Where(x => x.Category == cat).Select(x => x.Case).ToList();

                        var detail = CalculateIndicatorCategoryDetail(
                            meta.Code,
                            cat,
                            casesInCat,
                            weight,
                            rules
                        );

                        details[cat] = detail;
                        indicatorTotalPoints += detail.Points;

                        if (meta.IsNegative || detail.Points < 0)
                        {
                            totalNegativeDeductions += Math.Abs(detail.Points);
                        }
                        else
                        {
                            totalPositivePoints += detail.Points;
                        }

                        // Also track speed delay deduction points separately if positive indicator has deductions
                        if (detail.DeductionPoints.HasValue && detail.DeductionPoints.Value > 0)
                        {
                            totalNegativeDeductions += detail.DeductionPoints.Value;
                        }
                    }

                    indicatorScores.Add(new SrsIndicatorScoreDto
                    {
                        IndicatorCode = meta.Code,
                        IndicatorTitle = meta.Title,
                        IndicatorOrder = meta.Order,
                        IsNegative = meta.IsNegative,
                        TotalPoints = Math.Round(indicatorTotalPoints, 2),
                        CategoryDetails = details
                    });
                }

                decimal totalScore = Math.Round(totalPositivePoints - totalNegativeDeductions, 2);

                scorecards.Add(new SrsEmployeeScorecardDto
                {
                    AuditorName = auditorName,
                    AuditorNationalId = sample.AuditorNationalId,
                    PhotoUrl = ResolveAuditorPhotoUrl(sample.AuditorNationalId),
                    OfficeName = sample.FinalOfficeName ?? string.Empty,
                    TotalCases = totalCases,
                    TotalScore = totalScore,
                    TotalPositivePoints = Math.Round(totalPositivePoints, 2),
                    TotalNegativeDeductions = Math.Round(totalNegativeDeductions, 2),
                    MajorCasesLabel = rules.MajorCasesLabel ?? "۳۰۰ پرونده مهم",
                    CategorySummaries = categoryCounts,
                    Indicators = indicatorScores
                });
            }

            // Sort by TotalScore descending, then by TotalCases descending
            var ranked = scorecards
                .OrderByDescending(s => s.TotalScore)
                .ThenByDescending(s => s.TotalCases)
                .ToList();

            int totalRanked = ranked.Count;
            for (int i = 0; i < totalRanked; i++)
            {
                ranked[i].ProvincialRank = i + 1;
                double percentile = (double)(i + 1) / totalRanked;
                if (percentile <= 0.20)
                {
                    ranked[i].PerformanceTier = "A";
                    ranked[i].TierTitleFa = "ممتاز (الف)";
                }
                else if (percentile <= 0.55)
                {
                    ranked[i].PerformanceTier = "B";
                    ranked[i].TierTitleFa = "مطلوب (ب)";
                }
                else if (percentile <= 0.85)
                {
                    ranked[i].PerformanceTier = "C";
                    ranked[i].TierTitleFa = "متوسط (ج)";
                }
                else
                {
                    ranked[i].PerformanceTier = "D";
                    ranked[i].TierTitleFa = "نیازمند بهبود (د)";
                }
            }

            return Result.Success(ranked);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating auditors under SRS rules");
            return Result.Failure<List<SrsEmployeeScorecardDto>>($"خطا در ارزیابی عملکرد بر اساس بخشنامه: {ex.Message}");
        }
    }

    public async Task<Result<SrsEmployeeScorecardDto>> GetAuditorSrsScorecardAsync(
        string auditorName, 
        int? fiscalYear = null, 
        string? reportCode = null, 
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(auditorName))
                return Result.Failure<SrsEmployeeScorecardDto>("نام حسابرس الزامی است");

            var evaluateResult = await EvaluateAuditorsSrsAsync(fiscalYear, null, reportCode, ct);
            if (evaluateResult.IsFailure)
                return Result.Failure<SrsEmployeeScorecardDto>(evaluateResult.Error);

            var scorecard = evaluateResult.Value.FirstOrDefault(s => s.AuditorName.Trim().Equals(auditorName.Trim(), StringComparison.OrdinalIgnoreCase));
            if (scorecard == null)
                return Result.Failure<SrsEmployeeScorecardDto>($"حسابرس با نام '{auditorName}' یافت نشد");

            return Result.Success(scorecard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching SRS scorecard for auditor {AuditorName}", auditorName);
            return Result.Failure<SrsEmployeeScorecardDto>($"خطا در دریافت کارنامه امتیازی حسابرس: {ex.Message}");
        }
    }

    private static string ClassifyTaxCase(AuditorCaseRecord rec, HashSet<string> top300Tins, HashSet<string> allowedTags)
    {
        bool isLegal = (rec.CaseType != null && rec.CaseType.Contains("حقوقی")) || 
                       (!string.IsNullOrEmpty(rec.TaxpayerTin) && rec.TaxpayerTin.Trim().Length == 11) ||
                       (!string.IsNullOrEmpty(rec.TaxSource) && (rec.TaxSource.Contains("شرکت") || rec.TaxSource.Contains("حقوقی")));

        bool isTop300 = isLegal && (
            (!string.IsNullOrEmpty(rec.ImportanceType) && allowedTags.Contains(rec.ImportanceType.Trim())) ||
            (!string.IsNullOrEmpty(rec.TaxpayerTin) && top300Tins.Contains(rec.TaxpayerTin.Trim()))
        );
        string source = rec.TaxSource ?? string.Empty;

        if (isLegal)
        {
            if (source.Contains("ارزش افزوده") || source.Contains("دخانی") || source.Contains("طلا"))
                return isTop300 ? "Vat300" : "VatLegalOther";

            if (source.Contains("شرکت") || source.Contains("حقوقی"))
                return isTop300 ? "Corporate300" : "CorporateOther";

            if (source.Contains("مستغلات") || source.Contains("املاک") || source.Contains("آلاینده"))
                return "PropertyTax";

            return isTop300 ? "Corporate300" : "CorporateOther";
        }
        else
        {
            if (source.Contains("ارزش افزوده") || source.Contains("دخانی") || source.Contains("طلا"))
                return "VatIndividual";

            if (source.Contains("مشاغل") || source.Contains("حقیقی"))
                return "BusinessIncome";

            if (source.Contains("مستغلات") || source.Contains("املاک"))
                return "PropertyTax";

            return "BusinessIncome";
        }
    }

    private static SrsIndicatorCategoryDetailDto CalculateIndicatorCategoryDetail(
        string indicatorCode,
        string category,
        List<AuditorCaseRecord> cases,
        decimal weight,
        SrsRuleSetConfigDto rules)
    {
        switch (indicatorCode)
        {
            case "AssessmentsIssued": // FR-01
                int issuedCount = cases.Count(c =>
                    c.DaysAssignmentToNotice.HasValue ||
                    !string.IsNullOrWhiteSpace(c.AssessmentNoticeDateJalali) ||
                    (!string.IsNullOrEmpty(c.CurrentStatus) && (c.CurrentStatus.Contains("تشخیص") || c.CurrentStatus.Contains("قطعی") || c.CurrentStatus.Contains("اعتراض") || c.CurrentStatus.Contains("رای"))) ||
                    (!string.IsNullOrEmpty(c.AuditStatus) && c.AuditStatus.Contains("رسیدگی شده")));

                return new SrsIndicatorCategoryDetailDto
                {
                    CaseCount = issuedCount,
                    Weight = weight,
                    Points = Math.Round(issuedCount * weight, 2)
                };

            case "FinalizedAssessments": // FR-02
                int finalizedCount = cases.Count(c =>
                    c.DaysNoticeToFinal.HasValue ||
                    !string.IsNullOrWhiteSpace(c.FinalNoticeDateJalali) ||
                    (!string.IsNullOrEmpty(c.CurrentStatus) && (c.CurrentStatus.Contains("قطعی") || c.CurrentStatus.Contains("رای"))) ||
                    c.FinalTaxAmount > 0);

                return new SrsIndicatorCategoryDetailDto
                {
                    CaseCount = finalizedCount,
                    Weight = weight,
                    Points = Math.Round(finalizedCount * weight, 2)
                };

            case "TaxpayerAcceptance": // FR-03 (Only finalized cases qualify)
                int acceptedCount = cases.Count(c =>
                    (c.DaysNoticeToFinal.HasValue || !string.IsNullOrWhiteSpace(c.FinalNoticeDateJalali) || (!string.IsNullOrEmpty(c.CurrentStatus) && c.CurrentStatus.Contains("قطعی")) || c.FinalTaxAmount > 0) &&
                    ((c.FinalizationSource != null && (c.FinalizationSource.Contains("اصلاح") || c.FinalizationSource.Contains("تمکین") || c.FinalizationSource.Contains("حسابرسی سازمان"))) ||
                     (c.CurrentStatus != null && c.CurrentStatus.Contains("تمکین")) ||
                     (c.FinalizationSource == null && !string.IsNullOrEmpty(c.CurrentStatus) && c.CurrentStatus.Contains("قطعی") && !c.CurrentStatus.Contains("هیات") && !c.CurrentStatus.Contains("اعتراض"))));

                return new SrsIndicatorCategoryDetailDto
                {
                    CaseCount = acceptedCount,
                    Weight = weight,
                    Points = Math.Round(acceptedCount * weight, 2)
                };

            case "Article238Agreements": // FR-04 (Only finalized cases qualify)
                int art238Count = cases.Count(c =>
                    (c.DaysNoticeToFinal.HasValue || !string.IsNullOrWhiteSpace(c.FinalNoticeDateJalali) || (!string.IsNullOrEmpty(c.CurrentStatus) && c.CurrentStatus.Contains("قطعی")) || c.FinalTaxAmount > 0) &&
                    ((c.FinalizationSource != null && (c.FinalizationSource.Contains("اعتراض به اداره") || c.FinalizationSource.Contains("238") || c.FinalizationSource.Contains("۲۳۸"))) ||
                     (c.CurrentStatus != null && (c.CurrentStatus.Contains("رای اعتراض اداره") || c.CurrentStatus.Contains("اعتراض در اداره")))));

                return new SrsIndicatorCategoryDetailDto
                {
                    CaseCount = art238Count,
                    Weight = weight,
                    Points = Math.Round(art238Count * weight, 2)
                };

            case "AssessmentGrowth": // FR-05 (Only finalized cases qualify)
                bool isLegal = category.StartsWith("Corporate") || category.StartsWith("Vat300") || category.StartsWith("VatLegal");
                decimal growthThreshold = isLegal ? rules.GrowthThresholdLegalEntity : rules.GrowthThresholdIndividual;

                int growthCount = cases.Count(c =>
                {
                    bool isFinal = c.DaysNoticeToFinal.HasValue || !string.IsNullOrWhiteSpace(c.FinalNoticeDateJalali) || (!string.IsNullOrEmpty(c.CurrentStatus) && c.CurrentStatus.Contains("قطعی")) || c.FinalTaxAmount > 0;
                    if (!isFinal) return false;

                    if (c.DeclaredTaxAmount <= 0)
                        return c.AssessedTaxAmount > 0; // Infinite growth from zero declared tax

                    decimal growth = ((c.AssessedTaxAmount - c.DeclaredTaxAmount) / c.DeclaredTaxAmount) * 100m;
                    return growth > growthThreshold;
                });

                return new SrsIndicatorCategoryDetailDto
                {
                    CaseCount = growthCount,
                    Weight = weight,
                    Points = Math.Round(growthCount * weight, 2)
                };

            case "TaxAdjustment": // FR-06 (Only finalized cases qualify, negative points)
                decimal adjThreshold = rules.AdjustmentThreshold;

                int adjCount = cases.Count(c =>
                {
                    bool isFinal = c.DaysNoticeToFinal.HasValue || !string.IsNullOrWhiteSpace(c.FinalNoticeDateJalali) || (!string.IsNullOrEmpty(c.CurrentStatus) && c.CurrentStatus.Contains("قطعی")) || c.FinalTaxAmount > 0;
                    if (!isFinal) return false;

                    if (c.AssessedTaxAmount <= 0) return false;
                    if (c.FinalTaxAmount >= c.AssessedTaxAmount) return false;

                    decimal reductionRate = ((c.AssessedTaxAmount - c.FinalTaxAmount) / c.AssessedTaxAmount) * 100m;
                    return reductionRate > adjThreshold;
                });

                // Weight is typically negative (-10, -4, etc.)
                decimal negativeWeight = weight < 0 ? weight : -Math.Abs(weight);
                return new SrsIndicatorCategoryDetailDto
                {
                    CaseCount = adjCount,
                    Weight = negativeWeight,
                    Points = Math.Round(adjCount * negativeWeight, 2)
                };

            case "IssuanceSpeed": // FR-07 (Step 2 to Notice)
                int allowedIssuanceDays = rules.AllowedDays.ContainsKey(category) 
                    ? rules.AllowedDays[category].IssuanceAllowedDays 
                    : 45;

                var validIssuanceCases = cases.Where(c => c.DaysAssignmentToNotice.HasValue && c.DaysAssignmentToNotice.Value >= 0).ToList();
                int speedIssuanceCount = validIssuanceCases.Count;
                if (speedIssuanceCount == 0)
                {
                    return new SrsIndicatorCategoryDetailDto
                    {
                        CaseCount = 0,
                        Weight = weight,
                        AllowedDays = allowedIssuanceDays,
                        Points = 0m
                    };
                }

                double avgIssuanceDays = validIssuanceCases.Average(c => c.DaysAssignmentToNotice!.Value);
                double totalIssuanceDelay = validIssuanceCases.Sum(c => Math.Max(0.0, c.DaysAssignmentToNotice!.Value - allowedIssuanceDays));
                decimal totalIssuanceDeductions = (decimal)totalIssuanceDelay * rules.DailyDelayPenalty;

                decimal netIssuancePoints = (speedIssuanceCount * weight) - totalIssuanceDeductions;
                if (!rules.AllowNegativeSpeedScore && netIssuancePoints < 0)
                    netIssuancePoints = 0m;

                return new SrsIndicatorCategoryDetailDto
                {
                    CaseCount = speedIssuanceCount,
                    Weight = weight,
                    AvgActualDays = Math.Round(avgIssuanceDays, 1),
                    AllowedDays = allowedIssuanceDays,
                    DelayDays = Math.Round(totalIssuanceDelay, 1),
                    DeductionPoints = Math.Round(totalIssuanceDeductions, 2),
                    Points = Math.Round(netIssuancePoints, 2)
                };

            case "FinalizationSpeed": // FR-08 (Step 2 to Finalization)
                int allowedFinalDays = rules.AllowedDays.ContainsKey(category) 
                    ? rules.AllowedDays[category].FinalizationAllowedDays 
                    : 45;

                var validFinalCases = cases.Where(c => 
                    (c.DaysAssignmentToFinal.HasValue && c.DaysAssignmentToFinal.Value >= 0) ||
                    (c.DaysAssignmentToNotice.HasValue && c.DaysNoticeToFinal.HasValue && (c.DaysAssignmentToNotice.Value + c.DaysNoticeToFinal.Value) >= 0)
                ).ToList();

                int speedFinalCount = validFinalCases.Count;
                if (speedFinalCount == 0)
                {
                    return new SrsIndicatorCategoryDetailDto
                    {
                        CaseCount = 0,
                        Weight = weight,
                        AllowedDays = allowedFinalDays,
                        Points = 0m
                    };
                }

                double avgFinalDays = validFinalCases.Average(c => 
                    c.DaysAssignmentToFinal ?? (c.DaysAssignmentToNotice!.Value + c.DaysNoticeToFinal!.Value));

                double totalFinalDelay = validFinalCases.Sum(c =>
                {
                    double actual = c.DaysAssignmentToFinal ?? (c.DaysAssignmentToNotice!.Value + c.DaysNoticeToFinal!.Value);
                    return Math.Max(0.0, actual - allowedFinalDays);
                });

                decimal totalFinalDeductions = (decimal)totalFinalDelay * rules.DailyDelayPenalty;
                decimal netFinalPoints = (speedFinalCount * weight) - totalFinalDeductions;
                if (!rules.AllowNegativeSpeedScore && netFinalPoints < 0)
                    netFinalPoints = 0m;

                return new SrsIndicatorCategoryDetailDto
                {
                    CaseCount = speedFinalCount,
                    Weight = weight,
                    AvgActualDays = Math.Round(avgFinalDays, 1),
                    AllowedDays = allowedFinalDays,
                    DelayDays = Math.Round(totalFinalDelay, 1),
                    DeductionPoints = Math.Round(totalFinalDeductions, 2),
                    Points = Math.Round(netFinalPoints, 2)
                };

            default:
                return new SrsIndicatorCategoryDetailDto { CaseCount = 0, Weight = weight, Points = 0m };
        }
    }

    public async Task<Result<int>> Sync300CasesFromExcelAsync(string? customExcelPath = null, CancellationToken ct = default)
    {
        try
        {
            string? filePath = ResolveExcelFilePath(customExcelPath);
            if (filePath == null || !File.Exists(filePath))
            {
                return Result.Failure<int>("فایل اکسل داده‌های سنیم سال ۱۴۰۵ یافت نشد.");
            }

            var p300Tins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var p100Tins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var p300Trackings = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var p100Trackings = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            using var stream = File.OpenRead(filePath);
            var rows = stream.Query(useHeaderRow: true).ToList();

            foreach (IDictionary<string, object> row in rows)
            {
                object? typeVal = null;
                if (row.ContainsKey("type")) typeVal = row["type"];
                else if (row.ContainsKey("Type")) typeVal = row["Type"];

                var typeStr = typeVal?.ToString()?.Trim();
                if (string.IsNullOrEmpty(typeStr)) continue;

                string? tin = null;
                if (row.ContainsKey("تین سنیم مودی")) tin = row["تین سنیم مودی"]?.ToString()?.Trim();
                else if (row.ContainsKey("تین سنیم")) tin = row["تین سنیم"]?.ToString()?.Trim();

                string? tracking = null;
                if (row.ContainsKey("کد رهگیری مودی درسامانه ثبت نام")) tracking = row["کد رهگیری مودی درسامانه ثبت نام"]?.ToString()?.Trim();
                else if (row.ContainsKey("کد رهگیری")) tracking = row["کد رهگیری"]?.ToString()?.Trim();

                if (typeStr.Equals("300Parvande", StringComparison.OrdinalIgnoreCase))
                {
                    if (!string.IsNullOrEmpty(tin)) p300Tins.Add(tin);
                    if (!string.IsNullOrEmpty(tracking)) p300Trackings.Add(tracking);
                }
                else if (typeStr.Equals("100Parvande", StringComparison.OrdinalIgnoreCase))
                {
                    if (!string.IsNullOrEmpty(tin)) p100Tins.Add(tin);
                    if (!string.IsNullOrEmpty(tracking)) p100Trackings.Add(tracking);
                }
            }

            int updatedCount = 0;
            var cases = await _db.SanimAuditAssessments.ToListAsync(ct);

            foreach (var item in cases)
            {
                string? newType = null;
                string tin = item.TaxpayerTin?.Trim() ?? string.Empty;
                string tracking = item.TaxpayerTrackingCode?.Trim() ?? string.Empty;

                if ((!string.IsNullOrEmpty(tin) && p300Tins.Contains(tin)) ||
                    (!string.IsNullOrEmpty(tracking) && p300Trackings.Contains(tracking)))
                {
                    newType = "300Parvande";
                }
                else if ((!string.IsNullOrEmpty(tin) && p100Tins.Contains(tin)) ||
                         (!string.IsNullOrEmpty(tracking) && p100Trackings.Contains(tracking)))
                {
                    newType = "100Parvande";
                }

                if (item.ImportanceType != newType)
                {
                    item.SetImportanceType(newType);
                    updatedCount++;
                }
            }

            if (updatedCount > 0)
            {
                await _db.SaveChangesAsync(ct);
            }

            return Result.Success(updatedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing 300Parvande cases from Excel");
            return Result.Failure<int>($"خطا در همگام‌سازی ۳۰۰ پرونده از فایل اکسل: {ex.Message}");
        }
    }

    public async Task<Result<ImportantCasesInspectionResultDto>> InspectImportantCasesExcelAsync(
        Stream fileStream, 
        string fileName, 
        CancellationToken ct = default)
    {
        try
        {
            if (fileStream == null || fileStream.Length == 0)
                return Result.Failure<ImportantCasesInspectionResultDto>("فایل بارگذاری‌شده خالی است.");

            using var ms = new MemoryStream();
            await fileStream.CopyToAsync(ms, ct);
            ms.Position = 0;

            var rows = ms.Query(useHeaderRow: true).ToList();
            if (!rows.Any())
                return Result.Failure<ImportantCasesInspectionResultDto>("هیچ سطری در فایل اکسل یافت نشد.");

            var firstRow = rows.First() as IDictionary<string, object>;
            var columns = firstRow != null ? firstRow.Keys.ToList() : new List<string>();

            // Detect TIN column
            string? detectedTinCol = columns.FirstOrDefault(c => 
                c.Contains("تین", StringComparison.OrdinalIgnoreCase) || 
                c.Contains("شناسه", StringComparison.OrdinalIgnoreCase) || 
                c.Contains("tin", StringComparison.OrdinalIgnoreCase) ||
                (c.Contains("مودی", StringComparison.OrdinalIgnoreCase) && !c.Contains("نام", StringComparison.OrdinalIgnoreCase)));

            // Detect Tracking column
            string? detectedTrackingCol = columns.FirstOrDefault(c => 
                c.Contains("رهگیری", StringComparison.OrdinalIgnoreCase) || 
                c.Contains("tracking", StringComparison.OrdinalIgnoreCase));

            // Detect Type column
            string? detectedTypeCol = columns.FirstOrDefault(c => 
                c.Equals("type", StringComparison.OrdinalIgnoreCase) || 
                c.Contains("نوع", StringComparison.OrdinalIgnoreCase) || 
                c.Contains("برچسب", StringComparison.OrdinalIgnoreCase) ||
                c.Contains("اهمیت", StringComparison.OrdinalIgnoreCase));

            // Detect Taxpayer Name column
            string? detectedNameCol = columns.FirstOrDefault(c => 
                c.Contains("نام", StringComparison.OrdinalIgnoreCase) || 
                c.Contains("مودی", StringComparison.OrdinalIgnoreCase) ||
                c.Contains("عنوان", StringComparison.OrdinalIgnoreCase));

            var excelTins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var excelTrackings = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            int taggedRowsCount = 0;

            foreach (IDictionary<string, object> row in rows)
            {
                string? tin = null;
                if (!string.IsNullOrEmpty(detectedTinCol) && row.TryGetValue(detectedTinCol, out var val1) && val1 != null)
                    tin = val1.ToString()?.Trim();
                
                string? tracking = null;
                if (!string.IsNullOrEmpty(detectedTrackingCol) && row.TryGetValue(detectedTrackingCol, out var val2) && val2 != null)
                    tracking = val2.ToString()?.Trim();

                string? typeVal = null;
                if (!string.IsNullOrEmpty(detectedTypeCol) && row.TryGetValue(detectedTypeCol, out var val3) && val3 != null)
                    typeVal = val3.ToString()?.Trim();

                if (!string.IsNullOrEmpty(tin)) excelTins.Add(tin);
                if (!string.IsNullOrEmpty(tracking)) excelTrackings.Add(tracking);

                if (!string.IsNullOrEmpty(typeVal) && 
                    (typeVal.Contains("300", StringComparison.OrdinalIgnoreCase) || 
                     typeVal.Contains("100", StringComparison.OrdinalIgnoreCase) ||
                     typeVal.Contains("مهم", StringComparison.OrdinalIgnoreCase) ||
                     typeVal.Contains("parvande", StringComparison.OrdinalIgnoreCase)))
                {
                    taggedRowsCount++;
                }
            }

            // Check how many match in SanimAuditAssessments in database
            var matchingCount = await _db.SanimAuditAssessments
                .AsNoTracking()
                .Where(s => (!string.IsNullOrEmpty(s.TaxpayerTin) && excelTins.Contains(s.TaxpayerTin)) ||
                            (!string.IsNullOrEmpty(s.TaxpayerTrackingCode) && excelTrackings.Contains(s.TaxpayerTrackingCode)))
                .CountAsync(ct);

            // Fetch top 10 sample rows
            var sampleRows = new List<SampleImportantCaseRowDto>();
            int rowIndex = 1;
            foreach (IDictionary<string, object> row in rows.Take(10))
            {
                string? tin = !string.IsNullOrEmpty(detectedTinCol) && row.TryGetValue(detectedTinCol, out var v1) ? v1?.ToString()?.Trim() : null;
                string? tracking = !string.IsNullOrEmpty(detectedTrackingCol) && row.TryGetValue(detectedTrackingCol, out var v2) ? v2?.ToString()?.Trim() : null;
                string? name = !string.IsNullOrEmpty(detectedNameCol) && row.TryGetValue(detectedNameCol, out var v3) ? v3?.ToString()?.Trim() : null;
                string? typeVal = !string.IsNullOrEmpty(detectedTypeCol) && row.TryGetValue(detectedTypeCol, out var v4) ? v4?.ToString()?.Trim() : null;

                bool exists = (!string.IsNullOrEmpty(tin) && await _db.SanimAuditAssessments.AnyAsync(s => s.TaxpayerTin == tin, ct)) ||
                              (!string.IsNullOrEmpty(tracking) && await _db.SanimAuditAssessments.AnyAsync(s => s.TaxpayerTrackingCode == tracking, ct));

                sampleRows.Add(new SampleImportantCaseRowDto
                {
                    RowIndex = rowIndex++,
                    TaxpayerTin = tin,
                    TaxpayerName = name,
                    TrackingCode = tracking,
                    TypeValue = typeVal,
                    ExistsInDatabase = exists
                });
            }

            var result = new ImportantCasesInspectionResultDto
            {
                FileName = fileName,
                TotalRows = rows.Count,
                Columns = columns,
                DetectedTinColumn = detectedTinCol,
                DetectedTrackingColumn = detectedTrackingCol,
                DetectedTypeColumn = detectedTypeCol,
                DistinctTinCount = excelTins.Count,
                MatchingDatabaseCasesCount = matchingCount,
                TaggedRowsCount = taggedRowsCount,
                SampleRows = sampleRows
            };

            return Result.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inspecting important cases Excel file");
            return Result.Failure<ImportantCasesInspectionResultDto>($"خطا در بررسی فایل اکسل: {ex.Message}");
        }
    }

    public async Task<Result<ImportantCasesUploadResultDto>> UploadImportantCasesExcelAsync(
        Stream fileStream, 
        string fileName, 
        string? customLabel, 
        string? customTag, 
        string? tinColumn, 
        bool allRowsAreImportant, 
        bool replaceExisting, 
        CancellationToken ct = default)
    {
        try
        {
            if (fileStream == null || fileStream.Length == 0)
                return Result.Failure<ImportantCasesUploadResultDto>("فایل بارگذاری‌شده خالی است.");

            using var ms = new MemoryStream();
            await fileStream.CopyToAsync(ms, ct);
            ms.Position = 0;

            var rows = ms.Query(useHeaderRow: true).ToList();
            if (!rows.Any())
                return Result.Failure<ImportantCasesUploadResultDto>("هیچ سطری در فایل اکسل یافت نشد.");

            var firstRow = rows.First() as IDictionary<string, object>;
            var columns = firstRow != null ? firstRow.Keys.ToList() : new List<string>();

            string? tinCol = !string.IsNullOrWhiteSpace(tinColumn) ? tinColumn.Trim() : 
                columns.FirstOrDefault(c => 
                    c.Contains("تین", StringComparison.OrdinalIgnoreCase) || 
                    c.Contains("شناسه", StringComparison.OrdinalIgnoreCase) || 
                    c.Contains("tin", StringComparison.OrdinalIgnoreCase) ||
                    (c.Contains("مودی", StringComparison.OrdinalIgnoreCase) && !c.Contains("نام", StringComparison.OrdinalIgnoreCase)));

            string? trackingCol = columns.FirstOrDefault(c => 
                c.Contains("رهگیری", StringComparison.OrdinalIgnoreCase) || 
                c.Contains("tracking", StringComparison.OrdinalIgnoreCase));

            string? typeCol = columns.FirstOrDefault(c => 
                c.Equals("type", StringComparison.OrdinalIgnoreCase) || 
                c.Contains("نوع", StringComparison.OrdinalIgnoreCase) || 
                c.Contains("برچسب", StringComparison.OrdinalIgnoreCase) ||
                c.Contains("اهمیت", StringComparison.OrdinalIgnoreCase));

            string finalTag = !string.IsNullOrWhiteSpace(customTag) ? customTag.Trim() : "300Parvande";
            string finalLabel = !string.IsNullOrWhiteSpace(customLabel) ? customLabel.Trim() : "۳۰۰ پرونده مهم";

            // Map each target TIN and tracking code to its designated tag
            var targetTinToTag = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var targetTrackingToTag = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (IDictionary<string, object> row in rows)
            {
                string? tin = null;
                if (!string.IsNullOrEmpty(tinCol) && row.TryGetValue(tinCol, out var v1) && v1 != null)
                    tin = v1.ToString()?.Trim();

                string? tracking = null;
                if (!string.IsNullOrEmpty(trackingCol) && row.TryGetValue(trackingCol, out var v2) && v2 != null)
                    tracking = v2.ToString()?.Trim();

                string? rowType = null;
                if (!string.IsNullOrEmpty(typeCol) && row.TryGetValue(typeCol, out var v3) && v3 != null)
                    rowType = v3.ToString()?.Trim();

                bool shouldTag = false;
                string tagForThisRow = finalTag;

                if (allRowsAreImportant)
                {
                    shouldTag = true;
                    if (!string.IsNullOrEmpty(rowType)) tagForThisRow = rowType;
                }
                else
                {
                    if (!string.IsNullOrEmpty(rowType))
                    {
                        shouldTag = true;
                        tagForThisRow = rowType;
                    }
                }

                if (shouldTag)
                {
                    if (!string.IsNullOrEmpty(tin)) targetTinToTag[tin] = tagForThisRow;
                    if (!string.IsNullOrEmpty(tracking)) targetTrackingToTag[tracking] = tagForThisRow;
                }
            }

            if (!targetTinToTag.Any() && !targetTrackingToTag.Any())
            {
                return Result.Failure<ImportantCasesUploadResultDto>("هیچ پرونده واجد شرایطی جهت برچسب‌گذاری در فایل اکسل یافت نشد. در صورت عدم وجود ستون نوع در فایل، گزینه 'همه سطرهای فایل به عنوان پرونده مهم تلقی شوند' را فعال نمایید.");
            }

            // Retrieve all cases from SanimAuditAssessments
            var dbCases = await _db.SanimAuditAssessments.ToListAsync(ct);
            int updatedCount = 0;

            foreach (var item in dbCases)
            {
                string? tin = item.TaxpayerTin?.Trim();
                string? tracking = item.TaxpayerTrackingCode?.Trim();
                string? newTag = null;

                if (!string.IsNullOrEmpty(tin) && targetTinToTag.TryGetValue(tin, out var t1))
                {
                    newTag = t1;
                }
                else if (!string.IsNullOrEmpty(tracking) && targetTrackingToTag.TryGetValue(tracking, out var t2))
                {
                    newTag = t2;
                }

                if (newTag != null)
                {
                    if (item.ImportanceType != newTag)
                    {
                        item.SetImportanceType(newTag);
                        updatedCount++;
                    }
                }
                else if (replaceExisting && item.ImportanceType != null)
                {
                    item.SetImportanceType(null);
                    updatedCount++;
                }
            }

            // Update AuditorEvaluationRuleSet metadata
            var ruleSet = await _db.AuditorEvaluationRuleSets.FirstOrDefaultAsync(r => r.IsActive, ct);
            if (ruleSet == null)
            {
                ruleSet = AuditorEvaluationRuleSet.CreateDefault();
                await _db.AuditorEvaluationRuleSets.AddAsync(ruleSet, ct);
            }

            var currentTags = (ruleSet.MajorCasesTag ?? "300Parvande, 100Parvande")
                .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            currentTags.Add(finalTag);
            foreach (var t in targetTinToTag.Values) currentTags.Add(t);
            foreach (var t in targetTrackingToTag.Values) currentTags.Add(t);

            string combinedTags = string.Join(", ", currentTags);
            ruleSet.SetMajorCasesMetadata(finalLabel, combinedTags);

            await _db.SaveChangesAsync(ct);

            var result = new ImportantCasesUploadResultDto
            {
                Success = true,
                Message = $"تعداد {updatedCount} پرونده در پایگاه داده با موفقیت به‌روزرسانی و برچسب‌گذاری شد.",
                TotalExcelRows = rows.Count,
                TaggedTinCount = targetTinToTag.Count,
                UpdatedDatabaseCasesCount = updatedCount,
                MajorCasesLabel = finalLabel,
                MajorCasesTag = combinedTags
            };

            return Result.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading and tagging important cases Excel file");
            return Result.Failure<ImportantCasesUploadResultDto>($"خطا در بارگذاری و پردازش پرونده‌های مهم: {ex.Message}");
        }
    }

    private static string? ResolveExcelFilePath(string? customExcelPath)
    {
        if (!string.IsNullOrWhiteSpace(customExcelPath) && File.Exists(customExcelPath))
            return customExcelPath;

        const string fileName = "پرونده های حسابرسی شده ادارات-سنیم-در سال 1405.xlsx";

        try
        {
            var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
            while (dir != null)
            {
                var candidate = Path.Combine(dir.FullName, "sample_data", fileName);
                if (File.Exists(candidate)) return candidate;
                dir = dir.Parent;
            }
        }
        catch { }

        try
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir != null)
            {
                var candidate = Path.Combine(dir.FullName, "sample_data", fileName);
                if (File.Exists(candidate)) return candidate;
                dir = dir.Parent;
            }
        }
        catch { }

        return null;
    }

    #endregion
}
