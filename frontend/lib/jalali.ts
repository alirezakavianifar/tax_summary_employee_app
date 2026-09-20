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
 * Formats an ISO date or Date object into a readable Jalali date & time string ("YYYY/MM/DD HH:mm:ss")
 */
export function formatIsoToJalaliDateTime(
  isoStr: string | Date | null | undefined,
  persianDigits = true,
  includeSeconds = true
): string {
  if (!isoStr) return ''
  const str = typeof isoStr === 'string' ? isoStr.trim() : isoStr.toISOString()
  
  // Check if string is already Jalali format (YYYY/MM/DD ...)
  if (/^(?:13|14)\d{2}\/\d{1,2}\/\d{1,2}/.test(str)) {
    return persianDigits ? toPersianDigits(str) : str
  }

  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (!match) {
    const d = new Date(str)
    if (isNaN(d.getTime())) return str
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    const datePart = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
    const timePart = includeSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`
    const res = `${datePart} ${timePart}`
    return persianDigits ? toPersianDigits(res) : res
  }

  const gy = parseInt(match[1], 10)
  const gm = parseInt(match[2], 10)
  const gd = parseInt(match[3], 10)
  const hh = match[4] || '00'
  const mm = match[5] || '00'
  const ss = match[6] || '00'

  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd)
  const datePart = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
  const timePart = includeSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`
  const res = match[4] ? `${datePart} ${timePart}` : datePart

  return persianDigits ? toPersianDigits(res) : res
}

/**
 * Parses user input in Shamsi format (e.g., "1405/06/15" or "1405-6-15" or Persian digits)
 */
export const MIN_SHAMSI_YEAR = 1380
export const MAX_SHAMSI_YEAR = 1405
export const MAX_SHAMSI_DATE_YEAR = 1410

/**
 * Validates whether a given year is an allowable Shamsi tax year (1380 - 1405)
 */
export function isValidShamsiYear(year: number | string | null | undefined): boolean {
  if (year == null || year === '') return false
  const num = typeof year === 'number' ? year : parseInt(toEnglishDigits(year.toString().trim()), 10)
  return !isNaN(num) && num >= MIN_SHAMSI_YEAR && num <= MAX_SHAMSI_YEAR
}

/**
 * Sanitizes typing for a 4-digit Shamsi tax year (1380 - 1405):
 * - Digit 1: Must be '1'
 * - Digit 2: Must be '3' or '4' (13xx or 14xx)
 * - Digit 3: If '13', must be '8' or '9'; If '14', must be '0'
 * - Digit 4: If '140', must be 0..5
 * Blocks non-Shamsi years (e.g. 1988, 1212, 2024).
 */
export function sanitizeShamsiYearInput(val: string): string {
  if (!val) return ''
  const digits = toEnglishDigits(val).replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''

  if (digits[0] !== '1') return ''
  if (digits.length >= 2 && digits[1] !== '3' && digits[1] !== '4') return '1'

  if (digits.length >= 3) {
    if (digits.startsWith('13') && digits[2] !== '8' && digits[2] !== '9') return '13'
    if (digits.startsWith('14') && digits[2] !== '0') return '14'
  }

  if (digits.length === 4) {
    const num = parseInt(digits, 10)
    if (num < MIN_SHAMSI_YEAR || num > MAX_SHAMSI_YEAR) return digits.slice(0, 3)
  }

  return digits
}

/**
 * Internal helper to sanitize year segment of a date
 */
function sanitizeDateYearSegment(val: string): string {
  if (!val) return ''
  const digits = val.replace(/\D/g, '').slice(0, 4)
  if (!digits) return ''
  if (digits[0] !== '1') return ''
  if (digits.length >= 2 && digits[1] !== '3' && digits[1] !== '4') return '1'
  if (digits.length >= 3) {
    if (digits.startsWith('13') && digits[2] !== '8' && digits[2] !== '9') return '13'
    if (digits.startsWith('14') && digits[2] !== '0' && digits[2] !== '1') return '14'
  }
  if (digits.length === 4) {
    const num = parseInt(digits, 10)
    if (num < MIN_SHAMSI_YEAR || num > MAX_SHAMSI_DATE_YEAR) return digits.slice(0, 3)
  }
  return digits
}

/**
 * Internal helper to sanitize month segment of a date (01 - 12)
 */
function sanitizeDateMonthSegment(val: string): string {
  if (!val) return ''
  const digits = val.replace(/\D/g, '').slice(0, 2)
  if (!digits) return ''
  if (digits.length === 1) {
    if (digits === '0' || digits === '1') return digits
    return '0' + digits // 2..9 expands to 02..09
  }
  const m = parseInt(digits, 10)
  if (isNaN(m) || m <= 0) return '01'
  if (m > 12) {
    if (digits[0] === '1') return '12'
    return '0' + digits[0]
  }
  return digits
}

/**
 * Internal helper to sanitize day segment of a date (01 - maxDays)
 */
function sanitizeDateDaySegment(val: string, maxDays = 31): string {
  if (!val) return ''
  const digits = val.replace(/\D/g, '').slice(0, 2)
  if (!digits) return ''
  if (digits.length === 1) {
    if (['0', '1', '2', '3'].includes(digits)) return digits
    return '0' + digits // 4..9 expands to 04..09
  }
  const d = parseInt(digits, 10)
  if (isNaN(d) || d <= 0) return '01'
  if (d > maxDays) return String(maxDays).padStart(2, '0')
  return digits
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
  if (jy < MIN_SHAMSI_YEAR || jy > MAX_SHAMSI_DATE_YEAR) return null
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
 * - Restricts years strictly to valid Shamsi years (1380 - 1410). Blocks 19xx, 12xx, 20xx.
 * - Restricts months strictly to 01 - 12 (blocks 88, 23, etc.).
 * - Restricts days strictly to 01 - 31 (and according to month max days).
 * - Auto-inserts slashes when typing digits continuously or after year/month completion.
 * - Preserves backspace deletion of slashes.
 */
export function formatJalaliDateMask(val: string): string {
  if (!val) return ''
  const eng = toEnglishDigits(val)
  const clean = eng.replace(/[^\d/]/g, '')
  if (!clean) return ''

  const endsWithSlash = clean.endsWith('/')
  const rawParts = clean.split('/').filter((_, i) => i < 3)

  // Case 1: user typed continuously without slashes (e.g. 14030501)
  if (!clean.includes('/')) {
    const d = clean.slice(0, 8)
    const y = sanitizeDateYearSegment(d.slice(0, 4))
    if (y.length < 4 || d.length === 4) return y

    const m = sanitizeDateMonthSegment(d.slice(4, 6))
    if (m.length < 2 || d.length <= 6) return y + '/' + m

    const mNum = parseInt(m, 10)
    const maxD = !isNaN(mNum) && mNum >= 1 && mNum <= 12 ? getDaysInJalaliMonth(parseInt(y, 10) || 1403, mNum) : 31
    const day = sanitizeDateDaySegment(d.slice(6, 8), maxD)
    return y + '/' + m + '/' + day
  }

  // Case 2: user typed with slashes
  const y = sanitizeDateYearSegment(rawParts[0] || '')
  if (rawParts.length === 1) {
    return endsWithSlash && y.length === 4 ? y + '/' : y
  }

  const mRaw = rawParts[1] || ''
  const m = sanitizeDateMonthSegment(mRaw)

  if (rawParts.length === 2) {
    if (endsWithSlash && m.length === 2) {
      return y + '/' + m + '/'
    }
    return y + '/' + m
  }

  const mNum = parseInt(m, 10)
  const maxD = !isNaN(mNum) && mNum >= 1 && mNum <= 12 ? getDaysInJalaliMonth(parseInt(y, 10) || 1403, mNum) : 31
  const dRaw = rawParts[2] || ''
  const day = sanitizeDateDaySegment(dRaw, maxD)

  return y + '/' + m + '/' + day
}

/**
 * Validates a Jalali date and returns a human-readable Persian error message if invalid
 */
export function validateJalaliDate(
  val: string,
  options?: { allowFuture?: boolean; minYear?: number; maxYear?: number }
): { isValid: boolean; error?: string } {
  if (!val || !val.trim()) {
    return { isValid: false, error: 'تاریخ الزامی است' }
  }

  const parsed = parseJalaliInput(val)
  if (!parsed) {
    return {
      isValid: false,
      error: 'تاریخ باید یک تاریخ معتبر و کامل شمسی با فرمت سال/ماه/روز باشد (مثال: ۱۴۰۳/۰۵/۰۱)',
    }
  }

  const minYear = options?.minYear ?? MIN_SHAMSI_YEAR
  const maxYear = options?.maxYear ?? MAX_SHAMSI_DATE_YEAR

  if (parsed.jy < minYear || parsed.jy > maxYear) {
    return {
      isValid: false,
      error: `سال تاریخ باید بین ${minYear} تا ${maxYear} باشد`,
    }
  }

  if (options?.allowFuture === false) {
    const today = getTodayJalali()
    const valKey = parsed.jy * 10000 + parsed.jm * 100 + parsed.jd
    const todayKey = today.jy * 10000 + today.jm * 100 + today.jd
    if (valKey > todayKey) {
      return {
        isValid: false,
        error: 'تاریخ ثبت شده نمی‌تواند در آینده باشد',
      }
    }
  }

  return { isValid: true }
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

/**
 * Blocks non-digit keystrokes (allows navigation, backspace, etc.)
 */
export function handleNumericKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (
    e.key === 'Backspace' ||
    e.key === 'Tab' ||
    e.key === 'Delete' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'Home' ||
    e.key === 'End' ||
    e.key === 'Enter' ||
    e.key === 'Escape' ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return
  }
  if (!/^[0-9۰-۹٠-٩]$/.test(e.key)) {
    e.preventDefault()
  }
}

/**
 * Blocks non-digit characters on beforeinput event (IME, virtual keyboard, drag/drop)
 */
export function handleNumericBeforeInput(e: React.FormEvent<HTMLInputElement>) {
  const inputEvent = e.nativeEvent as InputEvent
  if (inputEvent.data && !/^[0-9۰-۹٠-٩]+$/.test(inputEvent.data)) {
    e.preventDefault()
  }
}

/**
 * Blocks non-date keystrokes (only digits and slash)
 */
export function handleDateKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (
    e.key === 'Backspace' ||
    e.key === 'Tab' ||
    e.key === 'Delete' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'Home' ||
    e.key === 'End' ||
    e.key === 'Enter' ||
    e.key === 'Escape' ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return
  }
  if (!/^[0-9۰-۹٠-٩/]$/.test(e.key)) {
    e.preventDefault()
  }
}

/**
 * Blocks non-date characters on beforeinput event
 */
export function handleDateBeforeInput(e: React.FormEvent<HTMLInputElement>) {
  const inputEvent = e.nativeEvent as InputEvent
  if (inputEvent.data && !/^[0-9۰-۹٠-٩/]+$/.test(inputEvent.data)) {
    e.preventDefault()
  }
}
