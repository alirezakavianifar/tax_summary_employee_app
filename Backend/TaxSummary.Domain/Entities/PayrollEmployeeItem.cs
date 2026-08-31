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
        long? calculatedWelfareAmount = null)
    {
        if (string.IsNullOrWhiteSpace(personnelNumber))
            throw new ArgumentException("شماره کارمند نمی‌تواند خالی باشد", nameof(personnelNumber));

        var now = DateTime.UtcNow;
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
            CalculatedOvertimeAmount = calculatedOvertimeAmount,
            CalculatedWelfareAmount = calculatedWelfareAmount,
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
        bool isRatedProcess)
    {
        AdjustedOvertimeRate = adjustedOvertimeRate;
        AdjustedWelfareRate = adjustedWelfareRate;
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
