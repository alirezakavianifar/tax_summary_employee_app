using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TaxSummary.Infrastructure.Services;

/// <summary>
/// Local file system implementation of file storage service
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly IHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LocalFileStorageService> _logger;
    private readonly string _uploadPath;
    private readonly long _maxFileSizeInBytes;
    private readonly string[] _allowedExtensions;

    public LocalFileStorageService(
        IHostEnvironment environment,
        IConfiguration configuration,
        ILogger<LocalFileStorageService> logger)
    {
        _environment = environment ?? throw new ArgumentNullException(nameof(environment));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _uploadPath = _configuration["FileStorage:EmployeePhotosPath"] ?? "wwwroot/uploads/employee-photos";
        var maxFileSizeInMB = _configuration.GetValue<int>("FileStorage:MaxFileSizeInMB", 5);
        _maxFileSizeInBytes = maxFileSizeInMB * 1024 * 1024;
        _allowedExtensions = _configuration.GetSection("FileStorage:AllowedExtensions").Get<string[]>()
            ?? new[] { ".jpg", ".jpeg", ".png" };
    }

    public async Task<string> SaveEmployeePhotoAsync(IFormFile file, string personnelNumber)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty", nameof(file));

        // Validate file size
        if (file.Length > _maxFileSizeInBytes)
            throw new ArgumentException($"File size exceeds maximum allowed size of {_maxFileSizeInBytes / (1024 * 1024)}MB");

        // Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(extension))
            throw new ArgumentException($"File type not allowed. Allowed types: {string.Join(", ", _allowedExtensions)}");

        // Validate content type
        var allowedContentTypes = new[] { "image/jpeg", "image/jpg", "image/png" };
        if (!allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            throw new ArgumentException("Invalid image content type");

        // Ensure upload directory exists
        var fullUploadPath = Path.IsPathRooted(_uploadPath) 
            ? _uploadPath 
            : Path.Combine(Directory.GetCurrentDirectory(), _uploadPath);
        if (!Directory.Exists(fullUploadPath))
        {
            Directory.CreateDirectory(fullUploadPath);
            _logger.LogInformation("Created upload directory: {Path}", fullUploadPath);
        }

        // Generate unique filename
        var sanitizedPersonnelNumber = SanitizeFileName(personnelNumber);
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var fileName = $"{sanitizedPersonnelNumber}_{timestamp}{extension}";
        var filePath = Path.Combine(fullUploadPath, fileName);

        // Save file
        try
        {
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            _logger.LogInformation("Saved employee photo: {FileName}", fileName);

            // Return relative URL
            return $"/uploads/employee-photos/{fileName}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving employee photo: {FileName}", fileName);
            throw new InvalidOperationException("Failed to save photo", ex);
        }
    }

    public async Task<bool> DeleteEmployeePhotoAsync(string photoUrl)
    {
        if (string.IsNullOrWhiteSpace(photoUrl))
            return false;

        try
        {
            // Extract filename from URL
            var fileName = Path.GetFileName(photoUrl);
            var fullUploadPath = Path.IsPathRooted(_uploadPath) 
                ? _uploadPath 
                : Path.Combine(Directory.GetCurrentDirectory(), _uploadPath);
            var filePath = Path.Combine(fullUploadPath, fileName);

            if (File.Exists(filePath))
            {
                await Task.Run(() => File.Delete(filePath));
                _logger.LogInformation("Deleted employee photo: {FileName}", fileName);
                return true;
            }

            _logger.LogWarning("Photo file not found: {FilePath}", filePath);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting employee photo: {PhotoUrl}", photoUrl);
            return false;
        }
    }

    public string GetPhotoUrl(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            return string.Empty;

        return $"/uploads/employee-photos/{fileName}";
    }

    private static string SanitizeFileName(string fileName)
    {
        // Remove invalid characters
        var invalidChars = Path.GetInvalidFileNameChars();
        return string.Join("_", fileName.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries))
            .TrimEnd('.');
    }
}
