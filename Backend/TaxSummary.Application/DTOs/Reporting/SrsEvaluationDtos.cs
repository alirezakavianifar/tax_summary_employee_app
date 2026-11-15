namespace TaxSummary.Application.DTOs.Reporting;

public class SrsRuleSetConfigDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal GrowthThresholdLegalEntity { get; set; }
    public decimal GrowthThresholdIndividual { get; set; }
    public decimal AdjustmentThreshold { get; set; }
    public decimal DailyDelayPenalty { get; set; }
    public int Top300TaxpayersCount { get; set; }
    public string MajorCasesLabel { get; set; } = "۳۰۰ پرونده مهم";
    public string MajorCasesTag { get; set; } = "300Parvande, 100Parvande";
    public bool AllowNegativeSpeedScore { get; set; }
    public bool IsActive { get; set; }
    public Dictionary<string, Dictionary<string, decimal>> WeightsMatrix { get; set; } = new();
    public Dictionary<string, AllowedDaysLimitDto> AllowedDays { get; set; } = new();
}

public class SaveSrsRuleConfigRequestDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal GrowthThresholdLegalEntity { get; set; } = 700m;
    public decimal GrowthThresholdIndividual { get; set; } = 500m;
    public decimal AdjustmentThreshold { get; set; } = 15m;
    public decimal DailyDelayPenalty { get; set; } = 0.25m;
    public int Top300TaxpayersCount { get; set; } = 300;
    public string MajorCasesLabel { get; set; } = "۳۰۰ پرونده مهم";
    public string MajorCasesTag { get; set; } = "300Parvande, 100Parvande";
    public bool AllowNegativeSpeedScore { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public Dictionary<string, Dictionary<string, decimal>> WeightsMatrix { get; set; } = new();
    public Dictionary<string, AllowedDaysLimitDto> AllowedDays { get; set; } = new();
}

public class AllowedDaysLimitDto
{
    public int IssuanceAllowedDays { get; set; }
    public int FinalizationAllowedDays { get; set; }
}

public class SrsEmployeeScorecardDto
{
    public string AuditorName { get; set; } = string.Empty;
    public string? AuditorNationalId { get; set; }
    public string? PhotoUrl { get; set; }
    public string OfficeName { get; set; } = string.Empty;
    public int TotalCases { get; set; }
    public decimal TotalScore { get; set; }
    public decimal TotalPositivePoints { get; set; }
    public decimal TotalNegativeDeductions { get; set; }
    public int ProvincialRank { get; set; }
    public string PerformanceTier { get; set; } = "B";
    public string TierTitleFa { get; set; } = "مطلوب";
    public string MajorCasesLabel { get; set; } = "۳۰۰ پرونده مهم";
    public Dictionary<string, int> CategorySummaries { get; set; } = new();
    public List<SrsIndicatorScoreDto> Indicators { get; set; } = new();
}

public class SrsIndicatorScoreDto
{
    public string IndicatorCode { get; set; } = string.Empty;
    public string IndicatorTitle { get; set; } = string.Empty;
    public int IndicatorOrder { get; set; }
    public bool IsNegative { get; set; }
    public decimal TotalPoints { get; set; }
    public Dictionary<string, SrsIndicatorCategoryDetailDto> CategoryDetails { get; set; } = new();
}

public class SrsIndicatorCategoryDetailDto
{
    public int CaseCount { get; set; }
    public decimal Weight { get; set; }
    public decimal Points { get; set; }
    public double? AvgActualDays { get; set; }
    public int? AllowedDays { get; set; }
    public double? DelayDays { get; set; }
    public decimal? DeductionPoints { get; set; }
}

public class ImportantCasesInspectionResultDto
{
    public string FileName { get; set; } = string.Empty;
    public int TotalRows { get; set; }
    public List<string> Columns { get; set; } = new();
    public string? DetectedTinColumn { get; set; }
    public string? DetectedTrackingColumn { get; set; }
    public string? DetectedTypeColumn { get; set; }
    public int DistinctTinCount { get; set; }
    public int MatchingDatabaseCasesCount { get; set; }
    public int TaggedRowsCount { get; set; }
    public List<SampleImportantCaseRowDto> SampleRows { get; set; } = new();
}

public class SampleImportantCaseRowDto
{
    public int RowIndex { get; set; }
    public string? TaxpayerTin { get; set; }
    public string? TaxpayerName { get; set; }
    public string? TrackingCode { get; set; }
    public string? TypeValue { get; set; }
    public bool ExistsInDatabase { get; set; }
}

public class ImportantCasesUploadResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TotalExcelRows { get; set; }
    public int TaggedTinCount { get; set; }
    public int UpdatedDatabaseCasesCount { get; set; }
    public string MajorCasesLabel { get; set; } = "۳۰۰ پرونده مهم";
    public string MajorCasesTag { get; set; } = "300Parvande, 100Parvande";
}


