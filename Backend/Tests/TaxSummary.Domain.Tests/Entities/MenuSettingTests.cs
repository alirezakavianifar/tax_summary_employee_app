using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Domain.Tests.Entities;

public class MenuSettingTests
{
    [Fact]
    public void Create_DefaultAllowedRoles_SetsAdminManagerEmployee()
    {
        var setting = MenuSetting.Create(
            menuKey: "module_test",
            title: "تست",
            route: "/test",
            adminOnly: false
        );

        Assert.Equal("module_test", setting.MenuKey);
        Assert.False(setting.AdminOnly);
        Assert.Equal("Admin,OfficeHead,GroupHead,Expert,ITSpecialist,Manager,Employee", setting.AllowedRoles);
        Assert.True(setting.IsRoleAllowed("Admin"));
        Assert.True(setting.IsRoleAllowed("OfficeHead"));
        Assert.True(setting.IsRoleAllowed("GroupHead"));
        Assert.True(setting.IsRoleAllowed("Expert"));
        Assert.True(setting.IsRoleAllowed("ITSpecialist"));
        Assert.True(setting.IsRoleAllowed("Manager"));
        Assert.True(setting.IsRoleAllowed("Employee"));
    }

    [Fact]
    public void Create_AdminOnlyTrue_SetsAdminRoleOnly()
    {
        var setting = MenuSetting.Create(
            menuKey: "module_admin_test",
            title: "پنل مدیریت",
            route: "/admin/test",
            adminOnly: true
        );

        Assert.True(setting.AdminOnly);
        Assert.Equal("Admin", setting.AllowedRoles);
        Assert.True(setting.IsRoleAllowed("Admin"));
        Assert.False(setting.IsRoleAllowed("Manager"));
        Assert.False(setting.IsRoleAllowed("Employee"));
    }

    [Fact]
    public void UpdateRoles_UpdatesAllowedRolesAndSynchronizesAdminOnly()
    {
        var setting = MenuSetting.Create(
            menuKey: "module_test",
            title: "تست",
            route: "/test",
            adminOnly: false
        );

        // Revoke Employee, allow Admin and Manager
        setting.UpdateRoles(new[] { "Admin", "Manager" });

        Assert.False(setting.AdminOnly);
        Assert.True(setting.IsRoleAllowed("Admin"));
        Assert.True(setting.IsRoleAllowed("Manager"));
        Assert.False(setting.IsRoleAllowed("Employee"));

        // Revoke both Manager and Employee -> becomes Admin-only
        setting.UpdateRoles(new[] { "Admin" });

        Assert.True(setting.AdminOnly);
        Assert.True(setting.IsRoleAllowed("Admin"));
        Assert.False(setting.IsRoleAllowed("Manager"));
        Assert.False(setting.IsRoleAllowed("Employee"));
    }

    [Fact]
    public void IsRoleAllowed_AdminRole_AlwaysReturnsTrue()
    {
        var setting = MenuSetting.Create(
            menuKey: "module_restricted",
            title: "محدود",
            route: "/restricted",
            allowedRoles: "Manager"
        );

        Assert.True(setting.IsRoleAllowed("Admin"));
        Assert.True(setting.IsRoleAllowed("Manager"));
        Assert.False(setting.IsRoleAllowed("Employee"));
    }
}
