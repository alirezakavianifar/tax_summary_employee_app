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
}
