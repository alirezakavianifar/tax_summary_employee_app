using TaxSummary.Domain.Entities;

namespace TaxSummary.Domain.Common;

/// <summary>
/// Provides default initial configurations for application navigation modules and menu actions.
/// </summary>
public static class DefaultMenuSettings
{
    public static List<MenuSetting> GetDefaults()
    {
        return new List<MenuSetting>
        {
            // 1. Home
            MenuSetting.Create("nav_home", "خانه", "/", null, "Home", true, false, 1, "صفحه اصلی پرتال یکپارچه"),

            // 2. Evaluation Module & Actions
            MenuSetting.Create("module_evaluation", "ارزیابی و انتصاب", "/reports", null, "Users", true, false, 2, "سامانه ارزیابی و گزارش‌دهی ارتقاء و انتصاب"),
            MenuSetting.Create("action_evaluation_list", "مشاهده و مدیریت فرم‌ها", "/reports", "module_evaluation", "FileText", true, false, 1, "فهرست فرم‌های ارزیابی ثبت شده کارکنان"),
            MenuSetting.Create("action_evaluation_create", "ثبت فرم ارزیابی داوطلب جدید", "/reports/create", "module_evaluation", "PlusCircle", true, false, 2, "ورود مشخصات و توانمندی‌های پرسنل جدید"),
            MenuSetting.Create("action_evaluation_search", "جستجو و فیلتر پیشرفته", "/reports/search", "module_evaluation", "Search", true, false, 3, "جستجوی سوابق با کدملی، نام یا اداره"),

            // 3. Payroll Module & Actions
            MenuSetting.Create("module_payroll", "حقوق و اضافه کار", "/payroll/cycles", null, "Calculator", true, false, 3, "سامانه مشارکتی محاسبه و تخصیص حقوق و اضافه کار"),
            MenuSetting.Create("action_payroll_cycles", "دوره‌های محاسبه و داشبورد تجمیعی", "/payroll/cycles", "module_payroll", "FileSpreadsheet", true, false, 1, "تعریف دوره جدید، پایش پیشرفت و تایید نهایی"),
            MenuSetting.Create("action_payroll_department", "کارپوشه اختصاصی اداره من", "/payroll/my-department", "module_payroll", "Building2", true, false, 2, "تکمیل ساعات، نرخ‌ها و ارسال کاربرگ واحد سازمانی"),
            MenuSetting.Create("action_payroll_quick", "محاسبه و ادغام سریع تک‌نشست", "/payroll", "module_payroll", "Calculator", true, false, 3, "پردازش و ادغام سریع فایل‌های اکسل بدون چرخه"),
            MenuSetting.Create("action_payroll_history", "تاریخچه و آرشیو محاسبات", "/payroll/history", "module_payroll", "History", true, false, 4, "مشاهده سوابق خروجی‌های دوره‌های پیشین"),

            // 4. Tax Refund Module & Actions
            MenuSetting.Create("module_tax_refund", "استرداد مالیات", "/refunds", null, "Scale", true, false, 4, "سامانه جامع استرداد مالیات اضافه دریافتی موضوع مواد ۲۴۲ و ۲۴۳"),
            MenuSetting.Create("action_refund_list", "کارپوشه و مدیریت پرونده‌ها", "/refunds", "module_tax_refund", "FileSpreadsheet", true, false, 1, "مشاهده سوابق، گردش کار تاییدات و پیگیری"),
            MenuSetting.Create("action_refund_new", "ثبت پرونده استرداد جدید (جادوگر)", "/refunds/new", "module_tax_refund", "PlusCircle", true, false, 2, "ورود مشخصات، قبوض و محاسبه سیستمی اضافه پرداختی"),
            MenuSetting.Create("action_refund_calculator", "شبیه‌ساز و محاسبه‌گر برخط", "/refunds/calculator", "module_tax_refund", "Calculator", true, false, 3, "آزمون آنی فرمول‌های مواد ۲۴۲ و ۲۴۳ قانون مالیات‌ها"),

            // 5. Admin System Management
            MenuSetting.Create("module_admin", "مدیریت سیستم", "/admin/users", null, "ShieldCheck", true, true, 5, "پنل راهبری و مدیریت سامانه (مخصوص مدیران)"),
            MenuSetting.Create("action_admin_users", "مدیریت کاربران", "/admin/users", "module_admin", "Users", true, true, 1, "تعریف کاربر، تغییر کلمه عبور و سطوح دسترسی"),
            MenuSetting.Create("action_admin_menus", "مدیریت منوها و دسترسی‌ها", "/admin/menu-settings", "module_admin", "Menu", true, true, 2, "پیکربندی نمایش و مخفی‌سازی گزینه‌های منو"),
            MenuSetting.Create("action_admin_audit_logs", "لاگ‌ها و رویدادهای امنیتی", "/admin/audit-logs", "module_admin", "History", true, true, 3, "مشاهده و پایش تاریخچه تغییرات و رخدادهای امنیتی سامانه")
        };
    }
}
