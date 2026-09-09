using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPayrollRulesEnforcementAndDeputyTier : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "AdjustedBonusAmount",
                table: "PayrollEmployeeItems",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsLaborPosition",
                table: "PayrollEmployeeItems",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "MaxBonusLimit",
                table: "PayrollEmployeeItems",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MaxOvertimeLimit",
                table: "PayrollEmployeeItems",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PositionTier",
                table: "PayrollEmployeeItems",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeputyApprovedAt",
                table: "PayrollDepartmentEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeputyApprovedByUserId",
                table: "PayrollDepartmentEntries",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "GroupHeadBonusCap",
                table: "PayrollDepartmentEntries",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "OtherStaffBonusCap",
                table: "PayrollDepartmentEntries",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "SeniorExpertBonusCap",
                table: "PayrollDepartmentEntries",
                type: "REAL",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PayrollDepartmentEntries_DeputyApprovedByUserId",
                table: "PayrollDepartmentEntries",
                column: "DeputyApprovedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PayrollDepartmentEntries_Users_DeputyApprovedByUserId",
                table: "PayrollDepartmentEntries",
                column: "DeputyApprovedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PayrollDepartmentEntries_Users_DeputyApprovedByUserId",
                table: "PayrollDepartmentEntries");

            migrationBuilder.DropIndex(
                name: "IX_PayrollDepartmentEntries_DeputyApprovedByUserId",
                table: "PayrollDepartmentEntries");

            migrationBuilder.DropColumn(
                name: "AdjustedBonusAmount",
                table: "PayrollEmployeeItems");

            migrationBuilder.DropColumn(
                name: "IsLaborPosition",
                table: "PayrollEmployeeItems");

            migrationBuilder.DropColumn(
                name: "MaxBonusLimit",
                table: "PayrollEmployeeItems");

            migrationBuilder.DropColumn(
                name: "MaxOvertimeLimit",
                table: "PayrollEmployeeItems");

            migrationBuilder.DropColumn(
                name: "PositionTier",
                table: "PayrollEmployeeItems");

            migrationBuilder.DropColumn(
                name: "DeputyApprovedAt",
                table: "PayrollDepartmentEntries");

            migrationBuilder.DropColumn(
                name: "DeputyApprovedByUserId",
                table: "PayrollDepartmentEntries");

            migrationBuilder.DropColumn(
                name: "GroupHeadBonusCap",
                table: "PayrollDepartmentEntries");

            migrationBuilder.DropColumn(
                name: "OtherStaffBonusCap",
                table: "PayrollDepartmentEntries");

            migrationBuilder.DropColumn(
                name: "SeniorExpertBonusCap",
                table: "PayrollDepartmentEntries");
        }
    }
}
