using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCollaborativePayrollCycles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PayrollCycles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    ProcessType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    FiscalYear = table.Column<int>(type: "INTEGER", nullable: false),
                    FiscalMonth = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Deadline = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FinalizedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    FinalizedByUserId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollCycles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PayrollCycles_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PayrollCycles_Users_FinalizedByUserId",
                        column: x => x.FinalizedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PayrollDepartmentEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PayrollCycleId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DepartmentName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    BaseOvertimeCap = table.Column<double>(type: "REAL", nullable: true),
                    BaseWelfareCap = table.Column<double>(type: "REAL", nullable: true),
                    BaseBonusCap = table.Column<double>(type: "REAL", nullable: true),
                    SubmittedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ApprovedByUserId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    RejectionReason = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollDepartmentEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PayrollDepartmentEntries_PayrollCycles_PayrollCycleId",
                        column: x => x.PayrollCycleId,
                        principalTable: "PayrollCycles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PayrollDepartmentEntries_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PayrollDepartmentEntries_Users_SubmittedByUserId",
                        column: x => x.SubmittedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PayrollEmployeeItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    DepartmentEntryId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PersonnelNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    EmployeeName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    InitialOvertimeRate = table.Column<double>(type: "REAL", nullable: true),
                    AdjustedOvertimeRate = table.Column<double>(type: "REAL", nullable: true),
                    BaseOvertimeAmount = table.Column<double>(type: "REAL", nullable: true),
                    CalculatedOvertimeAmount = table.Column<long>(type: "INTEGER", nullable: true),
                    InitialWelfareRate = table.Column<double>(type: "REAL", nullable: true),
                    AdjustedWelfareRate = table.Column<double>(type: "REAL", nullable: true),
                    BaseWelfareAmount = table.Column<double>(type: "REAL", nullable: true),
                    CalculatedWelfareAmount = table.Column<long>(type: "INTEGER", nullable: true),
                    BaseBonusAmount = table.Column<double>(type: "REAL", nullable: true),
                    OfficerNotes = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsExcluded = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollEmployeeItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PayrollEmployeeItems_PayrollDepartmentEntries_DepartmentEntryId",
                        column: x => x.DepartmentEntryId,
                        principalTable: "PayrollDepartmentEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PayrollCycles_CreatedByUserId",
                table: "PayrollCycles",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PayrollCycles_FinalizedByUserId",
                table: "PayrollCycles",
                column: "FinalizedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PayrollCycles_FiscalYear_FiscalMonth",
                table: "PayrollCycles",
                columns: new[] { "FiscalYear", "FiscalMonth" });

            migrationBuilder.CreateIndex(
                name: "IX_PayrollCycles_Status",
                table: "PayrollCycles",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_PayrollDepartmentEntries_ApprovedByUserId",
                table: "PayrollDepartmentEntries",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PayrollDepartmentEntries_PayrollCycleId_DepartmentName",
                table: "PayrollDepartmentEntries",
                columns: new[] { "PayrollCycleId", "DepartmentName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PayrollDepartmentEntries_Status",
                table: "PayrollDepartmentEntries",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_PayrollDepartmentEntries_SubmittedByUserId",
                table: "PayrollDepartmentEntries",
                column: "SubmittedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PayrollEmployeeItems_DepartmentEntryId_PersonnelNumber",
                table: "PayrollEmployeeItems",
                columns: new[] { "DepartmentEntryId", "PersonnelNumber" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PayrollEmployeeItems");

            migrationBuilder.DropTable(
                name: "PayrollDepartmentEntries");

            migrationBuilder.DropTable(
                name: "PayrollCycles");
        }
    }
}
