using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTaxRefundCaseOfficeHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GroupCode",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OfficeCode",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "OfficeId",
                table: "TaxRefundCases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundCases_GroupCode",
                table: "TaxRefundCases",
                column: "GroupCode");

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundCases_OfficeCode",
                table: "TaxRefundCases",
                column: "OfficeCode");

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundCases_OfficeId_Status",
                table: "TaxRefundCases",
                columns: new[] { "OfficeId", "Status" });

            migrationBuilder.AddForeignKey(
                name: "FK_TaxRefundCases_Offices_OfficeId",
                table: "TaxRefundCases",
                column: "OfficeId",
                principalTable: "Offices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaxRefundCases_Offices_OfficeId",
                table: "TaxRefundCases");

            migrationBuilder.DropIndex(
                name: "IX_TaxRefundCases_GroupCode",
                table: "TaxRefundCases");

            migrationBuilder.DropIndex(
                name: "IX_TaxRefundCases_OfficeCode",
                table: "TaxRefundCases");

            migrationBuilder.DropIndex(
                name: "IX_TaxRefundCases_OfficeId_Status",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "GroupCode",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "OfficeCode",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "OfficeId",
                table: "TaxRefundCases");
        }
    }
}
