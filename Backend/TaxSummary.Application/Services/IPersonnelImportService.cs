using System.IO;
using System.Threading;
using System.Threading.Tasks;
using TaxSummary.Application.DTOs.PersonnelImport;
using TaxSummary.Domain.Common;

namespace TaxSummary.Application.Services;

/// <summary>
/// Service for validating, previewing, and importing personnel and user accounts from HR and welfare Excel files
/// </summary>
public interface IPersonnelImportService
{
    /// <summary>
    /// Analyzes the base welfare file and office mapping file, validates structure, and returns a preview with statistics
    /// </summary>
    Task<Result<PersonnelImportPreviewDto>> PreviewImportAsync(
        Stream baseFileStream,
        Stream officeFileStream,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes the synchronization of Offices, Employees, Users, and UserOffices within a database transaction
    /// </summary>
    Task<Result<PersonnelImportResultDto>> ExecuteImportAsync(
        Stream baseFileStream,
        Stream officeFileStream,
        string? defaultPassword = null,
        Guid? actorUserId = null,
        string? actorUsername = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default);
}
