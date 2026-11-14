using Microsoft.AspNetCore.Http;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service interface for file storage operations
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Saves an employee photo and returns the URL
    /// </summary>
    /// <param name="file">The photo file to save</param>
    /// <param name="personnelNumber">Personnel number for unique filename</param>
    /// <returns>The relative URL of the saved photo</returns>
    Task<string> SaveEmployeePhotoAsync(IFormFile file, string personnelNumber);

    /// <summary>
    /// Deletes an employee photo
    /// </summary>
    /// <param name="photoUrl">The URL of the photo to delete</param>
    /// <returns>True if deleted successfully, false otherwise</returns>
    Task<bool> DeleteEmployeePhotoAsync(string photoUrl);

    /// <summary>
    /// Gets the full URL for a photo filename
    /// </summary>
    /// <param name="fileName">The filename</param>
    /// <returns>The relative URL</returns>
    string GetPhotoUrl(string fileName);

    /// <summary>
    /// Saves a branding logo and returns the relative URL
    /// </summary>
    /// <param name="file">The logo image file</param>
    /// <returns>The relative URL of the saved logo</returns>
    Task<string> SaveBrandingLogoAsync(IFormFile file);
}

