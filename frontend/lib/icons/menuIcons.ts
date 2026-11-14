import {
  Home,
  Users,
  FileText,
  PlusCircle,
  Search,
  Calculator,
  FileSpreadsheet,
  Building2,
  History,
  Scale,
  ShieldCheck,
  Shield,
  Sliders,
  Trash2,
  Award,
  BarChart3,
  TrendingUp,
  BookmarkCheck,
  Coins,
  FileCheck,
  GitFork,
  LayoutDashboard,
  Download,
  UserPlus,
  Link2,
  ExternalLink,
  Globe,
  Folder,
  LayoutGrid,
  Settings,
  Bell,
  HelpCircle,
  Briefcase,
  ClipboardList,
  Palette,
  type LucideIcon,
} from 'lucide-react'

export interface MenuIconOption {
  name: string
  label: string
  icon: LucideIcon
}

export const MENU_ICON_OPTIONS: MenuIconOption[] = [
  { name: 'Link2', label: 'لینک', icon: Link2 },
  { name: 'Globe', label: 'وب / پورتال', icon: Globe },
  { name: 'ExternalLink', label: 'پیوند خارجی', icon: ExternalLink },
  { name: 'LayoutGrid', label: 'ماژول / سامانه', icon: LayoutGrid },
  { name: 'Folder', label: 'پوشه / گروه', icon: Folder },
  { name: 'FileText', label: 'فرم / سند', icon: FileText },
  { name: 'ClipboardList', label: 'فهرست کار', icon: ClipboardList },
  { name: 'FileSpreadsheet', label: 'گزارش / جدول', icon: FileSpreadsheet },
  { name: 'BarChart3', label: 'آمار و نمودار', icon: BarChart3 },
  { name: 'TrendingUp', label: 'روند شاخص', icon: TrendingUp },
  { name: 'LayoutDashboard', label: 'داشبورد', icon: LayoutDashboard },
  { name: 'Calculator', label: 'محاسبه', icon: Calculator },
  { name: 'Scale', label: 'قوانین و مالیات', icon: Scale },
  { name: 'Coins', label: 'مالی و بودجه', icon: Coins },
  { name: 'Building2', label: 'اداره / واحد', icon: Building2 },
  { name: 'Briefcase', label: 'امور اداری', icon: Briefcase },
  { name: 'Users', label: 'کاربران و پرسنل', icon: Users },
  { name: 'UserPlus', label: 'کاربر جدید', icon: UserPlus },
  { name: 'ShieldCheck', label: 'مدیریت سیستم', icon: ShieldCheck },
  { name: 'Shield', label: 'امنیت و نقش', icon: Shield },
  { name: 'Award', label: 'ارزیابی و امتیاز', icon: Award },
  { name: 'BookmarkCheck', label: 'الگوها', icon: BookmarkCheck },
  { name: 'FileCheck', label: 'تایید و قطعیت', icon: FileCheck },
  { name: 'GitFork', label: 'گردش کار', icon: GitFork },
  { name: 'History', label: 'تاریخچه و لاگ', icon: History },
  { name: 'Search', label: 'جستجو', icon: Search },
  { name: 'PlusCircle', label: 'ثبت جدید', icon: PlusCircle },
  { name: 'Sliders', label: 'تنظیمات', icon: Sliders },
  { name: 'Palette', label: 'رنگ و برندینگ', icon: Palette },
  { name: 'Settings', label: 'پیکربندی', icon: Settings },
  { name: 'Bell', label: 'اطلاعیه‌ها', icon: Bell },
  { name: 'HelpCircle', label: 'راهنما', icon: HelpCircle },
  { name: 'Home', label: 'خانه', icon: Home },
]

const ICON_LOOKUP: Record<string, LucideIcon> = {
  ...Object.fromEntries(MENU_ICON_OPTIONS.map((opt) => [opt.name.toLowerCase(), opt.icon])),
  menu: Sliders,
  trash2: Trash2,
  download: Download,
}

export function resolveMenuIcon(
  iconName?: string | null,
  fallback: LucideIcon = Link2
): LucideIcon {
  if (!iconName) return fallback
  return ICON_LOOKUP[iconName.trim().toLowerCase()] || fallback
}

