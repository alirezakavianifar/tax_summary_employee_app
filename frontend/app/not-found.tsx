import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-black text-xl mb-4">
        ۴۰۴
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">صفحه مورد نظر یافت نشد</h2>
      <p className="text-xs text-gray-500 mb-6 max-w-sm">
        صفحه‌ای که به دنبال آن هستید وجود ندارد یا به آدرس دیگری منتقل شده است.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
      >
        بازگشت به صفحه اصلی
      </Link>
    </div>
  )
}
