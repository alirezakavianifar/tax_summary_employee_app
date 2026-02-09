using System.IO;
using Microsoft.AspNetCore.Http;

namespace TaxSummary.Application.Services;

public interface IExcelSeedService
{
    Task<int> SeedFromExcelAsync(Stream fileStream, CancellationToken cancellationToken = default);
}
