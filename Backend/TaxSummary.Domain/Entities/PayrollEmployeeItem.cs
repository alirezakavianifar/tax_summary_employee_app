namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents an individual employee record within a department payroll entry
/// </summary>
public class PayrollEmployeeItem
{
    public Guid Id { get; private set; }
    public Guid DepartmentEntryId { get; private set; }
    public string PersonnelNumber { get; private set; } = string.Empty;
    public string EmployeeName { get; private set; } = string.Empty;

    // Overtime
    public double? InitialOvertimeRate { get; private set; }
    public double? AdjustedOvertimeRate { get; private set; }
    public double? BaseOvertimeAmount { get; private set; }
    public long? CalculatedOvertimeAmount { get; private set; }

    // Welfare
    public double? InitialWelfareRate { get; private set; }
    public double? AdjustedWelfareRate { get; private set; }
    public double? BaseWelfareAmount { get; private set; }
    public long? CalculatedWelfareAmount { get; private set; }

    // Bonus (Half percent)
    public double? BaseBonusAmount { get; private set; }
    public double? AdjustedBonusAmount { get; private set; }

    // Position & Limit classifications
    public bool IsLaborPosition { get; private set; }
    public string PositionTier { get; private set; } = Domain.Entities.PositionTier.OtherStaff;
    public string? PositionTitle { get; private set; }
    public double? MaxOvertimeLimit { get; private set; }
    public double? MaxBonusLimit { get; private set; }

