using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PersonnelNumber = table.Column<string>(type: "NVARCHAR(50)", maxLength: 50, nullable: false),
                    FirstName = table.Column<string>(type: "NVARCHAR(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "NVARCHAR(100)", maxLength: 100, nullable: false),
                    Education = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    ServiceUnit = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    CurrentPosition = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    AppointmentPosition = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    PreviousExperienceYears = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdministrativeStatuses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MissionDays = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    IncentiveHours = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    DelayAndAbsenceHours = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    HourlyLeaveHours = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdministrativeStatuses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdministrativeStatuses_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PerformanceCapabilities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SystemRole = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    DetectionOfTaxIssues = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    DetectionOfTaxEvasion = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CompanyIdentification = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    ValueAddedRecognition = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    ReferredOrExecuted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "DATETIME2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerformanceCapabilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PerformanceCapabilities_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdministrativeStatuses_DelayAndAbsenceHours",
                table: "AdministrativeStatuses",
                column: "DelayAndAbsenceHours");

            migrationBuilder.CreateIndex(
                name: "IX_AdministrativeStatuses_EmployeeId",
                table: "AdministrativeStatuses",
                column: "EmployeeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_CreatedAt",
                table: "Employees",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_LastName",
                table: "Employees",
                column: "LastName");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_PersonnelNumber",
                table: "Employees",
                column: "PersonnelNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_ServiceUnit",
                table: "Employees",
                column: "ServiceUnit");

            migrationBuilder.CreateIndex(
                name: "IX_PerformanceCapabilities_EmployeeId",
                table: "PerformanceCapabilities",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_PerformanceCapabilities_SystemRole",
                table: "PerformanceCapabilities",
                column: "SystemRole");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdministrativeStatuses");

            migrationBuilder.DropTable(
                name: "PerformanceCapabilities");

            migrationBuilder.DropTable(
                name: "Employees");
        }
    }
}
