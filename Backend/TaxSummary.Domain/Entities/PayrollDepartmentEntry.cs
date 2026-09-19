namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents a department partition/sheet within a payroll cycle
/// </summary>
public class PayrollDepartmentEntry
{
    public Guid Id { get; private set; }
    public Guid PayrollCycleId { get; private set; }
    public string DepartmentName { get; private set; } = string.Empty;
    public string Status { get; private set; } = PayrollDepartmentStatus.Pending;

    // Caps / base coefficients for this department
    public double? BaseOvertimeCap { get; private set; }
    public double? BaseWelfareCap { get; private set; }
    public double? BaseBonusCap { get; private set; }

    // Position-specific bonus caps for 0.5%
    public double? GroupHeadBonusCap { get; private set; }
    public double? SeniorExpertBonusCap { get; private set; }
    public double? OtherStaffBonusCap { get; private set; }

    public Guid? SubmittedByUserId { get; private set; }
    public DateTime? SubmittedAt { get; private set; }

    public Guid? DeputyApprovedByUserId { get; private set; }
    public DateTime? DeputyApprovedAt { get; private set; }

    public Guid? ApprovedByUserId { get; private set; }
    public DateTime? ApprovedAt { get; private set; }

    public string? RejectionReason { get; private set; }
    public string? Notes { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    // Navigation properties
    public PayrollCycle? PayrollCycle { get; private set; }
    public User? SubmittedBy { get; private set; }
    public User? DeputyApprovedBy { get; private set; }
    public User? ApprovedBy { get; private set; }
    public ICollection<PayrollEmployeeItem> Items { get; private set; } = new List<PayrollEmployeeItem>();

    private PayrollDepartmentEntry() { }

    public static PayrollDepartmentEntry Create(
        Guid payrollCycleId,
        string departmentName,
        double? baseOvertimeCap = null,
        double? baseWelfareCap = null,
        double? baseBonusCap = null,
        double? groupHeadBonusCap = null,
        double? seniorExpertBonusCap = null,
        double? otherStaffBonusCap = null)
    {
        if (string.IsNullOrWhiteSpace(departmentName))
            throw new ArgumentException("نام اداره نمی‌تواند خالی باشد", nameof(departmentName));

        var now = DateTime.UtcNow;
        return new PayrollDepartmentEntry
        {
            Id = Guid.NewGuid(),
            PayrollCycleId = payrollCycleId,
            DepartmentName = departmentName.Trim(),
            Status = PayrollDepartmentStatus.Pending,
            BaseOvertimeCap = baseOvertimeCap,
            BaseWelfareCap = baseWelfareCap,
            BaseBonusCap = baseBonusCap,
            GroupHeadBonusCap = groupHeadBonusCap,
            SeniorExpertBonusCap = seniorExpertBonusCap,
            OtherStaffBonusCap = otherStaffBonusCap,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    public void SaveDraft(string? notes = null)
    {
        if (Status != PayrollDepartmentStatus.Approved)
        {
            Status = PayrollDepartmentStatus.Draft;
        }
        Notes = notes?.Trim() ?? Notes;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Submit(Guid submittedByUserId, string? notes = null)
    {
        Status = PayrollDepartmentStatus.Submitted;
        SubmittedByUserId = submittedByUserId;
        SubmittedAt = DateTime.UtcNow;
        RejectionReason = null;
        if (!string.IsNullOrWhiteSpace(notes))
        {
            Notes = notes.Trim();
        }
        UpdatedAt = DateTime.UtcNow;
    }

    public void ApproveByDeputy(Guid deputyUserId)
    {
        Status = PayrollDepartmentStatus.DeputyApproved;
        DeputyApprovedByUserId = deputyUserId;
        DeputyApprovedAt = DateTime.UtcNow;
        RejectionReason = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Approve(Guid approvedByUserId)
    {
        Status = PayrollDepartmentStatus.Approved;
        ApprovedByUserId = approvedByUserId;
        ApprovedAt = DateTime.UtcNow;
        RejectionReason = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reject(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("دلیل عدم تایید الزامی است", nameof(reason));

        Status = PayrollDepartmentStatus.Rejected;
        RejectionReason = reason.Trim();
        DeputyApprovedByUserId = null;
        DeputyApprovedAt = null;
        ApprovedByUserId = null;
        ApprovedAt = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ValidateDepartmentLimits(string processType)
    {
        var nonExcluded = Items.Where(i => !i.IsExcluded).ToList();

        if (processType == "HalfPercentBonus")
        {
            if (BaseBonusCap.HasValue && BaseBonusCap.Value > 0)
            {
                var totalBonus = nonExcluded.Sum(i => i.AdjustedBonusAmount ?? i.BaseBonusAmount ?? 0);
                if (totalBonus > BaseBonusCap.Value)
                {
                    throw new InvalidOperationException(
                        $"مجموع پاداش نیم درصد تخصیص داده شده ({totalBonus:N0} ریال) از سقف بودجه مصوب اداره ({BaseBonusCap.Value:N0} ریال) بیشتر است.");
                }
            }
        }
        else
        {
            // Overtime and Welfare
            if (BaseOvertimeCap.HasValue && BaseOvertimeCap.Value > 0)
            {
                if (BaseOvertimeCap.Value <= 50000)
                {
                    var totalHours = nonExcluded.Sum(i => i.AdjustedOvertimeRate ?? 0);
                    if (totalHours > BaseOvertimeCap.Value)
                    {
                        throw new InvalidOperationException(
                            $"مجموع ساعت اضافه کار تخصیص داده شده ({totalHours:N0} ساعت) از سقف مجاز اداره ({BaseOvertimeCap.Value:N0} ساعت) فراتر رفته است.");
                    }
                }
                else
                {
                    var totalOvertime = nonExcluded.Sum(i => i.CalculatedOvertimeAmount ?? 0);
                    if (totalOvertime > BaseOvertimeCap.Value)
                    {
                        throw new InvalidOperationException(
                            $"مجموع اضافه کار تخصیص داده شده ({totalOvertime:N0} ریال) از سقف مجاز اداره ({BaseOvertimeCap.Value:N0} ریال) فراتر رفته است.");
                    }
                }
            }

            if (BaseWelfareCap.HasValue && BaseWelfareCap.Value > 0)
            {
                if (BaseWelfareCap.Value <= 10000)
                {
                    var totalWelfareRate = nonExcluded.Sum(i => i.AdjustedWelfareRate ?? 0);
                    if (totalWelfareRate > BaseWelfareCap.Value)
                    {
                        throw new InvalidOperationException(
                            $"مجموع درصد رفاهی تخصیص داده شده ({totalWelfareRate:N0}٪) از سقف مجاز اداره ({BaseWelfareCap.Value:N0}٪) فراتر رفته است.");
                    }
                }
                else
                {
                    var totalWelfare = nonExcluded.Sum(i => i.CalculatedWelfareAmount ?? 0);
                    if (totalWelfare > BaseWelfareCap.Value)
                    {
                        throw new InvalidOperationException(
                            $"مجموع رفاهی تخصیص داده شده ({totalWelfare:N0} ریال) از سقف مجاز اداره ({BaseWelfareCap.Value:N0} ریال) فراتر رفته است.");
                    }
                }
            }
        }
    }

    public void UpdateCaps(double? baseOvertimeCap, double? baseWelfareCap, double? baseBonusCap = null)
    {
        if (baseOvertimeCap.HasValue) BaseOvertimeCap = baseOvertimeCap.Value;
        if (baseWelfareCap.HasValue) BaseWelfareCap = baseWelfareCap.Value;
        if (baseBonusCap.HasValue) BaseBonusCap = baseBonusCap.Value;
        UpdatedAt = DateTime.UtcNow;
    }

    public void ScaleItems(double overtimeFactor, double welfareFactor, bool isRatedProcess)
    {
        foreach (var item in Items.Where(i => !i.IsExcluded))
        {
            item.ScaleAmounts(overtimeFactor, welfareFactor, isRatedProcess);
        }

        if (overtimeFactor > 0 && BaseOvertimeCap.HasValue)
        {
            BaseOvertimeCap = Math.Round(BaseOvertimeCap.Value * overtimeFactor, 0);
        }

        if (welfareFactor > 0 && BaseWelfareCap.HasValue)
        {
            BaseWelfareCap = Math.Round(BaseWelfareCap.Value * welfareFactor, 0);
        }

        UpdatedAt = DateTime.UtcNow;
    }
}
