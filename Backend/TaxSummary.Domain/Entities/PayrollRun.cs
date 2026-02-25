namespace TaxSummary.Domain.Entities;

/// <summary>
/// Represents a saved payroll processing run
/// </summary>
public class PayrollRun
{
    public Guid Id { get; private set; }

    /// <summary>
    /// Process type: OvertimeWelfareRated | OvertimeWelfareMonetary | HalfPercentBonus
    /// </summary>
    public string ProcessType { get; private set; } = string.Empty;

    /// <summary>
    /// User-provided label for this run
    /// </summary>
    public string RunLabel { get; private set; } = string.Empty;

    public DateTime CreatedAt { get; private set; }

    public Guid CreatedByUserId { get; private set; }

    /// <summary>
    /// Full result serialized as JSON for re-download
    /// </summary>
    public string ResultJson { get; private set; } = string.Empty;

    /// <summary>
    /// Number of detail rows in the result
    /// </summary>
    public int RowCount { get; private set; }

    // Navigation property
    public User? CreatedBy { get; private set; }

    // Private constructor for EF Core
    private PayrollRun() { }

    public static PayrollRun Create(
        string processType,
        string runLabel,
        Guid createdByUserId,
        string resultJson,
        int rowCount)
    {
        if (string.IsNullOrWhiteSpace(processType))
            throw new ArgumentException("Process type cannot be empty", nameof(processType));
        if (string.IsNullOrWhiteSpace(runLabel))
            throw new ArgumentException("Run label cannot be empty", nameof(runLabel));

        return new PayrollRun
        {
            Id = Guid.NewGuid(),
            ProcessType = processType.Trim(),
            RunLabel = runLabel.Trim(),
            CreatedByUserId = createdByUserId,
            ResultJson = resultJson,
            RowCount = rowCount,
            CreatedAt = DateTime.UtcNow
        };
    }
}
