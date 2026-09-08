using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTaxRefundTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TaxRefundCases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CaseTrackingNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    DocketNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    TaxpayerName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    EconomicCode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    NationalId = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    TaxUnitCode = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Province = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    City = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Address = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    BankName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    ShebaNumber = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    TaxYear = table.Column<int>(type: "INTEGER", nullable: false),
                    Period = table.Column<int>(type: "INTEGER", nullable: false),
                    TaxSource = table.Column<int>(type: "INTEGER", nullable: false),
                    RefundReason = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    AdministrationHeadName = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    GroupHeadName = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    SeniorAuditorName = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Assessment_HasReturnFiled = table.Column<bool>(type: "INTEGER", nullable: false),
                    Assessment_ReturnNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Assessment_ReturnDateJalali = table.Column<string>(type: "TEXT", maxLength: 15, nullable: true),
                    Assessment_FinalizationMethod = table.Column<int>(type: "INTEGER", nullable: false),
                    Assessment_FinalNoticeNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Assessment_FinalNoticeDateJalali = table.Column<string>(type: "TEXT", maxLength: 15, nullable: true),
                    Assessment_AssessedIncome = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    Assessment_Exemptions = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    Assessment_AssessedTax = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    Assessment_NonWaivablePenalties = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    Assessment_TimelyPaymentBonus = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    Breakdown_PrincipalTaxRefund = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    Breakdown_StampDutyRefund = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    Breakdown_OtherRefund = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    Breakdown_PenaltiesRefund = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    Breakdown_DelayDamages = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    FinalizedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxRefundCases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TaxRefundApprovalActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TaxRefundCaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    FromStatus = table.Column<int>(type: "INTEGER", nullable: false),
                    ToStatus = table.Column<int>(type: "INTEGER", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ActorName = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    ActorRole = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    ActionDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxRefundApprovalActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaxRefundApprovalActions_TaxRefundCases_TaxRefundCaseId",
                        column: x => x.TaxRefundCaseId,
                        principalTable: "TaxRefundCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaxRefundLetters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TaxRefundCaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LetterType = table.Column<int>(type: "INTEGER", nullable: false),
                    LetterNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    LetterDateJalali = table.Column<string>(type: "TEXT", maxLength: 15, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    DebtAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    DebtYear = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxRefundLetters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaxRefundLetters_TaxRefundCases_TaxRefundCaseId",
                        column: x => x.TaxRefundCaseId,
                        principalTable: "TaxRefundCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaxRefundReceipts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TaxRefundCaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RowIndex = table.Column<int>(type: "INTEGER", nullable: false),
                    ReceiptNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    IssueDateJalali = table.Column<string>(type: "TEXT", maxLength: 15, nullable: false),
                    PaymentDateJalali = table.Column<string>(type: "TEXT", maxLength: 15, nullable: false),
                    AmountRials = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    BankBranch = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    City = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    RevenueLedgerRow = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaxRefundReceipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaxRefundReceipts_TaxRefundCases_TaxRefundCaseId",
                        column: x => x.TaxRefundCaseId,
                        principalTable: "TaxRefundCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefundableReceiptAllocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TaxRefundCaseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TaxRefundReceiptId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ReceiptNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    TotalReceiptAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    RefundableAmount = table.Column<decimal>(type: "TEXT", precision: 18, scale: 0, nullable: false),
                    BankBranch = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    City = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    RevenueLedgerRow = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefundableReceiptAllocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefundableReceiptAllocations_TaxRefundCases_TaxRefundCaseId",
                        column: x => x.TaxRefundCaseId,
                        principalTable: "TaxRefundCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RefundableReceiptAllocations_TaxRefundReceipts_TaxRefundReceiptId",
                        column: x => x.TaxRefundReceiptId,
                        principalTable: "TaxRefundReceipts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RefundableReceiptAllocations_TaxRefundCaseId_TaxRefundReceiptId",
                table: "RefundableReceiptAllocations",
                columns: new[] { "TaxRefundCaseId", "TaxRefundReceiptId" });

            migrationBuilder.CreateIndex(
                name: "IX_RefundableReceiptAllocations_TaxRefundReceiptId",
                table: "RefundableReceiptAllocations",
                column: "TaxRefundReceiptId");

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundApprovalActions_TaxRefundCaseId_ActionDate",
                table: "TaxRefundApprovalActions",
                columns: new[] { "TaxRefundCaseId", "ActionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundCases_CaseTrackingNumber",
                table: "TaxRefundCases",
                column: "CaseTrackingNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundCases_EconomicCode",
                table: "TaxRefundCases",
                column: "EconomicCode");

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundCases_Status",
                table: "TaxRefundCases",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundCases_TaxpayerName_TaxYear",
                table: "TaxRefundCases",
                columns: new[] { "TaxpayerName", "TaxYear" });

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundCases_TaxYear",
                table: "TaxRefundCases",
                column: "TaxYear");

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundLetters_TaxRefundCaseId_LetterType",
                table: "TaxRefundLetters",
                columns: new[] { "TaxRefundCaseId", "LetterType" });

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundReceipts_ReceiptNumber",
                table: "TaxRefundReceipts",
                column: "ReceiptNumber");

            migrationBuilder.CreateIndex(
                name: "IX_TaxRefundReceipts_TaxRefundCaseId_RowIndex",
                table: "TaxRefundReceipts",
                columns: new[] { "TaxRefundCaseId", "RowIndex" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RefundableReceiptAllocations");

            migrationBuilder.DropTable(
                name: "TaxRefundApprovalActions");

            migrationBuilder.DropTable(
                name: "TaxRefundLetters");

            migrationBuilder.DropTable(
                name: "TaxRefundReceipts");

            migrationBuilder.DropTable(
                name: "TaxRefundCases");
        }
    }
}
