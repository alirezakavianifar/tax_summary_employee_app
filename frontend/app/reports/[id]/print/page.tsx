'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { reportsApi } from '@/lib/api/reports'
import { BASE_URL } from '@/lib/api/config'
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
              سازمان امور مالیاتی کشور — اداره کل امور مالیاتی استان خوزستان
            </p>
          </div>

          {/* Employee Photo and Personal Info */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Photo */}
            <div className="col-span-3">
              <div className="photo-box border-2 border-gray-800 aspect-[3/4] flex items-center justify-center bg-gray-50">
                {report.employee.photoUrl ? (
                  <img
                    src={`${BASE_URL}${report.employee.photoUrl}`}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="form-field">
                  <span className="label">شماره پرسنلی:</span>
                  <span className="value">{report.employee.personnelNumber}</span>
                </div>
                <div className="form-field">
                  <span className="label">کد ملی:</span>
                  <span className="value">{report.employee.nationalId || '-'}</span>
                </div>
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
                <span className="value">{report.employee.appointmentPosition || '-'}</span>
              </div>
              <div className="form-field">
                <span className="label">سابقه خدمت:</span>
                <span className="value">
                  {report.employee.previousExperienceYears > 0 || (report.employee.serviceMonths && report.employee.serviceMonths > 0) ? (
                    <>
                      {report.employee.previousExperienceYears > 0 && `${report.employee.previousExperienceYears} سال `}
                      {report.employee.serviceMonths && report.employee.serviceMonths > 0 ? `و ${report.employee.serviceMonths} ماه` : ''}
                    </>
                  ) : (
                    '-'
                  )}
                </span>
              </div>
              {report.employee.employmentDate && (
                <div className="form-field">
                  <span className="label">تاریخ استخدام:</span>
                  <span className="value">{report.employee.employmentDate}</span>
                </div>
              )}
              {report.employee.appointmentDate && (
                <div className="form-field">
                  <span className="label">تاریخ انتصاب در سمت:</span>
                  <span className="value">{report.employee.appointmentDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Executive Performance & Dispute Resolution (Heads of Tax Affairs) */}
          {(() => {
            const execCap = report.capabilities?.find(
              (c) =>
                (c.collections1404_Amount != null && c.collections1404_Amount > 0) ||
                (c.collections1405_Amount != null && c.collections1405_Amount > 0) ||
                (c.totalObjections_Quantity != null && c.totalObjections_Quantity > 0) ||
                (c.issuedRulings_Quantity != null && c.issuedRulings_Quantity > 0) ||
                (c.finalizedObjections_Quantity != null && c.finalizedObjections_Quantity > 0) ||
                (c.systemicAudit1399_TotalQuantity != null && c.systemicAudit1399_TotalQuantity > 0) ||
                (c.systemicAudit1403_TotalQuantity != null && c.systemicAudit1403_TotalQuantity > 0)
            );
            if (!execCap) return null;

            return (
              <div className="section-box mb-6">
                <h2 className="section-title">عملکرد وصول و دادرسی مالیاتی (ویژه رؤسای امور و ادارات)</h2>
                
                <div className="mb-4">
                  <h3 className="font-bold text-sm mb-2">وصولی مالیاتی:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="stat-box">
                      <span className="stat-label">وصولی کل سال ۱۴۰۴:</span>
                      <span className="stat-value font-mono">
                        {execCap.collections1404_Amount ? execCap.collections1404_Amount.toLocaleString('fa-IR') : '۰'} ریال
                      </span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">وصولی ۷ ماهه سال ۱۴۰۵:</span>
                      <span className="stat-value font-mono">
                        {execCap.collections1405_Amount ? execCap.collections1405_Amount.toLocaleString('fa-IR') : '۰'} ریال
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm mb-2">رسیدگی به اعتراضات و دادرسی مالیاتی:</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="stat-box">
                      <span className="stat-label">کل اعتراضات:</span>
                      <span className="stat-value">
                        {execCap.totalObjections_Quantity?.toLocaleString('fa-IR') || '۰'} فقره
                      </span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">آراء صادره:</span>
                      <span className="stat-value">
                        {execCap.issuedRulings_Quantity?.toLocaleString('fa-IR') || '۰'} رأی
                        <span className="text-xs font-normal text-gray-600 block">
                          ({((execCap.issuedRulings_Percentage || 0) * 100).toFixed(1)}٪ صدور رأی)
                        </span>
                      </span>
                    </div>
                    <div className="stat-box">
                      <span className="stat-label">اعتراضات قطعی شده:</span>
                      <span className="stat-value">
                        {execCap.finalizedObjections_Quantity?.toLocaleString('fa-IR') || '۰'} پرونده
                        <span className="text-xs font-normal text-gray-600 block">
                          ({((execCap.finalizedRulings_Percentage || 0) * 100).toFixed(1)}٪ قطعیت)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Systemic Audit Performance Comparison (1399 vs 1403) */}
                {((execCap.systemicAudit1399_TotalQuantity != null && execCap.systemicAudit1399_TotalQuantity > 0) ||
                  (execCap.systemicAudit1403_TotalQuantity != null && execCap.systemicAudit1403_TotalQuantity > 0)) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="font-bold text-sm mb-2">رسیدگی سیستمی و وضعیت اعتراضات (مقایسه سنوات ۱۳۹۹ و ۱۴۰۳):</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* 1399 Box */}
                      <div className="border border-gray-300 rounded p-2.5 bg-gray-50/50">
                        <div className="font-bold text-xs text-gray-800 border-b pb-1 mb-2">
                          عملکرد رسیدگی سیستمی سال ۱۳۹۹:
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">کل رسیدگی سیستمی:</span>
                            <span className="font-bold">{execCap.systemicAudit1399_TotalQuantity?.toLocaleString('fa-IR') || '۰'} فقره</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">دارای اعتراض:</span>
                            <span className="font-bold">
                              {execCap.systemicAudit1399_ObjectionQuantity?.toLocaleString('fa-IR') || '۰'} فقره
                              <span className="text-[10px] text-gray-500 mr-1">({((execCap.systemicAudit1399_ObjectionPercentage || 0) * 100).toFixed(1)}٪)</span>
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">قطعیت اعتراضات:</span>
                            <span className="font-bold">
                              {execCap.systemicAudit1399_FinalizedObjectionQuantity?.toLocaleString('fa-IR') || '۰'} پرونده
                              <span className="text-[10px] text-gray-500 mr-1">({((execCap.systemicAudit1399_FinalizedObjectionPercentage || 0) * 100).toFixed(1)}٪)</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 1403 Box */}
                      <div className="border border-gray-300 rounded p-2.5 bg-gray-50/50">
                        <div className="font-bold text-xs text-gray-800 border-b pb-1 mb-2">
                          عملکرد رسیدگی سیستمی سال ۱۴۰۳:
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">کل رسیدگی سیستمی:</span>
                            <span className="font-bold">{execCap.systemicAudit1403_TotalQuantity?.toLocaleString('fa-IR') || '۰'} فقره</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">دارای اعتراض:</span>
                            <span className="font-bold">
                              {execCap.systemicAudit1403_ObjectionQuantity?.toLocaleString('fa-IR') || '۰'} فقره
                              <span className="text-[10px] text-gray-500 mr-1">({((execCap.systemicAudit1403_ObjectionPercentage || 0) * 100).toFixed(1)}٪)</span>
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">قطعیت اعتراضات:</span>
                            <span className="font-bold">
                              {execCap.systemicAudit1403_FinalizedObjectionQuantity?.toLocaleString('fa-IR') || '۰'} پرونده
                              <span className="text-[10px] text-gray-500 mr-1">({((execCap.systemicAudit1403_FinalizedObjectionPercentage || 0) * 100).toFixed(1)}٪)</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Administrative Status */}
          {report.adminStatus && (
            <div className="section-box mb-6">
              <h2 className="section-title">وضعیت اداری</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="stat-box">
                  <span className="stat-label">روزهای مأموریت:</span>
                  <span className="stat-value">{report.adminStatus.missionDays} روز</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">ساعات اضافه‌کاری:</span>
                  <span className="stat-value">{report.adminStatus.overtimeHours} ساعت</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">مرخصی استعلاجی:</span>
                  <span className="stat-value">{report.adminStatus.sickLeaveDays} روز</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">مرخصی استحقاقی:</span>
                  <span className="stat-value">{report.adminStatus.paidLeaveDays} روز</span>
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
