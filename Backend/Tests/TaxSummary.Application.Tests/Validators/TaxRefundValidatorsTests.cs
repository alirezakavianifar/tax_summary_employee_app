using FluentValidation.TestHelper;
using TaxSummary.Application.DTOs.TaxRefund;
using TaxSummary.Application.Validators.TaxRefund;
using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Application.Tests.Validators;

public class TaxRefundValidatorsTests
{
    private readonly CreateTaxRefundCaseValidator _caseValidator = new();
    private readonly CreateTaxRefundReceiptValidator _receiptValidator = new();
    private readonly CreateRefundableReceiptAllocationValidator _allocValidator = new();
    private readonly CreateTaxRefundLetterValidator _letterValidator = new();
    private readonly TaxAssessmentInfoValidator _assessmentValidator = new();

    [Fact]
    public void CreateTaxRefundCaseValidator_ValidDto_ShouldNotHaveErrors()
    {
        var dto = new CreateTaxRefundCaseDto
        {
            TaxpayerName = "شرکت نمونه",
            EconomicCode = "1234567890",
            ShebaNumber = "IR160120000000001234567890",
            BankName = "ملی",
            TaxUnitCode = "160300",
            Province = "خوزستان",
            City = "اهواز",
            TaxYear = 1402,
            Period = 1,
            RefundReason = "اشتباه واریزی",
            AdministrationHeadName = "غلامرضا اسلامی",
            GroupHeadName = "مسعود بصیر",
            SeniorAuditorName = "مهدی دلفی"
        };

        var result = _caseValidator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void CreateTaxRefundCaseValidator_EmptyTaxpayerName_ShouldHaveError(string name)
    {
        var dto = new CreateTaxRefundCaseDto { TaxpayerName = name };
        var result = _caseValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.TaxpayerName);
    }

    [Theory]
    [InlineData("123")] // Too short
    [InlineData("12345678901234567")] // Too long
    [InlineData("123456789A")] // Alpha
    public void CreateTaxRefundCaseValidator_InvalidEconomicCode_ShouldHaveError(string code)
    {
        var dto = new CreateTaxRefundCaseDto { EconomicCode = code };
        var result = _caseValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.EconomicCode);
    }

    [Theory]
    [InlineData(1200)]
    [InlineData(1600)]
    public void CreateTaxRefundCaseValidator_InvalidYear_ShouldHaveError(int year)
    {
        var dto = new CreateTaxRefundCaseDto { TaxYear = year };
        var result = _caseValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.TaxYear);
    }

    [Fact]
    public void CreateTaxRefundReceiptValidator_PositiveAmount_ShouldNotHaveError()
    {
        var dto = new CreateTaxRefundReceiptDto
        {
            ReceiptNumber = "987654321",
            AmountRials = 300_000_000,
            IssueDateJalali = "1403/05/01",
            PaymentDateJalali = "1403/05/01"
        };

        var result = _receiptValidator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1000)]
    public void CreateTaxRefundReceiptValidator_ZeroOrNegativeAmount_ShouldHaveError(decimal amount)
    {
        var dto = new CreateTaxRefundReceiptDto { AmountRials = amount };
        var result = _receiptValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.AmountRials);
    }

    [Fact]
    public void CreateRefundableReceiptAllocationValidator_AmountExceedingTotal_ShouldHaveError()
    {
        var dto = new CreateRefundableReceiptAllocationDto
        {
            TaxRefundReceiptId = Guid.NewGuid(),
            ReceiptNumber = "123",
            TotalReceiptAmount = 100_000_000,
            RefundableAmount = 150_000_000 // Exceeds total
        };

        var result = _allocValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.RefundableAmount);
    }

    [Fact]
    public void CreateTaxRefundLetterValidator_NegativeDebt_ShouldHaveError()
    {
        var dto = new CreateTaxRefundLetterDto
        {
            LetterType = TaxRefundLetterType.CollectionAndEnforcementInquiry,
            LetterNumber = "123",
            LetterDateJalali = "1405/02/01",
            DebtAmount = -500 // Negative
        };

        var result = _letterValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.DebtAmount);
    }

    [Fact]
    public void TaxAssessmentInfoValidator_NegativeIncome_ShouldHaveError()
    {
        var dto = new UpdateTaxAssessmentInfoDto
        {
            AssessedIncome = -1_000_000
        };

        var result = _assessmentValidator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.AssessedIncome);
    }
}
