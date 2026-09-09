using System;
using System.Linq;
using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Domain.Tests.Entities;

public class PayrollRulesTests
{
    [Fact]
    public void UpdateAdjustments_WelfareRateExceeding100_ThrowsArgumentException()
    {
        // Arrange
        var item = PayrollEmployeeItem.Create(
            Guid.NewGuid(),
            "1001",
            "احمد رضایی",
            initialOvertimeRate: 100,
            initialWelfareRate: 80,
            baseOvertimeAmount: 1000000,
            baseWelfareAmount: 2000000,
            isLaborPosition: false
        );

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            item.UpdateAdjustments(
                adjustedOvertimeRate: 120,
                adjustedWelfareRate: 105, // > 100%
                officerNotes: "تست",
                isExcluded: false,
                isRatedProcess: true
            ));

        Assert.Contains("حداکثر درصد رفاهی مجاز ۱۰۰٪ می‌باشد", ex.Message);
    }

    [Fact]
    public void UpdateAdjustments_WelfareRate100_Succeeds()
    {
        // Arrange
        var item = PayrollEmployeeItem.Create(
            Guid.NewGuid(),
            "1001",
            "احمد رضایی",
            initialOvertimeRate: 100,
            initialWelfareRate: 80,
            baseOvertimeAmount: 1000000,
            baseWelfareAmount: 2000000,
            isLaborPosition: false
        );

        // Act
        item.UpdateAdjustments(
            adjustedOvertimeRate: 120,
            adjustedWelfareRate: 100,
            officerNotes: null,
            isExcluded: false,
            isRatedProcess: true
        );

        // Assert
        Assert.Equal(100, item.AdjustedWelfareRate);
        Assert.Equal(2000000, item.CalculatedWelfareAmount);
    }

    [Fact]
    public void UpdateAdjustments_LaborPosition_OvertimeExceeding120_ThrowsArgumentException()
    {
        // Arrange
        var item = PayrollEmployeeItem.Create(
            Guid.NewGuid(),
            "1002",
            "علی کارگر",
            initialOvertimeRate: 100,
            initialWelfareRate: 50,
            baseOvertimeAmount: 500000,
            baseWelfareAmount: 1000000,
            isLaborPosition: true,
            maxOvertimeLimit: 120
        );

        // Act & Assert: Entering 125h for labor position must throw
        var ex = Assert.Throws<ArgumentException>(() =>
            item.UpdateAdjustments(
                adjustedOvertimeRate: 125,
                adjustedWelfareRate: 50,
                officerNotes: "تست مشاغل کارگری",
                isExcluded: false,
                isRatedProcess: true
            ));

        Assert.Contains("مشاغل کارگری", ex.Message);
        Assert.Contains("120", ex.Message);
    }

    [Fact]
    public void UpdateAdjustments_LaborPosition_Overtime120_Succeeds()
    {
        // Arrange
        var item = PayrollEmployeeItem.Create(
            Guid.NewGuid(),
            "1002",
            "علی کارگر",
            initialOvertimeRate: 100,
            initialWelfareRate: 50,
            baseOvertimeAmount: 500000,
            baseWelfareAmount: 1000000,
            isLaborPosition: true,
            maxOvertimeLimit: 120
        );

        // Act
        item.UpdateAdjustments(
            adjustedOvertimeRate: 120,
            adjustedWelfareRate: 50,
            officerNotes: null,
            isExcluded: false,
            isRatedProcess: true
        );

        // Assert
        Assert.Equal(120, item.AdjustedOvertimeRate);
        Assert.Equal(60000000, item.CalculatedOvertimeAmount);
    }

    [Fact]
    public void UpdateAdjustments_StandardPosition_OvertimeExceeding175_ThrowsArgumentException()
    {
        // Arrange
        var item = PayrollEmployeeItem.Create(
            Guid.NewGuid(),
            "1003",
            "مریم حسینی",
            initialOvertimeRate: 150,
            initialWelfareRate: 70,
            baseOvertimeAmount: 800000,
            baseWelfareAmount: 1500000,
            isLaborPosition: false,
            maxOvertimeLimit: 175
        );

        // Act & Assert: Entering 176h for standard employee must throw
        var ex = Assert.Throws<ArgumentException>(() =>
            item.UpdateAdjustments(
                adjustedOvertimeRate: 176,
                adjustedWelfareRate: 70,
                officerNotes: "اضافه کار مازاد",
                isExcluded: false,
                isRatedProcess: true
            ));

        Assert.Contains("175", ex.Message);
    }

    [Fact]
    public void UpdateAdjustments_BonusExceedingPositionCap_ThrowsArgumentException()
    {
        // Arrange
        var item = PayrollEmployeeItem.Create(
            Guid.NewGuid(),
            "1004",
            "رضا کارشناس",
            baseBonusAmount: 50000000,
            positionTier: PositionTier.SeniorExpert,
            maxBonusLimit: 60000000
        );

        // Act & Assert: entering 65,000,000 when cap is 60,000,000
        var ex = Assert.Throws<ArgumentException>(() =>
            item.UpdateAdjustments(
                adjustedOvertimeRate: null,
                adjustedWelfareRate: null,
                officerNotes: "پاداش",
                isExcluded: false,
                isRatedProcess: false,
                adjustedBonusAmount: 65000000
            ));

        Assert.Contains("کارشناس ارشد", ex.Message);
        Assert.Contains("60,000,000", ex.Message);
    }

    [Fact]
    public void ValidateDepartmentLimits_OvertimeExceedingCap_ThrowsInvalidOperationException()
    {
        // Arrange: Dept with BaseOvertimeCap of 100,000,000
        var dept = PayrollDepartmentEntry.Create(Guid.NewGuid(), "اداره امور مالیاتی", baseOvertimeCap: 100000000);
        var item1 = PayrollEmployeeItem.Create(dept.Id, "101", "کارمند ۱", baseOvertimeAmount: 60000000);
        var item2 = PayrollEmployeeItem.Create(dept.Id, "102", "کارمند ۲", baseOvertimeAmount: 50000000);
        
        item1.UpdateAdjustments(1, 0, null, false, true); // calculated: 60,000,000
        item2.UpdateAdjustments(1, 0, null, false, true); // calculated: 50,000,000
        dept.Items.Add(item1);
        dept.Items.Add(item2);

        // Act & Assert: Total = 110,000,000 > 100,000,000 cap
        var ex = Assert.Throws<InvalidOperationException>(() =>
            dept.ValidateDepartmentLimits("OvertimeWelfareRated"));

        Assert.Contains("مجموع اضافه کار", ex.Message);
    }

    [Fact]
    public void ValidateDepartmentLimits_BonusExceedingCap_ThrowsInvalidOperationException()
    {
        // Arrange: Dept with BaseBonusCap of 100,000,000
        var dept = PayrollDepartmentEntry.Create(Guid.NewGuid(), "اداره حسابرسی", baseBonusCap: 100000000);
        var item1 = PayrollEmployeeItem.Create(dept.Id, "201", "کارمند ۱", baseBonusAmount: 60000000);
        var item2 = PayrollEmployeeItem.Create(dept.Id, "202", "کارمند ۲", baseBonusAmount: 50000000);
        dept.Items.Add(item1);
        dept.Items.Add(item2);

        // Act & Assert: Total = 110,000,000 > 100,000,000 cap
        var ex = Assert.Throws<InvalidOperationException>(() =>
            dept.ValidateDepartmentLimits("HalfPercentBonus"));

        Assert.Contains("مجموع پاداش نیم درصد", ex.Message);
    }

    [Fact]
    public void TwoTierWorkflow_Submitted_ApproveByDeputy_TransitionsToDeputyApproved()
    {
        // Arrange
        var dept = PayrollDepartmentEntry.Create(Guid.NewGuid(), "اداره فناوری");
        var officerId = Guid.NewGuid();
        var deputyId = Guid.NewGuid();
        var managerId = Guid.NewGuid();

        // 1. Submit
        dept.Submit(officerId, "ارسال به معاونت");
        Assert.Equal(PayrollDepartmentStatus.Submitted, dept.Status);
        Assert.Equal(officerId, dept.SubmittedByUserId);

        // 2. Deputy Approval
        dept.ApproveByDeputy(deputyId);
        Assert.Equal(PayrollDepartmentStatus.DeputyApproved, dept.Status);
        Assert.Equal(deputyId, dept.DeputyApprovedByUserId);
        Assert.NotNull(dept.DeputyApprovedAt);

        // 3. Manager's Office Approval
        dept.Approve(managerId);
        Assert.Equal(PayrollDepartmentStatus.Approved, dept.Status);
        Assert.Equal(managerId, dept.ApprovedByUserId);
        Assert.NotNull(dept.ApprovedAt);
    }

    [Fact]
    public void TwoTierWorkflow_Reject_ResetsApprovalsAndTransitionsToRejected()
    {
        // Arrange
        var dept = PayrollDepartmentEntry.Create(Guid.NewGuid(), "اداره امور مالیاتی");
        dept.Submit(Guid.NewGuid());
        dept.ApproveByDeputy(Guid.NewGuid());

        // Act: Manager returns/rejects for corrections
        dept.Reject("عدم رعایت سقف اضافه کار");

        // Assert
        Assert.Equal(PayrollDepartmentStatus.Rejected, dept.Status);
        Assert.Equal("عدم رعایت سقف اضافه کار", dept.RejectionReason);
        Assert.Null(dept.DeputyApprovedByUserId);
        Assert.Null(dept.DeputyApprovedAt);
        Assert.Null(dept.ApprovedByUserId);
        Assert.Null(dept.ApprovedAt);
    }
}
