namespace TaxSummary.Application.DTOs;

/// <summary>
/// Response DTO for photo upload operations
/// </summary>
public class PhotoUploadResponseDto
{
    public string PhotoUrl { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
