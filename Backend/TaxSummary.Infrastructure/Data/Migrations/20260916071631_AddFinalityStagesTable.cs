using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFinalityStagesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TaxFinalityStages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    IsSystem = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxFinalityStages", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaxFinalityStages_Code",
                table: "TaxFinalityStages",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaxFinalityStages");
        }
    }
}
