using Microsoft.AspNetCore.Http;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service interface for secure PDF storage operations relating to Tax Refund Cases
/// سرویس ذخیره‌سازی امن اسناد و مدارک PDF پرونده استرداد
/// </summary>
public interface IRefundDocumentStorageService
{
    /// <summary>
    /// Validates and securely saves an uploaded PDF file for a refund case
    /// </summary>
    Task<(string StoredFileName, string RelativePath, long FileSize)> SavePdfAsync(
        IFormFile file,
        Guid caseId,
        CancellationToken ct = default);

    /// <summary>
    /// Gets a stream for reading a stored PDF file
    /// </summary>
    Task<(Stream Stream, string ContentType, string FileName)> GetPdfStreamAsync(
        string relativePath,
        string originalFileName,
        CancellationToken ct = default);

    /// <summary>
    /// Deletes a stored PDF file from storage
    /// </summary>
    Task<bool> DeletePdfAsync(
        string relativePath,
        CancellationToken ct = default);
}
