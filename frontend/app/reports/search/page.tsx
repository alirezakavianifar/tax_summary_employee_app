'use client'

import { useState } from 'react'
import Link from 'next/link'
import { reportsApi } from '@/lib/api/reports'
import type { EmployeeDto } from '@/lib/api/types'
import { useAuth } from '@/contexts/AuthContext'
import { Settings, Sparkles } from 'lucide-react'

export default function SearchReportsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<EmployeeDto[]>([])
  const [loading, setLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchTerm.trim()) {
      setError('لطفاً عبارت جستجو را وارد کنید')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setHasSearched(true)
      const results = await reportsApi.searchEmployees(searchTerm.trim())
      setSearchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در جستجو')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setSearchTerm('')
    setSearchResults([])
    setError(null)
    setHasSearched(false)
  }

  const handleBulkGenerate = async (overwrite: boolean = false) => {
    const confirmMessage = overwrite
      ? 'آیا از بازنویسی تمامی توضیحات اطمینان دارید؟ این عمل قابل بازگشت نیست.'
      : 'آیا از تولید خودکار توضیحات برای تمامی کارمندانی که توضیحات ندارند اطمینان دارید؟'

    if (!confirm(confirmMessage)) return

    try {
      setBulkLoading(true)
      setError(null)
      const result = await reportsApi.bulkGenerateDescriptions(overwrite)

      if (result.count === 0 && !overwrite) {
        alert('هیچ موردی برروزرسانی نشد. احتمالا تمامی کارمندان از قبل دارای توضیحات هستند. برای بروزرسانی تمامی موارد، از آیکون تنظیمات (چرخ‌دنده) کنار دکمه استفاده کنید.')
      } else {
        alert(result.message)
        // If we are currently showing search results, refresh them
        if (hasSearched && searchTerm) {
          const results = await reportsApi.searchEmployees(searchTerm.trim())
          setSearchResults(results)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در عملیات انبوه')
    } finally {
      setBulkLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">جستجو در فرم‌ها</h1>
              <p className="text-gray-600">
                جستجو بر اساس نام، نام خانوادگی یا شماره پرسنلی
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Link
                href="/"
                className="text-primary-500 hover:text-primary-600"
              >
                ← بازگشت به صفحه اصلی
              </Link>
              {isAdmin && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleBulkGenerate(false)}
                    disabled={bulkLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors text-sm font-medium"
                    title="تولید توضیحات برای موارد خالی"
                  >
                    <Sparkles size={16} />
                    {bulkLoading ? 'در حال پردازش...' : 'تولید انبوه توضیحات ✨'}
                  </button>
                  <button
                    onClick={() => handleBulkGenerate(true)}
                    disabled={bulkLoading}
                    className="flex items-center justify-center p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
                    title="بازنویسی تمامی توضیحات (احتیاط!)"
                  >
                    <Settings size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="searchTerm" className="block text-sm font-bold text-gray-700 mb-2">
                عبارت جستجو
              </label>
              <div className="flex gap-2">
                <input
                  id="searchTerm"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="نام، نام خانوادگی یا شماره پرسنلی را وارد کنید..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  {loading ? 'در حال جستجو...' : 'جستجو'}
                </button>
                {hasSearched && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    پاک کردن
                  </button>
                )}
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              نتایج جستجو
              {searchResults.length > 0 && (
                <span className="text-sm font-normal text-gray-600 mr-2">
                  ({searchResults.length} نتیجه)
                </span>
              )}
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                <p className="text-gray-600">در حال جستجو...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-gray-600 text-lg mb-2">نتیجه‌ای یافت نشد</p>
                <p className="text-gray-500 text-sm">
                  لطفاً با عبارت دیگری جستجو کنید
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">
                        شماره پرسنلی
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">
                        نام و نام خانوادگی
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">
                        کد ملی
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">
                        واحد محل خدمت
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">
                        پست فعلی
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">
                        عملیات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {searchResults.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{employee.personnelNumber}</td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {employee.firstName} {employee.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {employee.nationalId || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {employee.serviceUnit}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {employee.currentPosition}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <Link
                              href={`/reports/${employee.id}`}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                            >
                              مشاهده
                            </Link>
                            <Link
                              href={`/reports/${employee.id}/print`}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                            >
                              چاپ
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        {!hasSearched && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">دسترسی سریع</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/reports"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-bold text-gray-800 mb-1">مشاهده همه فرم‌ها</h3>
                <p className="text-sm text-gray-600">لیست کامل فرم‌های ثبت شده</p>
              </Link>
              <Link
                href="/reports/create"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <h3 className="font-bold text-gray-800 mb-1">ثبت فرم جدید</h3>
                <p className="text-sm text-gray-600">افزودن داوطلب جدید</p>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
