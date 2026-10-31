using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Enums;

namespace TaxSummary.Infrastructure.Data;

/// <summary>
/// Seeds the 10 standard enterprise Persian reports into the database.
/// </summary>
public static class ReportingDataSeeder
{
    public static async Task SeedReportingAsync(TaxSummaryDbContext context)
    {
        // 1. REP_PAYROLL_BUDGET_UTIL
        await UpsertReportAsync(context, ReportDefinition.Create(
            code: "REP_PAYROLL_BUDGET_UTIL",
            title: "گزارش مصرف بودجه اضافه کار به تفکیک ادارات",
            description: "پایش انحراف بودجه مصوب در برابر اضافه کار واقعی پرداخت شده به تفکیک ادارات تابعه",
            source: ReportDomainSource.PayrollAndWelfare,
            category: ReportCategory.Financial,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\":[{\"fieldName\":\"departmentName\",\"persianLabel\":\"اداره\",\"dataType\":\"string\"},{\"fieldName\":\"allocatedBudget\",\"persianLabel\":\"بودجه مصوب (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"consumedAmount\",\"persianLabel\":\"پرداختی واقعی (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"variance\",\"persianLabel\":\"انحراف بودجه (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"utilizationRate\",\"persianLabel\":\"درصد مصرف\",\"dataType\":\"number\"},{\"fieldName\":\"employeeCount\",\"persianLabel\":\"تعداد پرسنل\",\"dataType\":\"number\",\"hasAggregateSum\":true}]}",
            isSystemReport: true,
            requiredRole: "Manager"));

        // 2. REP_PAYROLL_LABOR_CAP
        await UpsertReportAsync(context, ReportDefinition.Create(
            code: "REP_PAYROLL_LABOR_CAP",
            title: "گزارش کنترل سقف ۱۲۰ ساعت مشاغل کارگری",
            description: "کنترل قانونی عدم تجاوز ساعات اضافه کاری پرسنل مشاغل کارگری از سقف مجاز ۱۲۰ ساعت",
            source: ReportDomainSource.PayrollAndWelfare,
            category: ReportCategory.ComplianceAndAudit,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\":[{\"fieldName\":\"personnelNumber\",\"persianLabel\":\"شماره پرسنلی\",\"dataType\":\"string\"},{\"fieldName\":\"employeeName\",\"persianLabel\":\"نام کارمند\",\"dataType\":\"string\"},{\"fieldName\":\"department\",\"persianLabel\":\"اداره\",\"dataType\":\"string\"},{\"fieldName\":\"overtimeHours\",\"persianLabel\":\"ساعت اضافه کار\",\"dataType\":\"number\",\"hasAggregateSum\":true},{\"fieldName\":\"violationStatus\",\"persianLabel\":\"وضعیت سقف ۱۲۰ ساعت\",\"dataType\":\"badge\"},{\"fieldName\":\"overtimeAmount\",\"persianLabel\":\"مبلغ اضافه کار (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true}]}",
            isSystemReport: true,
            requiredRole: "Manager"));

        // 3. REP_PAYROLL_MONTHLY_DEPT
        await UpsertReportAsync(context, ReportDefinition.Create(
            code: "REP_PAYROLL_MONTHLY_DEPT",
            title: "گزارش جامع حقوق و مزایای پرسنل به تفکیک اداره",
            description: "گزارش ریز محاسبات اضافه کار، حق‌الزحمه رفاهی و پرداختی ناخالص ماهانه کارکنان",
            source: ReportDomainSource.PayrollAndWelfare,
            category: ReportCategory.Operational,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\":[{\"fieldName\":\"personnelNumber\",\"persianLabel\":\"کد پرسنلی\",\"dataType\":\"string\"},{\"fieldName\":\"fullName\",\"persianLabel\":\"نام و نام خانوادگی\",\"dataType\":\"string\"},{\"fieldName\":\"department\",\"persianLabel\":\"اداره\",\"dataType\":\"string\"},{\"fieldName\":\"overtimeHours\",\"persianLabel\":\"ساعت اضافه کار\",\"dataType\":\"number\",\"hasAggregateSum\":true},{\"fieldName\":\"overtimeAmount\",\"persianLabel\":\"مبلغ اضافه کار (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"welfarePercentage\",\"persianLabel\":\"درصد رفاهی\",\"dataType\":\"number\"},{\"fieldName\":\"welfareAmount\",\"persianLabel\":\"مبلغ رفاهی (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"totalGrossPay\",\"persianLabel\":\"کل ناخالص (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true}]}",
            isSystemReport: true,
            requiredRole: "Manager"));

        // 4. REP_REFUND_SOURCE_SUMMARY
        await UpsertReportAsync(context, ReportDefinition.Create(
            code: "REP_REFUND_SOURCE_SUMMARY",
            title: "گزارش تحلیلی پرونده‌های استرداد به تفکیک منبع",
            description: "بررسی میزان و تعداد پرونده‌های استرداد مالیات بر ارزش افزوده، مشاغل، حقوق و شرکت‌ها",
            source: ReportDomainSource.TaxRefunds,
            category: ReportCategory.Financial,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\":[{\"fieldName\":\"taxSourceTitle\",\"persianLabel\":\"منبع مالیاتی\",\"dataType\":\"string\"},{\"fieldName\":\"caseCount\",\"persianLabel\":\"تعداد پرونده\",\"dataType\":\"number\",\"hasAggregateSum\":true},{\"fieldName\":\"totalClaimedAmount\",\"persianLabel\":\"مبلغ ادعایی مودی (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"totalApprovedRefund\",\"persianLabel\":\"خالص استرداد (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"totalDelayInterest\",\"persianLabel\":\"خسارت تاخیر پرداختی (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true}]}",
            isSystemReport: true,
            requiredRole: "Manager"));

        // 5. REP_REFUND_INTEREST_LIABILITY
        await UpsertReportAsync(context, ReportDefinition.Create(
            code: "REP_REFUND_INTEREST_LIABILITY",
            title: "گزارش خسارت دیرکرد موضوع ماده ۲۴۳ ق.م.م",
            description: "محاسبه بار مالی خسارت ۱.۵ درصد ماهانه ناشی از تاخیر ادارات در پرداخت اضافه دریافتی مودیان",
            source: ReportDomainSource.TaxRefunds,
            category: ReportCategory.ComplianceAndAudit,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\":[{\"fieldName\":\"caseNumber\",\"persianLabel\":\"شماره پرونده\",\"dataType\":\"string\"},{\"fieldName\":\"taxpayerName\",\"persianLabel\":\"نام مودی\",\"dataType\":\"string\"},{\"fieldName\":\"requestDate\",\"persianLabel\":\"تاریخ درخواست\",\"dataType\":\"date\"},{\"fieldName\":\"delayMonths\",\"persianLabel\":\"ماه‌های تاخیر\",\"dataType\":\"number\"},{\"fieldName\":\"delayAmount\",\"persianLabel\":\"مبلغ خسارت تاخیر (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true}]}",
            isSystemReport: true,
            requiredRole: "Admin"));

        // 6. REP_REFUND_WORKFLOW_BOTTLENECK
        await UpsertReportAsync(context, ReportDefinition.Create(
            code: "REP_REFUND_WORKFLOW_BOTTLENECK",
            title: "گزارش گلوگاه‌های فرآیند و توقف پرونده‌های استرداد",
            description: "پایش دیرکرد کارتابل‌های رسیدگی، مراحل معطل‌مانده و میانگین روزهای توقف اسناد استرداد",
            source: ReportDomainSource.TaxRefunds,
            category: ReportCategory.Operational,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\":[{\"fieldName\":\"caseNumber\",\"persianLabel\":\"شماره پرونده\",\"dataType\":\"string\"},{\"fieldName\":\"taxpayerName\",\"persianLabel\":\"نام مودی\",\"dataType\":\"string\"},{\"fieldName\":\"currentStep\",\"persianLabel\":\"مرحله جاری\",\"dataType\":\"string\"},{\"fieldName\":\"assignedUser\",\"persianLabel\":\"کاربر ارجاع‌شده\",\"dataType\":\"string\"},{\"fieldName\":\"daysInCurrentStep\",\"persianLabel\":\"روزهای توقف در مرحله\",\"dataType\":\"number\"},{\"fieldName\":\"statusAlert\",\"persianLabel\":\"وضعیت تاخیر\",\"dataType\":\"badge\"}]}",
            isSystemReport: true,
            requiredRole: "Manager"));

        // 7. REP_EMPLOYEE_PERF_SUMMARY
        await UpsertReportAsync(context, ReportDefinition.Create(
            code: "REP_EMPLOYEE_PERF_SUMMARY",
            title: "گزارش توانمندی و کشف فرار مالیاتی پرسنل",
            description: "ارزیابی شاخص‌های عملکرد ممیزان در شناسایی منابع جدید، رسیدگی و فرار مالیاتی",
            source: ReportDomainSource.HumanResources,
            category: ReportCategory.Operational,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\":[{\"fieldName\":\"personnelNumber\",\"persianLabel\":\"شماره پرسنلی\",\"dataType\":\"string\"},{\"fieldName\":\"fullName\",\"persianLabel\":\"نام و نام خانوادگی\",\"dataType\":\"string\"},{\"fieldName\":\"serviceUnit\",\"persianLabel\":\"واحد متبوع\",\"dataType\":\"string\"},{\"fieldName\":\"evasionAmount\",\"persianLabel\":\"مبلغ کشف فرار مالیاتی (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"referredCasesCount\",\"persianLabel\":\"پرونده‌های ارجاعی\",\"dataType\":\"number\",\"hasAggregateSum\":true}]}",
            isSystemReport: true,
            requiredRole: "Manager"));

        // 8. REP_EMPLOYEE_ATTENDANCE_LEAVE
        await UpsertReportAsync(context, ReportDefinition.Create(
            code: "REP_EMPLOYEE_ATTENDANCE_LEAVE",
            title: "گزارش وضعیت کارکرد، ماموریت و مرخصی کارکنان",
            description: "پایش روزهای ماموریت اداری، مرخصی‌های استعلاجی و تاخیرات ثبت‌شده در سامانه ارزیابی",
            source: ReportDomainSource.HumanResources,
            category: ReportCategory.ComplianceAndAudit,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\":[{\"fieldName\":\"personnelNumber\",\"persianLabel\":\"کد پرسنلی\",\"dataType\":\"string\"},{\"fieldName\":\"fullName\",\"persianLabel\":\"نام و نام خانوادگی\",\"dataType\":\"string\"},{\"fieldName\":\"department\",\"persianLabel\":\"اداره\",\"dataType\":\"string\"},{\"fieldName\":\"missionDays\",\"persianLabel\":\"روزهای ماموریت\",\"dataType\":\"number\",\"hasAggregateSum\":true},{\"fieldName\":\"sickLeaveDays\",\"persianLabel\":\"مرخصی استعلاجی (روز)\",\"dataType\":\"number\",\"hasAggregateSum\":true},{\"fieldName\":\"absenceHours\",\"persianLabel\":\"ساعات غیبت/کسر کار\",\"dataType\":\"number\",\"hasAggregateSum\":true}]}",
            isSystemReport: true,
            requiredRole: "Manager"));

        // 9. REP_EXECUTIVE_CROSS_DEPT_KPI
        await UpsertReportAsync(context, ReportDefinition.Create(
            code: "REP_EXECUTIVE_CROSS_DEPT_KPI",
            title: "داشبورد رتبه‌بندی عملکرد ادارات کل و شعب تابعه",
            description: "تحلیل مقایسه‌ای بهره‌وری پرسنل، سرانه اضافه کار و سرعت رسیدگی استرداد در سطح استان",
            source: ReportDomainSource.CrossSystem,
            category: ReportCategory.ExecutiveKpi,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\":[{\"fieldName\":\"officeName\",\"persianLabel\":\"اداره / واحد\",\"dataType\":\"string\"},{\"fieldName\":\"activeStaffCount\",\"persianLabel\":\"تعداد پرسنل\",\"dataType\":\"number\",\"hasAggregateSum\":true},{\"fieldName\":\"overtimePerCapita\",\"persianLabel\":\"سرانه اضافه کار (ساعت)\",\"dataType\":\"number\"},{\"fieldName\":\"budgetVarianceAmount\",\"persianLabel\":\"انحراف بودجه (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"activeRefundCases\",\"persianLabel\":\"پرونده‌های فعال استرداد\",\"dataType\":\"number\",\"hasAggregateSum\":true},{\"fieldName\":\"overallScore\",\"persianLabel\":\"امتیاز ارزیابی کیفی\",\"dataType\":\"number\"}]}",
            isSystemReport: true,
            requiredRole: "Admin"));

        // 10. REP_AUDIT_SECURITY_LOGS
        await UpsertReportAsync(context, ReportDefinition.Create(
            code: "REP_AUDIT_SECURITY_LOGS",
            title: "گزارش ممیزی امنیتی و ثبت رویدادهای سامانه",
            description: "لاگ جامع تغییرات پرونده‌ها، تاییدات سلسله‌مراتبی و تراکنش‌های حساس کاربران",
            source: ReportDomainSource.CrossSystem,
            category: ReportCategory.ComplianceAndAudit,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\":[{\"fieldName\":\"persianTimestamp\",\"persianLabel\":\"زمان رویداد\",\"dataType\":\"date\"},{\"fieldName\":\"username\",\"persianLabel\":\"کاربر\",\"dataType\":\"string\"},{\"fieldName\":\"userRole\",\"persianLabel\":\"نقش کاربر\",\"dataType\":\"string\"},{\"fieldName\":\"clientIp\",\"persianLabel\":\"آدرس IP\",\"dataType\":\"string\"},{\"fieldName\":\"actionType\",\"persianLabel\":\"نوع عملیات\",\"dataType\":\"badge\"},{\"fieldName\":\"targetModule\",\"persianLabel\":\"ماژول مربوطه\",\"dataType\":\"string\"},{\"fieldName\":\"details\",\"persianLabel\":\"شرح رویداد\",\"dataType\":\"string\"}]}",
            isSystemReport: true,
            requiredRole: "Admin"));

        await context.SaveChangesAsync();
    }

    private static async Task UpsertReportAsync(TaxSummaryDbContext context, ReportDefinition report)
    {
        var existing = await context.ReportDefinitions.FirstOrDefaultAsync(r => r.Code == report.Code);
        if (existing == null)
        {
            await context.ReportDefinitions.AddAsync(report);
        }
        else
        {
            existing.Update(report.Title, report.Description, report.ConfigurationJson, report.RequiredRole);
        }
    }
}
