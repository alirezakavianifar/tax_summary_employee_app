using TaxSummary.Domain.Entities;

namespace TaxSummary.Application.DTOs;

public class RefundWorkflowStepDto
{
    public Guid Id { get; set; }
    public RefundCaseStatus Stage { get; set; }
    public int StageValue => (int)Stage;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int StepOrder { get; set; }
    public bool IsEnabled { get; set; }
    public bool IsMandatory { get; set; }
    public string AllowedRoles { get; set; } = string.Empty;
    public List<string> AllowedRolesList => AllowedRoles
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .ToList();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateRefundWorkflowStepDto
{
    public RefundCaseStatus Stage { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int StepOrder { get; set; }
    public bool IsEnabled { get; set; }
    public string AllowedRoles { get; set; } = string.Empty;
}

public class UpdateWorkflowStepsRequestDto
{
    public List<UpdateRefundWorkflowStepDto> Steps { get; set; } = new();
}
