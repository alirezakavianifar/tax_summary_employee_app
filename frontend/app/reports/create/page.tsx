'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reportsApi } from '@/lib/api/reports'
import type { CreateEmployeeReportDto } from '@/lib/api/types'

export default function CreateReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<CreateEmployeeReportDto>({
    personnelNumber: '',
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
    capabilities: [
      {
        systemRole: '',
        detectionOfTaxIssues: false,
        detectionOfTaxEvasion: false,
        companyIdentification: false,
        valueAddedRecognition: false,
        referredOrExecuted: false,
      },
    ],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)
      const employeeId = await reportsApi.createReport(formData)
      router.push(`/reports/${employeeId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت اطلاعات')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">ثبت فرم جدید</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h2 className="text-xl font-bold mb-4 pb-2 border-b">اطلاعات شخصی</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">شماره پرسنلی *</label>
                <input
                  type="text"
                  required
                  value={formData.personnelNumber}
                  onChange={(e) => setFormData({ ...formData, personnelNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">نام *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">نام خانوادگی *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">مدرک تحصیلی</label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">واحد محل خدمت</label>
                <input
                  type="text"
                  value={formData.serviceUnit}
                  onChange={(e) => setFormData({ ...formData, serviceUnit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">پست سازمانی فعلی</label>
                <input
                  type="text"
                  value={formData.currentPosition}
                  onChange={(e) => setFormData({ ...formData, currentPosition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">پست موضوع انتصاب</label>
                <input
                  type="text"
                  value={formData.appointmentPosition}
                  onChange={(e) => setFormData({ ...formData, appointmentPosition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">سابقه خدمتی (سال)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.previousExperienceYears}
                  onChange={(e) => setFormData({ ...formData, previousExperienceYears: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Administrative Status */}
          <div>
            <h2 className="text-xl font-bold mb-4 pb-2 border-b">وضعیت نظم و انضباط اداری</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">تعداد روزهای ماموریت</label>
                <input
                  type="number"
                  min="0"
                  value={formData.missionDays}
                  onChange={(e) => setFormData({ ...formData, missionDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ساعات تشویقی</label>
                <input
                  type="number"
                  min="0"
                  value={formData.incentiveHours}
                  onChange={(e) => setFormData({ ...formData, incentiveHours: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ساعات تاخیر و غیبت</label>
                <input
                  type="number"
                  min="0"
                  value={formData.delayAndAbsenceHours}
                  onChange={(e) => setFormData({ ...formData, delayAndAbsenceHours: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">مرخصی ساعتی مجاز</label>
                <input
                  type="number"
                  min="0"
                  value={formData.hourlyLeaveHours}
                  onChange={(e) => setFormData({ ...formData, hourlyLeaveHours: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Performance Capabilities */}
          <div>
            <h2 className="text-xl font-bold mb-4 pb-2 border-b">توانمندی‌های عملکردی</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">نقش در سامانه سنیم</label>
                <input
                  type="text"
                  value={formData.capabilities[0].systemRole}
                  onChange={(e) => setFormData({
                    ...formData,
                    capabilities: [{
                      ...formData.capabilities[0],
                      systemRole: e.target.value,
                    }],
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.capabilities[0].detectionOfTaxIssues}
                    onChange={(e) => setFormData({
                      ...formData,
                      capabilities: [{
                        ...formData.capabilities[0],
                        detectionOfTaxIssues: e.target.checked,
                      }],
                    })}
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">تشخیص مسائل مالیاتی</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.capabilities[0].detectionOfTaxEvasion}
                    onChange={(e) => setFormData({
                      ...formData,
                      capabilities: [{
                        ...formData.capabilities[0],
                        detectionOfTaxEvasion: e.target.checked,
                      }],
                    })}
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">تشخیص فرار مالیاتی</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.capabilities[0].companyIdentification}
                    onChange={(e) => setFormData({
                      ...formData,
                      capabilities: [{
                        ...formData.capabilities[0],
                        companyIdentification: e.target.checked,
                      }],
                    })}
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">شناسایی شرکت</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.capabilities[0].valueAddedRecognition}
                    onChange={(e) => setFormData({
                      ...formData,
                      capabilities: [{
                        ...formData.capabilities[0],
                        valueAddedRecognition: e.target.checked,
                      }],
                    })}
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">شناسایی ارزش افزوده</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.capabilities[0].referredOrExecuted}
                    onChange={(e) => setFormData({
                      ...formData,
                      capabilities: [{
                        ...formData.capabilities[0],
                        referredOrExecuted: e.target.checked,
                      }],
                    })}
                    className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm">ارجاع یا اجرا شده</span>
                </label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'در حال ثبت...' : 'ثبت فرم'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
