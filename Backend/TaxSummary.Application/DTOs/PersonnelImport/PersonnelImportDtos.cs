using System;
using System.Collections.Generic;

namespace TaxSummary.Application.DTOs.PersonnelImport;

/// <summary>
/// DTO representing a single preview item during Excel personnel import
/// </summary>
public class PersonnelImportItemDto
{
    public string PersonnelNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = string.Empty;
    public string EmploymentStatus { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string AssignedRole { get; set; } = string.Empty;
    public string RoleLabelFa { get; set; } = string.Empty;
    public string OfficeCode { get; set; } = string.Empty;
    public string OfficeName { get; set; } = string.Empty;
    public bool IsExistingEmployee { get; set; }
    public bool IsExistingUser { get; set; }
}

/// <summary>
/// DTO for previewing the outcome of the two Excel files before committing to database
/// </summary>
public class PersonnelImportPreviewDto
{
    public int TotalBaseRecords { get; set; }
    public int TotalOfficeRecords { get; set; }
    public int MatchedRecords { get; set; }
    public int UnmatchedRecords { get; set; }

    public int NewOfficesCount { get; set; }
    public int ExistingOfficesCount { get; set; }

    public int NewEmployeesCount { get; set; }
    public int UpdatedEmployeesCount { get; set; }

    public int NewUsersCount { get; set; }
    public int UpdatedUsersCount { get; set; }

    public Dictionary<string, int> RoleBreakdown { get; set; } = new();
    public List<PersonnelImportItemDto> SamplePreview { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public List<string> Errors { get; set; } = new();
}

/// <summary>
/// DTO returned after actual execution of personnel and user import
/// </summary>
public class PersonnelImportResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int TotalProcessed { get; set; }
    public int OfficesCreated { get; set; }
    public int EmployeesCreated { get; set; }
    public int EmployeesUpdated { get; set; }
    public int UsersCreated { get; set; }
    public int UsersUpdated { get; set; }
    public int UserOfficesLinked { get; set; }
    public Dictionary<string, int> RoleBreakdown { get; set; } = new();
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
    public List<string> Warnings { get; set; } = new();
}
