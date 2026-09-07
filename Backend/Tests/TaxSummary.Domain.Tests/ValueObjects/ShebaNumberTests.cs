using TaxSummary.Domain.ValueObjects;
using Xunit;

namespace TaxSummary.Domain.Tests.ValueObjects;

public class ShebaNumberTests
{
    // A mathematically valid Iranian IBAN (MOD-97 equals 1)
    // IR160120000000001234567890:
    // Rearrange -> 0120000000001234567890 1827 16 -> modulo 97 = 1
    private const string ValidSheba = "IR160120000000001234567890";

    [Fact]
    public void Create_WithValidSheba_Succeeds()
    {
        // Act
        var sheba = ShebaNumber.Create(ValidSheba);

        // Assert
        Assert.NotNull(sheba);
        Assert.Equal(ValidSheba, sheba.Value);
    }

    [Fact]
    public void Create_WithLowercasePrefix_NormalizesToUppercase()
    {
        // Arrange
        var lowercase = ValidSheba.ToLowerInvariant();

        // Act
        var sheba = ShebaNumber.Create(lowercase);

        // Assert
        Assert.Equal(ValidSheba, sheba.Value);
    }

    [Fact]
    public void Create_WithSpacesAndDashes_NormalizesCleanly()
    {
        // Arrange
        var spaced = "IR16 0120 0000 0000 1234 5678 90";

        // Act
        var sheba = ShebaNumber.Create(spaced);

        // Assert
        Assert.Equal(ValidSheba, sheba.Value);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Create_WithNullOrEmpty_ThrowsArgumentException(string? invalid)
    {
        Assert.Throws<ArgumentException>(() => ShebaNumber.Create(invalid!));
    }

    [Theory]
    [InlineData("US020120000000001234567890")] // Wrong country prefix
    [InlineData("12012000000000123456789012")] // No IR prefix
    [InlineData("IR02012000000000123456789")]  // Too short (25 chars)
    [InlineData("IR0201200000000012345678901")] // Too long (27 chars)
    [InlineData("IR02012000000000123456789X")] // Non-digit characters
    public void Create_WithInvalidFormat_ThrowsArgumentException(string invalid)
    {
        Assert.Throws<ArgumentException>(() => ShebaNumber.Create(invalid));
    }

    [Fact]
    public void Create_WithTamperedDigits_FailsIso7064Checksum()
    {
        // Modify last digit of a valid IBAN
        var tampered = "IR160120000000001234567891";

        var ex = Assert.Throws<ArgumentException>(() => ShebaNumber.Create(tampered));
        Assert.Contains("کد کنترلی", ex.Message);
    }

    [Fact]
    public void CreateWithoutChecksum_ForLegacyCase_Succeeds()
    {
        // Excel sample value
        var sampleSheba = "IR123456658523532331234567";

        var sheba = ShebaNumber.CreateWithoutChecksum(sampleSheba);

        Assert.Equal(sampleSheba, sheba.Value);
    }

    [Fact]
    public void Equality_SameValue_AreEqual()
    {
        var sheba1 = ShebaNumber.Create(ValidSheba);
        var sheba2 = ShebaNumber.Create(ValidSheba.ToLowerInvariant());

        Assert.Equal(sheba1, sheba2);
    }
}
