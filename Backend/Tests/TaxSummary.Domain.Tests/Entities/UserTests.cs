using TaxSummary.Domain.Entities;
using Xunit;

namespace TaxSummary.Domain.Tests.Entities;

public class UserTests
{
    [Theory]
    [InlineData("Admin")]
    [InlineData("OfficeHead")]
    [InlineData("GroupHead")]
    [InlineData("Expert")]
    [InlineData("ITSpecialist")]
    [InlineData("Manager")]
    [InlineData("Employee")]
    public void Create_WithOrganizationalRole_Succeeds(string role)
    {
        var user = User.Create(
            username: "1756914445",
            email: "test@example.com",
            passwordHash: "someHash123",
            role: role
        );

        Assert.Equal("1756914445", user.Username);
        Assert.Equal(role, user.Role);
        Assert.True(user.IsActive);
    }

    [Fact]
    public void Create_WithInvalidRole_ThrowsArgumentException()
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            User.Create(
                username: "1756914445",
                email: null,
                passwordHash: "hash123",
                role: "InvalidRole"
            )
        );

        Assert.Contains("نقش باید یکی از موارد زیر باشد", ex.Message);
    }

    [Fact]
    public void UpdateRole_WithValidRole_UpdatesRole()
    {
        var user = User.Create("1756914445", "test@example.com", "hash123", "Employee");
        user.UpdateRole("Expert");

        Assert.Equal("Expert", user.Role);
    }

    [Fact]
    public void UpdateDetails_WithValidRoleAndUsername_UpdatesSuccessfully()
    {
        var user = User.Create("1756914445", "test@example.com", "hash123", "Employee");
        var employeeId = Guid.NewGuid();

        user.UpdateDetails("new@example.com", "GroupHead", true, employeeId, "0012345678");

        Assert.Equal("0012345678", user.Username);
        Assert.Equal("GroupHead", user.Role);
        Assert.Equal("new@example.com", user.Email);
        Assert.Equal(employeeId, user.EmployeeId);
    }
}
