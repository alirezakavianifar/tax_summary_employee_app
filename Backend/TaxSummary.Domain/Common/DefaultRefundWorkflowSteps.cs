using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Common;

/// <summary>
/// Default statutory 5-tier workflow configuration for the Tax Refund module.
/// پیکربندی پیش‌فرض گردش‌کار ۵ مرحله‌ای استرداد مالیات مطابق قانون
/// </summary>
public static class DefaultRefundWorkflowSteps
{
    public static List<RefundWorkflowStep> GetDefaults()
    {
        return new List<RefundWorkflowStep>
        {
            RefundWorkflowStep.Create(
                stage: RefundCaseStatus.Audited,
                title: "گزارش توجیهی و تایید کارشناس ارشد",
                description: "بررسی اسناد، فیش‌ها، احراز قطعیت مالیات و تنظیم گزارش توجیهی استرداد مالیاتی (ممیز / کارشناس ارشد)",
                stepOrder: 10,
                isEnabled: true,
                isMandatory: true,
                allowedRoles: "Expert,Auditor,GroupHead,OfficeHead,Admin"
            ),
            RefundWorkflowStep.Create(
                stage: RefundCaseStatus.GroupHeadApproved,
                title: "تایید رئیس گروه مالیاتی",
                description: "بررسی و انطباق محاسبات کارشناس ارشد در سطح گروه مالیاتی مربوطه (سطح ۲ سازمانی)",
                stepOrder: 20,
                isEnabled: true,
                isMandatory: false,
                allowedRoles: "GroupHead,OfficeHead,Admin"
            ),
            RefundWorkflowStep.Create(
                stage: RefundCaseStatus.AdministrationHeadApproved,
                title: "دستور استرداد رئیس امور مالیاتی",
                description: "صدور برگ استرداد و دستور پرداخت نهایی توسط رئیس اداره/امور مالیاتی (سطح ۱ سازمانی)",
                stepOrder: 30,
                isEnabled: true,
                isMandatory: false,
                allowedRoles: "OfficeHead,DirectorGeneral,Admin"
            ),
            RefundWorkflowStep.Create(
                stage: RefundCaseStatus.DirectorGeneralApproved,
                title: "موافقت مدیر کل امور مالیاتی",
                description: "تایید و ارسال پرونده استرداد به ذیحسابی و امور مالی توسط مدیر کل امور مالیاتی استان",
                stepOrder: 40,
                isEnabled: true,
                isMandatory: false,
                allowedRoles: "DirectorGeneral,Admin"
            ),
            RefundWorkflowStep.Create(
                stage: RefundCaseStatus.TreasuryDisbursed,
                title: "پرداخت و ثبت نهایی ذیحسابی",
                description: "انجام عملیات مالی، صدور چک/حواله پایا و تایید تسویه حساب در ذیحسابی و امور مالی",
                stepOrder: 50,
                isEnabled: true,
                isMandatory: true,
                allowedRoles: "Treasury,Admin"
            )
        };
    }
}
