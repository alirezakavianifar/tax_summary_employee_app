using Microsoft.EntityFrameworkCore;
using TaxSummary.Domain.Entities;
using TaxSummary.Domain.Entities.Reporting;
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

        // 11. REP_SANIM_AUDIT_ASSESSMENT
        await UpsertReportAsync(context, ReportDefinition.Create(
            code: "REP_SANIM_AUDIT_ASSESSMENT",
            title: "گزارش جامع پرونده‌های رسیدگی و تشخیص مالیاتی سنیم",
            description: "تحلیل و پیگیری ۱۶ هزار پرونده رسیدگی ارزش افزوده، مواعد تشخیص و قطعی، مالیات ابرازی/تشخیصی/قطعی و تاخیرات به تفکیک ادارات",
            source: ReportDomainSource.TaxAudit,
            category: ReportCategory.ComplianceAndAudit,
            type: ReportType.Tabular,
            configurationJson: "{\"columns\":[{\"fieldName\":\"id\",\"persianLabel\":\"شناسه\",\"dataType\":\"id\"},{\"fieldName\":\"taxpayerTin\",\"persianLabel\":\"تین سنیم / شناسه ملی\",\"dataType\":\"string\"},{\"fieldName\":\"taxpayerName\",\"persianLabel\":\"نام مودی\",\"dataType\":\"string\"},{\"fieldName\":\"finalOfficeName\",\"persianLabel\":\"اداره مالیاتی\",\"dataType\":\"string\"},{\"fieldName\":\"fiscalYear\",\"persianLabel\":\"سال عملکرد\",\"dataType\":\"year\"},{\"fieldName\":\"taxSource\",\"persianLabel\":\"منبع مالیاتی\",\"dataType\":\"string\"},{\"fieldName\":\"taxPeriod\",\"persianLabel\":\"دوره\",\"dataType\":\"number\"},{\"fieldName\":\"auditorName\",\"persianLabel\":\"حسابرس / ممیز\",\"dataType\":\"string\"},{\"fieldName\":\"auditStatus\",\"persianLabel\":\"وضعیت رسیدگی\",\"dataType\":\"badge\"},{\"fieldName\":\"declaredTaxAmount\",\"persianLabel\":\"مالیات ابرازی (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"assessedTaxAmount\",\"persianLabel\":\"مالیات تشخیصی (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"finalTaxAmount\",\"persianLabel\":\"مالیات قطعی (ریال)\",\"dataType\":\"currency\",\"hasAggregateSum\":true},{\"fieldName\":\"assessmentNoticeDateJalali\",\"persianLabel\":\"تاریخ ابلاغ برگ تشخیص\",\"dataType\":\"date\"},{\"fieldName\":\"finalNoticeDateJalali\",\"persianLabel\":\"تاریخ ابلاغ برگ قطعی\",\"dataType\":\"date\"},{\"fieldName\":\"daysNoticeToFinal\",\"persianLabel\":\"فاصله تشخیص تا قطعی (روز)\",\"dataType\":\"number\"}]}",
            isSystemReport: true,
            requiredRole: "Manager"));

        await context.SaveChangesAsync();

        await SeedDefaultAuditorMetricsAsync(context);
    }

    private static async Task SeedDefaultAuditorMetricsAsync(TaxSummaryDbContext context)
    {
        if (await context.AuditorPerformanceMetricDefinitions.AnyAsync())
            return;

        var metrics = new List<AuditorPerformanceMetricDefinition>
        {
            AuditorPerformanceMetricDefinition.Create(
                metricCode: "METRIC_DEFENSIBILITY",
                title: "ضریب تثبیت و استحکام برگ تشخیص",
                description: "نسبت مالیات قطعی به مالیات تشخیصی جهت سنجش استواری حقوقی برگ‌های تشخیص صادره حسابرس",
                category: AuditorMetricCategory.Quality,
                formulaType: AuditorMetricFormulaType.Ratio,
                primaryField: "FinalTaxAmount",
                secondaryField: "AssessedTaxAmount",
                multiplier: 100m,
                weightPercentage: 30m,
                higherIsBetter: true,
                targetValue: 85m,
                warningThreshold: 70m,
                criticalThreshold: 50m,
                unit: "%",
                displayOrder: 1,
                tierThresholdsJson: "{\"A\": 85, \"B\": 70, \"C\": 50}"),

            AuditorPerformanceMetricDefinition.Create(
                metricCode: "METRIC_TAX_GAP_DISCOVERY",
                title: "مابه‌التفاوت ابراز تا تشخیص (کشف ماخذ)",
                description: "میزان مالیات اضافه تشخیصی نسبت به ابراز مودی ناشی از ممیزی دقیق و کشف فرار مالیاتی",
                category: AuditorMetricCategory.Financial,
                formulaType: AuditorMetricFormulaType.Difference,
                primaryField: "AssessedTaxAmount",
                secondaryField: "DeclaredTaxAmount",
                multiplier: 1m,
                weightPercentage: 25m,
                higherIsBetter: true,
                targetValue: 20000000000m,
                warningThreshold: 5000000000m,
                criticalThreshold: 0m,
                unit: "ریال",
                displayOrder: 2,
                tierThresholdsJson: "{\"A\": 20000000000, \"B\": 5000000000, \"C\": 0}"),

            AuditorPerformanceMetricDefinition.Create(
                metricCode: "METRIC_SPEED_NOTICE",
                title: "سرعت صدور برگ تشخیص (تخصیص تا ابلاغ)",
                description: "میانگین روزهای سپری‌شده از زمان ارجاع پرونده تا صدور و ابلاغ برگ تشخیص مالیات",
                category: AuditorMetricCategory.Speed,
                formulaType: AuditorMetricFormulaType.Average,
                primaryField: "DaysAssignmentToNotice",
                secondaryField: null,
                multiplier: 1m,
                weightPercentage: 25m,
                higherIsBetter: false,
                targetValue: 45m,
                warningThreshold: 70m,
                criticalThreshold: 90m,
                unit: "روز",
                displayOrder: 3,
                tierThresholdsJson: "{\"A\": 45, \"B\": 70, \"C\": 90}"),

            AuditorPerformanceMetricDefinition.Create(
                metricCode: "METRIC_THROUGHPUT",
                title: "حجم پرونده‌های رسیدگی‌شده (مختومه)",
                description: "تعداد کل پرونده‌های رسیدگی‌شده توسط حسابرس در دوره مالیاتی",
                category: AuditorMetricCategory.Productivity,
                formulaType: AuditorMetricFormulaType.Count,
                primaryField: "AuditStatus",
                secondaryField: null,
                multiplier: 1m,
                weightPercentage: 10m,
                higherIsBetter: true,
                targetValue: 80m,
                warningThreshold: 50m,
                criticalThreshold: 30m,
                unit: "فقره",
                displayOrder: 4,
                tierThresholdsJson: "{\"A\": 80, \"B\": 50, \"C\": 30}"),

            AuditorPerformanceMetricDefinition.Create(
                metricCode: "METRIC_RISK_COMPLEXITY",
                title: "سهم رسیدگی به پرونده‌های پرریسک",
                description: "درصد پرونده‌های پرریسک حسابرسی‌شده از کل پرونده‌های تخصیصی حسابرس",
                category: AuditorMetricCategory.Quality,
                formulaType: AuditorMetricFormulaType.Percentage,
                primaryField: "RiskLevel",
                secondaryField: null,
                multiplier: 1m,
                weightPercentage: 10m,
                higherIsBetter: true,
                targetValue: 30m,
                warningThreshold: 15m,
                criticalThreshold: 5m,
                unit: "%",
                displayOrder: 5,
                tierThresholdsJson: "{\"A\": 30, \"B\": 15, \"C\": 5}")
        };

        await context.AuditorPerformanceMetricDefinitions.AddRangeAsync(metrics);
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
