/**
 * Jalali (Shamsi / Persian) Calendar Utilities
 * Accurate Gregorian <-> Jalali conversion algorithms
 */

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const

export const PERSIAN_WEEK_DAYS = [
  { short: 'ش', name: 'شنبه' },
  { short: 'ی', name: 'یکشنبه' },
  { short: 'د', name: 'دوشنبه' },
  { short: 'س', name: 'سه‌شنبه' },
  { short: 'چ', name: 'چهارشنبه' },
  { short: 'پ', name: 'پنج‌شنبه' },
  { short: 'ج', name: 'جمعه' },
] as const

/**
 * Converts English and Arabic numbers to English digits
 */
export function toEnglishDigits(str: string | number | null | undefined): string {
  if (str == null) return ''
  const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  const ar = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  let res = str.toString()
  for (let i = 0; i < 10; i++) {
    res = res.split(fa[i]).join(i.toString()).split(ar[i]).join(i.toString())
  }
  return res
}

/**
 * Converts Latin digits to Persian digits
 */
export function toPersianDigits(str: string | number | null | undefined): string {
  if (str == null) return ''
  const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return str.toString().replace(/[0-9]/g, (w) => fa[+w])
}

/**
 * Converts Gregorian date to Jalali date
 * @returns [jy, jm, jd] where jm is 1-12
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let jy = gy <= 1600 ? 0 : 979
  gy -= gy <= 1600 ? 621 : 1600
  const gy2 = gm > 2 ? gy + 1 : gy
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1]
  jy += 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30)
  return [jy, jm, jd]
}

/**
 * Converts Jalali date to Gregorian date
 * @returns [gy, gm, gd] where gm is 1-12
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let gy = jy <= 979 ? 621 : 1600
  jy -= jy <= 979 ? 0 : 979
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186)
  gy += 400 * Math.floor(days / 146097)
  days %= 146097
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524)
    days %= 36524
    if (days >= 365) days++
  }
  gy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    gy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]
  let gm = 0
  while (gm < 13 && days >= sal_a[gm]) {
    days -= sal_a[gm]
    gm++
  }
  const gd = days + 1
  return [gy, gm, gd]
}

/**
 * Check if a Jalali year is leap
 */
export function isJalaliLeapYear(jy: number): boolean {
  const [gy, gm, gd] = jalaliToGregorian(jy, 12, 30)
  const [backJy, backJm, backJd] = gregorianToJalali(gy, gm, gd)
  return backJy === jy && backJm === 12 && backJd === 30
}

/**
 * Get number of days in a Jalali month
 */
export function getDaysInJalaliMonth(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31
  if (jm >= 7 && jm <= 11) return 30
  if (jm === 12) return isJalaliLeapYear(jy) ? 30 : 29
  return 30
}

/**
 * Returns weekday index in Persian week: 0 = Saturday (شنبه), ..., 6 = Friday (جمعه)
 */
export function getJalaliWeekday(jy: number, jm: number, jd: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd)
  const gDay = new Date(gy, gm - 1, gd).getDay() // 0 = Sun, 6 = Sat
  return (gDay + 1) % 7
}

/**
 * Get today's date in Jalali calendar
 */
export function getTodayJalali(): { jy: number; jm: number; jd: number } {
  const now = new Date()
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  return { jy, jm, jd }
}

/**
 * Get today's date in Jalali formatted string (YYYY/MM/DD)
 */
export function getTodayJalaliString(persianDigits = false): string {
  const { jy, jm, jd } = getTodayJalali()
  return formatJalaliDateString(jy, jm, jd, persianDigits)
}

/**
 * Converts ISO date string (YYYY-MM-DD or full ISO) to Jalali object
 */
export function isoStringToJalali(
  isoStr: string | null | undefined
): { jy: number; jm: number; jd: number } | null {
  if (!isoStr) return null
  const clean = isoStr.trim()
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/)
  let gy: number, gm: number, gd: number
  if (match) {
    gy = parseInt(match[1], 10)
    gm = parseInt(match[2], 10)
    gd = parseInt(match[3], 10)
  } else {
    const d = new Date(clean)
    if (isNaN(d.getTime())) return null
    gy = d.getFullYear()
    gm = d.getMonth() + 1
    gd = d.getDate()
  }
  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd)
  return { jy, jm, jd }
}

/**
 * Converts Jalali date components to ISO string format (YYYY-MM-DD)
 */
export function jalaliToIsoString(jy: number, jm: number, jd: number): string {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd)
  const yStr = gy.toString().padStart(4, '0')
  const mStr = gm.toString().padStart(2, '0')
  const dStr = gd.toString().padStart(2, '0')
  return `${yStr}-${mStr}-${dStr}`
}

