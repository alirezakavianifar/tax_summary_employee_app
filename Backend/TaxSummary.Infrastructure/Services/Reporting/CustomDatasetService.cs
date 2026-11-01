using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MiniExcelLibs;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Services.Reporting;

public class CustomDatasetService : ICustomDatasetService
{
    private readonly TaxSummaryDbContext _db;
    private readonly IReportingRepository _reportingRepository;
    private readonly ILogger<CustomDatasetService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public CustomDatasetService(
        TaxSummaryDbContext db,
        IReportingRepository reportingRepository,
        ILogger<CustomDatasetService> logger)
    {
        _db = db;
        _reportingRepository = reportingRepository;
        _logger = logger;
    }

    public async Task<Result<ExcelInspectionResultDto>> InspectExcelStreamAsync(
        Stream stream,
        string fileName,
        string? sheetName = null,
        int sampleRowsCount = 15,
        CancellationToken ct = default)
    {
        try
        {
            if (stream == null || stream.Length == 0)
                return Result.Failure<ExcelInspectionResultDto>("فایل اکسل بارگذاری شده خالی است.");

            // MiniExcel requires seekable stream
            Stream workStream = stream;
            MemoryStream? ms = null;
            if (!stream.CanSeek)
            {
                ms = new MemoryStream();
                await stream.CopyToAsync(ms, ct);
                ms.Position = 0;
                workStream = ms;
            }
            else
            {
                workStream.Position = 0;
            }

            var sheetNames = MiniExcel.GetSheetNames(workStream).ToList();
            if (sheetNames.Count == 0)
                return Result.Failure<ExcelInspectionResultDto>("هیچ برگه کاری (Worksheet) در فایل اکسل یافت نشد.");

            var selectedSheet = !string.IsNullOrWhiteSpace(sheetName) && sheetNames.Contains(sheetName)
                ? sheetName
                : sheetNames[0];

            workStream.Position = 0;
            var rows = workStream.Query(sheetName: selectedSheet, useHeaderRow: true).Take(sampleRowsCount).ToList();

            if (rows.Count == 0)
                return Result.Failure<ExcelInspectionResultDto>($"برگه کاری '{selectedSheet}' فاقد رکورد داده است.");

            // Extract original headers from first row
            var firstRow = (IDictionary<string, object>)rows[0];
            var rawHeaders = firstRow.Keys.Where(k => !string.IsNullOrWhiteSpace(k)).ToList();

            var columns = new List<CustomDatasetColumnDto>();
            int colIndex = 1;

            foreach (var rawHeader in rawHeaders)
            {
                var fieldName = $"c_{colIndex:02}";
                var persianLabel = rawHeader.Trim();

                // Gather sample non-empty values
                var sampleValues = new List<string>();
                foreach (var row in rows)
                {
                    var dict = (IDictionary<string, object>)row;
                    if (dict.TryGetValue(rawHeader, out var val) && val != null)
                    {
                        var s = val.ToString()?.Trim();
                        if (!string.IsNullOrWhiteSpace(s) && !sampleValues.Contains(s))
                        {
                            sampleValues.Add(s);
                            if (sampleValues.Count >= 5) break;
                        }
                    }
                }

                var dataType = InferDataType(persianLabel, sampleValues);
                var isCurrency = dataType == "currency";
                var isIdOrYear = dataType is "id" or "year";

                columns.Add(new CustomDatasetColumnDto
                {
                    FieldName = fieldName,
                    OriginalHeader = persianLabel,
                    PersianLabel = persianLabel,
                    DataType = dataType,
                    IsVisible = true,
                    IsSortable = true,
                    HasAggregateSum = isCurrency,
                    Aggregate = isCurrency ? "Sum" : null,
                    Alignment = isCurrency ? "left" : (isIdOrYear || dataType == "date" ? "center" : "right"),
                    DisplayOrder = colIndex,
                    SampleValues = sampleValues.Take(3).ToList()
                });

                colIndex++;
            }

            // Create sample rows mapped to safe fieldNames
            var sampleRows = new List<Dictionary<string, object?>>();
            foreach (var row in rows)
            {
                var dict = (IDictionary<string, object>)row;
                var sampleRow = new Dictionary<string, object?>();

                foreach (var col in columns)
                {
                    dict.TryGetValue(col.OriginalHeader, out var cellVal);
                    sampleRow[col.FieldName] = FormatSampleCellValue(cellVal, col.DataType);
                }

                sampleRows.Add(sampleRow);
            }

            var cleanBaseName = Path.GetFileNameWithoutExtension(fileName);
            var suggestedCode = GenerateSafeReportCode(cleanBaseName);
            var suggestedTitle = $"گزارش {cleanBaseName}";

            var result = new ExcelInspectionResultDto
            {
                FileName = fileName,
                FileSizeBytes = workStream.Length,
                SheetNames = sheetNames,
                SelectedSheet = selectedSheet,
                TotalEstimatedRows = rows.Count,
                SuggestedReportCode = suggestedCode,
                SuggestedReportTitle = suggestedTitle,
                Columns = columns,
                SampleRows = sampleRows
            };

            ms?.Dispose();
            return Result.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inspecting Excel file '{FileName}'", fileName);
            return Result.Failure<ExcelInspectionResultDto>($"خطا در بررسی ساختار فایل اکسل: {ex.Message}");
        }
    }

