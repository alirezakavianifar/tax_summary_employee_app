using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReportingSubsystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReportDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false, defaultValue: ""),
                    DomainSource = table.Column<int>(type: "INTEGER", nullable: false),
                    Category = table.Column<int>(type: "INTEGER", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    ConfigurationJson = table.Column<string>(type: "TEXT", nullable: false),
                    IsSystemReport = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    RequiredRole = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportDefinitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReportDefinitions_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ReportExecutionLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ReportDefinitionId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ReportCode = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Username = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    ExecutedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ExecutionDurationMs = table.Column<long>(type: "INTEGER", nullable: false),
                    ResultRowCount = table.Column<int>(type: "INTEGER", nullable: false),
                    AppliedFiltersSummary = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    ExportFormat = table.Column<string>(type: "TEXT", maxLength: 32, nullable: true),
                    ClientIpAddress = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportExecutionLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SavedReportPresets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ReportDefinitionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PresetName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    FilterCriteriaJson = table.Column<string>(type: "TEXT", nullable: false),
                    VisibleColumnsJson = table.Column<string>(type: "TEXT", nullable: true),
                    IsSharedWithOffice = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    OfficeId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedReportPresets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SavedReportPresets_ReportDefinitions_ReportDefinitionId",
                        column: x => x.ReportDefinitionId,
                        principalTable: "ReportDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SavedReportPresets_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReportDefinitions_Category",
                table: "ReportDefinitions",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_ReportDefinitions_Code",
                table: "ReportDefinitions",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReportDefinitions_CreatedByUserId",
                table: "ReportDefinitions",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportDefinitions_DomainSource",
                table: "ReportDefinitions",
                column: "DomainSource");

            migrationBuilder.CreateIndex(
                name: "IX_ReportDefinitions_IsActive",
                table: "ReportDefinitions",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_ReportExecutionLogs_ExecutedAt",
                table: "ReportExecutionLogs",
                column: "ExecutedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ReportExecutionLogs_ReportCode",
                table: "ReportExecutionLogs",
                column: "ReportCode");

            migrationBuilder.CreateIndex(
                name: "IX_ReportExecutionLogs_UserId",
                table: "ReportExecutionLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedReportPresets_OfficeId",
                table: "SavedReportPresets",
                column: "OfficeId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedReportPresets_ReportDefinitionId",
                table: "SavedReportPresets",
                column: "ReportDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedReportPresets_User_Report",
                table: "SavedReportPresets",
                columns: new[] { "UserId", "ReportDefinitionId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReportExecutionLogs");

            migrationBuilder.DropTable(
                name: "SavedReportPresets");

            migrationBuilder.DropTable(
                name: "ReportDefinitions");
        }
    }
}
