using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRefundWorkflowStepsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CycleCode",
                table: "PayrollCycles",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "RefundWorkflowSteps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Stage = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    StepOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsMandatory = table.Column<bool>(type: "INTEGER", nullable: false),
                    AllowedRoles = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefundWorkflowSteps", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PayrollCycles_CycleCode",
                table: "PayrollCycles",
                column: "CycleCode");

            migrationBuilder.CreateIndex(
                name: "IX_RefundWorkflowSteps_Stage",
                table: "RefundWorkflowSteps",
                column: "Stage",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefundWorkflowSteps_StepOrder",
                table: "RefundWorkflowSteps",
                column: "StepOrder");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RefundWorkflowSteps");

            migrationBuilder.DropIndex(
                name: "IX_PayrollCycles_CycleCode",
                table: "PayrollCycles");

            migrationBuilder.DropColumn(
                name: "CycleCode",
                table: "PayrollCycles");
        }
    }
}
