namespace TaxSummary.Application.DTOs.TaxSource;

/// <summary>
/// Data Transfer Object for Tax Source representation
/// </summary>
public class TaxSourceDto
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
/// DTO for creating a new custom tax source
/// </summary>
public class CreateTaxSourceDto
{
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
}

/// <summary>
/// DTO for updating an existing tax source
/// </summary>
public class UpdateTaxSourceDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
}

/// <summary>
/// DTO for batch updating display order
/// </summary>
public class TaxSourceOrderDto
{
    public int Id { get; set; }
    public int DisplayOrder { get; set; }
}

