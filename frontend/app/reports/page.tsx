'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { reportsApi } from '@/lib/api/reports'
import type { EmployeeDto } from '@/lib/api/types'

export default function ReportsPage() {
  const [employees, setEmployees] = useState<EmployeeDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportsApi.getAllEmployees()
      setEmployees(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
              onClick={loadEmployees}
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
          <h1 className="text-3xl font-bold">فرم‌های ثبت شده</h1>
          <Link
            href="/reports/create"
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            ثبت فرم جدید
          </Link>
        </div>

        {employees.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">هیچ فرمی ثبت نشده است</p>
            <Link
              href="/reports/create"
              className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              ثبت اولین فرم
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
