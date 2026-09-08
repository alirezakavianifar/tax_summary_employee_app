'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xl mb-4">
        !
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">خطایی در پردازش رخ داده است</h2>
      <p className="text-xs text-gray-500 mb-6 max-w-sm">
        متاسفانه در بارگذاری این بخش خطایی پیش آمده است. لطفاً مجدداً تلاش کنید.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
        >
          تلاش مجدد
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition-colors shadow-xs"
        >
          صفحه اصلی
        </Link>
      </div>
    </div>
  )
}
