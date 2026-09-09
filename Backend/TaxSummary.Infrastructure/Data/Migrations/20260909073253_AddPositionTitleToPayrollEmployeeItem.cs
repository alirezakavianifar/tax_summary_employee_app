using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPositionTitleToPayrollEmployeeItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PositionTitle",
                table: "PayrollEmployeeItems",
                type: "TEXT",
                maxLength: 150,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PositionTitle",
                table: "PayrollEmployeeItems");
        }
    }
}
