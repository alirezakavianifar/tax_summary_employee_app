using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExtendedTaxPerformanceMetrics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompanyIdentification_UndetectedQuantity",
                table: "PerformanceCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "Jobs_Amount",
                table: "PerformanceCapabilities",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "Jobs_Quantity",
                table: "PerformanceCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Jobs_UndetectedQuantity",
                table: "PerformanceCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "Other_Amount",
                table: "PerformanceCapabilities",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "Other_Quantity",
                table: "PerformanceCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Other_UndetectedQuantity",
                table: "PerformanceCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ValueAddedRecognition_UndetectedQuantity",
                table: "PerformanceCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompanyIdentification_UndetectedQuantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "Jobs_Amount",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "Jobs_Quantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "Jobs_UndetectedQuantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "Other_Amount",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "Other_Quantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "Other_UndetectedQuantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "ValueAddedRecognition_UndetectedQuantity",
                table: "PerformanceCapabilities");
        }
    }
}
