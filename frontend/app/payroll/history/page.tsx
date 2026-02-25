'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  payrollApi,
  PROCESS_TYPE_LABELS,
  type PayrollRunSummaryDto,
} from '@/lib/api/payroll'
import { Download, Trash2, Loader2, ArrowRight, History } from 'lucide-react'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PayrollHistoryPage() {
  const [runs, setRuns] = useState<PayrollRunSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadRuns = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await payrollApi.getRuns()
      setRuns(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری تاریخچه')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRuns()
  }, [])

  const handleRedownload = async (run: PayrollRunSummaryDto) => {
    setDownloading(run.id)
    try {
      const result = await payrollApi.getRunById(run.id)
      const blob = await payrollApi.exportPayroll(result)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payroll_${run.runLabel}_${run.id.slice(0, 8)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دانلود فایل')
    } finally {
      setDownloading(null)
    }
  }

  const handleDelete = async (run: PayrollRunSummaryDto) => {
    if (!confirm(`آیا از حذف "${run.runLabel}" مطمئن هستید؟`)) return
    setDeleting(run.id)
    try {
      await payrollApi.deleteRun(run.id)
      setRuns((prev) => prev.filter((r) => r.id !== run.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در حذف')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <ProtectedRoute>
      <div dir="rtl" className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History className="w-7 h-7 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">تاریخچه محاسبات حقوقی</h1>
            </div>
            <Link
              href="/payroll"
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <ArrowRight className="w-4 h-4" />
              بازگشت به محاسبات
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : runs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">هیچ اجرای ذخیره‌شده‌ای وجود ندارد</p>
              <Link href="/payroll" className="mt-4 inline-block text-primary-600 hover:underline text-sm">
                رفتن به صفحه محاسبات
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-right font-medium text-gray-700">برچسب</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">نوع فرآیند</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">تعداد ردیف</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">تاریخ ایجاد</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{run.runLabel}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {PROCESS_TYPE_LABELS[run.processType] ?? run.processType}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{run.rowCount.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(run.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleRedownload(run)}
                            disabled={downloading === run.id}
                            title="دانلود مجدد Excel"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-60 transition-colors"
                          >
                            {downloading === run.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(run)}
                            disabled={deleting === run.id}
                            title="حذف"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-60 transition-colors"
                          >
                            {deleting === run.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
