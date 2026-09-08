using TaxSummary.Application.Services;
using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Application.Tests.Services;

public class RefundCalculationEngineTests
{
    private readonly RefundCalculationEngine _engine = new();

    [Fact]
    public void Compute_WithSampleData_MatchesExcelBenchmarkExactly()
    {
        // Arrange (from tax_refund_delfi نمونه.xlsm)
        var caseId = Guid.NewGuid();
        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: true,
            returnNumber: "654321987",
            returnDateJalali: "1403/04/31",
            finalizationMethod: FinalizationMethod.AliRas,
            finalNoticeNumber: "326541789",
            finalNoticeDateJalali: "1403/10/20",
            assessedIncome: 1_000_000_000,
            exemptions: 0,
            assessedTax: 250_000_000,
            nonWaivablePenalties: 0,
            timelyPaymentBonus: 0);

        var receipts = new List<TaxRefundReceipt>
        {
            TaxRefundReceipt.Create(caseId, 1, "987654321", "1403/05/01", "1403/05/01", 300_000_000),
            TaxRefundReceipt.Create(caseId, 2, "654321987", "1403/05/02", "1403/05/02", 15_000_000)
        };

        var letters = new List<TaxRefundLetter>
        {
            TaxRefundLetter.Create(caseId, TaxRefundLetterType.CollectionAndEnforcementInquiry, "1235465", "1405/02/01", null, 0),
            TaxRefundLetter.Create(caseId, TaxRefundLetterType.WithholdingTaxInquiry, "6532487", "1405/02/01", null, 0)
        };

        // Act
        var result = _engine.Compute(assessment, receipts, letters);

        // Assert - exact match with sample Excel outputs
        Assert.Equal(2, result.TotalReceiptsCount);
        Assert.Equal(315_000_000, result.TotalPaidAmount);
        Assert.Equal(1_000_000_000, result.TaxableBase);
        Assert.Equal(250_000_000, result.TotalAssessedTax);
        Assert.Equal(-65_000_000, result.SurplusPaid);
        Assert.Equal(0, result.TotalDiscoveredDebts);
        Assert.Equal(65_000_000, result.GrossSurplus);
        Assert.Equal(65_000_000, result.PrincipalTaxRefund);
        Assert.Equal(65_000_000, result.GrandTotalRefundable);
    }

    [Fact]
    public void Compute_WithDiscoveredDebts_OffsetsLiabilitiesFromRefund()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: true,
            returnNumber: "654321987",
            returnDateJalali: "1403/04/31",
            finalizationMethod: FinalizationMethod.AliRas,
            finalNoticeNumber: "326541789",
            finalNoticeDateJalali: "1403/10/20",
            assessedIncome: 1_000_000_000,
            exemptions: 0,
            assessedTax: 250_000_000);

        var receipts = new List<TaxRefundReceipt>
        {
            TaxRefundReceipt.Create(caseId, 1, "987654321", "1403/05/01", "1403/05/01", 315_000_000)
        };

        // Discovered debts from two inquiries: 10M from وصول و اجرا, 5M from حقوق
        var letters = new List<TaxRefundLetter>
        {
            TaxRefundLetter.Create(caseId, TaxRefundLetterType.CollectionAndEnforcementInquiry, "101", "1405/02/01", null, 10_000_000),
            TaxRefundLetter.Create(caseId, TaxRefundLetterType.WithholdingTaxInquiry, "102", "1405/02/01", null, 5_000_000)
        };

        // Act
        var result = _engine.Compute(assessment, receipts, letters);

        // Assert
        Assert.Equal(15_000_000, result.TotalDiscoveredDebts);
        Assert.Equal(65_000_000, result.GrossSurplus);
        Assert.Equal(50_000_000, result.PrincipalTaxRefund); // 65M gross - 15M debt = 50M net
        Assert.Equal(50_000_000, result.GrandTotalRefundable);
    }

    [Fact]
    public void Compute_WithArticle243DelayDamages_CalculatesCorrectMonthlyInterest()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: true,
            returnNumber: "1",
            returnDateJalali: "1403/01/01",
            finalizationMethod: FinalizationMethod.ReturnAccepted,
            finalNoticeNumber: "1",
            finalNoticeDateJalali: "1403/01/01",
            assessedIncome: 500_000_000,
            exemptions: 0,
            assessedTax: 100_000_000);

        var receipts = new List<TaxRefundReceipt>
        {
            TaxRefundReceipt.Create(caseId, 1, "RCP1", "1403/01/01", "1403/01/01", 200_000_000)
        };

        // Surplus = 100M - 200M = -100M -> Principal = 100M
        // 3 months delay at 1.5% per month = 100,000,000 * 0.015 * 3 = 4,500,000 Rials
        int delayMonths = 3;

        // Act
        var result = _engine.Compute(
            assessment,
            receipts,
            letters: Enumerable.Empty<TaxRefundLetter>(),
            delayMonths: delayMonths);

        // Assert
        Assert.Equal(100_000_000, result.PrincipalTaxRefund);
        Assert.Equal(4_500_000, result.DelayDamages);
        Assert.Equal(104_500_000, result.GrandTotalRefundable);
    }

    [Fact]
    public void Compute_WhenLiabilityExceedsPaidReceipts_RefundIsZero()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: true,
            returnNumber: "1",
            returnDateJalali: "1403/01/01",
            finalizationMethod: FinalizationMethod.AuditBooks,
            finalNoticeNumber: "1",
            finalNoticeDateJalali: "1403/01/01",
            assessedIncome: 1_000_000_000,
            exemptions: 0,
            assessedTax: 300_000_000);

        var receipts = new List<TaxRefundReceipt>
        {
            TaxRefundReceipt.Create(caseId, 1, "RCP1", "1403/01/01", "1403/01/01", 200_000_000)
        };

        // Act
        var result = _engine.Compute(assessment, receipts, Enumerable.Empty<TaxRefundLetter>());

        // Assert
        Assert.Equal(100_000_000, result.SurplusPaid); // Positive = underpaid
        Assert.Equal(0, result.GrossSurplus);
        Assert.Equal(0, result.PrincipalTaxRefund);
        Assert.Equal(0, result.GrandTotalRefundable);
    }

    [Fact]
    public void Compute_WithAllAdditionalItems_SumsGrandTotalCorrectly()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var assessment = TaxAssessmentInfo.Create(
            hasReturnFiled: false,
            returnNumber: null,
            returnDateJalali: null,
            finalizationMethod: FinalizationMethod.AliRas,
            finalNoticeNumber: "1",
            finalNoticeDateJalali: "1403/01/01",
            assessedIncome: 200_000_000,
            exemptions: 0,
            assessedTax: 50_000_000);

        var receipts = new List<TaxRefundReceipt>
        {
            TaxRefundReceipt.Create(caseId, 1, "RCP1", "1403/01/01", "1403/01/01", 150_000_000)
        };

        // Principal = 100M
        // Stamp Duty = 2M, Other = 1M, Penalties = 5M, Delay = 0
        var result = _engine.Compute(
            assessment,
            receipts,
            letters: Enumerable.Empty<TaxRefundLetter>(),
            stampDuty: 2_000_000,
            other: 1_000_000,
            penalties: 5_000_000);

        Assert.Equal(100_000_000, result.PrincipalTaxRefund);
        Assert.Equal(2_000_000, result.StampDutyRefund);
        Assert.Equal(1_000_000, result.OtherRefund);
        Assert.Equal(5_000_000, result.PenaltiesRefund);
        Assert.Equal(108_000_000, result.GrandTotalRefundable);
    }
}
