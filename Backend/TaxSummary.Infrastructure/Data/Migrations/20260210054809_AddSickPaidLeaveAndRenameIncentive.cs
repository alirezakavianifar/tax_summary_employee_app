using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSickPaidLeaveAndRenameIncentive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IncentiveHours",
                table: "AdministrativeStatuses",
                newName: "SickLeaveDays");

            migrationBuilder.AddColumn<int>(
                name: "OvertimeHours",
                table: "AdministrativeStatuses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PaidLeaveDays",
                table: "AdministrativeStatuses",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OvertimeHours",
                table: "AdministrativeStatuses");

            migrationBuilder.DropColumn(
                name: "PaidLeaveDays",
                table: "AdministrativeStatuses");

            migrationBuilder.RenameColumn(
                name: "SickLeaveDays",
                table: "AdministrativeStatuses",
                newName: "IncentiveHours");
        }
    }
}
