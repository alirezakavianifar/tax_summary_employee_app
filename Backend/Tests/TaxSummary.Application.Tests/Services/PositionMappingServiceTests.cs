using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TaxSummary.Domain.Entities;
using TaxSummary.Infrastructure.Services;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class PositionMappingServiceTests
{
    private readonly PositionMappingService _service;

    public PositionMappingServiceTests()
    {
        var inMemoryConfig = new Dictionary<string, string?>
        {
            ["PositionMappingFilePath"] = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "sample_data", "تبدیل پست ها.xlsx")
        };

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemoryConfig)
            .Build();

        _service = new PositionMappingService(config, NullLogger<PositionMappingService>.Instance);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t\n")]
    public void GetStandardizedPosition_WhenNullOrEmpty_ReturnsHesabras(string? input)
    {
        var result = _service.GetStandardizedPosition(input);
        result.Should().Be("حسابرس");
    }

    [Theory]
    [InlineData("حسابرس ارشد مالياتي", "حسابرس ارشد")]
    [InlineData("حسابرس ارشد مالیاتی", "حسابرس ارشد")]
    [InlineData("رييس گروه حسابرسي مالياتي", "رییس گروه")]
    [InlineData("رییس گروه حسابرسی مالیاتی", "رییس گروه")]
    [InlineData("کارشناس نرم افزار", "حسابرس")]
    [InlineData("حسابدار و امين اموال", "حسابرس")]
    [InlineData("متصدي امور مالياتي", "حسابرس")]
    public void GetStandardizedPosition_WhenMappedTitle_ReturnsStandardizedName(string rawTitle, string expected)
    {
        var result = _service.GetStandardizedPosition(rawTitle);
        result.Should().Be(expected);
    }

    [Fact]
    public void GetStandardizedPosition_WhenUnmatchedTitle_FallsBackToHesabras()
    {
        var result = _service.GetStandardizedPosition("عنوان ناشناخته آزمایشی سازمانی ۱۲۳");
        result.Should().Be("حسابرس");
    }

    [Theory]
    [InlineData("رییس گروه", PositionTier.GroupHead)]
    [InlineData("رئیس گروه", PositionTier.GroupHead)]
    [InlineData("سرپرست گروه", PositionTier.GroupHead)]
    [InlineData("حسابرس ارشد", PositionTier.SeniorExpert)]
    [InlineData("کارشناس ارشد", PositionTier.SeniorExpert)]
    [InlineData("حسابرس", PositionTier.OtherStaff)]
    [InlineData(null, PositionTier.OtherStaff)]
    [InlineData("", PositionTier.OtherStaff)]
    public void ResolveTierFromPosition_ResolvesAccurateTier(string? position, string expectedTier)
    {
        var tier = _service.ResolveTierFromPosition(position);
        tier.Should().Be(expectedTier);
    }
}
