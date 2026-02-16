using FluentAssertions;
using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Domain.Tests.Entities;

public class AdministrativeStatusTests
{
    [Fact]
    public void Create_ValidData_CreatesAdministrativeStatus()
    {
        // Arrange
        var employeeId = Guid.NewGuid();
        var missionDays = 10;
        var overtimeHours = 20;

        // Act
        var status = AdministrativeStatus.Create(
            employeeId: employeeId,
            missionDays: missionDays,
            sickLeaveDays: 2,
            paidLeaveDays: 5,
            overtimeHours: overtimeHours,
            delayAndAbsenceHours: 5,
            hourlyLeaveHours: 8
        );

        // Assert
        status.Should().NotBeNull();
        status.Id.Should().NotBeEmpty();
        status.EmployeeId.Should().Be(employeeId);
        status.MissionDays.Should().Be(missionDays);
        status.OvertimeHours.Should().Be(overtimeHours);
        status.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void Create_NegativeMissionDays_ThrowsException()
    {
        // Act
        var act = () => AdministrativeStatus.Create(
            employeeId: Guid.NewGuid(),
            missionDays: -5,
            sickLeaveDays: 0,
            paidLeaveDays: 0,
            overtimeHours: 0,
            delayAndAbsenceHours: 0,
            hourlyLeaveHours: 0
        );

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Mission days cannot be negative*");
    }

    [Fact]
    public void Create_ExcessiveMissionDays_ThrowsException()
    {
        // Act
        var act = () => AdministrativeStatus.Create(
            employeeId: Guid.NewGuid(),
            missionDays: 400,
            sickLeaveDays: 0,
            paidLeaveDays: 0,
            overtimeHours: 0,
            delayAndAbsenceHours: 0,
            hourlyLeaveHours: 0
        );

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Mission days cannot exceed 365*");
    }

    [Fact]
    public void UpdateStatus_ValidData_UpdatesSuccessfully()
    {
        // Arrange
        var status = AdministrativeStatus.Create(
            employeeId: Guid.NewGuid(),
            missionDays: 10,
            sickLeaveDays: 2,
            paidLeaveDays: 5,
            overtimeHours: 20,
            delayAndAbsenceHours: 5,
            hourlyLeaveHours: 8
        );

        // Act
        status.UpdateStatus(
            missionDays: 15,
            sickLeaveDays: 4,
            paidLeaveDays: 8,
            overtimeHours: 30,
            delayAndAbsenceHours: 10,
            hourlyLeaveHours: 12
        );

        // Assert
        status.MissionDays.Should().Be(15);
        status.OvertimeHours.Should().Be(30);
        status.DelayAndAbsenceHours.Should().Be(10);
        status.HourlyLeaveHours.Should().Be(12);
        status.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void IsValid_ValidData_ReturnsTrue()
    {
        // Arrange
        var status = AdministrativeStatus.Create(
            employeeId: Guid.NewGuid(),
            missionDays: 10,
            sickLeaveDays: 2,
            paidLeaveDays: 5,
            overtimeHours: 20,
            delayAndAbsenceHours: 5,
            hourlyLeaveHours: 8
        );

        // Act
        var isValid = status.IsValid();

        // Assert
        isValid.Should().BeTrue();
    }

    [Fact]
    public void HasDisciplinaryIssues_ExcessiveDelays_ReturnsTrue()
    {
        // Arrange
        var status = AdministrativeStatus.Create(
            employeeId: Guid.NewGuid(),
            missionDays: 0,
            sickLeaveDays: 0,
            paidLeaveDays: 0,
            overtimeHours: 0,
            delayAndAbsenceHours: 50, // Exceeds threshold of 40
            hourlyLeaveHours: 0
        );

        // Act
        var hasDisciplinaryIssues = status.HasDisciplinaryIssues();

        // Assert
        hasDisciplinaryIssues.Should().BeTrue();
    }

    [Fact]
    public void HasDisciplinaryIssues_AcceptableDelays_ReturnsFalse()
    {
        // Arrange
        var status = AdministrativeStatus.Create(
            employeeId: Guid.NewGuid(),
            missionDays: 0,
            sickLeaveDays: 0,
            paidLeaveDays: 0,
            overtimeHours: 0,
            delayAndAbsenceHours: 20, // Below threshold
            hourlyLeaveHours: 0
        );

        // Act
        var hasDisciplinaryIssues = status.HasDisciplinaryIssues();

        // Assert
        hasDisciplinaryIssues.Should().BeFalse();
    }

    [Fact]
    public void GetTotalLeaveHours_ReturnsCorrectValue()
    {
        // Arrange
        var status = AdministrativeStatus.Create(
            employeeId: Guid.NewGuid(),
            missionDays: 0,
            sickLeaveDays: 0,
            paidLeaveDays: 0,
            overtimeHours: 0,
            delayAndAbsenceHours: 0,
            hourlyLeaveHours: 24
        );

        // Act
        var totalLeaveHours = status.GetTotalLeaveHours();

        // Assert
        totalLeaveHours.Should().Be(24);
    }
}
