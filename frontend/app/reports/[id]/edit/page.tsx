'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { reportsApi } from '@/lib/api/reports'
import type { EmployeeReportDto, UpdateEmployeeReportDto } from '@/lib/api/types'

export default function EditReportPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<UpdateEmployeeReportDto>({
    firstName: '',
    lastName: '',
    education: '',
    serviceUnit: '',
    currentPosition: '',
    appointmentPosition: '',
    previousExperienceYears: 0,
    missionDays: 0,
    incentiveHours: 0,
    delayAndAbsenceHours: 0,
    hourlyLeaveHours: 0,
    capabilities: [],
  })

  useEffect(() => {
    loadReport()
  }, [params.id])

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      const report = await reportsApi.getReport(params.id)
      
      setFormData({
        firstName: report.employee.firstName,
        lastName: report.employee.lastName,
        education: report.employee.education,
        serviceUnit: report.employee.serviceUnit,
        currentPosition: report.employee.currentPosition,
        appointmentPosition: report.employee.appointmentPosition,
        previousExperienceYears: report.employee.previousExperienceYears,
        missionDays: report.adminStatus?.missionDays || 0,
        incentiveHours: report.adminStatus?.incentiveHours || 0,
        delayAndAbsenceHours: report.adminStatus?.delayAndAbsenceHours || 0,
        hourlyLeaveHours: report.adminStatus?.hourlyLeaveHours || 0,
        capabilities: report.capabilities.map(c => ({
          systemRole: c.systemRole,
          detectionOfTaxIssues: c.detectionOfTaxIssues,
          detectionOfTaxEvasion: c.detectionOfTaxEvasion,
          companyIdentification: c.companyIdentification,
          valueAddedRecognition: c.valueAddedRecognition,
          referredOrExecuted: c.referredOrExecuted,
        })),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      await reportsApi.updateReport(params.id, formData)
      alert('گزارش با موفقیت بروزرسانی شد')
      router.push(`/reports/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بروزرسانی گزارش')
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }))
  }

  const handleCapabilityChange = (index: number, field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.map((cap, i) =>
        i === index ? { ...cap, [field]: value } : cap
      ),
    }))
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

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ویرایش گزارش</h1>
          <Link
            href={`/reports/${params.id}`}
            className="text-primary-500 hover:text-primary-600"
          >
            ← بازگشت
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              اطلاعات فردی
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  نام *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  نام خانوادگی *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  تحصیلات *
                </label>
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  سابقه خدمت (سال) *
                </label>
                <input
                  type="number"
                  name="previousExperienceYears"
                  value={formData.previousExperienceYears}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  واحد محل خدمت *
                </label>
                <input
                  type="text"
                  name="serviceUnit"
                  value={formData.serviceUnit}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  پست فعلی *
                </label>
                <input
                  type="text"
                  name="currentPosition"
                  value={formData.currentPosition}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  پست مورد انتصاب *
                </label>
                <input
                  type="text"
                  name="appointmentPosition"
                  value={formData.appointmentPosition}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Administrative Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              وضعیت اداری
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  روزهای مأموریت
                </label>
                <input
                  type="number"
                  name="missionDays"
                  value={formData.missionDays}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ساعات اضافه‌کاری
                </label>
                <input
                  type="number"
                  name="incentiveHours"
                  value={formData.incentiveHours}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  تأخیر و غیبت (ساعت)
                </label>
                <input
                  type="number"
                  name="delayAndAbsenceHours"
                  value={formData.delayAndAbsenceHours}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  مرخصی ساعتی
                </label>
                <input
                  type="number"
                  name="hourlyLeaveHours"
                  value={formData.hourlyLeaveHours}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Performance Capabilities */}
          {formData.capabilities.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                توانمندی‌های عملکردی
              </h2>
              {formData.capabilities.map((capability, index) => (
                <div key={index} className="mb-6 pb-6 border-b last:border-b-0">
                  <h3 className="font-bold text-gray-700 mb-3">
                    نقش سیستمی: {capability.systemRole}
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={capability.detectionOfTaxIssues}
                        onChange={(e) =>
                          handleCapabilityChange(index, 'detectionOfTaxIssues', e.target.checked)
                        }
                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span>تشخیص موارد مالیاتی</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={capability.detectionOfTaxEvasion}
                        onChange={(e) =>
                          handleCapabilityChange(index, 'detectionOfTaxEvasion', e.target.checked)
                        }
                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span>تشخیص فرار مالیاتی</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={capability.companyIdentification}
                        onChange={(e) =>
                          handleCapabilityChange(index, 'companyIdentification', e.target.checked)
                        }
                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span>شناسایی شرکت</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={capability.valueAddedRecognition}
                        onChange={(e) =>
                          handleCapabilityChange(index, 'valueAddedRecognition', e.target.checked)
                        }
                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span>شناسایی ارزش افزوده</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={capability.referredOrExecuted}
                        onChange={(e) =>
                          handleCapabilityChange(index, 'referredOrExecuted', e.target.checked)
                        }
                        className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span>ارجاع یا اجرای کننده</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <Link
              href={`/reports/${params.id}`}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              انصراف
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
