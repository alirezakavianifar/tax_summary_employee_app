using System.Reflection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OfficeOpenXml;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;

namespace TaxSummary.Infrastructure.Services;

/// <summary>
/// Service that loads and applies position standardization rules using the master mapping table.
/// </summary>
public class PositionMappingService : IPositionMappingService
{
    private const string DefaultFallbackPosition = "حسابرس";
    private readonly ILogger<PositionMappingService> _logger;
    private readonly Dictionary<string, string> _mappingCache = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _lock = new();
    private bool _initialized;

    public PositionMappingService(
        IConfiguration configuration,
        ILogger<PositionMappingService> logger)
    {
        _logger = logger;
        InitializeMappings(configuration);
    }

    public string GetStandardizedPosition(string? rawPosition)
    {
        if (string.IsNullOrWhiteSpace(rawPosition))
        {
            return DefaultFallbackPosition;
        }

        var normalized = NormalizeText(rawPosition);
        if (string.IsNullOrEmpty(normalized))
        {
            return DefaultFallbackPosition;
        }

        lock (_lock)
        {
            if (_mappingCache.TryGetValue(normalized, out var mapped) && !string.IsNullOrWhiteSpace(mapped))
            {
                return mapped;
            }
        }

        // Direct standard titles check
        if (normalized.Contains("رییس گروه") || normalized.Contains("رئیس گروه") || normalized.Contains("سرپرست گروه"))
        {
            return "رییس گروه";
        }
        if (normalized.Contains("حسابرس ارشد") || normalized.Contains("کارشناس ارشد"))
        {
            return "حسابرس ارشد";
        }
        if (normalized.Contains("حسابرس"))
        {
            return "حسابرس";
        }

        // Default fallback per business specification
        return DefaultFallbackPosition;
    }

    public string ResolveTierFromPosition(string? standardizedOrRawPosition)
    {
        var standardized = GetStandardizedPosition(standardizedOrRawPosition);
        if (standardized.Contains("رییس گروه") || standardized.Contains("رئیس گروه") || standardized.Contains("سرپرست گروه"))
        {
            return PositionTier.GroupHead;
        }
        if (standardized.Contains("حسابرس ارشد") || standardized.Contains("کارشناس ارشد"))
        {
            return PositionTier.SeniorExpert;
        }
        return PositionTier.OtherStaff;
    }

    private void InitializeMappings(IConfiguration configuration)
    {
        if (_initialized) return;

        lock (_lock)
        {
            if (_initialized) return;

            try
            {
                using var stream = OpenMappingStream(configuration);
                if (stream != null)
                {
                    LoadFromStream(stream);
                    _logger.LogInformation("Loaded {Count} position mapping rules successfully.", _mappingCache.Count);
                }
                else
                {
                    _logger.LogWarning("Position mapping file could not be found. Defaulting to standard fallback resolution.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize position mapping rules from Excel resource.");
            }
            finally
            {
                _initialized = true;
            }
        }
    }

    private Stream? OpenMappingStream(IConfiguration configuration)
    {
        // 1. Configured file path
        var configuredPath = configuration["PositionMappingFilePath"];
        if (!string.IsNullOrWhiteSpace(configuredPath) && File.Exists(configuredPath))
        {
            return File.OpenRead(configuredPath);
        }

        // 2. Local filesystem paths relative to app or project root
        var candidatePaths = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "Resources", "PositionMappings.xlsx"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Backend", "TaxSummary.Infrastructure", "Resources", "PositionMappings.xlsx"),
            Path.Combine(Directory.GetCurrentDirectory(), "sample_data", "تبدیل پست ها.xlsx"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "sample_data", "تبدیل پست ها.xlsx"),
            Path.Combine(Directory.GetCurrentDirectory(), "Backend", "TaxSummary.Infrastructure", "Resources", "PositionMappings.xlsx")
        };

        foreach (var path in candidatePaths)
        {
            try
            {
                var fullPath = Path.GetFullPath(path);
                if (File.Exists(fullPath))
                {
                    return File.OpenRead(fullPath);
                }
            }
            catch { }
        }

        // 3. Embedded resource
        var assembly = Assembly.GetExecutingAssembly();
        var resourceName = assembly.GetManifestResourceNames()
            .FirstOrDefault(n => n.EndsWith("PositionMappings.xlsx", StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(resourceName))
        {
            return assembly.GetManifestResourceStream(resourceName);
        }

        return null;
    }

    private void LoadFromStream(Stream stream)
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets.FirstOrDefault(w => w.Name.Equals("bASErtENAME", StringComparison.OrdinalIgnoreCase))
                        ?? package.Workbook.Worksheets.FirstOrDefault();

        if (worksheet == null || worksheet.Dimension == null)
        {
            return;
        }

        int colOld = -1;
        int colNew = -1;

        for (int c = 1; c <= worksheet.Dimension.Columns; c++)
        {
            var header = worksheet.Cells[1, c].Text?.Trim();
            if (header != null)
            {
                if (header.Contains("عنوان پست") || header.Contains("اصلاح شده") || header.Contains("قدیم"))
                {
                    colOld = c;
                }
                else if (header.Contains("جدید"))
                {
                    colNew = c;
                }
            }
        }

        if (colOld == -1) colOld = 1;
        if (colNew == -1) colNew = 2;

        for (int r = 2; r <= worksheet.Dimension.Rows; r++)
        {
            var rawOld = worksheet.Cells[r, colOld].Text;
            var rawNew = worksheet.Cells[r, colNew].Text;

            var normOld = NormalizeText(rawOld);
            var normNew = NormalizeText(rawNew);

            if (!string.IsNullOrEmpty(normOld) && !string.IsNullOrEmpty(normNew))
            {
                _mappingCache[normOld] = normNew;
            }
        }
    }

    private static string NormalizeText(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var t = text.Trim();
        // Normalize Persian/Arabic character discrepancies
        t = t.Replace('ي', 'ی').Replace('ك', 'ک');
        t = t.Replace('\u200c', ' ').Replace('\u200b', ' ');
        var tokens = t.Split(new[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        return string.Join(" ", tokens);
    }
}
