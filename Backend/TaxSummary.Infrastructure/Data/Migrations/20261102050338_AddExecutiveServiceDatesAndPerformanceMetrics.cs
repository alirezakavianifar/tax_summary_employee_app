using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExecutiveServiceDatesAndPerformanceMetrics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Collections1404_Amount",
                table: "PerformanceCapabilities",
                type: "DECIMAL(24,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Collections1405_Amount",
                table: "PerformanceCapabilities",
                type: "DECIMAL(24,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "FinalizedObjections_Quantity",
                table: "PerformanceCapabilities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "FinalizedRulings_Percentage",
                table: "PerformanceCapabilities",
                type: "DECIMAL(8,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "IssuedRulings_Percentage",
                table: "PerformanceCapabilities",
                type: "DECIMAL(8,4)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "IssuedRulings_Quantity",
                table: "PerformanceCapabilities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalObjections_Quantity",
                table: "PerformanceCapabilities",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "AppointmentDate",
                table: "Employees",
                type: "NVARCHAR(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmploymentDate",
                table: "Employees",
                type: "NVARCHAR(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ServiceMonths",
                table: "Employees",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "AuditorPerformanceMetricDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    MetricCode = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Category = table.Column<int>(type: "INTEGER", nullable: false),
                    FormulaType = table.Column<int>(type: "INTEGER", nullable: false),
                    PrimaryField = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    SecondaryField = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    Multiplier = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WeightPercentage = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    HigherIsBetter = table.Column<bool>(type: "INTEGER", nullable: false),
                    TargetValue = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    WarningThreshold = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    CriticalThreshold = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    Unit = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    TierThresholdsJson = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditorPerformanceMetricDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SanimAuditAssessments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false),
                    UpdateDateJalali = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    AuditStatus = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    FinalOfficeName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    InitialOfficeName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    DeclarationId = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    TaxpayerTrackingCode = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    TaxpayerName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    TaxpayerTin = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    FiscalYear = table.Column<int>(type: "INTEGER", nullable: false),
                    TaxSource = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    TaxPeriod = table.Column<int>(type: "INTEGER", nullable: true),
                    RiskLevel = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    AuditTrackingId = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    AuditorName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    AuditorNationalId = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    AssessmentNoticeDateJalali = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    FinalNoticeDateJalali = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    AssessedTaxAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DeclaredTaxAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FinalTaxAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Stage = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    YearlyType = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    CaseType = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    WarehouseUploadDateJalali = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    AuditorAssignmentDateJalali = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    DaysAssignmentToNotice = table.Column<int>(type: "INTEGER", nullable: true),
                    DaysAssignmentToFinal = table.Column<int>(type: "INTEGER", nullable: true),
                    DaysNoticeToFinal = table.Column<int>(type: "INTEGER", nullable: true),
                    CurrentStatus = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    NextStatus = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    FinalizationSource = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    OfficeId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SanimAuditAssessments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditorPerformanceMetricDefinitions_DisplayOrder",
                table: "AuditorPerformanceMetricDefinitions",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_AuditorPerformanceMetricDefinitions_IsActive",
                table: "AuditorPerformanceMetricDefinitions",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AuditorPerformanceMetricDefinitions_MetricCode",
                table: "AuditorPerformanceMetricDefinitions",
                column: "MetricCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SanimAuditAssessments_AuditorName",
                table: "SanimAuditAssessments",
                column: "AuditorName");

            migrationBuilder.CreateIndex(
                name: "IX_SanimAuditAssessments_AuditStatus",
                table: "SanimAuditAssessments",
                column: "AuditStatus");

            migrationBuilder.CreateIndex(
                name: "IX_SanimAuditAssessments_FinalOfficeName",
                table: "SanimAuditAssessments",
                column: "FinalOfficeName");

            migrationBuilder.CreateIndex(
                name: "IX_SanimAuditAssessments_FiscalYear",
                table: "SanimAuditAssessments",
                column: "FiscalYear");

            migrationBuilder.CreateIndex(
                name: "IX_SanimAuditAssessments_OfficeId",
                table: "SanimAuditAssessments",
                column: "OfficeId");

            migrationBuilder.CreateIndex(
                name: "IX_SanimAuditAssessments_TaxpayerTin",
                table: "SanimAuditAssessments",
                column: "TaxpayerTin");

            migrationBuilder.CreateIndex(
                name: "IX_SanimAuditAssessments_TaxSource",
                table: "SanimAuditAssessments",
                column: "TaxSource");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditorPerformanceMetricDefinitions");

            migrationBuilder.DropTable(
                name: "SanimAuditAssessments");

            migrationBuilder.DropColumn(
                name: "Collections1404_Amount",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "Collections1405_Amount",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "FinalizedObjections_Quantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "FinalizedRulings_Percentage",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "IssuedRulings_Percentage",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "IssuedRulings_Quantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "TotalObjections_Quantity",
                table: "PerformanceCapabilities");

            migrationBuilder.DropColumn(
                name: "AppointmentDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "EmploymentDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ServiceMonths",
                table: "Employees");
        }
    }
}
