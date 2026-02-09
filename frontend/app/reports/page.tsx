'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { reportsApi } from '@/lib/api/reports'
import type { EmployeeDto } from '@/lib/api/types'

export default function ReportsPage() {
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadEmployees(currentPage)
  }, [currentPage, searchTerm]) // Added searchTerm to dependencies to trigger reload on search/clear

  const loadEmployees = async (page: number) => {
    try {
      setLoading(true)
      setError(null)
      // Call paginated API with search term if present
      const response = await reportsApi.getEmployeesPaged(page, pageSize, searchTerm)
      setEmployees(response.data)
      setTotalPages(response.pagination.totalPages)
      setTotalCount(response.pagination.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // This will trigger useEffect, which calls loadEmployees(1)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setCurrentPage(1) // This will trigger useEffect, which calls loadEmployees(1) with empty searchTerm
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)
      const data = await reportsApi.seedFromExcel(file)

      const { message, count } = data

      // Clear current list and force reload to page 1
      setEmployees([])
      if (currentPage === 1) {
        await loadEmployees(1)
      } else {
        setCurrentPage(1)
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (count === 0) {
        alert('هشدار: هیچ رکوردی بارگذاری نشد. لطفاً سرستون‌های فایل اکسل را بررسی کنید.\n(Expected: شماره کارمند, نام, واحد متبوع, ...)')
      } else {
        alert(`${message}\nتعداد رکوردهای پردازش شده: ${count}`)
      }
    } catch (err) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : 'خطا در بارگذاری فایل اکسل'
      alert(errorMessage)
    } finally {
      setImporting(false)
    }
  }

  if (loading && !importing && employees.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-700 mb-2">خطا</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => loadEmployees(currentPage)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">فرم‌های ثبت شده <span className="text-sm font-normal text-gray-500">({totalCount} مورد)</span></h1>
          <div className="flex gap-4">
            <input
              type="file"
              accept=".xlsx"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              disabled={importing}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {importing ? 'در حال وارد کردن...' : 'ورود از اکسل'}
            </button>
            <Link
              href="/reports/create"
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              ثبت فرم جدید
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو بر اساس نام، نام خانوادگی یا شماره پرسنلی..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              جستجو
            </button>
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                پاک کردن
              </button>
            )}
          </form>
        </div>

        {employees.length === 0 && !loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">هیچ فرمی ثبت نشده است</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleImportClick}
                disabled={importing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ورود از اکسل
              </button>
              <Link
                href="/reports/create"
                className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                ثبت اولین فرم
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">شماره پرسنلی</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">نام و نام خانوادگی</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">واحد محل خدمت</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">پست فعلی</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{employee.personnelNumber}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {employee.firstName} {employee.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{employee.serviceUnit}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{employee.currentPosition}</td>
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

            {/* Pagination Controls */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                نمایش {((currentPage - 1) * pageSize) + 1} تا {Math.min(currentPage * pageSize, totalCount)} از {totalCount} مورد
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  قبلی
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Simple logic to show a window of pages or just first few. 
                  // For simplicity, let's just show current page surrounding, or just current.
                  // Let's implement a simple sliding window later if needed.
                  // For now, simpler: Just show current page number
                  return null;
                })}
                <span className="px-3 py-1 self-center">
                  صفحه {currentPage} از {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  بعدی
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-primary-500 hover:text-primary-600">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  )
}
