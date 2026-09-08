using AutoMapper;
using TaxSummary.Application.Mapping;
using Xunit;

namespace TaxSummary.Application.Tests.Mapping;

public class TaxRefundMappingProfileTests
{
    [Fact]
    public void AutoMapper_Configuration_IsValid()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<TaxRefundMappingProfile>();
        });

        config.AssertConfigurationIsValid();
    }
}
