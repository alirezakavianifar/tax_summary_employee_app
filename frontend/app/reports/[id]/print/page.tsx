'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { reportsApi } from '@/lib/api/reports'
import type { EmployeeReportDto } from '@/lib/api/types'

export default function PrintReportPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<EmployeeReportDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const handlePrint = () => {
    window.print()
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
            <Link
              href="/reports"
              className="inline-block mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              بازگشت
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Controls - Hidden in print */}
      <div className="print:hidden bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">پیش‌نمایش چاپ</h1>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
            >
              چاپ
            </button>
            <Link
              href={`/reports/${params.id}`}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              بازگشت
            </Link>
          </div>
        </div>
      </div>

      {/* Print Content - A4 Format */}
      <div className="print:p-0 p-8">
        <div className="report-container max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none">
          {/* Header */}
          <div className="text-center border-b-4 border-gray-800 pb-6 mb-6">
            <h1 className="text-2xl font-bold mb-2">
              فرم وضعیت داوطلبین ارتقاء و انتصاب به سطوح مدیریتی
            </h1>
            <p className="text-lg text-gray-700">
              سازمان امور مالیاتی کشور
            </p>
          </div>

          {/* Employee Photo and Personal Info */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Photo */}
            <div className="col-span-3">
              <div className="photo-box border-2 border-gray-800 aspect-[3/4] flex items-center justify-center bg-gray-50">
                {report.employee.photoUrl ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${report.employee.photoUrl}`}
                    alt="عکس پرسنلی"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-sm text-center">عکس پرسنلی</span>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div className="col-span-9 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-field">
                  <span className="label">نام:</span>
                  <span className="value">{report.employee.firstName}</span>
                </div>
                <div className="form-field">
                  <span className="label">نام خانوادگی:</span>
                  <span className="value">{report.employee.lastName}</span>
                </div>
              </div>
              
              <div className="form-field">
                <span className="label">شماره پرسنلی:</span>
                <span className="value">{report.employee.personnelNumber}</span>
              </div>

              <div className="form-field">
                <span className="label">آخرین مدرک تحصیلی:</span>
                <span className="value">{report.employee.education}</span>
              </div>

              <div className="form-field">
                <span className="label">واحد محل خدمت:</span>
                <span className="value">{report.employee.serviceUnit}</span>
              </div>

              <div className="form-field col-span-2">
                <span className="label">توضیحات وضعیت:</span>
                <div className="value border border-gray-300 p-2 min-h-[100px] bg-white whitespace-pre-wrap">
                  {report.employee.statusDescription || ''}
                </div>
              </div>
            </div>
          </div>

          {/* Position Information */}
          <div className="section-box mb-6">
            <h2 className="section-title">اطلاعات پست سازمانی</h2>
            <div className="space-y-3">
              <div className="form-field">
                <span className="label">پست فعلی:</span>
                <span className="value">{report.employee.currentPosition}</span>
              </div>
              <div className="form-field">
                <span className="label">پست مورد انتصاب:</span>
                <span className="value">{report.employee.appointmentPosition}</span>
              </div>
              <div className="form-field">
                <span className="label">سابقه خدمت:</span>
                <span className="value">{report.employee.previousExperienceYears} سال</span>
              </div>
            </div>
          </div>

          {/* Administrative Status */}
          {report.adminStatus && (
            <div className="section-box mb-6">
              <h2 className="section-title">وضعیت اداری</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-box">
                  <span className="stat-label">روزهای مأموریت:</span>
                  <span className="stat-value">{report.adminStatus.missionDays} روز</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">ساعات اضافه‌کاری:</span>
                  <span className="stat-value">{report.adminStatus.incentiveHours} ساعت</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">تأخیر و غیبت:</span>
                  <span className="stat-value">{report.adminStatus.delayAndAbsenceHours} ساعت</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">مرخصی ساعتی:</span>
                  <span className="stat-value">{report.adminStatus.hourlyLeaveHours} ساعت</span>
                </div>
              </div>
            </div>
          )}

          {/* Performance Capabilities */}
          {report.capabilities && report.capabilities.length > 0 && (
            <div className="section-box mb-6">
              <h2 className="section-title">توانمندی‌های عملکردی</h2>
              {report.capabilities.map((capability, index) => (
                <div key={capability.id} className="mb-4">
                  <div className="font-bold mb-3">نقش سیستمی: {capability.systemRole}</div>
                  <table className="w-full border-collapse border border-gray-800">
                    <thead>
                      <tr>
                        <th className="border border-gray-800 px-3 py-2 text-sm font-bold bg-gray-100">نوع توانمندی</th>
                        <th className="border border-gray-800 px-3 py-2 text-sm font-bold bg-gray-100">وضعیت</th>
                        <th className="border border-gray-800 px-3 py-2 text-sm font-bold bg-gray-100">تعداد</th>
                        <th className="border border-gray-800 px-3 py-2 text-sm font-bold bg-gray-100">مبلغ (ریال)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-800 px-3 py-2 text-sm">تشخیص مشاغل/مالیات</td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.detectionOfTaxIssues ? '✓' : '☐'}
                        </td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.detectionOfTaxIssues_Quantity?.toLocaleString('fa-IR') || 0}
                        </td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.detectionOfTaxIssues_Amount?.toLocaleString('fa-IR') || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-800 px-3 py-2 text-sm">تشخیص فرار مالیاتی</td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.detectionOfTaxEvasion ? '✓' : '☐'}
                        </td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.detectionOfTaxEvasion_Quantity?.toLocaleString('fa-IR') || 0}
                        </td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.detectionOfTaxEvasion_Amount?.toLocaleString('fa-IR') || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-800 px-3 py-2 text-sm">تشخیص شرکت/مالیات</td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.companyIdentification ? '✓' : '☐'}
                        </td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.companyIdentification_Quantity?.toLocaleString('fa-IR') || 0}
                        </td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.companyIdentification_Amount?.toLocaleString('fa-IR') || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-800 px-3 py-2 text-sm">تشخیص ارزش افزوده/مالیات</td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.valueAddedRecognition ? '✓' : '☐'}
                        </td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.valueAddedRecognition_Quantity?.toLocaleString('fa-IR') || 0}
                        </td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.valueAddedRecognition_Amount?.toLocaleString('fa-IR') || 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-800 px-3 py-2 text-sm">ارجاع یا اجرا شده</td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.referredOrExecuted ? '✓' : '☐'}
                        </td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.referredOrExecuted_Quantity?.toLocaleString('fa-IR') || 0}
                        </td>
                        <td className="border border-gray-800 px-3 py-2 text-center text-sm">
                          {capability.referredOrExecuted_Amount?.toLocaleString('fa-IR') || 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t-2">
            <div className="text-center">
              <div className="h-20 mb-2"></div>
              <div className="border-t-2 border-gray-800 pt-2">
                <p className="font-bold">امضاء کارمند</p>
                <p className="text-sm text-gray-600 mt-1">
                  تاریخ: {new Date().toLocaleDateString('fa-IR')}
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="h-20 mb-2"></div>
              <div className="border-t-2 border-gray-800 pt-2">
                <p className="font-bold">تأیید مدیر واحد</p>
                <p className="text-sm text-gray-600 mt-1">
                  تاریخ: ........................
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t">
            <p>شماره فرم: {report.employee.personnelNumber}</p>
            <p>تاریخ تشکیل: {new Date(report.employee.createdAt).toLocaleDateString('fa-IR')}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .report-container {
            width: 100%;
            max-width: 100%;
            box-shadow: none !important;
            padding: 0;
          }
        }

        .report-container {
          padding: 40px;
          font-family: 'Vazirmatn', sans-serif;
          color: #000;
          line-height: 1.8;
        }

        .photo-box {
          min-height: 200px;
        }

        .section-box {
          border: 2px solid #1f2937;
          border-radius: 8px;
          padding: 20px;
          background-color: #f9fafb;
        }

        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #374151;
        }

        .form-field {
          display: flex;
          align-items: baseline;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px dotted #d1d5db;
        }

        .label {
          font-weight: bold;
          color: #374151;
          min-width: 140px;
        }

        .value {
          flex: 1;
          color: #000;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          padding: 12px;
          background-color: white;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
        }

        .checkbox-field {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
        }

        .checkbox {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid #374151;
          text-align: center;
          line-height: 16px;
          font-weight: bold;
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
