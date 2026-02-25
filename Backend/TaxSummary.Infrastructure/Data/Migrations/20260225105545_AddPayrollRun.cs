using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPayrollRun : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PayrollRuns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProcessType = table.Column<string>(type: "NVARCHAR(50)", maxLength: 50, nullable: false),
                    RunLabel = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ResultJson = table.Column<string>(type: "TEXT", nullable: false),
                    RowCount = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedById = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollRuns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PayrollRuns_Users_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_PayrollRuns_CreatedAt",
                table: "PayrollRuns",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_PayrollRuns_CreatedById",
                table: "PayrollRuns",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_PayrollRuns_CreatedByUserId",
                table: "PayrollRuns",
                column: "CreatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PayrollRuns");
        }
    }
}
