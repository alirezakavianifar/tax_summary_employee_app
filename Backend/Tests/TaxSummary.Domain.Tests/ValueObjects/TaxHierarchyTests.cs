using TaxSummary.Domain.Entities;
using TaxSummary.Domain.ValueObjects;
using Xunit;

namespace TaxSummary.Domain.Tests.ValueObjects;

public class TaxHierarchyTests
{
    [Fact]
    public void FromTaxUnitCode_WithValid6DigitCode_DecomposesCorrectly()
    {
        // Act - Case specified by user: 160211
        var hierarchy = TaxHierarchy.FromTaxUnitCode("160211");

        // Assert:
        // Level 1: Office (اداره کل و امور مالیاتی) ends with 00
        Assert.Equal("160200", hierarchy.OfficeCode);
        // Level 2: Audit Group (رئیس گروه) ends with single 0
        Assert.Equal("160210", hierarchy.GroupCode);
        // Level 3: Tax Unit (کارشناس ارشد مالیاتی / واحد مالیاتی)
        Assert.Equal("160211", hierarchy.TaxUnitCode);
        Assert.True(hierarchy.IsValid);
    }

    [Fact]
    public void FromTaxUnitCode_WithPersianDigits_NormalizesAndDecomposes()
    {
        // Act: Persian digits ۱۶۰۲۱۱
        var hierarchy = TaxHierarchy.FromTaxUnitCode("۱۶۰۲۱۱");

        // Assert
        Assert.Equal("160200", hierarchy.OfficeCode);
        Assert.Equal("160210", hierarchy.GroupCode);
        Assert.Equal("160211", hierarchy.TaxUnitCode);
        Assert.True(hierarchy.IsValid);
    }

    [Theory]
    [InlineData("160200", true)]   // Office code covers all its units
    [InlineData("1602", true)]     // 4-digit office prefix covers all units
    [InlineData("160210", true)]   // Group 1 code covers unit 11
    [InlineData("160211", true)]   // Exact unit match
    [InlineData("160212", false)]  // Sibling unit in same group
    [InlineData("160220", false)]  // Sibling group (group 2)
    [InlineData("160100", false)]  // Different office (160100)
    [InlineData("160300", false)]  // Different office (160300)
    public void IsCoveredBy_EvaluatesHierarchyCorrectly(string assignedCode, bool expectedResult)
    {
        // Arrange: Unit 160211 belongs to Office 160200 and Group 160210
        var hierarchy = TaxHierarchy.FromTaxUnitCode("160211");

        // Act
        var result = hierarchy.IsCoveredBy(assignedCode);

        // Assert
        Assert.Equal(expectedResult, result);
    }

    [Fact]
    public void TaxRefundCase_Create_AutomaticallyDecomposesAndSetsHierarchy()
    {
        // Act: Create case with tax unit code 160211
        var refundCase = TaxRefundCase.Create(
            "REF-1402-1001",
            "87",
            "شرکت پتروشیمی کارون",
            "411395768531",
            "160211",
            "خوزستان",
            "اهواز",
            "کیانپارس",
            "ملی",
            "IR120170000000123456789012",
            1402,
            1,
            TaxSourceType.CorporateIncome,
            "اضافه پرداختی عملکرد",
            "رئیس امور",
            "رئیس گروه",
            "کارشناس ارشد",
            Guid.NewGuid(),
            "10102345678");

        // Assert
        Assert.Equal("160211", refundCase.TaxUnitCode);
        Assert.Equal("160210", refundCase.GroupCode);
        Assert.Equal("160200", refundCase.OfficeCode);
    }

    [Fact]
    public void User_OfficeHead_AssignedToOffice160200_HasAccessToUnit160211()
    {
        // Arrange
        var user = User.Create("office_head", "head@tax.gov.ir", "hash", "OfficeHead");
        var office = Office.Create("160200", "اداره ۲ اهواز");
        user.AssignOffice(office);

        // Act & Assert
        Assert.True(user.HasAccessToTaxHierarchy("160211"));
        Assert.True(user.HasAccessToTaxHierarchy("160212"));
        Assert.True(user.HasAccessToTaxHierarchy("160220"));
        Assert.False(user.HasAccessToTaxHierarchy("160100"));
        Assert.False(user.HasAccessToTaxHierarchy("160311"));
    }

    [Fact]
    public void User_GroupHead_AssignedToGroup160210_HasAccessOnlyToGroup1Units()
    {
        // Arrange: User assigned to group 160210
        var user = User.Create("group_head", "gh@tax.gov.ir", "hash", "GroupHead");
        var office = Office.Create("160210", "گروه ۱ اداره ۲");
        user.AssignOffice(office);

        // Act & Assert:
        // Should have access to unit 160211 and 160212
        Assert.True(user.HasAccessToTaxHierarchy("160211"));
        Assert.True(user.HasAccessToTaxHierarchy("160212"));
        // Should NOT have access to group 2 (160221) or office 160100
        Assert.False(user.HasAccessToTaxHierarchy("160221"));
        Assert.False(user.HasAccessToTaxHierarchy("160111"));
    }

