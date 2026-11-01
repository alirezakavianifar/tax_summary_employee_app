using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities.Reporting;
using TaxSummary.Domain.Enums;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Services.Reporting;

public class AuditorPerformanceService : IAuditorPerformanceService
{
    private readonly TaxSummaryDbContext _db;
    private readonly ILogger<AuditorPerformanceService> _logger;

    public AuditorPerformanceService(
        TaxSummaryDbContext db, 
        ILogger<AuditorPerformanceService> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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

    public async Task<Result<List<AuditorScorecardDto>>> EvaluateAuditorsAsync(
        int? fiscalYear, 
        string? officeName, 
        CancellationToken ct = default)
    {
        try
        {
            var activeMetrics = await _db.AuditorPerformanceMetricDefinitions
                .AsNoTracking()
                .Where(m => m.IsActive)
                .OrderBy(m => m.DisplayOrder)
                .ToListAsync(ct);

            var query = _db.SanimAuditAssessments.AsNoTracking().Where(s => !string.IsNullOrEmpty(s.AuditorName));

            if (fiscalYear.HasValue)
                query = query.Where(s => s.FiscalYear == fiscalYear.Value);

            if (!string.IsNullOrWhiteSpace(officeName))
                query = query.Where(s => s.FinalOfficeName.Contains(officeName.Trim()));

            var rawCases = await query.Select(s => new
            {
                s.AuditorName,
                s.AuditorNationalId,
                s.FinalOfficeName,
                s.AuditStatus,
                s.RiskLevel,
                s.DeclaredTaxAmount,
                s.AssessedTaxAmount,
                s.FinalTaxAmount,
                s.DaysAssignmentToNotice,
                s.DaysNoticeToFinal,
                s.DaysAssignmentToFinal
            }).ToListAsync(ct);

            if (!rawCases.Any())
                return Result.Success(new List<AuditorScorecardDto>());

            var auditorGroups = rawCases.GroupBy(x => x.AuditorName).ToList();
            var scorecards = new List<AuditorScorecardDto>();

            foreach (var group in auditorGroups)
            {
                var auditorName = group.Key;
                var sample = group.First();
                int totalCases = group.Count();
                int completedCases = group.Count(x => x.AuditStatus != null && x.AuditStatus.Contains("رسیدگی شده"));

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
                    OfficeName = sample.FinalOfficeName,
                    TotalAssignedCases = totalCases,
                    CompletedCases = completedCases,
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
            _logger.LogError(ex, "Error evaluating auditors");
            return Result.Failure<List<AuditorScorecardDto>>($"خطا در ارزیابی حسابرسان: {ex.Message}");
        }
    }

    public async Task<Result<Auditor360ProfileDto>> GetAuditor360ProfileAsync(
        string auditorName, 
        int? fiscalYear, 
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(auditorName))
                return Result.Failure<Auditor360ProfileDto>("نام حسابرس الزامی است");

            var evaluateResult = await EvaluateAuditorsAsync(fiscalYear, null, ct);
            if (evaluateResult.IsFailure)
                return Result.Failure<Auditor360ProfileDto>(evaluateResult.Error);

            var scorecard = evaluateResult.Value.FirstOrDefault(s => s.AuditorName.Trim() == auditorName.Trim());
            if (scorecard == null)
                return Result.Failure<Auditor360ProfileDto>($"حسابرس با نام '{auditorName}' یافت نشد");

            var query = _db.SanimAuditAssessments.AsNoTracking()
                .Where(s => s.AuditorName.Trim() == auditorName.Trim());

            if (fiscalYear.HasValue)
                query = query.Where(s => s.FiscalYear == fiscalYear.Value);

            var cases = await query.ToListAsync(ct);

            int highRisk = cases.Count(c => c.RiskLevel != null && c.RiskLevel.Contains("پرریسک"));
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

            var officeBreakdowns = cases.GroupBy(c => c.FinalOfficeName)
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
        int? fiscalYear, 
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

            var query = _db.SanimAuditAssessments.AsNoTracking().Where(s => !string.IsNullOrEmpty(s.AuditorName));
            if (fiscalYear.HasValue)
                query = query.Where(s => s.FiscalYear == fiscalYear.Value);

            var rawCases = await query.Select(s => new
            {
                s.AuditorName,
                s.AuditorNationalId,
                s.FinalOfficeName,
                s.AuditStatus,
                s.RiskLevel,
                s.DeclaredTaxAmount,
                s.AssessedTaxAmount,
                s.FinalTaxAmount,
                s.DaysAssignmentToNotice,
                s.DaysNoticeToFinal,
                s.DaysAssignmentToFinal
            }).ToListAsync(ct);

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
    private static decimal CalculateMetricValue(AuditorPerformanceMetricDefinition metric, IEnumerable<dynamic> group)
    {
        switch (metric.FormulaType)
        {
            case AuditorMetricFormulaType.Ratio:
                decimal num = SumField(metric.PrimaryField, group);
                decimal den = SumField(metric.SecondaryField ?? string.Empty, group);
                if (den == 0m) den = 1m;
                return (num / den) * metric.Multiplier;

            case AuditorMetricFormulaType.Difference:
                decimal p = SumField(metric.PrimaryField, group);
                decimal s = SumField(metric.SecondaryField ?? string.Empty, group);
                return (p - s) * metric.Multiplier;

            case AuditorMetricFormulaType.Average:
                var daysList = new List<double>();
                foreach (var item in group)
                {
                    if (metric.PrimaryField.Equals("DaysAssignmentToNotice", StringComparison.OrdinalIgnoreCase) && item.DaysAssignmentToNotice != null)
                        daysList.Add((double)item.DaysAssignmentToNotice);
                    else if (metric.PrimaryField.Equals("DaysNoticeToFinal", StringComparison.OrdinalIgnoreCase) && item.DaysNoticeToFinal != null)
                        daysList.Add((double)item.DaysNoticeToFinal);
                    else if (metric.PrimaryField.Equals("DaysAssignmentToFinal", StringComparison.OrdinalIgnoreCase) && item.DaysAssignmentToFinal != null)
                        daysList.Add((double)item.DaysAssignmentToFinal);
                }
                return daysList.Any() ? (decimal)daysList.Average() * metric.Multiplier : 0m;

            case AuditorMetricFormulaType.Count:
                int count = 0;
                foreach (var item in group)
                {
                    if (metric.PrimaryField.Equals("AuditStatus", StringComparison.OrdinalIgnoreCase))
                    {
                        if (item.AuditStatus != null && item.AuditStatus.ToString().Contains("رسیدگی شده"))
                            count++;
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
                        if (item.RiskLevel != null && item.RiskLevel.ToString().Contains("پرریسک"))
                            matches++;
                    }
                }
                return ((decimal)matches / total) * 100m * metric.Multiplier;

            default:
                return 0m;
        }
    }

    private static decimal SumField(string fieldName, IEnumerable<dynamic> group)
    {
        if (string.IsNullOrWhiteSpace(fieldName)) return 0m;

        decimal sum = 0m;
        foreach (var item in group)
        {
            if (fieldName.Equals("FinalTaxAmount", StringComparison.OrdinalIgnoreCase))
                sum += (decimal)item.FinalTaxAmount;
            else if (fieldName.Equals("AssessedTaxAmount", StringComparison.OrdinalIgnoreCase))
                sum += (decimal)item.AssessedTaxAmount;
            else if (fieldName.Equals("DeclaredTaxAmount", StringComparison.OrdinalIgnoreCase))
                sum += (decimal)item.DeclaredTaxAmount;
        }
        return sum;
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
