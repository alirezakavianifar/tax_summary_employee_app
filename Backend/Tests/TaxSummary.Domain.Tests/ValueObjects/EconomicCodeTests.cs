using TaxSummary.Domain.ValueObjects;
using Xunit;

namespace TaxSummary.Domain.Tests.ValueObjects;

public class EconomicCodeTests
{
    [Theory]
    [InlineData("1234567890")]
    [InlineData("123456789012")]
    [InlineData("411111111111")]
    public void Create_WithValidCode_Succeeds(string code)
    {
        var economicCode = EconomicCode.Create(code);

        Assert.NotNull(economicCode);
        Assert.Equal(code, economicCode.Value);
    }

    [Fact]
    public void Create_WithPersianDigits_NormalizesToAscii()
    {
        // "۱۲۳۴۵۶۷۸۹۰۱۲" in Persian numerals
        var persian = "۱۲۳۴۵۶۷۸۹۰۱۲";

        var economicCode = EconomicCode.Create(persian);

        Assert.Equal("123456789012", economicCode.Value);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Create_WithNullOrEmpty_ThrowsArgumentException(string? invalid)
    {
        Assert.Throws<ArgumentException>(() => EconomicCode.Create(invalid!));
    }

    [Theory]
    [InlineData("123456")] // Too short (<10 digits)
    [InlineData("12345678901234567")] // Too long (>14 digits)
    [InlineData("123456789A")] // Contains letter
    public void Create_WithInvalidLengthOrCharacters_ThrowsArgumentException(string invalid)
    {
        Assert.Throws<ArgumentException>(() => EconomicCode.Create(invalid));
    }

    [Fact]
    public void Equality_SameValue_AreEqual()
    {
        var code1 = EconomicCode.Create("123456789012");
        var code2 = EconomicCode.Create("۱۲۳۴۵۶۷۸۹۰۱۲");

        Assert.Equal(code1, code2);
    }
}