    [Fact]
    public void User_CanVerifyStage_EnforcesWorkflowGatePermissions()
    {
        // 1. Senior Auditor (Expert) assigned to 160211
        var auditor = User.Create("auditor", "auditor@tax.gov.ir", "hash", "Expert");
        var auditorOffice = Office.Create("160211", "واحد ۱");
        auditor.AssignOffice(auditorOffice);

        // Can audit stage 1 (Audited)
        Assert.True(auditor.CanVerifyStage(RefundCaseStatus.Audited, "160211"));
        // Cannot approve stage 2 (GroupHeadApproved) or stage 3 (AdministrationHeadApproved)
        Assert.False(auditor.CanVerifyStage(RefundCaseStatus.GroupHeadApproved, "160211"));
        Assert.False(auditor.CanVerifyStage(RefundCaseStatus.AdministrationHeadApproved, "160211"));

        // 2. Group Head assigned to 160210
        var groupHead = User.Create("ghead", "gh@tax.gov.ir", "hash", "GroupHead");
        var groupOffice = Office.Create("160210", "گروه ۱");
        groupHead.AssignOffice(groupOffice);

        // Can approve stage 2 (GroupHeadApproved)
        Assert.True(groupHead.CanVerifyStage(RefundCaseStatus.GroupHeadApproved, "160211"));
        // Cannot approve stage 3 (AdministrationHeadApproved)
        Assert.False(groupHead.CanVerifyStage(RefundCaseStatus.AdministrationHeadApproved, "160211"));

        // 2b. Group Head assigned to Group 161010
        var groupHead161010 = User.Create("gh161010", "gh161010@tax.gov.ir", "hash", "GroupHead");
        var office161010 = Office.Create("161010", "گروه ۱ اداره ۱۰ اهواز");
        groupHead161010.AssignOffice(office161010);

        // Can see (TaxHierarchy access) and confirm stage 2 (GroupHeadApproved) for unit 161012 (belongs to group 161010)
        Assert.True(groupHead161010.HasAccessToTaxHierarchy("161012"));
        Assert.True(groupHead161010.CanVerifyStage(RefundCaseStatus.GroupHeadApproved, "161012"));

        // CANNOT see and CANNOT confirm for unit 161022 (belongs to group 161020)
        Assert.False(groupHead161010.HasAccessToTaxHierarchy("161022"));
        Assert.False(groupHead161010.CanVerifyStage(RefundCaseStatus.GroupHeadApproved, "161022"));

        // Cannot approve stage 3 (AdministrationHeadApproved)
        Assert.False(groupHead161010.CanVerifyStage(RefundCaseStatus.AdministrationHeadApproved, "161012"));

        // 2c. Group Head assigned only general 4-digit Office 1610 without specific group code
        var groupHeadGeneral = User.Create("ghGeneral", "ghg@tax.gov.ir", "hash", "GroupHead");
        var office1610 = Office.Create("1610", "اداره 1610");
        groupHeadGeneral.AssignOffice(office1610);
        // Cannot approve stage 2 for specific group 161010 because specific group assignment is required
        Assert.False(groupHeadGeneral.CanVerifyStage(RefundCaseStatus.GroupHeadApproved, "161012"));

        // 3. Office Head assigned to 160200
        var officeHead = User.Create("ohead", "oh@tax.gov.ir", "hash", "OfficeHead");
        var mainOffice = Office.Create("160200", "اداره ۲");
        officeHead.AssignOffice(mainOffice);

        // Can approve all stages for unit 160211
        Assert.True(officeHead.CanVerifyStage(RefundCaseStatus.Audited, "160211"));
        Assert.True(officeHead.CanVerifyStage(RefundCaseStatus.GroupHeadApproved, "160211"));
        Assert.True(officeHead.CanVerifyStage(RefundCaseStatus.AdministrationHeadApproved, "160211"));
        // Cannot approve for office 160100
        Assert.False(officeHead.CanVerifyStage(RefundCaseStatus.AdministrationHeadApproved, "160111"));

        // 4. Director General (مدیر کل) has province-wide access without assigned offices
        var dg = User.Create("dg", "dg@tax.gov.ir", "hash", "DirectorGeneral");
        Assert.True(dg.HasAccessToTaxHierarchy("160111"));
        Assert.True(dg.HasAccessToTaxHierarchy("161012"));
        Assert.True(dg.CanVerifyStage(RefundCaseStatus.DirectorGeneralApproved, "161012"));

        // 5. Treasury (ذیحساب) has province-wide access without assigned offices
        var treasury = User.Create("treasury", "tr@tax.gov.ir", "hash", "Treasury");
        Assert.True(treasury.HasAccessToTaxHierarchy("160111"));
        Assert.True(treasury.HasAccessToTaxHierarchy("161012"));
        Assert.True(treasury.CanVerifyStage(RefundCaseStatus.TreasuryDisbursed, "161012"));
    }
}
