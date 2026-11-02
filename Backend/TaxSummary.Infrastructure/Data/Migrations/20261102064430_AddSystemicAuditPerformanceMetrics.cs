using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemicAuditPerformanceMetrics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "SystemicAudit1399_FinalizedObjectionPercentage",
                table: "PerformanceCapabilities",
                type: "DECIMAL(8,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "SystemicAudit1399_FinalizedObjectionQuantity",
                table: "PerformanceCapabilities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "SystemicAudit1399_ObjectionPercentage",
                table: "PerformanceCapabilities",
                type: "DECIMAL(8,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "SystemicAudit1399_ObjectionQuantity",
                table: "PerformanceCapabilities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SystemicAudit1399_TotalQuantity",
                table: "PerformanceCapabilities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "SystemicAudit1403_FinalizedObjectionPercentage",
                table: "PerformanceCapabilities",
                type: "DECIMAL(8,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "SystemicAudit1403_FinalizedObjectionQuantity",
                table: "PerformanceCapabilities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "SystemicAudit1403_ObjectionPercentage",
                table: "PerformanceCapabilities",
                type: "DECIMAL(8,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "SystemicAudit1403_ObjectionQuantity",
                table: "PerformanceCapabilities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SystemicAudit1403_TotalQuantity",
                table: "PerformanceCapabilities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SystemicAudit1399_FinalizedObjectionPercentage",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "SystemicAudit1399_FinalizedObjectionQuantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "SystemicAudit1399_ObjectionPercentage",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "SystemicAudit1399_ObjectionQuantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "SystemicAudit1399_TotalQuantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "SystemicAudit1403_FinalizedObjectionPercentage",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "SystemicAudit1403_FinalizedObjectionQuantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "SystemicAudit1403_ObjectionPercentage",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "SystemicAudit1403_ObjectionQuantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "SystemicAudit1403_TotalQuantity",
                table: "PerformanceCapabilities");
        }
    }
}
