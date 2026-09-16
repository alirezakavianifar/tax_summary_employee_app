namespace TaxSummary.Application.DTOs.TaxFinalityStage;

/// <summary>
/// Data Transfer Object for Tax Finality Stage representation
/// </summary>
public class FinalityStageDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsSystem { get; set; }
}

/// <summary>
/// DTO for creating a new custom finality stage
/// </summary>
public class CreateFinalityStageDto
{
    public string? Code { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
}

/// <summary>
/// DTO for updating an existing finality stage
/// </summary>
public class UpdateFinalityStageDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
}

/// <summary>
/// DTO for batch updating display order
/// </summary>
public class FinalityStageOrderDto
{
    public int Id { get; set; }
    public int DisplayOrder { get; set; }
}
