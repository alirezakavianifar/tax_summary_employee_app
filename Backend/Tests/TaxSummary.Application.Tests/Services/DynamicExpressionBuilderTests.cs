using TaxSummary.Application.DTOs.Reporting;
using TaxSummary.Application.Services.Reporting;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class DynamicExpressionBuilderTests
{
    private class TestEmployeeItem
    {
        public string PersonnelNumber { get; set; } = string.Empty;
        public decimal OvertimeHours { get; set; }
        public decimal TotalAmount { get; set; }
        public bool IsLaborPosition { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
    }

    private static readonly Dictionary<string, string> WhitelistMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "PersonnelNumber", "string" },
        { "OvertimeHours", "number" },
        { "TotalAmount", "currency" },
        { "IsLaborPosition", "bool" },
        { "DepartmentName", "string" }
    };

    [Fact]
    public void BuildFilterPredicate_NumericGreaterThan_FiltersCorrectly()
    {
        // Arrange
        var filters = new List<DynamicFilterConditionDto>
        {
            new() { FieldName = "OvertimeHours", Operator = "greaterthan", Value = "100" }
        };

        var items = new List<TestEmployeeItem>
        {
            new() { PersonnelNumber = "101", OvertimeHours = 50 },
            new() { PersonnelNumber = "102", OvertimeHours = 120 },
            new() { PersonnelNumber = "103", OvertimeHours = 100 },
            new() { PersonnelNumber = "104", OvertimeHours = 101 }
        }.AsQueryable();

        // Act
        var predicate = DynamicExpressionBuilder.BuildFilterPredicate<TestEmployeeItem>(filters, WhitelistMap);
        var result = items.Where(predicate).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, item => Assert.True(item.OvertimeHours > 100));
        Assert.Contains(result, r => r.PersonnelNumber == "102");
        Assert.Contains(result, r => r.PersonnelNumber == "104");
    }

    [Fact]
    public void BuildFilterPredicate_NonWhitelistedField_IsSafelyIgnored()
    {
        // Arrange: Try to inject unapproved field e.g. "PasswordHash" or "SecretRole"
        var filters = new List<DynamicFilterConditionDto>
        {
            new() { FieldName = "PasswordHash", Operator = "equals", Value = "secret" },
            new() { FieldName = "OvertimeHours", Operator = "greaterthan", Value = "50" }
        };

        var items = new List<TestEmployeeItem>
        {
            new() { PersonnelNumber = "101", OvertimeHours = 30 },
            new() { PersonnelNumber = "102", OvertimeHours = 80 }
        }.AsQueryable();

        // Act
        var predicate = DynamicExpressionBuilder.BuildFilterPredicate<TestEmployeeItem>(filters, WhitelistMap);
        var result = items.Where(predicate).ToList();

        // Assert: Unapproved field ignored, only OvertimeHours > 50 evaluated
        Assert.Single(result);
        Assert.Equal("102", result[0].PersonnelNumber);
    }

    [Fact]
    public void BuildFilterPredicate_StringContainsAndEquals_FiltersProperly()
    {
        // Arrange
        var filters = new List<DynamicFilterConditionDto>
        {
            new() { FieldName = "DepartmentName", Operator = "contains", Value = "مالی" }
        };

        var items = new List<TestEmployeeItem>
        {
            new() { PersonnelNumber = "101", DepartmentName = "امور مالی و حسابداری" },
            new() { PersonnelNumber = "102", DepartmentName = "فناوری اطلاعات" },
            new() { PersonnelNumber = "103", DepartmentName = "حقوقی و دادرسی مالیاتی" }
        }.AsQueryable();

        // Act
        var predicate = DynamicExpressionBuilder.BuildFilterPredicate<TestEmployeeItem>(filters, WhitelistMap);
        var result = items.Where(predicate).ToList();

        // Assert
        Assert.Equal(2, result.Count);
        Assert.Contains(result, r => r.PersonnelNumber == "101");
        Assert.Contains(result, r => r.PersonnelNumber == "103");
    }

    [Fact]
    public void BuildFilterPredicate_EmptyFilters_ReturnsAllRecords()
    {
        // Arrange
        var items = new List<TestEmployeeItem>
        {
            new() { PersonnelNumber = "101" },
            new() { PersonnelNumber = "102" }
        }.AsQueryable();

        // Act
        var predicate = DynamicExpressionBuilder.BuildFilterPredicate<TestEmployeeItem>(new List<DynamicFilterConditionDto>(), WhitelistMap);
        var result = items.Where(predicate).ToList();

        // Assert
        Assert.Equal(2, result.Count);
    }
}