    public async Task<Result<ReportDefinitionDto>> CreateCustomDatasetAsync(
        Stream stream,
        string fileName,
        CreateCustomDatasetRequestDto request,
        Guid? createdByUserId,
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.ReportCode))
                return Result.Failure<ReportDefinitionDto>("کد گزارش الزامی است.");

            if (string.IsNullOrWhiteSpace(request.Title))
                return Result.Failure<ReportDefinitionDto>("عنوان گزارش الزامی است.");

            if (request.Columns == null || request.Columns.Count == 0)
                return Result.Failure<ReportDefinitionDto>("تعریف ستون‌های گزارش الزامی است.");

            var cleanCode = GenerateSafeReportCode(request.ReportCode);

            // Check if code already exists
            var existing = await _reportingRepository.GetReportDefinitionByCodeAsync(cleanCode, ct);
            if (existing != null)
            {
                return Result.Failure<ReportDefinitionDto>($"گزارشی با کد '{cleanCode}' قبلاً در سامانه ثبت شده است.");
            }

            var tableName = $"custom_dataset_{cleanCode.ToLowerInvariant()}";

            // Prepare stream
            Stream workStream = stream;
            MemoryStream? ms = null;
            if (!stream.CanSeek)
            {
                ms = new MemoryStream();
                await stream.CopyToAsync(ms, ct);
                ms.Position = 0;
                workStream = ms;
            }
            else
            {
                workStream.Position = 0;
            }

            var sheetNames = MiniExcel.GetSheetNames(workStream).ToList();
            var targetSheet = !string.IsNullOrWhiteSpace(request.SheetName) && sheetNames.Contains(request.SheetName)
                ? request.SheetName
                : sheetNames.FirstOrDefault() ?? "Sheet1";

            // 1. Create SQLite Table
            await CreatePhysicalTableAsync(tableName, request.Columns, ct);

            // 2. Stream Data and Batch Insert
            workStream.Position = 0;
            int totalInserted = await StreamAndInsertRowsAsync(workStream, targetSheet, tableName, request.Columns, ct);

            // 3. Create Indexes for Filter Fields
            await CreateIndexesAsync(tableName, request.QuickFilterColumns, request.Columns, ct);

            // 4. Build Configuration JSON
            var configDto = new CustomDatasetConfigJsonDto
            {
                DatasetTableName = tableName,
                OriginalFileName = fileName,
                UploadedSheetName = targetSheet,
                TotalRowCount = totalInserted,
                DefaultSortField = request.DefaultSortField ?? request.Columns.FirstOrDefault(c => c.IsVisible)?.FieldName,
                DefaultSortDescending = request.DefaultSortDescending,
                QuickFilterColumns = request.QuickFilterColumns ?? new List<string>(),
                Columns = request.Columns
            };

            var configJson = JsonSerializer.Serialize(configDto, JsonOptions);

            // 5. Create and Register ReportDefinition
            var report = ReportDefinition.Create(
                code: cleanCode,
                title: request.Title,
                description: string.IsNullOrWhiteSpace(request.Description)
                    ? $"گزارش داده‌های بارگذاری شده از {fileName} (تعداد رکورد: {totalInserted:N0})"
                    : request.Description,
                source: ReportDomainSource.CustomUploadedDataset,
                category: ReportCategory.Operational,
                type: ReportType.Tabular,
                configurationJson: configJson,
                isSystemReport: false,
                requiredRole: request.RequiredRole,
                createdByUserId: createdByUserId);

            await _reportingRepository.AddReportDefinitionAsync(report, ct);

            ms?.Dispose();

            var dto = new ReportDefinitionDto
            {
                Id = report.Id,
                Code = report.Code,
                Title = report.Title,
                Description = report.Description,
                DomainSource = report.DomainSource,
                Category = report.Category,
                Type = report.Type,
                IsSystemReport = report.IsSystemReport,
                IsActive = report.IsActive,
                RequiredRole = report.RequiredRole,
                Columns = request.Columns.Select(c => new ReportColumnMetadataDto
                {
                    FieldName = c.FieldName,
                    PersianLabel = c.PersianLabel,
                    DataType = c.DataType,
                    IsVisible = c.IsVisible,
                    IsSortable = c.IsSortable,
                    HasAggregateSum = c.HasAggregateSum,
                    Aggregate = c.Aggregate,
                    Alignment = c.Alignment,
                    DisplayOrder = c.DisplayOrder
                }).ToList()
            };

            return Result.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating custom dataset for report code '{ReportCode}'", request.ReportCode);
            return Result.Failure<ReportDefinitionDto>($"خطا در ایجاد گزارش و بارگذاری مجموعه داده: {ex.Message}");
        }
    }

    public async Task<Result<ReportDefinitionDto>> TweakCustomReportAsync(
        string reportCode,
        TweakCustomReportRequestDto request,
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(reportCode))
                return Result.Failure<ReportDefinitionDto>("کد گزارش الزامی است.");

            var report = await _reportingRepository.GetReportDefinitionByCodeAsync(reportCode, ct);
            if (report == null)
                return Result.Failure<ReportDefinitionDto>($"گزارش با کد '{reportCode}' یافت نشد.");

            var existingConfig = JsonSerializer.Deserialize<CustomDatasetConfigJsonDto>(report.ConfigurationJson, JsonOptions)
                ?? new CustomDatasetConfigJsonDto();

            // Update configuration settings
            existingConfig.DefaultSortField = request.DefaultSortField;
            existingConfig.DefaultSortDescending = request.DefaultSortDescending;
            existingConfig.QuickFilterColumns = request.QuickFilterColumns ?? new List<string>();
            existingConfig.Columns = request.Columns ?? existingConfig.Columns;

            var updatedConfigJson = JsonSerializer.Serialize(existingConfig, JsonOptions);

            report.Update(
                request.Title,
                request.Description ?? report.Description,
                updatedConfigJson,
                request.RequiredRole);

            await _reportingRepository.UpdateReportDefinitionAsync(report, ct);

            var dto = new ReportDefinitionDto
            {
                Id = report.Id,
                Code = report.Code,
                Title = report.Title,
                Description = report.Description,
                DomainSource = report.DomainSource,
                Category = report.Category,
                Type = report.Type,
                IsSystemReport = report.IsSystemReport,
                IsActive = report.IsActive,
                RequiredRole = report.RequiredRole,
                Columns = existingConfig.Columns.Select(c => new ReportColumnMetadataDto
                {
                    FieldName = c.FieldName,
                    PersianLabel = c.PersianLabel,
                    DataType = c.DataType,
                    IsVisible = c.IsVisible,
                    IsSortable = c.IsSortable,
                    HasAggregateSum = c.HasAggregateSum,
                    Aggregate = c.Aggregate,
                    Alignment = c.Alignment,
                    DisplayOrder = c.DisplayOrder
                }).ToList()
            };

            return Result.Success(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error tweaking custom report '{ReportCode}'", reportCode);
            return Result.Failure<ReportDefinitionDto>($"خطا در اعمال تغییرات بر گزارش: {ex.Message}");
        }
    }

    public async Task<Result<int>> AppendDatasetRowsAsync(
        string reportCode,
        Stream stream,
        string? sheetName = null,
        CancellationToken ct = default)
    {
        try
        {
            var report = await _reportingRepository.GetReportDefinitionByCodeAsync(reportCode, ct);
            if (report == null)
                return Result.Failure<int>($"گزارش با کد '{reportCode}' یافت نشد.");

            var config = JsonSerializer.Deserialize<CustomDatasetConfigJsonDto>(report.ConfigurationJson, JsonOptions);
            if (config == null || string.IsNullOrWhiteSpace(config.DatasetTableName))
                return Result.Failure<int>("پیکربندی جدول داده این گزارش نامعتبر است.");

            Stream workStream = stream;
            MemoryStream? ms = null;
            if (!stream.CanSeek)
            {
                ms = new MemoryStream();
                await stream.CopyToAsync(ms, ct);
                ms.Position = 0;
                workStream = ms;
            }
            else
            {
                workStream.Position = 0;
            }

            var sheetNames = MiniExcel.GetSheetNames(workStream).ToList();
            var targetSheet = !string.IsNullOrWhiteSpace(sheetName) && sheetNames.Contains(sheetName)
                ? sheetName
                : config.UploadedSheetName ?? sheetNames.FirstOrDefault() ?? "Sheet1";

            workStream.Position = 0;
            int appendedCount = await StreamAndInsertRowsAsync(workStream, targetSheet, config.DatasetTableName, config.Columns, ct);

            // Update row count in configuration
            config.TotalRowCount += appendedCount;
            var updatedJson = JsonSerializer.Serialize(config, JsonOptions);
            report.Update(report.Title, report.Description, updatedJson, report.RequiredRole);
            await _reportingRepository.UpdateReportDefinitionAsync(report, ct);

            ms?.Dispose();
            return Result.Success(appendedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error appending rows to report '{ReportCode}'", reportCode);
            return Result.Failure<int>($"خطا در افزودن داده‌های جدید به گزارش: {ex.Message}");
        }
    }

    public async Task<Result<int>> ReplaceDatasetRowsAsync(
        string reportCode,
        Stream stream,
        string? sheetName = null,
        CancellationToken ct = default)
    {
        try
        {
            var report = await _reportingRepository.GetReportDefinitionByCodeAsync(reportCode, ct);
            if (report == null)
                return Result.Failure<int>($"گزارش با کد '{reportCode}' یافت نشد.");

            var config = JsonSerializer.Deserialize<CustomDatasetConfigJsonDto>(report.ConfigurationJson, JsonOptions);
            if (config == null || string.IsNullOrWhiteSpace(config.DatasetTableName))
                return Result.Failure<int>("پیکربندی جدول داده این گزارش نامعتبر است.");

            // Clear existing rows
            var connection = (SqliteConnection)_db.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);

            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = $"DELETE FROM [{config.DatasetTableName}];";
                await cmd.ExecuteNonQueryAsync(ct);
            }

            Stream workStream = stream;
            MemoryStream? ms = null;
            if (!stream.CanSeek)
            {
                ms = new MemoryStream();
                await stream.CopyToAsync(ms, ct);
                ms.Position = 0;
                workStream = ms;
            }
            else
            {
                workStream.Position = 0;
            }

            var sheetNames = MiniExcel.GetSheetNames(workStream).ToList();
            var targetSheet = !string.IsNullOrWhiteSpace(sheetName) && sheetNames.Contains(sheetName)
                ? sheetName
                : config.UploadedSheetName ?? sheetNames.FirstOrDefault() ?? "Sheet1";

            workStream.Position = 0;
            int newCount = await StreamAndInsertRowsAsync(workStream, targetSheet, config.DatasetTableName, config.Columns, ct);

            config.TotalRowCount = newCount;
            var updatedJson = JsonSerializer.Serialize(config, JsonOptions);
            report.Update(report.Title, report.Description, updatedJson, report.RequiredRole);
            await _reportingRepository.UpdateReportDefinitionAsync(report, ct);

            ms?.Dispose();
            return Result.Success(newCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error replacing rows in report '{ReportCode}'", reportCode);
            return Result.Failure<int>($"خطا در جایگزینی داده‌های گزارش: {ex.Message}");
        }
    }

    public async Task<Result<bool>> DeleteCustomDatasetAsync(string reportCode, CancellationToken ct = default)
    {
        try
        {
            var report = await _reportingRepository.GetReportDefinitionByCodeAsync(reportCode, ct);
            if (report == null)
                return Result.Failure<bool>($"گزارش با کد '{reportCode}' یافت نشد.");

            if (report.IsSystemReport)
                return Result.Failure<bool>("امکان حذف گزارش‌های پایه سیستمی وجود ندارد.");

            var config = JsonSerializer.Deserialize<CustomDatasetConfigJsonDto>(report.ConfigurationJson, JsonOptions);
            if (config != null && !string.IsNullOrWhiteSpace(config.DatasetTableName))
            {
                try
                {
                    var connection = (SqliteConnection)_db.Database.GetDbConnection();
                    if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);

                    using var cmd = connection.CreateCommand();
                    cmd.CommandText = $"DROP TABLE IF EXISTS [{config.DatasetTableName}];";
                    await cmd.ExecuteNonQueryAsync(ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not drop physical table '{TableName}' for deleted report '{ReportCode}'", config.DatasetTableName, reportCode);
                }
            }

            await _reportingRepository.DeleteReportDefinitionAsync(report.Id, ct);
            return Result.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting custom dataset '{ReportCode}'", reportCode);
            return Result.Failure<bool>($"خطا در حذف گزارش: {ex.Message}");
        }
    }

    public async Task<Result<(List<Dictionary<string, object?>> Rows, Dictionary<string, object?> Summary, int TotalCount)>> QueryCustomDatasetAsync(
        string reportCode,
        ReportFilterParametersDto parameters,
        CancellationToken ct = default)
    {
        try
        {
            var report = await _reportingRepository.GetReportDefinitionByCodeAsync(reportCode, ct);
            if (report == null)
                return Result.Failure<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)>($"گزارش با کد '{reportCode}' یافت نشد.");

            var config = JsonSerializer.Deserialize<CustomDatasetConfigJsonDto>(report.ConfigurationJson, JsonOptions);
            if (config == null || string.IsNullOrWhiteSpace(config.DatasetTableName))
                return Result.Failure<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)>("پیکربندی این مجموعه داده نامعتبر است.");

            var connection = (SqliteConnection)_db.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);

            var validColumns = config.Columns.ToDictionary(c => c.FieldName, c => c, StringComparer.OrdinalIgnoreCase);

            var whereClauses = new List<string> { "1=1" };
            var sqlParams = new List<SqliteParameter>();

            // 1. SearchTerm across visible string/id columns
            if (!string.IsNullOrWhiteSpace(parameters.SearchTerm))
            {
                var term = $"%{parameters.SearchTerm.Trim()}%";
                var searchCols = config.Columns
                    .Where(c => c.IsVisible && c.DataType is "string" or "id" or "year" or "badge")
                    .Take(12)
                    .Select(c => $"[{c.FieldName}] LIKE @SearchTerm")
                    .ToList();

                if (searchCols.Count > 0)
                {
                    whereClauses.Add($"({string.Join(" OR ", searchCols)})");
                    sqlParams.Add(new SqliteParameter("@SearchTerm", term));
                }
            }

            // 2. Fiscal Year filter (if column exists)
            if (parameters.FiscalYear.HasValue)
            {
                var yearCol = config.Columns.FirstOrDefault(c => c.DataType == "year" || c.OriginalHeader.Contains("سال"));
                if (yearCol != null)
                {
                    whereClauses.Add($"[{yearCol.FieldName}] = @FiscalYear");
                    sqlParams.Add(new SqliteParameter("@FiscalYear", parameters.FiscalYear.Value));
                }
            }

            // 3. Department / Office Name filter (if column exists)
            if (!string.IsNullOrWhiteSpace(parameters.Department))
            {
                var deptCol = config.Columns.FirstOrDefault(c => c.OriginalHeader.Contains("اداره") || c.FieldName.Contains("office") || c.FieldName.Contains("dept"));
                if (deptCol != null)
                {
                    whereClauses.Add($"[{deptCol.FieldName}] LIKE @DeptName");
                    sqlParams.Add(new SqliteParameter("@DeptName", $"%{parameters.Department.Trim()}%"));
                }
            }

            // 4. Status filter (if column exists)
            if (!string.IsNullOrWhiteSpace(parameters.CaseStatus))
            {
                var statusCol = config.Columns.FirstOrDefault(c => c.OriginalHeader.Contains("وضعیت") || c.DataType == "badge");
                if (statusCol != null)
                {
                    whereClauses.Add($"[{statusCol.FieldName}] = @StatusVal");
                    sqlParams.Add(new SqliteParameter("@StatusVal", parameters.CaseStatus.Trim()));
                }
            }

            // 5. Tax Source filter (if column exists)
            if (!string.IsNullOrWhiteSpace(parameters.TaxSourceCode))
            {
                var sourceCol = config.Columns.FirstOrDefault(c => c.OriginalHeader.Contains("منبع") || c.FieldName.Contains("source"));
                if (sourceCol != null)
                {
                    whereClauses.Add($"[{sourceCol.FieldName}] LIKE @SourceVal");
                    sqlParams.Add(new SqliteParameter("@SourceVal", $"%{parameters.TaxSourceCode.Trim()}%"));
                }
            }

            // 6. Auditor Name filter (if column exists or mapped)
            if (!string.IsNullOrWhiteSpace(parameters.AuditorName))
            {
                var mapper = SemanticAuditFieldMapper.FromColumns(config.Columns);
                var auditorCol = mapper.AuditorNameField ?? 
                    config.Columns.FirstOrDefault(c => (c.OriginalHeader.Contains("حسابرس") || c.PersianLabel.Contains("حسابرس")) && !c.OriginalHeader.Contains("کد") && !c.OriginalHeader.Contains("طول"))?.FieldName;

                if (auditorCol != null)
                {
                    whereClauses.Add($"[{auditorCol}] LIKE @AuditorVal");
                    sqlParams.Add(new SqliteParameter("@AuditorVal", $"%{parameters.AuditorName.Trim()}%"));
                }
            }

            var whereSql = string.Join(" AND ", whereClauses);

            // A. Count Query
            int totalCount = 0;
            using (var countCmd = connection.CreateCommand())
            {
                countCmd.CommandText = $"SELECT COUNT(1) FROM [{config.DatasetTableName}] WHERE {whereSql};";
                foreach (var p in sqlParams) countCmd.Parameters.Add(new SqliteParameter(p.ParameterName, p.Value));
                var countRes = await countCmd.ExecuteScalarAsync(ct);
                totalCount = Convert.ToInt32(countRes);
            }

            // B. Aggregates Query
            var summaryAggregates = new Dictionary<string, object?>();
            var aggCols = config.Columns.Where(c => c.HasAggregateSum || c.Aggregate == "Sum" || c.Aggregate == "Average").ToList();
            if (aggCols.Count > 0)
            {
                try
                {
                    var aggSelects = aggCols.Select(c =>
                    {
                        var func = c.Aggregate == "Average" ? "AVG" : "TOTAL";
                        return $"{func}(CAST([{c.FieldName}] AS REAL)) AS [{c.FieldName}_agg]";
                    });

                    using var aggCmd = connection.CreateCommand();
                    aggCmd.CommandText = $"SELECT {string.Join(", ", aggSelects)} FROM [{config.DatasetTableName}] WHERE {whereSql};";
                    foreach (var p in sqlParams) aggCmd.Parameters.Add(new SqliteParameter(p.ParameterName, p.Value));

                    using var aggReader = await aggCmd.ExecuteReaderAsync(ct);
                    if (await aggReader.ReadAsync(ct))
                    {
                        for (int i = 0; i < aggCols.Count; i++)
                        {
                            var col = aggCols[i];
                            var val = aggReader.IsDBNull(i) ? 0 : aggReader.GetValue(i);
                            summaryAggregates[col.FieldName] = val;
                        }
                    }
                }
                catch (Exception aggEx)
                {
                    _logger.LogWarning(aggEx, "Could not compute aggregates for custom report '{ReportCode}'", reportCode);
                }
            }

            // C. Paged Data Query
            var page = Math.Max(1, parameters.PageNumber);
            var pageSize = Math.Max(1, Math.Min(parameters.PageSize, 10000));
            var offset = (page - 1) * pageSize;

            // Safe Order By
            string sortSql = "_row_id ASC";
            if (!string.IsNullOrWhiteSpace(parameters.SortBy) && validColumns.ContainsKey(parameters.SortBy))
            {
                var dir = parameters.SortDescending ? "DESC" : "ASC";
                sortSql = $"[{parameters.SortBy}] {dir}";
            }
            else if (!string.IsNullOrWhiteSpace(config.DefaultSortField) && validColumns.ContainsKey(config.DefaultSortField))
            {
                var dir = config.DefaultSortDescending ? "DESC" : "ASC";
                sortSql = $"[{config.DefaultSortField}] {dir}";
            }

            var selectCols = string.Join(", ", config.Columns.Select(c => $"[{c.FieldName}]"));
            var dataSql = $@"
                SELECT _row_id, {selectCols} 
                FROM [{config.DatasetTableName}] 
                WHERE {whereSql} 
                ORDER BY {sortSql} 
                LIMIT @PageSize OFFSET @Offset;";

            var rows = new List<Dictionary<string, object?>>();
            using (var dataCmd = connection.CreateCommand())
            {
                dataCmd.CommandText = dataSql;
                foreach (var p in sqlParams) dataCmd.Parameters.Add(new SqliteParameter(p.ParameterName, p.Value));
                dataCmd.Parameters.Add(new SqliteParameter("@PageSize", pageSize));
                dataCmd.Parameters.Add(new SqliteParameter("@Offset", offset));

                using var reader = await dataCmd.ExecuteReaderAsync(ct);
                while (await reader.ReadAsync(ct))
                {
                    var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                    row["_row_id"] = reader.GetInt64(0);

                    for (int i = 0; i < config.Columns.Count; i++)
                    {
                        var col = config.Columns[i];
                        var readerIdx = i + 1; // offset by _row_id
                        if (reader.IsDBNull(readerIdx))
                        {
                            row[col.FieldName] = null;
                        }
                        else
                        {
                            var rawVal = reader.GetValue(readerIdx);
                            row[col.FieldName] = FormatTypedValue(rawVal, col.DataType);
                        }
                    }

                    rows.Add(row);
                }
            }

            return Result.Success((rows, summaryAggregates, totalCount));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying custom dataset for report '{ReportCode}'", reportCode);
            return Result.Failure<(List<Dictionary<string, object?>>, Dictionary<string, object?>, int)>($"خطا در اجرای کوئری گزارش اختصاصی: {ex.Message}");
        }
    }

    public async Task<Result<CustomDatasetConfigJsonDto>> GetCustomDatasetConfigAsync(string reportCode, CancellationToken ct = default)
    {
        try
        {
            var report = await _reportingRepository.GetReportDefinitionByCodeAsync(reportCode, ct);
            if (report == null)
                return Result.Failure<CustomDatasetConfigJsonDto>($"گزارش با کد '{reportCode}' یافت نشد.");

            var config = JsonSerializer.Deserialize<CustomDatasetConfigJsonDto>(report.ConfigurationJson, JsonOptions);
            if (config == null)
                return Result.Failure<CustomDatasetConfigJsonDto>("پیکربندی این گزارش خالی است.");

            return Result.Success(config);
        }
        catch (Exception ex)
        {
            return Result.Failure<CustomDatasetConfigJsonDto>($"خطا در دریافت اطلاعات پیکربندی: {ex.Message}");
        }
    }

    #region Private Helper Methods

    private async Task CreatePhysicalTableAsync(string tableName, List<CustomDatasetColumnDto> columns, CancellationToken ct)
    {
        var connection = (SqliteConnection)_db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);

        var colDefs = new List<string> { "_row_id INTEGER PRIMARY KEY AUTOINCREMENT" };
        foreach (var col in columns)
        {
            var sqliteType = col.DataType switch
            {
                "currency" => "NUMERIC",
                "number" => "NUMERIC",
                "year" => "INTEGER",
                _ => "TEXT"
            };

            colDefs.Add($"[{col.FieldName}] {sqliteType}");
        }

        var sql = $"CREATE TABLE IF NOT EXISTS [{tableName}] ({string.Join(", ", colDefs)});";
        using var cmd = connection.CreateCommand();
        cmd.CommandText = sql;
        await cmd.ExecuteNonQueryAsync(ct);
    }

    private async Task<int> StreamAndInsertRowsAsync(
        Stream stream,
        string sheetName,
        string tableName,
        List<CustomDatasetColumnDto> columns,
        CancellationToken ct)
    {
        var connection = (SqliteConnection)_db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);

        // Pre-build parameterized INSERT command
        var colNames = string.Join(", ", columns.Select(c => $"[{c.FieldName}]"));
        var paramPlaceholders = string.Join(", ", columns.Select((_, idx) => $"@p{idx}"));
        var insertSql = $"INSERT INTO [{tableName}] ({colNames}) VALUES ({paramPlaceholders});";

        int totalInserted = 0;
        using var transaction = connection.BeginTransaction();
        try
        {
            using var cmd = connection.CreateCommand();
            cmd.Transaction = transaction;
            cmd.CommandText = insertSql;

            var cmdParams = new List<SqliteParameter>();
            for (int i = 0; i < columns.Count; i++)
            {
                var p = new SqliteParameter($"@p{i}", DBNull.Value);
                cmd.Parameters.Add(p);
                cmdParams.Add(p);
            }

            var queryEnumerable = stream.Query(sheetName: sheetName, useHeaderRow: true);
            foreach (var rowObj in queryEnumerable)
            {
                var dict = (IDictionary<string, object>)rowObj;

                for (int i = 0; i < columns.Count; i++)
                {
                    var col = columns[i];
                    object? cellVal = null;
                    if (dict.TryGetValue(col.OriginalHeader, out var val))
                    {
                        cellVal = val;
                    }

                    cmdParams[i].Value = NormalizeInsertValue(cellVal, col.DataType);
                }

                await cmd.ExecuteNonQueryAsync(ct);
                totalInserted++;
            }

            await transaction.CommitAsync(ct);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }

        return totalInserted;
    }

    private async Task CreateIndexesAsync(
        string tableName,
        List<string>? quickFilters,
        List<CustomDatasetColumnDto> columns,
        CancellationToken ct)
    {
        var connection = (SqliteConnection)_db.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open) await connection.OpenAsync(ct);

        var indexFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (quickFilters != null)
        {
            foreach (var f in quickFilters) indexFields.Add(f);
        }

        // Also index year and status columns automatically
        foreach (var c in columns.Where(c => c.DataType is "year" or "badge"))
        {
            indexFields.Add(c.FieldName);
        }

        foreach (var field in indexFields.Take(6))
        {
            var col = columns.FirstOrDefault(c => c.FieldName.Equals(field, StringComparison.OrdinalIgnoreCase));
            if (col != null)
            {
                var idxName = $"idx_{tableName}_{col.FieldName}";
                var sql = $"CREATE INDEX IF NOT EXISTS [{idxName}] ON [{tableName}] ([{col.FieldName}]);";
                using var cmd = connection.CreateCommand();
                cmd.CommandText = sql;
                await cmd.ExecuteNonQueryAsync(ct);
            }
        }
    }

    private static object NormalizeInsertValue(object? rawVal, string dataType)
    {
        if (rawVal == null || rawVal == DBNull.Value) return DBNull.Value;
        var str = rawVal.ToString()?.Trim();
        if (string.IsNullOrWhiteSpace(str)) return DBNull.Value;

        switch (dataType.ToLowerInvariant())
        {
            case "currency":
            case "number":
                var cleanNumber = Regex.Replace(str, @"[,،٬\s]", "");
                if (decimal.TryParse(cleanNumber, out var decVal)) return decVal;
                return DBNull.Value;

            case "year":
                var cleanYear = Regex.Replace(str, @"[,،٬\s]", "");
                if (int.TryParse(cleanYear, out var yrVal)) return yrVal;
                return DBNull.Value;

            default:
                return str;
        }
    }

    private static object? FormatTypedValue(object? rawVal, string dataType)
    {
        if (rawVal == null || rawVal == DBNull.Value) return null;

        switch (dataType.ToLowerInvariant())
        {
            case "currency":
            case "number":
                if (rawVal is decimal d) return d;
                if (rawVal is double dbl) return (decimal)dbl;
                if (rawVal is long l) return (decimal)l;
                if (rawVal is int i) return (decimal)i;
                if (decimal.TryParse(rawVal.ToString(), out var parsedDec)) return parsedDec;
                return rawVal;

            case "year":
                if (rawVal is int y) return y;
                if (rawVal is long yl) return (int)yl;
                if (int.TryParse(rawVal.ToString(), out var py)) return py;
                return rawVal;

            default:
                return rawVal.ToString();
        }
    }

    private static object? FormatSampleCellValue(object? val, string dataType)
    {
        if (val == null) return null;
        var s = val.ToString()?.Trim();
        if (string.IsNullOrWhiteSpace(s)) return null;

        if (dataType == "currency" || dataType == "number")
        {
            var clean = Regex.Replace(s, @"[,،٬\s]", "");
            if (decimal.TryParse(clean, out var dec)) return dec;
        }

        if (dataType == "year")
        {
            var clean = Regex.Replace(s, @"[,،٬\s]", "");
            if (int.TryParse(clean, out var yr)) return yr;
        }

        return s;
    }

    private static string InferDataType(string header, List<string> sampleValues)
    {
        var lowerHeader = header.Trim().ToLowerInvariant();

        // 1. Year
        if (lowerHeader.Contains("سال") || lowerHeader.Contains("fiscal") || lowerHeader.Contains("year"))
            return "year";

        // 2. Date
        if (lowerHeader.Contains("تاریخ") || lowerHeader.Contains("date") || lowerHeader.Contains("صدور") || lowerHeader.Contains("سررسید") || lowerHeader.Contains("مهلت"))
            return "date";

        // 3. Explicit Person Name / Full Name (takes precedence over embedded ID keywords)
        if ((lowerHeader.Contains("نام و نام خانوادگی") || lowerHeader.Contains("نام خانوادگی") || lowerHeader.StartsWith("نام ") || lowerHeader.Contains(" نام ")) &&
            !lowerHeader.Contains("ثبت نام") && !lowerHeader.Contains("سامانه"))
        {
            return "string";
        }

        // 4. Explicit Currency Amounts (مبلغ always takes precedence over پرونده/مالیات)
        if (lowerHeader.Contains("مبلغ") ||
            lowerHeader.Contains("درآمد") ||
            lowerHeader.Contains("درامد") ||
            lowerHeader.Contains("مأخذ") ||
            lowerHeader.Contains("ماخذ") ||
            lowerHeader.Contains("ریال") ||
            lowerHeader.Contains("حقوق") ||
            lowerHeader.Contains("هزینه") ||
            lowerHeader.Contains("جریمه") ||
            lowerHeader.Contains("عوارض") ||
            lowerHeader.Contains("بدهی") ||
            lowerHeader.Contains("تعدیل") ||
            lowerHeader.Contains("amount") ||
            lowerHeader.Contains("salary"))
        {
            return "currency";
        }

        // 5. Validation flag / status (اعتبارسنجی)
        if (lowerHeader.Contains("اعتبارسنجی") || lowerHeader.Contains("اعتبار سنجی"))
        {
            return "badge";
        }

        // 6. ID / Tracking / Declaration / National Code / Docket / Key / Code
        if (lowerHeader.StartsWith("کد") ||
            lowerHeader.Contains(" کد ") ||
            lowerHeader.Contains("کد ") ||
            lowerHeader.Contains("_کد") ||
            lowerHeader.Contains("کد_") ||
            lowerHeader.Contains("شناسه") ||
            lowerHeader.Contains("کدملی") ||
            lowerHeader.Contains("کد ملی") ||
            lowerHeader.Contains("کلاسه") ||
            lowerHeader.Contains("پرونده") ||
            lowerHeader.Contains("کلید") ||
            lowerHeader.Contains("شماره") ||
            lowerHeader.Contains("ردیف") ||
            lowerHeader.Contains("سریال") ||
            lowerHeader.Contains("بارکد") ||
            lowerHeader.Contains("تین") ||
            lowerHeader.Contains("شبا") ||
            lowerHeader.Contains("پستی") ||
            lowerHeader.Contains("tracking") ||
            lowerHeader.Contains("nationalid") ||
            lowerHeader.Contains("tin") ||
            lowerHeader.Contains("dossier") ||
            lowerHeader.Contains("key") ||
            lowerHeader.EndsWith(" id") ||
            lowerHeader.EndsWith("_id") ||
            lowerHeader == "id")
        {
            return "id";
        }

        // 7. Name / Title / Department / Description (explicit text fields)
        if (lowerHeader.Contains("عنوان") ||
            lowerHeader.Contains("شرح") ||
            lowerHeader.Contains("توضیح") ||
            lowerHeader.Contains("متن") ||
            lowerHeader.Contains("آدرس") ||
            lowerHeader.Contains("واحد") ||
            lowerHeader.Contains("اداره") ||
            lowerHeader.Contains("ثبت نام"))
        {
            return "string";
        }

        // 8. Badge / Category / Status
        if (lowerHeader.Contains("وضعیت") ||
            lowerHeader.Contains("نوع") ||
            lowerHeader.Contains("منبع") ||
            lowerHeader.Contains("مرحله") ||
            lowerHeader.Contains("status") ||
            lowerHeader.Contains("state"))
        {
            return "badge";
        }

        // 9. General Tax mentions (without کد/عنوان/نوع)
        if (lowerHeader.Contains("مالیات") || lowerHeader.Contains("tax"))
        {
            return "currency";
        }

        // 10. Value-based heuristic across samples
        if (sampleValues.Count > 0)
        {
            bool allNumeric = true;
            bool hasLargeCurrencyLike = false;
            bool isNationalIdOrDossier = false;
            bool allYearRange = true;

            foreach (var val in sampleValues)
            {
                var clean = Regex.Replace(val, @"[,،٬\s]", "");
                if (decimal.TryParse(clean, out var dec))
                {
                    if (clean.Length >= 10 && !clean.Contains('.'))
                    {
                        isNationalIdOrDossier = true;
                    }
                    else if (dec > 100000)
                    {
                        hasLargeCurrencyLike = true;
                    }

                    if (dec < 1300 || dec > 1450) allYearRange = false;
                }
                else
                {
                    allNumeric = false;
                    allYearRange = false;
                    break;
                }
            }

            if (allNumeric)
            {
                if (allYearRange) return "year";
                if (isNationalIdOrDossier) return "id";
                if (hasLargeCurrencyLike) return "currency";
                return "number";
            }
        }

        return "string";
    }

    private static string GenerateSafeReportCode(string baseName)
    {
        var clean = Regex.Replace(baseName, @"[^a-zA-Z0-9_]", "_");
        clean = Regex.Replace(clean, @"_+", "_").Trim('_');
        if (string.IsNullOrWhiteSpace(clean)) clean = "CUSTOM_REPORT";
        if (!clean.StartsWith("REP_", StringComparison.OrdinalIgnoreCase))
        {
            clean = "REP_" + clean;
        }

        if (clean.Length > 50) clean = clean[..50];
        return clean.ToUpperInvariant();
    }

    #endregion
}
