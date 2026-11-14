namespace TaxSummary.Application.DTOs.Branding;

public class SystemSettingsDto
{
    public Guid Id { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string SystemTitle { get; set; } = string.Empty;
    public string LogoPath { get; set; } = string.Empty;
    public string ReportingModuleTitle { get; set; } = string.Empty;
    public string ReportingModuleSubtitle { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public class UpdateSystemSettingsDto
{
    public string OrganizationName { get; set; } = string.Empty;
    public string SystemTitle { get; set; } = string.Empty;
    public string? LogoPath { get; set; }
    public string ReportingModuleTitle { get; set; } = string.Empty;
    public string ReportingModuleSubtitle { get; set; } = string.Empty;
}

