using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Common;

/// <summary>
/// Provides default initial configurations for application navigation modules and menu actions.
/// </summary>
public static class DefaultMenuSettings
{
    public const string AllGeneralRoles = "Admin,OfficeHead,GroupHead,Expert,ITSpecialist,Manager,Employee";
    public const string AdminOnlyRoles = "Admin";

    public static List<MenuSetting> GetDefaults()
    {
        return new List<MenuSetting>
        {
            // 1. Home
            MenuSetting.Create("nav_home", "خانه", "/", null, "Home", true, false, 1, "صفحه اصلی پرتال یکپارچه", null, AllGeneralRoles),

            // 2. Evaluation Module & Actions
            MenuSetting.Create("module_evaluation", "ارزیابی و انتصاب", "/reports", null, "Users", true, false, 2, "سامانه ارزیابی و گزارش‌دهی ارتقاء و انتصاب", null, AllGeneralRoles),
            MenuSetting.Create("action_evaluation_list", "مشاهده و مدیریت فرم‌ها", "/reports", "module_evaluation", "FileText", true, false, 1, "فهرست فرم‌های ارزیابی ثبت شده کارکنان", null, AllGeneralRoles),
            MenuSetting.Create("action_evaluation_create", "ثبت فرم ارزیابی داوطلب جدید", "/reports/create", "module_evaluation", "PlusCircle", true, false, 2, "ورود مشخصات و توانمندی‌های پرسنل جدید", null, AllGeneralRoles),
            MenuSetting.Create("action_evaluation_search", "جستجو و فیلتر پیشرفته", "/reports/search", "module_evaluation", "Search", true, false, 3, "جستجوی سوابق با کدملی، نام یا اداره", null, AllGeneralRoles),

            // 3. Payroll Module & Actions
            MenuSetting.Create("module_payroll", "حقوق و اضافه کار", "/payroll/cycles", null, "Calculator", true, false, 3, "سامانه مشارکتی محاسبه و تخصیص حقوق و اضافه کار", null, AllGeneralRoles),
            MenuSetting.Create("action_payroll_cycles", "دوره‌های محاسبه و داشبورد تجمیعی", "/payroll/cycles", "module_payroll", "FileSpreadsheet", true, false, 1, "مشاهده دوره‌های محاسبه و پایش پیشرفت", null, AllGeneralRoles),
            MenuSetting.Create("action_payroll_create_cycle", "تعریف دوره جدید حقوق و اضافه کار", "/payroll/cycles/create", "module_payroll", "PlusCircle", true, false, 2, "تعریف و بارگذاری فایل‌های پایه دوره محاسبه جدید ماهانه", null, "Admin,DirectorGeneral"),
            MenuSetting.Create("action_payroll_delete_cycle", "حذف دوره محاسبه حقوق و اضافه کار", "/payroll/cycles/delete", "module_payroll", "Trash2", true, true, 3, "حذف دوره محاسبه و پاکسازی کاربرگ ادارات تابعه", null, AdminOnlyRoles),
            MenuSetting.Create("action_payroll_department", "کارپوشه اختصاصی اداره من", "/payroll/my-department", "module_payroll", "Building2", true, false, 4, "تکمیل ساعات، نرخ‌ها و ارسال کاربرگ واحد سازمانی", null, AllGeneralRoles),
            MenuSetting.Create("action_payroll_quick", "محاسبه و ادغام سریع تک‌نشست", "/payroll", "module_payroll", "Calculator", true, false, 5, "پردازش و ادغام سریع فایل‌های اکسل بدون چرخه", null, AllGeneralRoles),
            MenuSetting.Create("action_payroll_history", "تاریخچه و آرشیو محاسبات", "/payroll/history", "module_payroll", "History", true, false, 6, "مشاهده سوابق خروجی‌های دوره‌های پیشین", null, AllGeneralRoles),

            // 4. Tax Refund Module & Actions
            MenuSetting.Create("module_tax_refund", "استرداد مالیات", "/refunds", null, "Scale", true, false, 4, "سامانه جامع استرداد مالیات اضافه دریافتی موضوع مواد ۲۴۲ و ۲۴۳", null, AllGeneralRoles),
            MenuSetting.Create("action_refund_list", "کارپوشه و مدیریت پرونده‌ها", "/refunds", "module_tax_refund", "FileSpreadsheet", true, false, 1, "مشاهده سوابق، گردش کار تاییدات و پیگیری", null, AllGeneralRoles),
            MenuSetting.Create("action_refund_new", "ثبت پرونده استرداد جدید (جادوگر)", "/refunds/new", "module_tax_refund", "PlusCircle", true, false, 2, "ورود مشخصات، قبوض و محاسبه سیستمی اضافه پرداختی", null, AllGeneralRoles),
            MenuSetting.Create("action_refund_calculator", "شبیه‌ساز و محاسبه‌گر برخط", "/refunds/calculator", "module_tax_refund", "Calculator", true, false, 3, "آزمون آنی فرمول‌های مواد ۲۴۲ و ۲۴۳ قانون مالیات‌ها", null, AllGeneralRoles),
            MenuSetting.Create("action_admin_tax_sources", "مدیریت منابع مالیاتی", "/admin/tax-sources", "module_tax_refund", "Coins", true, true, 4, "پیکربندی و تعریف منابع مالیاتی در پرونده‌های استرداد", null, AdminOnlyRoles),
            MenuSetting.Create("action_admin_finality_stages", "مدیریت مراحل قطعیت", "/admin/finality-stages", "module_tax_refund", "FileCheck", true, true, 5, "پیکربندی و تعریف مراحل قطعیت پرونده‌های استرداد", null, AdminOnlyRoles),

            // 5. Admin System Management
            MenuSetting.Create("module_admin", "مدیریت سیستم", "/admin/users", null, "ShieldCheck", true, true, 5, "پنل راهبری و مدیریت سامانه (مخصوص مدیران)", null, AdminOnlyRoles),
            MenuSetting.Create("action_admin_users", "مدیریت کاربران", "/admin/users", "module_admin", "Users", true, true, 1, "تعریف کاربر، تغییر کلمه عبور و سطوح دسترسی", null, AdminOnlyRoles),
            MenuSetting.Create("action_admin_menus", "مدیریت منوها و دسترسی‌ها", "/admin/menu-settings", "module_admin", "Menu", true, true, 2, "پیکربندی نمایش و مخفی‌سازی گزینه‌های منو", null, AdminOnlyRoles),
            MenuSetting.Create("action_admin_audit_logs", "لاگ‌ها و رویدادهای امنیتی", "/admin/audit-logs", "module_admin", "History", true, true, 3, "مشاهده و پایش تاریخچه تغییرات و رخدادهای امنیتی سامانه", null, AdminOnlyRoles)
        };
    }
}
