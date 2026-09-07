using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Domain.Tests.Entities;

public class RefundableReceiptAllocationTests
{
    [Fact]
    public void Create_WithValidAmounts_Succeeds()
    {
        var caseId = Guid.NewGuid();
        var receiptId = Guid.NewGuid();

        var alloc = RefundableReceiptAllocation.Create(
            caseId,
            receiptId,
            receiptNumber: "987654321",
            totalReceiptAmount: 300_000_000,
            refundableAmount: 65_000_000,
            bankBranch: "اهواز",
            city: "اهواز");

        Assert.NotNull(alloc);
        Assert.Equal(65_000_000, alloc.RefundableAmount);
        Assert.Equal(300_000_000, alloc.TotalReceiptAmount);
    }

    [Fact]
    public void Create_WhenRefundableAmountExceedsReceiptAmount_ThrowsArgumentException()
    {
        var caseId = Guid.NewGuid();
        var receiptId = Guid.NewGuid();

        var ex = Assert.Throws<ArgumentException>(() =>
            RefundableReceiptAllocation.Create(
                caseId,
                receiptId,
                receiptNumber: "987654321",
                totalReceiptAmount: 100_000_000,
                refundableAmount: 150_000_000));

        Assert.Contains("نمی‌تواند بیشتر از کل مبلغ مندرج در قبض", ex.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1000)]
    public void Create_WhenRefundableAmountIsZeroOrNegative_ThrowsArgumentException(decimal invalidAmount)
    {
        var caseId = Guid.NewGuid();
        var receiptId = Guid.NewGuid();

        Assert.Throws<ArgumentException>(() =>
            RefundableReceiptAllocation.Create(
                caseId,
                receiptId,
                receiptNumber: "987654321",
                totalReceiptAmount: 100_000_000,
                refundableAmount: invalidAmount));
    }

    [Fact]
    public void UpdateRefundableAmount_WhenExceedsTotal_ThrowsArgumentException()
    {
        var alloc = RefundableReceiptAllocation.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            receiptNumber: "987654321",
            totalReceiptAmount: 100_000_000,
            refundableAmount: 50_000_000);

        Assert.Throws<ArgumentException>(() => alloc.UpdateRefundableAmount(120_000_000));
    }
}
