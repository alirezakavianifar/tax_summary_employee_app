using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTaxRefundDocumentsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TaxRefundDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TaxRefundCaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    DocumentType = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    OriginalFileName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    StoredFileName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    FileSize = table.Column<long>(type: "INTEGER", nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    UploadDateJalali = table.Column<string>(type: "TEXT", maxLength: 15, nullable: false),
                    UploadedByUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UploadedByUserName = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    RelatedReceiptId = table.Column<Guid>(type: "TEXT", nullable: true),
                    RelatedLetterId = table.Column<Guid>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxRefundDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaxRefundDocuments_TaxRefundCases_TaxRefundCaseId",
                        column: x => x.TaxRefundCaseId,
                        principalTable: "TaxRefundCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundDocuments_RelatedLetterId",
                table: "TaxRefundDocuments",
                column: "RelatedLetterId");

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundDocuments_RelatedReceiptId",
                table: "TaxRefundDocuments",
                column: "RelatedReceiptId");

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundDocuments_TaxRefundCaseId",
                table: "TaxRefundDocuments",
                column: "TaxRefundCaseId");

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundDocuments_TaxRefundCaseId_DocumentType",
                table: "TaxRefundDocuments",
                columns: new[] { "TaxRefundCaseId", "DocumentType" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaxRefundDocuments");
        }
    }
}