    public string? OfficerNotes { get; private set; }
    public bool IsExcluded { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation property
    public PayrollDepartmentEntry? DepartmentEntry { get; private set; }

    private PayrollEmployeeItem() { }

    public static PayrollEmployeeItem Create(
        Guid departmentEntryId,
        string personnelNumber,
        string employeeName,
        double? initialOvertimeRate = null,
        double? initialWelfareRate = null,
        double? baseOvertimeAmount = null,
        double? baseWelfareAmount = null,
        double? baseBonusAmount = null,
        long? calculatedOvertimeAmount = null,
        long? calculatedWelfareAmount = null,
        bool isLaborPosition = false,
        string? positionTier = null,
        double? maxOvertimeLimit = null,
        double? maxBonusLimit = null,
        string? positionTitle = null)
    {
        if (string.IsNullOrWhiteSpace(personnelNumber))
            throw new ArgumentException("شماره کارمند نمی‌تواند خالی باشد", nameof(personnelNumber));

        var now = DateTime.UtcNow;
        var resolvedTier = string.IsNullOrWhiteSpace(positionTier)
            ? Domain.Entities.PositionTier.OtherStaff
            : positionTier.Trim();

        var resolvedOvertimeLimit = maxOvertimeLimit ?? (isLaborPosition
            ? PayrollBusinessRules.MaxOvertimeHoursLabor
            : PayrollBusinessRules.MaxOvertimeHoursStandard);

        return new PayrollEmployeeItem
        {
            Id = Guid.NewGuid(),
            DepartmentEntryId = departmentEntryId,
            PersonnelNumber = personnelNumber.Trim(),
            EmployeeName = employeeName?.Trim() ?? string.Empty,
            InitialOvertimeRate = initialOvertimeRate,
            AdjustedOvertimeRate = null, // empty by default as requested
            InitialWelfareRate = initialWelfareRate,
            AdjustedWelfareRate = null,   // empty by default as requested
            BaseOvertimeAmount = baseOvertimeAmount,
            BaseWelfareAmount = baseWelfareAmount,
            BaseBonusAmount = baseBonusAmount,
            AdjustedBonusAmount = null,     // empty by default
            CalculatedOvertimeAmount = calculatedOvertimeAmount,
            CalculatedWelfareAmount = calculatedWelfareAmount,
            IsLaborPosition = isLaborPosition,
            PositionTier = resolvedTier,
            PositionTitle = positionTitle?.Trim(),
            MaxOvertimeLimit = resolvedOvertimeLimit,
            MaxBonusLimit = maxBonusLimit,
            IsExcluded = false,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void UpdateAdjustments(
        double? adjustedOvertimeRate,
        double? adjustedWelfareRate,
        string? officerNotes,
        bool isExcluded,
        bool isRatedProcess,
        double? adjustedBonusAmount = null)
    {
        // 1. Validation for Welfare Rate (Max 100%, disallowed 1 through 29)
        if (adjustedWelfareRate.HasValue)
        {
            if (adjustedWelfareRate.Value < 0 || adjustedWelfareRate.Value > PayrollBusinessRules.MaxWelfarePercentage)
            {
                throw new ArgumentException(
                    $"حداکثر درصد رفاهی مجاز {PayrollBusinessRules.MaxWelfarePercentage}٪ می‌باشد. مقدار وارد شده: {adjustedWelfareRate.Value}٪",
                    nameof(adjustedWelfareRate));
            }

            if (adjustedWelfareRate.Value > 0 && adjustedWelfareRate.Value < PayrollBusinessRules.MinWelfarePercentageThreshold)
            {
                throw new ArgumentException(
                    $"درصد رفاهی نمی‌تواند بین ۱ تا ۲۹ باشد. مقدار مجاز صفر یا حداقل {PayrollBusinessRules.MinWelfarePercentageThreshold}٪ می‌باشد. مقدار وارد شده: {adjustedWelfareRate.Value}٪",
                    nameof(adjustedWelfareRate));
            }
        }

        // 2. Validation for Overtime (Max 120h for labor, 175h for standard, disallowed 1 through 29)
        if (adjustedOvertimeRate.HasValue)
        {
            var maxAllowedOvertime = MaxOvertimeLimit ?? (IsLaborPosition
                ? PayrollBusinessRules.MaxOvertimeHoursLabor
                : PayrollBusinessRules.MaxOvertimeHoursStandard);

            if (adjustedOvertimeRate.Value < 0 || adjustedOvertimeRate.Value > maxAllowedOvertime)
            {
                var roleLabel = IsLaborPosition ? "مشاغل کارگری" : "سایر کارکنان";
                throw new ArgumentException(
                    $"حداکثر سقف ساعت اضافه کار برای {roleLabel} {maxAllowedOvertime} ساعت می‌باشد. مقدار وارد شده: {adjustedOvertimeRate.Value}",
                    nameof(adjustedOvertimeRate));
            }

            if (adjustedOvertimeRate.Value > 0 && adjustedOvertimeRate.Value < PayrollBusinessRules.MinOvertimeHoursThreshold)
            {
                throw new ArgumentException(
                    $"ساعت اضافه کار نمی‌تواند بین ۱ تا ۲۹ باشد. مقدار مجاز صفر یا حداقل {PayrollBusinessRules.MinOvertimeHoursThreshold} ساعت می‌باشد. مقدار وارد شده: {adjustedOvertimeRate.Value}",
                    nameof(adjustedOvertimeRate));
            }
        }

        // 3. Validation for Bonus (Half-Percent)
        if (adjustedBonusAmount.HasValue && MaxBonusLimit.HasValue && adjustedBonusAmount.Value > MaxBonusLimit.Value)
        {
            var tierName = Domain.Entities.PositionTier.GetDisplayName(PositionTier);
            throw new ArgumentException(
                $"مبلغ پاداش برای سمت «{tierName}» نمی‌تواند بیش از سقف مجاز تعیین شده ({MaxBonusLimit.Value:N0} ریال) باشد.",
                nameof(adjustedBonusAmount));
        }

        AdjustedOvertimeRate = adjustedOvertimeRate;
        AdjustedWelfareRate = adjustedWelfareRate;
        if (adjustedBonusAmount.HasValue)
        {
            AdjustedBonusAmount = adjustedBonusAmount;
        }
        OfficerNotes = officerNotes?.Trim();
        IsExcluded = isExcluded;

        if (isExcluded)
        {
            CalculatedOvertimeAmount = 0;
            CalculatedWelfareAmount = 0;
        }
        else if (isRatedProcess)
        {
            var hourlyRate = (BaseOvertimeAmount.HasValue && BaseOvertimeAmount.Value > 1000)
                ? BaseOvertimeAmount.Value
                : (InitialOvertimeRate.HasValue && InitialOvertimeRate.Value > 1000 ? InitialOvertimeRate.Value : (BaseOvertimeAmount ?? InitialOvertimeRate ?? 0));

            var baseHours = (BaseOvertimeAmount.HasValue && BaseOvertimeAmount.Value <= 1000)
                ? BaseOvertimeAmount.Value
                : (InitialOvertimeRate.HasValue && InitialOvertimeRate.Value <= 1000 ? InitialOvertimeRate.Value : (double?)null);

            if (AdjustedOvertimeRate.HasValue)
            {
                CalculatedOvertimeAmount = (long)Math.Ceiling(hourlyRate * AdjustedOvertimeRate.Value);
            }
            else if (baseHours.HasValue && hourlyRate > 0)
            {
                CalculatedOvertimeAmount = (long)Math.Ceiling(hourlyRate * baseHours.Value);
            }
            else
            {
                CalculatedOvertimeAmount = null;
            }

            var baseWelfareSalary = (BaseWelfareAmount.HasValue && BaseWelfareAmount.Value > 1000)
                ? BaseWelfareAmount.Value
                : (InitialWelfareRate.HasValue && InitialWelfareRate.Value > 1000 ? InitialWelfareRate.Value : (BaseWelfareAmount ?? InitialWelfareRate ?? 0));

            var baseWelfarePercent = (BaseWelfareAmount.HasValue && BaseWelfareAmount.Value <= 1000)
                ? BaseWelfareAmount.Value
                : (InitialWelfareRate.HasValue && InitialWelfareRate.Value <= 1000 ? InitialWelfareRate.Value : (double?)null);

            if (AdjustedWelfareRate.HasValue)
            {
                CalculatedWelfareAmount = (long)Math.Ceiling(baseWelfareSalary * AdjustedWelfareRate.Value / 100.0);
            }
            else if (baseWelfarePercent.HasValue && baseWelfareSalary > 0)
            {
                CalculatedWelfareAmount = (long)Math.Ceiling(baseWelfareSalary * baseWelfarePercent.Value / 100.0);
            }
            else
            {
                CalculatedWelfareAmount = null;
            }
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void ScaleAmounts(double overtimeFactor, double welfareFactor, bool isRatedProcess)
    {
        if (IsExcluded) return;

        if (overtimeFactor > 0)
        {
            if (CalculatedOvertimeAmount.HasValue)
            {
                CalculatedOvertimeAmount = (long)Math.Round(CalculatedOvertimeAmount.Value * overtimeFactor);
            }
            if (BaseOvertimeAmount.HasValue)
            {
                BaseOvertimeAmount = Math.Round(BaseOvertimeAmount.Value * overtimeFactor, 2);
            }
        }

        if (welfareFactor > 0)
        {
            if (CalculatedWelfareAmount.HasValue)
            {
                CalculatedWelfareAmount = (long)Math.Round(CalculatedWelfareAmount.Value * welfareFactor);
            }
            if (BaseWelfareAmount.HasValue)
            {
                BaseWelfareAmount = Math.Round(BaseWelfareAmount.Value * welfareFactor, 2);
            }
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void DirectSetAmounts(long? calculatedOvertime, long? calculatedWelfare, double? baseOvertime, double? baseWelfare)
    {
        if (calculatedOvertime.HasValue) CalculatedOvertimeAmount = calculatedOvertime.Value;
        if (calculatedWelfare.HasValue) CalculatedWelfareAmount = calculatedWelfare.Value;
        if (baseOvertime.HasValue) BaseOvertimeAmount = baseOvertime.Value;
        if (baseWelfare.HasValue) BaseWelfareAmount = baseWelfare.Value;
        UpdatedAt = DateTime.UtcNow;
    }
}

