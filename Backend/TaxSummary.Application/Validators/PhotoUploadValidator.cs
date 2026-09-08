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

        // Validate magic bytes (binary file signature)
        try
        {
            using var stream = file.OpenReadStream();
            var headerBytes = new byte[8];
            var bytesRead = stream.Read(headerBytes, 0, headerBytes.Length);
            if (bytesRead < 8)
                return Result.Failure("محتوای فایل ارسالی برای اعتبارسنجی تصویر کافی نیست");

            if (extension == ".jpg" || extension == ".jpeg")
            {
                if (headerBytes[0] != 0xFF || headerBytes[1] != 0xD8 || headerBytes[2] != 0xFF)
                {
                    return Result.Failure("محتوای فایل ارسالی با فرمت تصویر JPEG همخوانی ندارد");
                }
            }
            else if (extension == ".png")
            {
                byte[] pngSignature = { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
                for (int i = 0; i < pngSignature.Length; i++)
                {
                    if (headerBytes[i] != pngSignature[i])
                    {
                        return Result.Failure("محتوای فایل ارسالی با فرمت تصویر PNG همخوانی ندارد");
                    }
                }
            }
        }
        catch (Exception)
        {
            return Result.Failure("خطا در بررسی ساختار فایل تصویر");
        }

        return Result.Success();
    }
}
