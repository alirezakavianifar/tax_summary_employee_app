using FluentAssertions;
using TaxSummary.Domain.ValueObjects;
using Xunit;

namespace TaxSummary.Domain.Tests.ValueObjects;

public class PersonnelNumberTests
{
    [Fact]
    public void Create_ValidValue_CreatesPersonnelNumber()
    {
        // Arrange
        var value = "EMP12345";

        // Act
        var personnelNumber = PersonnelNumber.Create(value);

        // Assert
        personnelNumber.Should().NotBeNull();
        personnelNumber.Value.Should().Be(value);
    }

    [Fact]
    public void Create_EmptyValue_ThrowsArgumentException()
    {
        // Act
        var act = () => PersonnelNumber.Create("");

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Personnel number cannot be empty*");
    }

    [Fact]
    public void Create_WhitespaceValue_ThrowsArgumentException()
    {
        // Act
        var act = () => PersonnelNumber.Create("   ");

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Personnel number cannot be empty*");
    }

    [Fact]
    public void Create_ExceedsMaxLength_ThrowsArgumentException()
    {
        // Arrange
        var longValue = new string('A', 51); // 51 characters

        // Act
        var act = () => PersonnelNumber.Create(longValue);

        // Assert
        act.Should().Throw<ArgumentException>()
            .WithMessage("*Personnel number cannot exceed 50 characters*");
    }

    [Fact]
    public void Create_ValueWithSpaces_TrimsSpaces()
    {
        // Arrange
        var value = "  EMP001  ";

        // Act
        var personnelNumber = PersonnelNumber.Create(value);

        // Assert
        personnelNumber.Value.Should().Be("EMP001");
    }

    [Fact]
    public void ImplicitConversion_ToString_ReturnsValue()
    {
        // Arrange
        var personnelNumber = PersonnelNumber.Create("EMP001");

        // Act
        string stringValue = personnelNumber;

        // Assert
        stringValue.Should().Be("EMP001");
    }

    [Fact]
    public void ToString_ReturnsValue()
    {
        // Arrange
        var personnelNumber = PersonnelNumber.Create("EMP001");

        // Act
        var stringValue = personnelNumber.ToString();

        // Assert
        stringValue.Should().Be("EMP001");
    }

    [Fact]
    public void Equality_SameValue_AreEqual()
    {
        // Arrange
        var personnelNumber1 = PersonnelNumber.Create("EMP001");
        var personnelNumber2 = PersonnelNumber.Create("EMP001");

        // Act & Assert
        personnelNumber1.Should().Be(personnelNumber2);
        personnelNumber1.GetHashCode().Should().Be(personnelNumber2.GetHashCode());
    }

    [Fact]
    public void Equality_DifferentValue_AreNotEqual()
    {
        // Arrange
        var personnelNumber1 = PersonnelNumber.Create("EMP001");
        var personnelNumber2 = PersonnelNumber.Create("EMP002");

        // Act & Assert
        personnelNumber1.Should().NotBe(personnelNumber2);
    }
}
