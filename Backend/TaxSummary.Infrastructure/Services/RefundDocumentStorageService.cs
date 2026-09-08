using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TaxSummary.Application.Services;

namespace TaxSummary.Infrastructure.Services;

/// <summary>
/// Secure file system storage service for Tax Refund Case PDF documents
/// </summary>
public class RefundDocumentStorageService : IRefundDocumentStorageService
{
    private readonly IHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RefundDocumentStorageService> _logger;
    private readonly string _baseUploadPath;
    private readonly long _maxFileSizeInBytes;

    // PDF magic bytes signature (%PDF-)
    private static readonly byte[] PdfMagicBytes = { 0x25, 0x50, 0x44, 0x46, 0x2D };

    public RefundDocumentStorageService(
        IHostEnvironment environment,
        IConfiguration configuration,
        ILogger<RefundDocumentStorageService> logger)
    {
        _environment = environment ?? throw new ArgumentNullException(nameof(environment));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _baseUploadPath = _configuration["FileStorage:RefundDocumentsPath"] ?? "App_Data/uploads/refund-documents";
        var maxFileSizeSection = _configuration["FileStorage:MaxDocumentFileSizeInMB"];
        var maxFileSizeInMb = int.TryParse(maxFileSizeSection, out var mb) && mb > 0 ? mb : 25;
        _maxFileSizeInBytes = maxFileSizeInMb * 1024L * 1024L;
    }

    public async Task<(string StoredFileName, string RelativePath, long FileSize)> SavePdfAsync(
        IFormFile file,
        Guid caseId,
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("فایل ارسالی خالی است", nameof(file));

        // 1. Validate file size
        if (file.Length > _maxFileSizeInBytes)
        {
            var maxMb = _maxFileSizeInBytes / (1024 * 1024);
            throw new ArgumentException($"حجم فایل ({file.Length / (1024 * 1024.0):F1} مگابایت) بیش از سقف مجاز ({maxMb} مگابایت) است");
        }

        // 2. Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".pdf")
            throw new ArgumentException("صرفاً فایل‌های با فرمت PDF مجاز به بارگذاری می‌باشند");

        // 3. Validate binary magic bytes (%PDF-)
        using (var stream = file.OpenReadStream())
        {
            var header = new byte[5];
            var read = await stream.ReadAsync(header.AsMemory(0, 5), ct);
            if (read < 5 || !IsPdfSignature(header))
            {
                throw new ArgumentException("محتوای فایل فاقد ساختار استاندارد PDF می‌باشد");
            }
        }

        // 4. Ensure directory exists
        var caseDirectory = Path.Combine(GetFullRootPath(), caseId.ToString());
        if (!Directory.Exists(caseDirectory))
        {
            Directory.CreateDirectory(caseDirectory);
        }

        // 5. Generate secure randomized filename
        var storedFileName = $"{caseId}_{Guid.NewGuid():N}.pdf";
        var fullPath = Path.Combine(caseDirectory, storedFileName);
        var relativePath = Path.Combine(_baseUploadPath, caseId.ToString(), storedFileName).Replace('\\', '/');

        // 6. Write file to disk
        using (var destinationStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await file.CopyToAsync(destinationStream, ct);
        }

        _logger.LogInformation("Successfully saved refund document {FileName} to {Path} ({Size} bytes)",
            file.FileName, fullPath, file.Length);

        return (storedFileName, relativePath, file.Length);
    }

    public Task<(Stream Stream, string ContentType, string FileName)> GetPdfStreamAsync(
        string relativePath,
        string originalFileName,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            throw new ArgumentException("مسیر فایل نامعتبر است", nameof(relativePath));

        var fullPath = ResolveFullPath(relativePath);
        if (!File.Exists(fullPath))
        {
            _logger.LogWarning("PDF file not found on disk at {Path}", fullPath);
            throw new FileNotFoundException("فایل فیزیکی در سرور یافت نشد", fullPath);
        }

        var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<(Stream Stream, string ContentType, string FileName)>((
            stream,
            "application/pdf",
            string.IsNullOrWhiteSpace(originalFileName) ? Path.GetFileName(fullPath) : originalFileName
        ));
    }

    public Task<bool> DeletePdfAsync(
        string relativePath,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return Task.FromResult(false);

        try
        {
            var fullPath = ResolveFullPath(relativePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                _logger.LogInformation("Deleted refund document file at {Path}", fullPath);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting refund document file at {RelativePath}", relativePath);
            return Task.FromResult(false);
        }
    }

    private static bool IsPdfSignature(byte[] header)
    {
        for (int i = 0; i < PdfMagicBytes.Length; i++)
        {
            if (header[i] != PdfMagicBytes[i])
                return false;
        }
        return true;
    }

    private string GetFullRootPath()
    {
        return Path.IsPathRooted(_baseUploadPath)
            ? _baseUploadPath
            : Path.Combine(Directory.GetCurrentDirectory(), _baseUploadPath);
    }

    private string ResolveFullPath(string relativePath)
    {
        if (Path.IsPathRooted(relativePath))
            return relativePath;

        return Path.Combine(Directory.GetCurrentDirectory(), relativePath);
    }
}
