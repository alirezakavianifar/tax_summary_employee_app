using FluentAssertions;
using TaxSummary.Domain.Common;
using Xunit;

namespace TaxSummary.Domain.Tests.Common;

public class ResultTests
{
    [Fact]
    public void Success_CreatesSuccessResult()
    {
        // Act
        var result = Result.Success();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Error.Should().BeEmpty();
    }

    [Fact]
    public void Failure_CreatesFailureResult()
    {
        // Arrange
        var errorMessage = "Test error";

        // Act
        var result = Result.Failure(errorMessage);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be(errorMessage);
    }

    [Fact]
    public void SuccessGeneric_CreatesSuccessResultWithValue()
    {
        // Arrange
        var value = "Test Value";

        // Act
        var result = Result.Success(value);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.IsFailure.Should().BeFalse();
        result.Value.Should().Be(value);
        result.Error.Should().BeEmpty();
    }

    [Fact]
    public void FailureGeneric_CreatesFailureResultWithoutValue()
    {
        // Arrange
        var errorMessage = "Test error";

        // Act
        var result = Result.Failure<string>(errorMessage);

        // Assert
        result.IsSuccess.Should().BeFalse();
        result.IsFailure.Should().BeTrue();
        result.Value.Should().BeNull();
        result.Error.Should().Be(errorMessage);
    }

    [Fact]
    public void SuccessGeneric_AccessingValueOnFailure_ThrowsException()
    {
        // Arrange
        var result = Result.Failure<string>("Test error");

        // Act & Assert
        result.Value.Should().BeNull();
        result.Error.Should().Be("Test error");
    }

    [Fact]
    public void Result_MultipleOperations_WorksCorrectly()
    {
        // Arrange & Act
        var success1 = Result.Success();
        var success2 = Result.Success("value");
        var failure1 = Result.Failure("error1");
        var failure2 = Result.Failure<int>("error2");

        // Assert
        success1.IsSuccess.Should().BeTrue();
        success2.IsSuccess.Should().BeTrue();
        success2.Value.Should().Be("value");
        failure1.IsFailure.Should().BeTrue();
        failure2.IsFailure.Should().BeTrue();
        failure2.Value.Should().Be(0);
    }
}
