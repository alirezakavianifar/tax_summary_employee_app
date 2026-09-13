using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OfficeOpenXml;
using TaxSummary.Application.DTOs.PersonnelImport;
using TaxSummary.Application.Services;
using TaxSummary.Domain.Common;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Interfaces;
using TaxSummary.Infrastructure.Data;

namespace TaxSummary.Infrastructure.Services;

public class PersonnelImportService : IPersonnelImportService
{
    private readonly TaxSummaryDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<PersonnelImportService> _logger;

    static PersonnelImportService()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public PersonnelImportService(
        TaxSummaryDbContext context,
        IPasswordHasher passwordHasher,
        ILogger<PersonnelImportService> logger)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _passwordHasher = passwordHasher ?? throw new ArgumentNullException(nameof(passwordHasher));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<Result<PersonnelImportPreviewDto>> PreviewImportAsync(
        Stream baseFileStream,
        Stream officeFileStream,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var parsedData = ParseExcelFiles(baseFileStream, officeFileStream);
            if (parsedData.IsFailure)
            {
                return Result.Failure<PersonnelImportPreviewDto>(parsedData.Error);
            }

            var (baseRecords, officeMappings, warnings) = parsedData.Value;

            // Retrieve existing records from database
            var existingOffices = await _context.Offices
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var existingOfficeCodes = new HashSet<string>(
                existingOffices.Select(o => NormalizePersian(o.Code)),
                StringComparer.OrdinalIgnoreCase);

            var existingEmployees = await _context.Employees
                .AsNoTracking()
                .Select(e => e.PersonnelNumber)
                .ToListAsync(cancellationToken);

            var existingEmpSet = new HashSet<string>(
                existingEmployees.Select(p => p.Trim()),
                StringComparer.OrdinalIgnoreCase);

            var existingUsers = await _context.Users
                .AsNoTracking()
                .Select(u => u.Username)
                .ToListAsync(cancellationToken);

            var existingUserSet = new HashSet<string>(
                existingUsers.Select(u => u.Trim().ToLowerInvariant()),
                StringComparer.OrdinalIgnoreCase);

            var preview = new PersonnelImportPreviewDto
            {
                TotalBaseRecords = baseRecords.Count,
                TotalOfficeRecords = officeMappings.Count,
                Warnings = warnings
            };

            var uniqueOfficesInFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            int matched = 0;
            int unmatched = 0;

            foreach (var item in baseRecords)
            {
                officeMappings.TryGetValue(item.PersonnelNumber, out var officeName);
                if (!string.IsNullOrWhiteSpace(officeName))
                {
                    matched++;
                    uniqueOfficesInFile.Add(officeName.Trim());
                    item.OfficeName = officeName.Trim();
                    item.OfficeCode = StandardizeOfficeCode(officeName.Trim());
                }
                else
                {
                    unmatched++;
                    item.OfficeName = "نامشخص";
                    item.OfficeCode = "UNKNOWN";
                }

                var targetUsername = !string.IsNullOrWhiteSpace(item.NationalId)
                    ? item.NationalId.Trim()
                    : item.PersonnelNumber.Trim();

                item.IsExistingEmployee = existingEmpSet.Contains(item.PersonnelNumber);
                item.IsExistingUser = existingUserSet.Contains(targetUsername.ToLowerInvariant()) ||
                                      existingUserSet.Contains(item.PersonnelNumber.ToLowerInvariant());

                if (item.IsExistingEmployee)
                    preview.UpdatedEmployeesCount++;
                else
                    preview.NewEmployeesCount++;

                if (item.IsExistingUser)
                    preview.UpdatedUsersCount++;
                else
                    preview.NewUsersCount++;

                // Role counts
                if (!preview.RoleBreakdown.ContainsKey(item.AssignedRole))
                    preview.RoleBreakdown[item.AssignedRole] = 0;
                preview.RoleBreakdown[item.AssignedRole]++;
            }

            preview.MatchedRecords = matched;
            preview.UnmatchedRecords = unmatched;

            // Office counts
            foreach (var off in uniqueOfficesInFile)
            {
                var norm = NormalizePersian(off);
                var stdCode = StandardizeOfficeCode(off);
                if (existingOfficeCodes.Contains(norm) || existingOfficeCodes.Contains(stdCode))
                    preview.ExistingOfficesCount++;
                else
                    preview.NewOfficesCount++;
            }

            preview.SamplePreview = baseRecords.Take(15).ToList();

            if (unmatched > 0)
            {
                preview.Warnings.Add($"تعداد {unmatched} کارمند در فایل تخصیص اداره یافت نشدند.");
            }

            return Result.Success(preview);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing personnel import from Excel");
            return Result.Failure<PersonnelImportPreviewDto>($"خطا در پردازش پیش‌نمایش فایل اکسل: {ex.Message}");
        }
    }

    public async Task<Result<PersonnelImportResultDto>> ExecuteImportAsync(
        Stream baseFileStream,
        Stream officeFileStream,
        string? defaultPassword = null,
        Guid? actorUserId = null,
        string? actorUsername = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var parsedData = ParseExcelFiles(baseFileStream, officeFileStream);
            if (parsedData.IsFailure)
            {
                return Result.Failure<PersonnelImportResultDto>(parsedData.Error);
            }

            var (baseRecords, officeMappings, warnings) = parsedData.Value;

            using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            // 1. Synchronize Offices
            var existingOffices = await _context.Offices.ToListAsync(cancellationToken);
            var officeMapByCode = existingOffices.ToDictionary(
                o => NormalizePersian(o.Code),
                o => o,
                StringComparer.OrdinalIgnoreCase);

            var officeMapByName = existingOffices.ToDictionary(
                o => NormalizePersian(o.Name),
                o => o,
                StringComparer.OrdinalIgnoreCase);

            var officesCreated = 0;
            var uniqueOfficesInFile = officeMappings.Values
                .Where(v => !string.IsNullOrWhiteSpace(v))
                .Select(v => v.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            foreach (var rawOffice in uniqueOfficesInFile)
            {
                var normRaw = NormalizePersian(rawOffice);
                var stdCode = StandardizeOfficeCode(rawOffice);
                var stdName = StandardizeOfficeName(rawOffice);

                if (!officeMapByCode.ContainsKey(normRaw) &&
                    !officeMapByCode.ContainsKey(stdCode) &&
                    !officeMapByName.ContainsKey(normRaw) &&
                    !officeMapByName.ContainsKey(NormalizePersian(stdName)))
                {
                    var newOffice = Office.Create(stdCode, stdName, $"ایجاد خودکار از اکسل تخصیص اداره: {rawOffice}");
                    _context.Offices.Add(newOffice);
                    existingOffices.Add(newOffice);
                    officeMapByCode[normRaw] = newOffice;
                    officeMapByCode[stdCode] = newOffice;
                    officeMapByName[NormalizePersian(stdName)] = newOffice;
                    officesCreated++;
                }
            }

            if (officesCreated > 0)
            {
                await _context.SaveChangesAsync(cancellationToken);
            }

            // Function to resolve Office entity
            Office? ResolveOffice(string? rawOffice)
            {
                if (string.IsNullOrWhiteSpace(rawOffice)) return null;
                var norm = NormalizePersian(rawOffice);
                if (officeMapByCode.TryGetValue(norm, out var off1)) return off1;
                var stdCode = StandardizeOfficeCode(rawOffice);
                if (officeMapByCode.TryGetValue(stdCode, out var off2)) return off2;
                if (officeMapByName.TryGetValue(norm, out var off3)) return off3;
                var stdName = NormalizePersian(StandardizeOfficeName(rawOffice));
                if (officeMapByName.TryGetValue(stdName, out var off4)) return off4;
                return null;
            }

            // 2. Pre-hash passwords in parallel for all users that will be created
            var existingUsers = await _context.Users
                .Include(u => u.UserOffices)
                .ToListAsync(cancellationToken);

            var userMapByUsername = existingUsers.ToDictionary(
                u => u.Username.Trim().ToLowerInvariant(),
                u => u,
                StringComparer.OrdinalIgnoreCase);

            var userMapByEmployeeId = existingUsers
                .Where(u => u.EmployeeId.HasValue)
                .ToDictionary(
                    u => u.EmployeeId!.Value,
                    u => u);

            var existingEmployees = await _context.Employees.ToListAsync(cancellationToken);
            var empMapByPersonnel = existingEmployees.ToDictionary(
                e => e.PersonnelNumber.Trim(),
                e => e,
                StringComparer.OrdinalIgnoreCase);

            // Determine which items need new users and pre-compute password hashes
            string? singleStandardHash = null;
            if (!string.IsNullOrWhiteSpace(defaultPassword))
            {
                singleStandardHash = _passwordHasher.HashPassword(defaultPassword.Trim());
            }

            var passwordHashes = new ConcurrentDictionary<string, string>();
            var newPersonnelItems = baseRecords
                .Where(b => {
                    var targetU = (!string.IsNullOrWhiteSpace(b.NationalId) ? b.NationalId : b.PersonnelNumber).ToLowerInvariant();
                    return !userMapByUsername.ContainsKey(targetU);
                })
                .ToList();

            if (singleStandardHash != null)
            {
                foreach (var item in newPersonnelItems)
                {
                    var targetU = !string.IsNullOrWhiteSpace(item.NationalId) ? item.NationalId : item.PersonnelNumber;
                    passwordHashes[targetU] = singleStandardHash;
                }
            }
            else
            {
                // Parallelize password hashing (National ID as default temporary password)
                Parallel.ForEach(newPersonnelItems, item =>
                {
                    var targetU = !string.IsNullOrWhiteSpace(item.NationalId)
                        ? item.NationalId
                        : item.PersonnelNumber;
                    passwordHashes[targetU] = _passwordHasher.HashPassword(targetU);
                });
            }

            // 3. Upsert Employees & Users
            int employeesCreated = 0;
            int employeesUpdated = 0;
            int usersCreated = 0;
            int usersUpdated = 0;
            int userOfficesLinked = 0;
            var roleCounts = new Dictionary<string, int>();

            var newEmployees = new List<Employee>();
            var newUsers = new List<User>();
            var newUserOffices = new List<UserOffice>();

            foreach (var item in baseRecords)
            {
                officeMappings.TryGetValue(item.PersonnelNumber, out var officeName);
                var resolvedOffice = ResolveOffice(officeName);

                // Upsert Employee
                Employee employee;
                if (empMapByPersonnel.TryGetValue(item.PersonnelNumber, out var existingEmp))
                {
                    employee = existingEmp;
                    employee.UpdatePersonalInfo(item.FirstName, item.LastName, employee.Education, item.NationalId);
                    employee.UpdatePosition(item.Position, employee.AppointmentPosition, employee.PreviousExperienceYears);
                    if (!string.IsNullOrWhiteSpace(officeName))
                    {
                        employee.UpdateServiceUnit(officeName);
                    }
                    if (resolvedOffice != null)
                    {
                        employee.SetOffice(resolvedOffice.Id);
                    }
                    var statusDesc = $"نوع استخدام: {item.EmploymentType} | وضعیت: {item.EmploymentStatus}";
                    employee.UpdateStatusDescription(statusDesc);
                    employeesUpdated++;
                }
                else
                {
                    employee = Employee.Create(
                        personnelNumber: item.PersonnelNumber,
                        firstName: item.FirstName,
                        lastName: item.LastName,
                        education: string.Empty,
                        serviceUnit: officeName ?? string.Empty,
                        currentPosition: item.Position,
                        appointmentPosition: string.Empty,
                        previousExperienceYears: 0,
                        nationalId: item.NationalId
                    );
                    if (resolvedOffice != null)
                    {
                        employee.SetOffice(resolvedOffice.Id);
                    }
                    var statusDesc = $"نوع استخدام: {item.EmploymentType} | وضعیت: {item.EmploymentStatus}";
                    employee.UpdateStatusDescription(statusDesc);
                    _context.Employees.Add(employee);
                    empMapByPersonnel[item.PersonnelNumber] = employee;
                    newEmployees.Add(employee);
                    employeesCreated++;
                }

                // Track Role counts
                if (!roleCounts.ContainsKey(item.AssignedRole))
                    roleCounts[item.AssignedRole] = 0;
                roleCounts[item.AssignedRole]++;

                // Upsert User with National ID as Username
                var targetUsername = !string.IsNullOrWhiteSpace(item.NationalId)
                    ? item.NationalId.Trim()
                    : item.PersonnelNumber.Trim();
                var usernameLower = targetUsername.ToLowerInvariant();

                User user;
                if (userMapByUsername.TryGetValue(usernameLower, out var existingUser) ||
                    (employee.Id != Guid.Empty && userMapByEmployeeId.TryGetValue(employee.Id, out existingUser)) ||
                    userMapByUsername.TryGetValue(item.PersonnelNumber.ToLowerInvariant(), out existingUser))
                {
                    user = existingUser;
                    // Update details, ensuring username is the National ID
                    user.UpdateDetails(user.Email, item.AssignedRole, true, employee.Id, targetUsername);
                    usersUpdated++;
                }
                else
                {
                    var hash = passwordHashes.TryGetValue(targetUsername, out var h)
                        ? h
                        : _passwordHasher.HashPassword(targetUsername);

                    user = User.Create(
                        username: targetUsername,
                        email: null,
                        passwordHash: hash,
                        role: item.AssignedRole,
                        employeeId: employee.Id
                    );
                    user.RequirePasswordChange();
                    _context.Users.Add(user);
                    userMapByUsername[usernameLower] = user;
                    userMapByEmployeeId[employee.Id] = user;
                    newUsers.Add(user);
                    usersCreated++;
                }

                // Associate Employee with User
                employee.AssociateWithUser(user.Id);

                // UserOffice association
                if (resolvedOffice != null)
                {
                    bool alreadyAssigned = user.UserOffices.Any(uo => uo.OfficeId == resolvedOffice.Id);
                    if (!alreadyAssigned)
                    {
                        var uo = UserOffice.Create(user.Id, resolvedOffice.Id);
                        _context.UserOffices.Add(uo);
                        user.UserOffices.Add(uo);
                        userOfficesLinked++;
                    }
                }
            }

            // Save all entities
            await _context.SaveChangesAsync(cancellationToken);

            // Audit Log Entry
            try
            {
                var auditLog = AuditLog.Create(
                    userId: actorUserId,
                    username: actorUsername ?? "Admin",
                    action: "Imported",
                    entityName: "PersonnelImport",
                    entityId: Guid.NewGuid().ToString(),
                    oldValues: null,
                    newValues: JsonSerializer.Serialize(new
                    {
                        totalProcessed = baseRecords.Count,
                        officesCreated,
                        employeesCreated,
                        employeesUpdated,
                        usersCreated,
                        usersUpdated,
                        userOfficesLinked,
                        roleCounts
                    }),
                    affectedColumns: "Employees,Users,Offices,UserOffices",
                    ipAddress: ipAddress,
                    userAgent: userAgent
                );
                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception auditEx)
            {
                _logger.LogWarning(auditEx, "Failed to write audit log entry for personnel import");
            }

            await transaction.CommitAsync(cancellationToken);

            var result = new PersonnelImportResultDto
            {
                Success = true,
                Message = $"اطلاعات پرسنل و کاربران با موفقیت همگام‌سازی شد ({baseRecords.Count} رکورد پردازش گردید).",
                TotalProcessed = baseRecords.Count,
                OfficesCreated = officesCreated,
                EmployeesCreated = employeesCreated,
                EmployeesUpdated = employeesUpdated,
                UsersCreated = usersCreated,
                UsersUpdated = usersUpdated,
                UserOfficesLinked = userOfficesLinked,
                RoleBreakdown = roleCounts,
                ProcessedAt = DateTime.UtcNow,
                Warnings = warnings
            };

            return Result.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing personnel import from Excel");
            return Result.Failure<PersonnelImportResultDto>($"خطا در ثبت و همگام‌سازی پرسنل و کاربران: {ex.Message}");
        }
    }

    #region Parsing & Normalization Helpers

    private static Result<(List<PersonnelImportItemDto> BaseRecords, Dictionary<string, string> OfficeMappings, List<string> Warnings)>
        ParseExcelFiles(Stream baseFileStream, Stream officeFileStream)
    {
        var warnings = new List<string>();

        // 1. Read Office Mapping File
        var officeMappings = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        using (var officePackage = new ExcelPackage(officeFileStream))
        {
            var sheet = officePackage.Workbook.Worksheets.FirstOrDefault();
            if (sheet == null || sheet.Dimension == null)
            {
                return Result.Failure<(List<PersonnelImportItemDto>, Dictionary<string, string>, List<string>)>(
                    "فایل تخصیص اداره خالی است یا برگه‌ای در آن یافت نشد.");
            }

            int personnelCol = -1;
            int officeCol = -1;

            for (int col = 1; col <= sheet.Dimension.End.Column; col++)
            {
                var h = NormalizeHeader(sheet.Cells[1, col].Text);
                if (h.Contains("شمارهکارمند") || h.Contains("کدپرسنلی") || h.Contains("شمارهپرسنلی"))
                    personnelCol = col;
                else if (h.Contains("اداره") || h.Contains("واحد") || h.Contains("محلخدمت"))
                    officeCol = col;
            }

            if (personnelCol == -1 || officeCol == -1)
            {
                // Fallback by column position: Col 1 = Personnel Number, Col 2 = Office
                personnelCol = 1;
                officeCol = 2;
            }

            for (int row = 2; row <= sheet.Dimension.End.Row; row++)
            {
                var rawPersonnel = sheet.Cells[row, personnelCol].Text;
                var rawOffice = sheet.Cells[row, officeCol].Text;

                var personnelNo = CleanPersonnelNumber(rawPersonnel);
                if (!string.IsNullOrWhiteSpace(personnelNo))
                {
                    officeMappings[personnelNo] = rawOffice?.Trim() ?? string.Empty;
                }
            }
        }

        // 2. Read Base Welfare File
        var baseRecords = new List<PersonnelImportItemDto>();
        using (var basePackage = new ExcelPackage(baseFileStream))
        {
            var sheet = basePackage.Workbook.Worksheets.FirstOrDefault();
            if (sheet == null || sheet.Dimension == null)
            {
                return Result.Failure<(List<PersonnelImportItemDto>, Dictionary<string, string>, List<string>)>(
                    "فایل پایه رفاهی خالی است یا برگه‌ای در آن یافت نشد.");
            }

            int personnelCol = -1;
            int nameCol = -1;
            int firstNameCol = -1;
            int lastNameCol = -1;
            int employmentTypeCol = -1;
            int employmentStatusCol = -1;
            int positionCol = -1;
            int nationalIdCol = -1;

            for (int col = 1; col <= sheet.Dimension.End.Column; col++)
            {
                var h = NormalizeHeader(sheet.Cells[1, col].Text);
                if (h.Contains("شمارهکارمند") || h.Contains("کدپرسنلی"))
                    personnelCol = col;
                else if (h.Contains("نامکارمند") || h.Contains("ناموخانوادگی"))
                    nameCol = col;
                else if (h == "نام")
                    firstNameCol = col;
                else if (h.Contains("نامخانوادگی") || h.Contains("فامیلی"))
                    lastNameCol = col;
                else if (h.Contains("نوعاستخدام"))
                    employmentTypeCol = col;
                else if (h.Contains("وضعیتاشتغال"))
                    employmentStatusCol = col;
                else if (h.Contains("پست") || h.Contains("سمت"))
                    positionCol = col;
                else if (h.Contains("شمارهملی") || h.Contains("کدملی"))
                    nationalIdCol = col;
            }

            if (personnelCol == -1)
            {
                return Result.Failure<(List<PersonnelImportItemDto>, Dictionary<string, string>, List<string>)>(
                    "ستون شماره کارمند در فایل پایه یافت نشد.");
            }

            for (int row = 2; row <= sheet.Dimension.End.Row; row++)
            {
                var rawPersonnel = sheet.Cells[row, personnelCol].Text;
                var personnelNo = CleanPersonnelNumber(rawPersonnel);
                if (string.IsNullOrWhiteSpace(personnelNo)) continue;

                var rawName = nameCol != -1 ? sheet.Cells[row, nameCol].Text : string.Empty;
                var rawFirst = firstNameCol != -1 ? sheet.Cells[row, firstNameCol].Text : string.Empty;
                var rawLast = lastNameCol != -1 ? sheet.Cells[row, lastNameCol].Text : string.Empty;
                var rawEmpType = employmentTypeCol != -1 ? sheet.Cells[row, employmentTypeCol].Text : string.Empty;
                var rawEmpStatus = employmentStatusCol != -1 ? sheet.Cells[row, employmentStatusCol].Text : string.Empty;
                var rawPosition = positionCol != -1 ? sheet.Cells[row, positionCol].Text : string.Empty;
                var rawNationalId = nationalIdCol != -1 ? sheet.Cells[row, nationalIdCol].Text : string.Empty;

                var (first, last, full) = ParseName(rawName, rawFirst, rawLast);
                var nationalId = CleanNationalId(rawNationalId);
                var role = InferRole(rawPosition);
                var roleLabelFa = GetRoleLabelFa(role);

                var item = new PersonnelImportItemDto
                {
                    PersonnelNumber = personnelNo,
                    FirstName = first,
                    LastName = last,
                    FullName = full,
                    NationalId = nationalId,
                    EmploymentType = NormalizePersian(rawEmpType),
                    EmploymentStatus = NormalizePersian(rawEmpStatus),
                    Position = NormalizePersian(rawPosition),
                    AssignedRole = role,
                    RoleLabelFa = roleLabelFa
                };

                baseRecords.Add(item);
            }
        }

        return Result.Success((baseRecords, officeMappings, warnings));
    }

    private static string NormalizeHeader(string header)
    {
        if (string.IsNullOrWhiteSpace(header)) return string.Empty;
        return NormalizePersian(header).Replace(" ", "").Replace("\t", "").Replace("\r", "").Replace("\n", "");
    }

    private static string NormalizePersian(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        return text.Trim()
            .Replace('ي', 'ی')
            .Replace('ك', 'ک')
            .Replace('ة', 'ه')
            .Replace('\u200c', ' ') // replace ZWNJ with space for uniform matching
            .Trim();
    }

    private static string CleanPersonnelNumber(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var s = raw.Trim();
        if (s.EndsWith(".0", StringComparison.OrdinalIgnoreCase))
            s = s[..^2];
        return Regex.Replace(s, @"[^\d]", "").Trim();
    }

    private static string CleanNationalId(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var s = raw.Trim();
        if (s.EndsWith(".0", StringComparison.OrdinalIgnoreCase))
            s = s[..^2];
        s = Regex.Replace(s, @"[^\d]", "").Trim();
        if (s.Length > 0 && s.Length < 10)
        {
            s = s.PadLeft(10, '0');
        }
        return s;
    }

    private static (string FirstName, string LastName, string FullName) ParseName(
        string? combinedName,
        string? separateFirst,
        string? separateLast)
    {
        if (!string.IsNullOrWhiteSpace(separateFirst) && !string.IsNullOrWhiteSpace(separateLast))
        {
            var f = NormalizePersian(separateFirst);
            var l = NormalizePersian(separateLast);
            return (f, l, $"{f} {l}".Trim());
        }

        if (string.IsNullOrWhiteSpace(combinedName))
        {
            return ("-", "-", "-");
        }

        var normalized = NormalizePersian(combinedName);
        var parts = normalized.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length == 1)
        {
            return ("-", parts[0], parts[0]);
        }

        // Check if last word is preceded by religious honorifics (سید, سیده, میر, حاج, حاجی)
        var prefixes = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "سید", "سیده", "میر", "حاج", "حاجی" };

        if (parts.Length >= 3 && prefixes.Contains(parts[^2]))
        {
            var firstName = $"{parts[^2]} {parts[^1]}";
            var lastName = string.Join(' ', parts[..^2]);
            return (firstName, lastName, $"{firstName} {lastName}".Trim());
        }
        else
        {
            var firstName = parts[^1];
            var lastName = string.Join(' ', parts[..^1]);
            return (firstName, lastName, $"{firstName} {lastName}".Trim());
        }
    }

    public static string InferRole(string? position)
    {
        if (string.IsNullOrWhiteSpace(position))
            return "Employee";

        var pos = NormalizePersian(position);

        if (pos.Contains("رییس امور") || pos.Contains("رئیس امور") ||
            pos.Contains("معاون حسابرسی") || pos.Contains("معاون مدیر") ||
            pos.Contains("مدیر کل") || pos.Contains("مدیرکل"))
        {
            return "OfficeHead";
        }

        if (pos.Contains("رییس گروه") || pos.Contains("رئیس گروه"))
        {
            return "GroupHead";
        }

        if (pos.Contains("حسابرس") || pos.Contains("ممیز") || pos.Contains("دادیار"))
        {
            return "Expert";
        }

        if (pos.Contains("فناوری") || pos.Contains("نرم افزار") || pos.Contains("سخت افزار") || pos.Contains("شبکه"))
        {
            return "ITSpecialist";
        }

        if (pos.Contains("مدیر"))
        {
            return "Manager";
        }

        return "Employee";
    }

    public static string GetRoleLabelFa(string role)
    {
        return role switch
        {
            "Admin" => "مدیر ارشد",
            "OfficeHead" => "رئیس اداره",
            "GroupHead" => "رئیس گروه مالیاتی",
            "Expert" => "کارشناس (ممیز)",
            "ITSpecialist" => "کارشناس فناوری",
            "Manager" => "مدیر",
            _ => "کارمند"
        };
    }

    public static string StandardizeOfficeCode(string rawOffice)
    {
        var norm = NormalizePersian(rawOffice);
        if (int.TryParse(norm, out var num))
        {
            if (norm.Length == 4) return norm + "00";
            return norm;
        }
        return norm;
    }

    public static string StandardizeOfficeName(string rawOffice)
    {
        var norm = NormalizePersian(rawOffice);
        if (int.TryParse(norm, out _))
        {
            return $"اداره امور مالیاتی {norm}";
        }
        if (norm.StartsWith("اداره"))
        {
            return norm;
        }
        return $"اداره امور مالیاتی {norm}";
    }

    #endregion
}
