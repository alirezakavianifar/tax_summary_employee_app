using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCapabilityMetrics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CompanyIdentification_Amount",
                table: "PerformanceCapabilities",
                type: "DECIMAL(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "CompanyIdentification_Quantity",
                table: "PerformanceCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "DetectionOfTaxEvasion_Amount",
                table: "PerformanceCapabilities",
                type: "DECIMAL(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "DetectionOfTaxEvasion_Quantity",
                table: "PerformanceCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "DetectionOfTaxIssues_Amount",
                table: "PerformanceCapabilities",
                type: "DECIMAL(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "DetectionOfTaxIssues_Quantity",
                table: "PerformanceCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ReferredOrExecuted_Amount",
                table: "PerformanceCapabilities",
                type: "DECIMAL(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ReferredOrExecuted_Quantity",
                table: "PerformanceCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ValueAddedRecognition_Amount",
                table: "PerformanceCapabilities",
                type: "DECIMAL(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "ValueAddedRecognition_Quantity",
                table: "PerformanceCapabilities",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompanyIdentification_Amount",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "CompanyIdentification_Quantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "DetectionOfTaxEvasion_Amount",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "DetectionOfTaxEvasion_Quantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "DetectionOfTaxIssues_Amount",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "DetectionOfTaxIssues_Quantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "ReferredOrExecuted_Amount",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "ReferredOrExecuted_Quantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "ValueAddedRecognition_Amount",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "ValueAddedRecognition_Quantity",
                table: "PerformanceCapabilities");
        }
    }
}
