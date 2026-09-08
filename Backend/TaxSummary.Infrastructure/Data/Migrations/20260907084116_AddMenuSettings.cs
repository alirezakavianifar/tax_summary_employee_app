using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMenuSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MenuSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    MenuKey = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    ParentKey = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Route = table.Column<string>(type: "TEXT", maxLength: 250, nullable: false),
                    IconName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    IsVisible = table.Column<bool>(type: "INTEGER", nullable: false),
                    AdminOnly = table.Column<bool>(type: "INTEGER", nullable: false),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedByUserId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuSettings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MenuSettings_DisplayOrder",
                table: "MenuSettings",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_MenuSettings_MenuKey",
                table: "MenuSettings",
                column: "MenuKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MenuSettings_ParentKey",
                table: "MenuSettings",
                column: "ParentKey");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MenuSettings");
        }
    }
}
