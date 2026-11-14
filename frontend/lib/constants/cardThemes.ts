export interface ThemeConfig {
  header: string
  primaryBtn: string
  hoverBorder: string
  accentText: string
  chipHover: string
}

export interface ColorThemeOption {
  key: string
  label: string
  swatchGradient: string
  theme: ThemeConfig
}

export const PORTAL_COLOR_THEMES: ColorThemeOption[] = [
  {
    key: 'blue',
    label: 'آبی اقیانوسی',
    swatchGradient: 'from-blue-600 to-indigo-600',
    theme: {
      header: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white',
      primaryBtn:
        'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20',
      hoverBorder: 'hover:border-blue-400',
      accentText: 'text-blue-600',
      chipHover: 'hover:bg-blue-50/80 hover:text-blue-700 hover:border-blue-300',
    },
  },
  {
    key: 'emerald',
    label: 'زمردی / سبز',
    swatchGradient: 'from-emerald-600 to-teal-600',
    theme: {
      header: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white',
      primaryBtn:
        'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20',
      hoverBorder: 'hover:border-emerald-400',
      accentText: 'text-emerald-600',
      chipHover: 'hover:bg-emerald-50/80 hover:text-emerald-700 hover:border-emerald-300',
    },
  },
  {
    key: 'purple',
    label: 'بنفش سلطنتی',
    swatchGradient: 'from-purple-600 to-violet-700',
    theme: {
      header: 'bg-gradient-to-r from-purple-600 via-violet-600 to-purple-800 text-white',
      primaryBtn:
        'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-purple-500/20',
      hoverBorder: 'hover:border-purple-400',
      accentText: 'text-purple-600',
      chipHover: 'hover:bg-purple-50/80 hover:text-purple-700 hover:border-purple-300',
    },
  },
  {
    key: 'amber',
    label: 'کهربایی / طلایی',
    swatchGradient: 'from-amber-600 to-orange-600',
    theme: {
      header: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white',
      primaryBtn:
        'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/20',
      hoverBorder: 'hover:border-amber-400',
      accentText: 'text-amber-600',
      chipHover: 'hover:bg-amber-50/80 hover:text-amber-700 hover:border-amber-300',
    },
  },
  {
    key: 'rose',
    label: 'سرخ گلی / یاقوتی',
    swatchGradient: 'from-rose-600 to-pink-600',
    theme: {
      header: 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white',
      primaryBtn:
        'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-500/20',
      hoverBorder: 'hover:border-rose-400',
      accentText: 'text-rose-600',
      chipHover: 'hover:bg-rose-50/80 hover:text-rose-700 hover:border-rose-300',
    },
  },
  {
    key: 'cyan',
    label: 'فیروزه‌ای / آبی روشن',
    swatchGradient: 'from-cyan-600 to-sky-600',
    theme: {
      header: 'bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white',
      primaryBtn:
        'bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-cyan-500/20',
      hoverBorder: 'hover:border-cyan-400',
      accentText: 'text-cyan-600',
      chipHover: 'hover:bg-cyan-50/80 hover:text-cyan-700 hover:border-cyan-300',
    },
  },
  {
    key: 'indigo',
    label: 'نیلی تیره / لاجوردی',
    swatchGradient: 'from-indigo-700 to-slate-900',
    theme: {
      header: 'bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white',
      primaryBtn:
        'bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-600 hover:to-indigo-800 text-white shadow-indigo-500/20',
      hoverBorder: 'hover:border-indigo-400',
      accentText: 'text-indigo-600',
      chipHover: 'hover:bg-indigo-50/80 hover:text-indigo-700 hover:border-indigo-300',
    },
  },
  {
    key: 'slate',
    label: 'سنگی / خنثی',
    swatchGradient: 'from-slate-700 to-zinc-800',
    theme: {
      header: 'bg-gradient-to-r from-slate-700 via-gray-800 to-zinc-900 text-white',
      primaryBtn:
        'bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-600 hover:to-gray-700 text-white shadow-slate-500/20',
      hoverBorder: 'hover:border-slate-400',
      accentText: 'text-slate-700',
      chipHover: 'hover:bg-slate-50/80 hover:text-slate-800 hover:border-slate-300',
    },
  },
]

const THEME_LOOKUP: Record<string, ThemeConfig> = Object.fromEntries(
  PORTAL_COLOR_THEMES.map((t) => [t.key.toLowerCase(), t.theme])
)

const DEFAULT_MODULE_THEME_KEYS: Record<string, string> = {
  'employee-evaluation': 'blue',
  module_evaluation: 'blue',
  'collaborative-payroll': 'emerald',
  module_payroll: 'emerald',
  'tax-refund': 'purple',
  module_tax_refund: 'purple',
  'executive-reporting': 'amber',
  module_reporting: 'amber',
  reporting: 'amber',
}

export function getCardTheme(colorKey?: string | null, fallbackModuleKey?: string): ThemeConfig {
  if (colorKey && THEME_LOOKUP[colorKey.toLowerCase()]) {
    return THEME_LOOKUP[colorKey.toLowerCase()]
  }
  if (fallbackModuleKey) {
    const defaultKey = DEFAULT_MODULE_THEME_KEYS[fallbackModuleKey.toLowerCase()]
    if (defaultKey && THEME_LOOKUP[defaultKey]) {
      return THEME_LOOKUP[defaultKey]
    }
  }
  return THEME_LOOKUP['blue']
}

