using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCycleCodeToPayrollCycles : Migration
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

            migrationBuilder.CreateIndex(
                name: "IX_PayrollCycles_CycleCode",
                table: "PayrollCycles",
                column: "CycleCode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PayrollCycles_CycleCode",
                table: "PayrollCycles");

            migrationBuilder.DropColumn(
                name: "CycleCode",
                table: "PayrollCycles");
        }
    }
}
