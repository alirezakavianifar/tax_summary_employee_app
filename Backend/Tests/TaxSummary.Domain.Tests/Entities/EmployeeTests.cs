using FluentAssertions;
using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Domain.Tests.Entities;

public class EmployeeTests
{
    [Fact]
    public void Create_ValidData_CreatesEmployee()
    {
        // Arrange
        var personnelNumber = "EMP001";
        var firstName = "علی";
        var lastName = "احمدی";

        // Act
        var employee = Employee.Create(
            personnelNumber: personnelNumber,
            firstName: firstName,
            lastName: lastName,
            education: "کارشناسی",
            serviceUnit: "واحد مالیات",
            currentPosition: "کارشناس",
            appointmentPosition: "کارشناس ارشد",
            previousExperienceYears: 5
        );

        // Assert
        employee.Should().NotBeNull();
        employee.Id.Should().NotBeEmpty();
        employee.PersonnelNumber.Should().Be(personnelNumber);
        employee.FirstName.Should().Be(firstName);
        employee.LastName.Should().Be(lastName);
        employee.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void Create_EmptyPersonnelNumber_ThrowsArgumentException()
    {
        // Act
        var act = () => Employee.Create(
            personnelNumber: "",
            firstName: "علی",
            lastName: "احمدی",
            education: "",
            serviceUnit: "",
            currentPosition: "",
            appointmentPosition: "",
            previousExperienceYears: 0
        );

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Personnel number cannot be empty*");
    }

    [Fact]
    public void Create_EmptyFirstName_ThrowsArgumentException()
    {
        // Act
        var act = () => Employee.Create(
            personnelNumber: "EMP001",
            firstName: "",
            lastName: "احمدی",
            education: "",
            serviceUnit: "",
            currentPosition: "",
            appointmentPosition: "",
            previousExperienceYears: 0
        );

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*First name cannot be empty*");
    }

    [Fact]
    public void Create_NegativeExperienceYears_ThrowsArgumentException()
    {
        // Act
        var act = () => Employee.Create(
            personnelNumber: "EMP001",
            firstName: "علی",
            lastName: "احمدی",
            education: "",
            serviceUnit: "",
            currentPosition: "",
            appointmentPosition: "",
            previousExperienceYears: -5
        );

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Experience years cannot be negative*");
    }

    [Fact]
    public void Create_ExcessiveExperienceYears_ThrowsArgumentException()
    {
        // Act
        var act = () => Employee.Create(
            personnelNumber: "EMP001",
            firstName: "علی",
            lastName: "احمدی",
            education: "",
            serviceUnit: "",
            currentPosition: "",
            appointmentPosition: "",
            previousExperienceYears: 70
        );

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Experience years seems unrealistic*");
    }

    [Fact]
    public void UpdatePersonalInfo_ValidData_UpdatesSuccessfully()
    {
        // Arrange
        var employee = Employee.Create(
            personnelNumber: "EMP001",
            firstName: "علی",
            lastName: "احمدی",
            education: "کارشناسی",
            serviceUnit: "واحد مالیات",
            currentPosition: "کارشناس",
            appointmentPosition: "کارشناس ارشد",
            previousExperienceYears: 5
        );

        var newFirstName = "محمد";
        var newLastName = "رضایی";
        var newEducation = "کارشناسی ارشد";

        // Act
        employee.UpdatePersonalInfo(newFirstName, newLastName, newEducation);

        // Assert
        employee.FirstName.Should().Be(newFirstName);
        employee.LastName.Should().Be(newLastName);
        employee.Education.Should().Be(newEducation);
        employee.UpdatedAt.Should().NotBeNull();
        employee.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void UpdatePosition_ValidData_UpdatesSuccessfully()
    {
        // Arrange
        var employee = Employee.Create(
            personnelNumber: "EMP001",
            firstName: "علی",
            lastName: "احمدی",
            education: "کارشناسی",
            serviceUnit: "واحد مالیات",
            currentPosition: "کارشناس",
            appointmentPosition: "کارشناس ارشد",
            previousExperienceYears: 5
        );

        var newCurrentPosition = "کارشناس ارشد";
        var newAppointmentPosition = "رئیس گروه";
        var newExperienceYears = 7;

        // Act
        employee.UpdatePosition(newCurrentPosition, newAppointmentPosition, newExperienceYears);

        // Assert
        employee.CurrentPosition.Should().Be(newCurrentPosition);
        employee.AppointmentPosition.Should().Be(newAppointmentPosition);
        employee.PreviousExperienceYears.Should().Be(newExperienceYears);
        employee.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void GetFullName_ReturnsCorrectFormat()
    {
        // Arrange
        var employee = Employee.Create(
            personnelNumber: "EMP001",
            firstName: "علی",
            lastName: "احمدی",
            education: "",
            serviceUnit: "",
            currentPosition: "",
            appointmentPosition: "",
            previousExperienceYears: 0
        );

        // Act
        var fullName = employee.GetFullName();

        // Assert
        fullName.Should().Be("علی احمدی");
    }

    [Fact]
    public void SetAdministrativeStatus_ValidStatus_SetsSuccessfully()
    {
        // Arrange
        var employee = Employee.Create(
            personnelNumber: "EMP001",
            firstName: "علی",
            lastName: "احمدی",
            education: "",
            serviceUnit: "",
            currentPosition: "",
            appointmentPosition: "",
            previousExperienceYears: 0
        );

        var adminStatus = AdministrativeStatus.Create(
            employeeId: employee.Id,
            missionDays: 10,
            incentiveHours: 20,
            delayAndAbsenceHours: 5,
            hourlyLeaveHours: 8
        );

        // Act
        employee.SetAdministrativeStatus(adminStatus);

        // Assert
        employee.AdministrativeStatus.Should().NotBeNull();
        employee.AdministrativeStatus.Should().Be(adminStatus);
        employee.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void AddPerformanceCapability_ValidCapability_AddsSuccessfully()
    {
        // Arrange
        var employee = Employee.Create(
            personnelNumber: "EMP001",
            firstName: "علی",
            lastName: "احمدی",
            education: "",
            serviceUnit: "",
            currentPosition: "",
            appointmentPosition: "",
            previousExperienceYears: 0
        );

        var capability = PerformanceCapability.Create(
            employeeId: employee.Id,
            systemRole: "معاون",
            detectionOfTaxIssues: true,
            detectionOfTaxEvasion: false,
            companyIdentification: true,
            valueAddedRecognition: false,
            referredOrExecuted: true
        );

        // Act
        employee.AddPerformanceCapability(capability);

        // Assert
        employee.PerformanceCapabilities.Should().HaveCount(1);
        employee.PerformanceCapabilities.Should().Contain(capability);
        employee.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void RemovePerformanceCapability_ExistingCapability_RemovesSuccessfully()
    {
        // Arrange
        var employee = Employee.Create(
            personnelNumber: "EMP001",
            firstName: "علی",
            lastName: "احمدی",
            education: "",
            serviceUnit: "",
            currentPosition: "",
            appointmentPosition: "",
            previousExperienceYears: 0
        );

        var capability = PerformanceCapability.Create(
            employeeId: employee.Id,
            systemRole: "معاون",
            detectionOfTaxIssues: true
        );

        employee.AddPerformanceCapability(capability);

        // Act
        employee.RemovePerformanceCapability(capability.Id);

        // Assert
        employee.PerformanceCapabilities.Should().BeEmpty();
        employee.UpdatedAt.Should().NotBeNull();
    }
}
