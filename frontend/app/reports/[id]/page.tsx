'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { reportsApi } from '@/lib/api/reports'
import type { EmployeeReportDto } from '@/lib/api/types'

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [report, setReport] = useState<EmployeeReportDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadReport()
  }, [params.id])

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reportsApi.getReport(params.id)
      setReport(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این گزارش اطمینان دارید؟')) {
      return
    }

    try {
      setDeleting(true)
      await reportsApi.deleteReport(params.id)
      alert('گزارش با موفقیت حذف شد')
      router.push('/reports')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در حذف گزارش')
      setDeleting(false)
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

  if (error || !report) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-700 mb-2">خطا</h2>
            <p className="text-red-600">{error || 'گزارش یافت نشد'}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={loadReport}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                تلاش مجدد
              </button>
              <Link
                href="/reports"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                بازگشت
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                جزئیات گزارش کارمند
              </h1>
              <p className="text-gray-600">
                شماره پرسنلی: <span className="font-bold">{report.employee.personnelNumber}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/reports/${params.id}/edit`}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                ویرایش
              </Link>
              <Link
                href={`/reports/${params.id}/print`}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                چاپ
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'در حال حذف...' : 'حذف'}
              </button>
            </div>
          </div>
          <Link
            href="/reports"
            className="text-primary-500 hover:text-primary-600 inline-flex items-center"
          >
            ← بازگشت به لیست
          </Link>
        </div>

        {/* Employee Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            اطلاعات فردی
          </h2>

          {/* Photo and Status Description - Side by Side */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Photo - Left Side */}
            <div className="col-span-3">
              {report.employee.photoUrl ? (
                <div className="w-full aspect-[3/4] border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${report.employee.photoUrl}`}
                    alt={`${report.employee.firstName} ${report.employee.lastName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[3/4] border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <span className="text-gray-400 text-sm">عکس پرسنلی</span>
                </div>
              )}
              <p className="text-center text-sm text-gray-600 mt-2">عکس</p>
            </div>

            {/* Status Description - Right Side */}
            <div className="col-span-9">
              <div className="border-2 border-gray-300 rounded-lg p-4 h-full bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700 mb-2">توضیحات وضعیت:</h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {report.employee.statusDescription || 'توضیحاتی ثبت نشده است'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">نام:</label>
              <p className="text-gray-900">{report.employee.firstName}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">نام خانوادگی:</label>
              <p className="text-gray-900">{report.employee.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">تحصیلات:</label>
              <p className="text-gray-900">{report.employee.education}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">کد ملی:</label>
              <p className="text-gray-900">{report.employee.nationalId || '-'}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">سابقه خدمت (سال):</label>
              <p className="text-gray-900">{report.employee.previousExperienceYears}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">واحد محل خدمت:</label>
              <p className="text-gray-900">{report.employee.serviceUnit}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">پست فعلی:</label>
              <p className="text-gray-900">{report.employee.currentPosition}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">پست مورد انتصاب:</label>
              <p className="text-gray-900">{report.employee.appointmentPosition}</p>
            </div>
          </div>
        </div>

        {/* Administrative Status */}
        {report.adminStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              وضعیت اداری
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-1">روزهای مأموریت:</label>
                <p className="text-2xl font-bold text-blue-600">{report.adminStatus.missionDays}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-1">ساعات اضافه‌کاری:</label>
                <p className="text-2xl font-bold text-green-600">{report.adminStatus.overtimeHours}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-1">مرخصی استعلاجی:</label>
                <p className="text-2xl font-bold text-purple-600">{report.adminStatus.sickLeaveDays}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-1">مرخصی استحقاقی:</label>
                <p className="text-2xl font-bold text-orange-600">{report.adminStatus.paidLeaveDays}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-1">تأخیر و غیبت (ساعت):</label>
                <p className="text-2xl font-bold text-red-600">{report.adminStatus.delayAndAbsenceHours}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-1">مرخصی ساعتی:</label>
                <p className="text-2xl font-bold text-yellow-600">{report.adminStatus.hourlyLeaveHours}</p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Capabilities */}
        {report.capabilities && report.capabilities.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              توانمندی‌های عملکردی
            </h2>
            <div className="space-y-6">
              {report.capabilities.map((capability, index) => (
                <div key={capability.id} className="border-b pb-4 last:border-b-0">
                  <h3 className="font-bold text-gray-700 mb-3">
                    نقش سیستمی: {capability.systemRole}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-sm font-semibold">نوع توانمندی</th>
                          <th className="border border-gray-300 px-4 py-2 text-sm font-semibold">وضعیت</th>
                          <th className="border border-gray-300 px-4 py-2 text-sm font-semibold">تعداد</th>
                          <th className="border border-gray-300 px-4 py-2 text-sm font-semibold">مبلغ (ریال)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-sm">تشخیص مشاغل/مالیات</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${capability.detectionOfTaxIssues ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {capability.detectionOfTaxIssues ? 'فعال' : 'غیرفعال'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{capability.detectionOfTaxIssues_Quantity?.toLocaleString('fa-IR') || 0}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{capability.detectionOfTaxIssues_Amount?.toLocaleString('fa-IR') || 0}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-sm">تشخیص فرار مالیاتی</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${capability.detectionOfTaxEvasion ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {capability.detectionOfTaxEvasion ? 'فعال' : 'غیرفعال'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{capability.detectionOfTaxEvasion_Quantity?.toLocaleString('fa-IR') || 0}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{capability.detectionOfTaxEvasion_Amount?.toLocaleString('fa-IR') || 0}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-sm">تشخیص شرکت/مالیات</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${capability.companyIdentification ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {capability.companyIdentification ? 'فعال' : 'غیرفعال'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{capability.companyIdentification_Quantity?.toLocaleString('fa-IR') || 0}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{capability.companyIdentification_Amount?.toLocaleString('fa-IR') || 0}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-sm">تشخیص ارزش افزوده/مالیات</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${capability.valueAddedRecognition ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {capability.valueAddedRecognition ? 'فعال' : 'غیرفعال'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{capability.valueAddedRecognition_Quantity?.toLocaleString('fa-IR') || 0}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{capability.valueAddedRecognition_Amount?.toLocaleString('fa-IR') || 0}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-sm">ارجاع یا اجرا شده</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${capability.referredOrExecuted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {capability.referredOrExecuted ? 'فعال' : 'غیرفعال'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{capability.referredOrExecuted_Quantity?.toLocaleString('fa-IR') || 0}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{capability.referredOrExecuted_Amount?.toLocaleString('fa-IR') || 0}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>تاریخ ایجاد: {new Date(report.employee.createdAt).toLocaleDateString('fa-IR')}</p>
          {report.employee.updatedAt && (
            <p>آخرین بروزرسانی: {new Date(report.employee.updatedAt).toLocaleDateString('fa-IR')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
