using Microsoft.AspNetCore.Http;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Validators;

/// <summary>
/// Validator for employee photo uploads
/// </summary>
public class PhotoUploadValidator
{
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png" };
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB
    private readonly string[] _allowedContentTypes = { "image/jpeg", "image/jpg", "image/png" };

    public Result Validate(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return Result.Failure("فایل عکس خالی است");

        // Validate file size
        if (file.Length > MaxFileSize)
            return Result.Failure($"حجم فایل نباید بیشتر از {MaxFileSize / (1024 * 1024)} مگابایت باشد");

        // Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(extension))
            return Result.Failure($"فرمت فایل مجاز نیست. فرمت‌های مجاز: {string.Join(", ", _allowedExtensions)}");

        // Validate content type
        if (!_allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            return Result.Failure("نوع محتوای تصویر معتبر نیست");

        // Validate filename
        if (string.IsNullOrWhiteSpace(file.FileName))
            return Result.Failure("نام فایل معتبر نیست");

        return Result.Success();
    }
}
