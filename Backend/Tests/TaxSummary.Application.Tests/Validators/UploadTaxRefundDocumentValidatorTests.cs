using TaxSummary.Application.DTOs.TaxRefund;
using TaxSummary.Application.Validators.TaxRefund;
using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Application.Tests.Validators;

public class UploadTaxRefundDocumentValidatorTests
{
    private readonly UploadTaxRefundDocumentValidator _validator = new();

    [Fact]
    public void Validate_WithValidDto_Passes()
    {
        var dto = new UploadTaxRefundDocumentDto
        {
            Title = "درخواست مودی جهت استرداد اضافه پرداختی",
            DocumentType = TaxRefundDocumentType.TaxpayerPetition,
            Description = "توضیحات تکمیلی سند پیوست"
        };

        var result = _validator.Validate(dto);

        Assert.True(result.IsValid);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData(null)]
    public void Validate_WithEmptyTitle_Fails(string? title)
    {
        var dto = new UploadTaxRefundDocumentDto
        {
            Title = title!,
            DocumentType = TaxRefundDocumentType.ReceiptProof
        };

        var result = _validator.Validate(dto);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(dto.Title));
    }

    [Fact]
    public void Validate_WithInvalidDocumentType_Fails()
    {
        var dto = new UploadTaxRefundDocumentDto
        {
            Title = "برگ تشخیص",
            DocumentType = (TaxRefundDocumentType)999 // invalid enum
        };

        var result = _validator.Validate(dto);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(dto.DocumentType));
    }

    [Fact]
    public void Validate_WithOverlongTitle_Fails()
    {
        var dto = new UploadTaxRefundDocumentDto
        {
            Title = new string('A', 201),
            DocumentType = TaxRefundDocumentType.ReceiptProof
        };

        var result = _validator.Validate(dto);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(dto.Title));
    }
}
