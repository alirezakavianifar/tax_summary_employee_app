using AutoMapper;
using FluentAssertions;
using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Mapping;
using TaxSummary.Application.Validators.Reporting;
using TaxSummary.Domain.Enums;
using Xunit;

namespace TaxSummary.Application.Tests.Validators;

public class ReportingValidatorTests
{
    // ==========================================
    // 1. AutoMapper Configuration Validation
    // ==========================================

    [Fact]
    public void AutoMapper_Configuration_IsValid()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<ReportingMappingProfile>());
        config.AssertConfigurationIsValid();
    }

    // ==========================================
    // 2. ReportFilterParametersValidator Tests
    // ==========================================

    [Fact]
    public void ReportFilterParametersValidator_RejectsInvalidShamsiDates()
    {
        var validator = new ReportFilterParametersValidator();
        var invalidParams = new ReportFilterParametersDto
        {
            ShamsiDateFrom = "1404-07-01", // Hyphen instead of slash
            PageNumber = 1,
            PageSize = 50
        };

        var result = validator.Validate(invalidParams);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("فرمت تاریخ"));
    }

    [Fact]
    public void ReportFilterParametersValidator_AcceptsValidShamsiDates()
    {
        var validator = new ReportFilterParametersValidator();
        var validParams = new ReportFilterParametersDto
        {
            ShamsiDateFrom = "1404/07/01",
            ShamsiDateTo = "1404/07/30",
            PageNumber = 1,
            PageSize = 50
        };

        var result = validator.Validate(validParams);

        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(0, 50)]
    [InlineData(-1, 50)]
    public void ReportFilterParametersValidator_RejectsInvalidPageNumber(int pageNumber, int pageSize)
    {
        var validator = new ReportFilterParametersValidator();
        var invalidParams = new ReportFilterParametersDto
        {
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = validator.Validate(invalidParams);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ReportFilterParametersDto.PageNumber));
    }

    [Theory]
    [InlineData(1, 0)]
    [InlineData(1, 201)]
    public void ReportFilterParametersValidator_RejectsInvalidPageSize(int pageNumber, int pageSize)
    {
        var validator = new ReportFilterParametersValidator();
        var invalidParams = new ReportFilterParametersDto
        {
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        var result = validator.Validate(invalidParams);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(ReportFilterParametersDto.PageSize));
    }

    // ==========================================
    // 3. DynamicReportQueryRequestValidator Tests
    // ==========================================

    [Fact]
    public void DynamicReportQueryRequestValidator_RejectsEmptySelectedFields()
    {
        var validator = new DynamicReportQueryRequestValidator();
        var request = new DynamicReportQueryRequestDto
        {
            DomainSource = ReportDomainSource.PayrollAndWelfare,
            SelectedFields = new List<string>(), // Empty
            PageNumber = 1,
            PageSize = 50
        };

        var result = validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("حداقل یک ستون"));
    }

    [Fact]
    public void DynamicReportQueryRequestValidator_RejectsMoreThan30SelectedFields()
    {
        var validator = new DynamicReportQueryRequestValidator();
        var fields = Enumerable.Range(1, 31).Select(i => $"Field_{i}").ToList();
        var request = new DynamicReportQueryRequestDto
        {
            DomainSource = ReportDomainSource.PayrollAndWelfare,
            SelectedFields = fields,
            PageNumber = 1,
            PageSize = 50
        };

        var result = validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("حداکثر ۳۰ ستون"));
    }

    [Fact]
    public void DynamicReportQueryRequestValidator_RejectsEmptyFilterProperties()
    {
        var validator = new DynamicReportQueryRequestValidator();
        var request = new DynamicReportQueryRequestDto
        {
            DomainSource = ReportDomainSource.PayrollAndWelfare,
            SelectedFields = new List<string> { "Field1" },
            Filters = new List<DynamicFilterConditionDto>
            {
                new DynamicFilterConditionDto { FieldName = "", Operator = "equals", Value = "test" },
                new DynamicFilterConditionDto { FieldName = "Field2", Operator = "", Value = "test" }
            },
            PageNumber = 1,
            PageSize = 50
        };

        var result = validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().HaveCountGreaterOrEqualTo(2);
    }

    [Fact]
    public void DynamicReportQueryRequestValidator_AcceptsValidQuery()
    {
        var validator = new DynamicReportQueryRequestValidator();
        var request = new DynamicReportQueryRequestDto
        {
            DomainSource = ReportDomainSource.PayrollAndWelfare,
            SelectedFields = new List<string> { "EmployeeName", "OvertimeHours" },
            Filters = new List<DynamicFilterConditionDto>
            {
                new DynamicFilterConditionDto { FieldName = "OvertimeHours", Operator = "greater_than", Value = "120" }
            },
            PageNumber = 1,
            PageSize = 100
        };

        var result = validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    // ==========================================
    // 4. SaveReportPresetRequestValidator Tests
    // ==========================================

    [Fact]
    public void SaveReportPresetRequestValidator_RejectsEmptyReportDefinitionId()
    {
        var validator = new SaveReportPresetRequestValidator();
        var request = new SaveReportPresetRequestDto
        {
            ReportDefinitionId = Guid.Empty,
            PresetName = "الگو",
            FilterCriteriaJson = "{}"
        };

        var result = validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(SaveReportPresetRequestDto.ReportDefinitionId));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void SaveReportPresetRequestValidator_RejectsEmptyPresetName(string? name)
    {
        var validator = new SaveReportPresetRequestValidator();
        var request = new SaveReportPresetRequestDto
        {
            ReportDefinitionId = Guid.NewGuid(),
            PresetName = name!,
            FilterCriteriaJson = "{}"
        };

        var result = validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == nameof(SaveReportPresetRequestDto.PresetName));
    }

    [Fact]
    public void SaveReportPresetRequestValidator_RejectsInvalidJsonCriteria()
    {
        var validator = new SaveReportPresetRequestValidator();
        var request = new SaveReportPresetRequestDto
        {
            ReportDefinitionId = Guid.NewGuid(),
            PresetName = "الگوی آزمایشی",
            FilterCriteriaJson = "NOT_A_VALID_JSON_STRING"
        };

        var result = validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("معتبر نمی‌باشد"));
    }

    [Fact]
    public void SaveReportPresetRequestValidator_AcceptsValidPreset()
    {
        var validator = new SaveReportPresetRequestValidator();
        var request = new SaveReportPresetRequestDto
        {
            ReportDefinitionId = Guid.NewGuid(),
            PresetName = "الگوی استاندارد فروردین",
            FilterCriteriaJson = "{\"fiscalYear\": 1404, \"department\": \"مالی\"}",
            VisibleColumnsJson = "[\"col1\", \"col2\"]",
            IsSharedWithOffice = true
        };

        var result = validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }
}
