using FluentAssertions;
using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Domain.Tests.Entities;

public class PerformanceCapabilityTests
{
    [Fact]
    public void Create_ValidData_CreatesCapability()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var systemRole = "معاون مالیاتی";

        // Act
        var capability = PerformanceCapability.Create(
            employeeId: employeeId,
            systemRole: systemRole,
            detectionOfTaxIssues: true,
            detectionOfTaxEvasion: true,
            companyIdentification: false,
            valueAddedRecognition: true,
            referredOrExecuted: true
        );

        // Assert
        capability.Should().NotBeNull();
        capability.Id.Should().NotBeEmpty();
        capability.EmployeeId.Should().Be(employeeId);
        capability.SystemRole.Should().Be(systemRole);
        capability.DetectionOfTaxIssues.Should().BeTrue();
        capability.DetectionOfTaxEvasion.Should().BeTrue();
        capability.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void Create_EmptySystemRole_ThrowsArgumentException()
    {
        // Act
        var act = () => PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "",
            detectionOfTaxIssues: false,
            detectionOfTaxEvasion: false,
            companyIdentification: false,
            valueAddedRecognition: false,
            referredOrExecuted: false
        );

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*System role cannot be empty*");
    }

    [Fact]
    public void UpdateCapabilities_ValidData_UpdatesSuccessfully()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssues: false,
            detectionOfTaxEvasion: false,
            companyIdentification: false,
            valueAddedRecognition: false,
            referredOrExecuted: false
        );

        // Act
        capability.UpdateCapabilities(
            detectionOfTaxIssues: true,
            detectionOfTaxEvasion: true,
            companyIdentification: true,
            valueAddedRecognition: true,
            referredOrExecuted: true
        );

        // Assert
        capability.DetectionOfTaxIssues.Should().BeTrue();
        capability.DetectionOfTaxEvasion.Should().BeTrue();
        capability.CompanyIdentification.Should().BeTrue();
        capability.ValueAddedRecognition.Should().BeTrue();
        capability.ReferredOrExecuted.Should().BeTrue();
        capability.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void GetCapabilityScore_AllCapabilitiesEnabled_ReturnsMaxScore()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssues: true,
            detectionOfTaxEvasion: true,
            companyIdentification: true,
            valueAddedRecognition: true,
            referredOrExecuted: true
        );

        // Act
        var score = capability.GetCapabilityScore();

        // Assert
        score.Should().Be(100); // 20 + 25 + 20 + 20 + 15
    }

    [Fact]
    public void GetCapabilityScore_NoCapabilitiesEnabled_ReturnsZero()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssues: false,
            detectionOfTaxEvasion: false,
            companyIdentification: false,
            valueAddedRecognition: false,
            referredOrExecuted: false
        );

        // Act
        var score = capability.GetCapabilityScore();

        // Assert
        score.Should().Be(0);
    }

    [Fact]
    public void GetCapabilityScore_PartialCapabilities_ReturnsCorrectScore()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssues: true,      // 20
            detectionOfTaxEvasion: true,     // 25
            companyIdentification: false,    // 0
            valueAddedRecognition: false,    // 0
            referredOrExecuted: false        // 0
        );

        // Act
        var score = capability.GetCapabilityScore();

        // Assert
        score.Should().Be(45); // 20 + 25
    }

    [Fact]
    public void HasAnyCapability_WithCapabilities_ReturnsTrue()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssues: true
        );

        // Act
        var hasAny = capability.HasAnyCapability();

        // Assert
        hasAny.Should().BeTrue();
    }

    [Fact]
    public void HasAnyCapability_NoCapabilities_ReturnsFalse()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssues: false,
            detectionOfTaxEvasion: false,
            companyIdentification: false,
            valueAddedRecognition: false,
            referredOrExecuted: false
        );

        // Act
        var hasAny = capability.HasAnyCapability();

        // Assert
        hasAny.Should().BeFalse();
    }

    [Fact]
    public void GetActiveCapabilities_ReturnsCorrectList()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssues: true,
            detectionOfTaxEvasion: true,
            companyIdentification: false,
            valueAddedRecognition: false,
            referredOrExecuted: false
        );

        // Act
        var activeCapabilities = capability.GetActiveCapabilities().ToList();

        // Assert
        activeCapabilities.Should().HaveCount(2);
        activeCapabilities.Should().Contain("Detection of Tax Issues");
        activeCapabilities.Should().Contain("Detection of Tax Evasion");
    }

    [Fact]
    public void Create_WithQuantityAndAmount_CreatesCapabilityWithMetrics()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var systemRole = "معاون مالیاتی";

        // Act
        var capability = PerformanceCapability.Create(
            employeeId: employeeId,
            systemRole: systemRole,
            detectionOfTaxIssues: true,
            detectionOfTaxEvasion: true,
            companyIdentification: false,
            valueAddedRecognition: true,
            referredOrExecuted: true,
            detectionOfTaxIssuesQuantity: 15,
            detectionOfTaxIssuesAmount: 250000000,
            detectionOfTaxEvasionQuantity: 8,
            detectionOfTaxEvasionAmount: 180000000
        );

        // Assert
        capability.Should().NotBeNull();
        capability.DetectionOfTaxIssues_Quantity.Should().Be(15);
        capability.DetectionOfTaxIssues_Amount.Should().Be(250000000);
        capability.DetectionOfTaxEvasion_Quantity.Should().Be(8);
        capability.DetectionOfTaxEvasion_Amount.Should().Be(180000000);
    }

    [Fact]
    public void Create_WithQuantityButNoBoolean_AutoSetsBooleanToTrue()
    {
        // Arrange
        var employeeId = Guid.NewGuid();

        // Act
        var capability = PerformanceCapability.Create(
            employeeId: employeeId,
            systemRole: "معاون",
            detectionOfTaxIssues: false,
            detectionOfTaxIssuesQuantity: 10
        );

        // Assert
        capability.DetectionOfTaxIssues.Should().BeTrue();
        capability.DetectionOfTaxIssues_Quantity.Should().Be(10);
    }

    [Fact]
    public void Create_NegativeQuantity_ThrowsArgumentException()
    {
        // Act
        var act = () => PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssuesQuantity: -5
        );

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Quantity cannot be negative*");
    }

    [Fact]
    public void Create_NegativeAmount_ThrowsArgumentException()
    {
        // Act
        var act = () => PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssuesAmount: -1000
        );

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Amount cannot be negative*");
    }

    [Fact]
    public void GetTotalAmount_MultipleCapabilities_ReturnsSumOfAmounts()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssuesAmount: 100000,
            detectionOfTaxEvasionAmount: 200000,
            companyIdentificationAmount: 300000
        );

        // Act
        var totalAmount = capability.GetTotalAmount();

        // Assert
        totalAmount.Should().Be(600000);
    }

    [Fact]
    public void GetTotalQuantity_MultipleCapabilities_ReturnsSumOfQuantities()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssuesQuantity: 5,
            detectionOfTaxEvasionQuantity: 10,
            companyIdentificationQuantity: 15
        );

        // Act
        var totalQuantity = capability.GetTotalQuantity();

        // Assert
        totalQuantity.Should().Be(30);
    }

    [Fact]
    public void HasAnyMetrics_WithQuantity_ReturnsTrue()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssuesQuantity: 5
        );

        // Act
        var hasMetrics = capability.HasAnyMetrics();

        // Assert
        hasMetrics.Should().BeTrue();
    }

    [Fact]
    public void HasAnyMetrics_WithAmount_ReturnsTrue()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون",
            detectionOfTaxIssuesAmount: 1000
        );

        // Act
        var hasMetrics = capability.HasAnyMetrics();

        // Assert
        hasMetrics.Should().BeTrue();
    }

    [Fact]
    public void HasAnyMetrics_NoQuantityOrAmount_ReturnsFalse()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون"
        );

        // Act
        var hasMetrics = capability.HasAnyMetrics();

        // Assert
        hasMetrics.Should().BeFalse();
    }

    [Fact]
    public void UpdateAllCapabilityMetrics_ValidData_UpdatesSuccessfully()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون"
        );

        // Act
        capability.UpdateAllCapabilityMetrics(
            detectionOfTaxIssuesQuantity: 10,
            detectionOfTaxIssuesAmount: 100000,
            detectionOfTaxEvasionQuantity: 5,
            detectionOfTaxEvasionAmount: 50000,
            companyIdentificationQuantity: 3,
            companyIdentificationAmount: 30000,
            valueAddedRecognitionQuantity: 8,
            valueAddedRecognitionAmount: 80000,
            referredOrExecutedQuantity: 2,
            referredOrExecutedAmount: 20000
        );

        // Assert
        capability.DetectionOfTaxIssues_Quantity.Should().Be(10);
        capability.DetectionOfTaxIssues_Amount.Should().Be(100000);
        capability.DetectionOfTaxIssues.Should().BeTrue(); // Auto-set from quantity
        capability.GetTotalQuantity().Should().Be(28);
        capability.GetTotalAmount().Should().Be(280000);
    }

    [Fact]
    public void UpdateCapabilityMetric_ValidData_UpdatesSpecificMetric()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون"
        );

        // Act
        capability.UpdateCapabilityMetric("detectionoftaxissues", 15, 150000);

        // Assert
        capability.DetectionOfTaxIssues_Quantity.Should().Be(15);
        capability.DetectionOfTaxIssues_Amount.Should().Be(150000);
        capability.DetectionOfTaxIssues.Should().BeTrue();
    }

    [Fact]
    public void UpdateCapabilityMetric_UnknownType_ThrowsArgumentException()
    {
        // Arrange
        var capability = PerformanceCapability.Create(
            employeeId: Guid.NewGuid(),
            systemRole: "معاون"
        );

        // Act
        var act = () => capability.UpdateCapabilityMetric("unknownType", 10, 1000);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Unknown capability type*");
    }
}
