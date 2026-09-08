using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaxSummary.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddJustificationReportToTaxRefundCase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "JustificationReport_AdministrationHeadApprovalText",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JustificationReport_AuditExaminationFindings",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "JustificationReport_AuditorConclusion",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "JustificationReport_AuditorSignatureDate",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 15,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "JustificationReport_AuditorUserId",
                table: "TaxRefundCases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JustificationReport_AuditorUserName",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "JustificationReport_FinalizedAt",
                table: "TaxRefundCases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JustificationReport_GroupHeadOpinionText",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JustificationReport_InquiriesAndDebtClearanceSummary",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "JustificationReport_IsFinalized",
                table: "TaxRefundCases",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "JustificationReport_LegalGroundsAndReasoning",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "JustificationReport_ReceiptsVerificationNotes",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "JustificationReport_RecommendedRefundAmount",
                table: "TaxRefundCases",
                type: "TEXT",
                precision: 18,
                scale: 0,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "JustificationReport_ReportDateJalali",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 15,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "JustificationReport_ReportNumber",
                table: "TaxRefundCases",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JustificationReport_AdministrationHeadApprovalText",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_AuditExaminationFindings",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_AuditorConclusion",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_AuditorSignatureDate",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_AuditorUserId",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_AuditorUserName",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_FinalizedAt",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_GroupHeadOpinionText",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_InquiriesAndDebtClearanceSummary",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_IsFinalized",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_LegalGroundsAndReasoning",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_ReceiptsVerificationNotes",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_RecommendedRefundAmount",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_ReportDateJalali",
                table: "TaxRefundCases");

            migrationBuilder.DropColumn(
                name: "JustificationReport_ReportNumber",
                table: "TaxRefundCases");
        }
    }
}
