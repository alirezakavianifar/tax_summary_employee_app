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
            AdjustedOvertimeRate = initialOvertimeRate, // default to initial
            InitialWelfareRate = initialWelfareRate,
            AdjustedWelfareRate = initialWelfareRate,   // default to initial
            BaseOvertimeAmount = baseOvertimeAmount,
            BaseWelfareAmount = baseWelfareAmount,
            BaseBonusAmount = baseBonusAmount,
            AdjustedBonusAmount = baseBonusAmount,     // default to base bonus
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
        // 1. Validation for Welfare Rate (Max 100%)
        if (adjustedWelfareRate.HasValue)
        {
            if (adjustedWelfareRate.Value < 0 || adjustedWelfareRate.Value > PayrollBusinessRules.MaxWelfarePercentage)
            {
                throw new ArgumentException(
                    $"حداکثر درصد رفاهی مجاز {PayrollBusinessRules.MaxWelfarePercentage}٪ می‌باشد. مقدار وارد شده: {adjustedWelfareRate.Value}٪",
                    nameof(adjustedWelfareRate));
            }
        }

        // 2. Validation for Overtime (Max 120h for labor, 175h for standard)
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
            if (BaseOvertimeAmount.HasValue && AdjustedOvertimeRate.HasValue)
            {
                CalculatedOvertimeAmount = (long)Math.Ceiling(BaseOvertimeAmount.Value * AdjustedOvertimeRate.Value);
            }
            else
            {
                CalculatedOvertimeAmount = null;
            }

            if (BaseWelfareAmount.HasValue && AdjustedWelfareRate.HasValue)
            {
                CalculatedWelfareAmount = (long)Math.Ceiling(BaseWelfareAmount.Value * AdjustedWelfareRate.Value / 100.0);
            }
            else
            {
                CalculatedWelfareAmount = null;
            }
        }

        UpdatedAt = DateTime.UtcNow;
    }
}