/**
 * Formats a Jalali date into "YYYY/MM/DD" string
 */
export function formatJalaliDateString(
  jy: number,
  jm: number,
  jd: number,
  persianDigits = false
): string {
  const yStr = jy.toString()
  const mStr = jm.toString().padStart(2, '0')
  const dStr = jd.toString().padStart(2, '0')
  const res = `${yStr}/${mStr}/${dStr}`
  return persianDigits ? toPersianDigits(res) : res
}

/**
 * Formats an ISO date or Date object into a readable Jalali date string
 */
export function formatIsoToJalali(
  isoStr: string | Date | null | undefined,
  persianDigits = false
): string {
  if (!isoStr) return ''
  const str = typeof isoStr === 'string' ? isoStr : isoStr.toISOString()
  const j = isoStringToJalali(str)
  if (!j) return ''
  return formatJalaliDateString(j.jy, j.jm, j.jd, persianDigits)
}

/**
 * Parses user input in Shamsi format (e.g., "1405/06/15" or "1405-6-15" or Persian digits)
 */
export function parseJalaliInput(input: string): { jy: number; jm: number; jd: number } | null {
  if (!input) return null
  const normalized = toEnglishDigits(input.trim())
  const parts = normalized.split(/[/.\-_ ]+/).filter(Boolean)
  if (parts.length !== 3) return null

  const jy = parseInt(parts[0], 10)
  const jm = parseInt(parts[1], 10)
  const jd = parseInt(parts[2], 10)

  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return null
  if (jy < 1300 || jy > 1500) return null
  if (jm < 1 || jm > 12) return null

  const maxDays = getDaysInJalaliMonth(jy, jm)
  if (jd < 1 || jd > maxDays) return null

  return { jy, jm, jd }
}

/**
 * Sanitizes numeric input by converting Persian/Arabic digits to English and removing non-digits.
 */
export function sanitizeNumericInput(val: string, maxLength = 30): string {
  if (!val) return ''
  return toEnglishDigits(val).replace(/\D/g, '').slice(0, maxLength)
}

/**
 * Smart formatting / masking for Jalali date input:
 * - Strips any characters that are not digits or slashes
 * - Auto-inserts slashes when typing digits continuously (e.g. 14030501 -> 1403/05/01)
 * - Restricts input length to max 10 characters (YYYY/MM/DD)
 */
export function formatJalaliDateMask(val: string): string {
  if (!val) return ''
  const eng = toEnglishDigits(val)
  // Strip any Persian/English letters or symbols other than digits and slash
  const clean = eng.replace(/[^\d/]/g, '')

  // If there are no slashes, auto-format by digit count
  if (!clean.includes('/')) {
    const digits = clean.slice(0, 8)
    if (digits.length <= 4) return digits
    if (digits.length <= 6) return `${digits.slice(0, 4)}/${digits.slice(4)}`
    return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6, 8)}`
  }

  // If user entered slashes manually, format each segment
  const parts = clean.split('/')
  const year = parts[0].slice(0, 4)
  if (parts.length === 1) return year

  const month = parts[1].slice(0, 2)
  if (parts.length === 2) {
    return clean.endsWith('/') && parts[1] === '' ? `${year}/` : `${year}/${month}`
  }

  const day = parts[2].slice(0, 2)
  if (parts.length >= 3 && parts[2] === '' && clean.endsWith('/')) {
    return `${year}/${month}/`
  }
  return `${year}/${month}/${day}`
}

/**
 * Checks if a string is a valid complete Jalali date
 */
export function isValidJalaliDate(val: string): boolean {
  return parseJalaliInput(val) !== null
}

/**
 * Normalizes a Jalali date string into canonical "YYYY/MM/DD" with zero-padding
 */
export function normalizeJalaliDateString(val: string): string | null {
  const parsed = parseJalaliInput(val)
  if (!parsed) return null
  return formatJalaliDateString(parsed.jy, parsed.jm, parsed.jd)
}

/**
 * Compare two Jalali date strings (format: "YYYY/MM/DD" or any format supported by parseJalaliInput)
 * Returns <0 if date1 < date2, 0 if date1 == date2, >0 if date1 > date2
 */
export function compareJalaliDates(date1: string, date2: string): number {
  const p1 = parseJalaliInput(date1)
  const p2 = parseJalaliInput(date2)
  if (!p1 || !p2) return NaN
  const v1 = p1.jy * 10000 + p1.jm * 100 + p1.jd
  const v2 = p2.jy * 10000 + p2.jm * 100 + p2.jd
  return v1 - v2
}
