using TaxSummary.Domain.ValueObjects;
using Xunit;

namespace TaxSummary.Domain.Tests.ValueObjects;

public class JalaliDateTests
{
    [Theory]
    [InlineData("1402/01/01")]
    [InlineData("1402/06/31")]
    [InlineData("1402/07/30")]
    [InlineData("1402/12/29")]
    [InlineData("1403/10/20")]
    public void Create_WithValidDate_Succeeds(string dateStr)
    {
        var jalaliDate = JalaliDate.Create(dateStr);

        Assert.NotNull(jalaliDate);
        Assert.Equal(dateStr, jalaliDate.Value);
    }

    [Fact]
    public void Create_WithDashes_NormalizesToSlashes()
    {
        var jalaliDate = JalaliDate.Create("1402-05-15");

        Assert.Equal("1402/05/15", jalaliDate.Value);
    }

    [Fact]
    public void Create_WithPersianDigits_NormalizesToAscii()
    {
        var jalaliDate = JalaliDate.Create("۱۴۰۲/۰۵/۱۵");

        Assert.Equal("1402/05/15", jalaliDate.Value);
    }

    [Theory]
    [InlineData("1402/07/31")] // Month 7 has only 30 days
    [InlineData("1402/12/31")] // Month 12 has at most 30 days
    [InlineData("1402/13/01")] // Invalid month 13
    [InlineData("1402/00/01")] // Invalid month 0
    [InlineData("1402/05/32")] // Invalid day 32
    public void Create_WithInvalidDayOrMonth_ThrowsArgumentException(string invalid)
    {
        Assert.Throws<ArgumentException>(() => JalaliDate.Create(invalid));
    }

    [Fact]
    public void Comparison_EarlierDate_IsLessThanLaterDate()
    {
        var d1 = JalaliDate.Create("1402/05/01");
        var d2 = JalaliDate.Create("1403/05/01");

        Assert.True(d1.CompareTo(d2) < 0);
        Assert.True(d2.CompareTo(d1) > 0);
    }
}
