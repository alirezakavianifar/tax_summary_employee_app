import {
  FileText,
  PlusCircle,
  Search,
  Calculator,
  Building2,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  CheckCircle2,
  History,
} from 'lucide-react'
import { BasePortalModule, PortalAction } from '@/types/portal'

/**
 * Module 1: Employee Promotion and Performance Evaluations
 */
export class EmployeeEvaluationModule extends BasePortalModule {
  public readonly id = 'employee-evaluation'
  public readonly title = 'سامانه ارزیابی و گزارش‌دهی ارتقاء و انتصاب'
  public readonly navTitle = 'ارزیابی و انتصاب'
  public readonly subtitle = 'مدیریت سوابق، عملکرد اجرایی و ارزیابی شایستگی کارکنان'
  public readonly description =
    'ثبت و پایش فرم‌های ارزیابی عملکرد، سوابق شغلی، توانمندی‌های تخصصی مالیاتی و صدور شناسنامه استاندارد چاپی جهت تصمیم‌گیری در انتصابات مدیریتی.'
  public readonly badgeText = 'سرمایه انسانی و ارزیابی'
  public readonly icon = Users
  public readonly gradient = 'from-blue-600 to-indigo-700'
  public readonly accentColor = 'text-blue-600'
  public readonly borderHoverColor = 'hover:border-blue-400'
  public readonly iconBgColor = 'bg-blue-50 text-blue-600'

  public readonly actions: PortalAction[] = [
    {
      id: 'view-reports',
      title: 'مشاهده و مدیریت فرم‌ها',
      href: '/reports',
      description: 'فهرست فرم‌های ارزیابی ثبت شده کارکنان',
      icon: FileText,
      variant: 'primary',
    },
    {
      id: 'create-report',
      title: 'ثبت فرم ارزیابی داوطلب جدید',
      href: '/reports/create',
      description: 'ورود مشخصات و توانمندی‌های پرسنل جدید',
      icon: PlusCircle,
      variant: 'secondary',
    },
    {
      id: 'search-reports',
      title: 'جستجو و فیلتر پیشرفته',
      href: '/reports/search',
      description: 'جستجوی سوابق با کدملی، نام یا اداره',
      icon: Search,
      variant: 'outline',
    },
  ]

  public readonly highlights = [
    'ثبت سوابق اداری، مرخصی‌ها و ماموریت‌ها',
    'ارزیابی شاخص‌های توانمندی و فرار مالیاتی',
    'چاپ شناسنامه استاندارد انتصاب با بارگذاری عکس',
    'آرشیو الکترونیک با قابلیت ویرایش و بازبینی',
  ]
}

/**
 * Module 2: Collaborative Multi-Department Payroll & Overtime Portal
 */
export class CollaborativePayrollModule extends BasePortalModule {
  public readonly id = 'collaborative-payroll'
  public readonly title = 'سامانه مشارکتی محاسبه و تخصیص حقوق و اضافه کار'
  public readonly navTitle = 'حقوق و اضافه کار'
  public readonly subtitle = 'تفکیک هوشمند کاربرگ ادارات، ثبت برخط نرخ‌ها و تجمیع نهایی'
  public readonly description =
    'تعریف دوره‌های ماهانه مالی، تفکیک خودکار اطلاعات ادارات، ویرایش زنده ساعات و رفاهی توسط روسای واحدها با کنترل سقف بودجه و صدور اکسل تجمیعی چندبرگی.'
  public readonly badgeText = 'امور مالی و اضافه کار'
  public readonly icon = Calculator
  public readonly gradient = 'from-emerald-600 to-teal-700'
  public readonly accentColor = 'text-emerald-600'
  public readonly borderHoverColor = 'hover:border-emerald-400'
  public readonly iconBgColor = 'bg-emerald-50 text-emerald-600'

  public readonly actions: PortalAction[] = [
    {
      id: 'payroll-cycles',
      title: 'دوره‌های محاسبه و داشبورد تجمیعی',
      href: '/payroll/cycles',
      description: 'تعریف دوره جدید، پایش پیشرفت و تایید نهایی',
      icon: FileSpreadsheet,
      variant: 'primary',
    },
    {
      id: 'my-department',
      title: 'کارپوشه اختصاصی اداره من',
      href: '/payroll/my-department',
      description: 'تکمیل ساعات، نرخ‌ها و ارسال کاربرگ واحد سازمانی',
      icon: Building2,
      variant: 'secondary',
    },
    {
      id: 'quick-payroll',
      title: 'محاسبه و ادغام سریع تک‌نشست',
      href: '/payroll',
      description: 'پردازش و ادغام سریع فایل‌های اکسل بدون چرخه',
      icon: Calculator,
      variant: 'outline',
    },
    {
      id: 'payroll-history',
      title: 'تاریخچه و آرشیو محاسبات',
      href: '/payroll/history',
      description: 'مشاهده سوابق خروجی‌های دوره‌های پیشین',
      icon: History,
      variant: 'outline',
    },
  ]

  public readonly highlights = [
    'تفکیک هوشمند فایل‌های اکسل به کاربرگ‌های مستقل ادارات',
    'محاسبه آنی و لحظه‌ای مبالغ اضافه کار و رفاهی در مرورگر',
    'گردش‌کار ارسال، پیش‌نویس، تایید و بازگشت با ذکر دلیل',
    'خروجی فایل اکسل چندبرگی تجمیعی دقیقاً مطابق ساختار استاندارد',
  ]
}

/**
 * Global Registry of all portal modules.
 * In the future, any new distinct functional module simply extends BasePortalModule
 * and is added to this registry array.
 */
export const PORTAL_MODULES: BasePortalModule[] = [
  new EmployeeEvaluationModule(),
  new CollaborativePayrollModule(),
]

/**
 * Returns all portal modules filtered by user role permissions
 */
export function getAuthorizedPortalModules(userRole?: string): BasePortalModule[] {
  return PORTAL_MODULES.filter((module) => module.hasAccess(userRole))
}
