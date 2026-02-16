'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { reportsApi } from '@/lib/api/reports'
import type { EmployeeReportDto, UpdateEmployeeReportDto } from '@/lib/api/types'
import { PhotoUpload } from '@/components/PhotoUpload'

export default function EditReportPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | undefined>(undefined)

  // Form state
  const [formData, setFormData] = useState<UpdateEmployeeReportDto>({
    firstName: '',
    lastName: '',
    education: '',
    serviceUnit: '',
    currentPosition: '',
    appointmentPosition: '',
    previousExperienceYears: 0,
    nationalId: '',
    missionDays: 0,
    sickLeaveDays: 0,
    paidLeaveDays: 0,
    overtimeHours: 0,
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

      setCurrentPhotoUrl(report.employee.photoUrl)

      setFormData({
        firstName: report.employee.firstName,
        lastName: report.employee.lastName,
        education: report.employee.education,
        serviceUnit: report.employee.serviceUnit,
        currentPosition: report.employee.currentPosition,
        appointmentPosition: report.employee.appointmentPosition,
        previousExperienceYears: report.employee.previousExperienceYears,
        nationalId: report.employee.nationalId || '',
        photoUrl: report.employee.photoUrl,
        statusDescription: report.employee.statusDescription || '',
        missionDays: report.adminStatus?.missionDays || 0,
        sickLeaveDays: report.adminStatus?.sickLeaveDays || 0,
        paidLeaveDays: report.adminStatus?.paidLeaveDays || 0,
        overtimeHours: report.adminStatus?.overtimeHours || 0,
        delayAndAbsenceHours: report.adminStatus?.delayAndAbsenceHours || 0,
        hourlyLeaveHours: report.adminStatus?.hourlyLeaveHours || 0,
        capabilities: report.capabilities.map(c => ({
          systemRole: c.systemRole,
          detectionOfTaxIssues: c.detectionOfTaxIssues,
          detectionOfTaxEvasion: c.detectionOfTaxEvasion,
          companyIdentification: c.companyIdentification,
          valueAddedRecognition: c.valueAddedRecognition,
          referredOrExecuted: c.referredOrExecuted,
          detectionOfTaxIssues_Quantity: c.detectionOfTaxIssues_Quantity || 0,
          detectionOfTaxIssues_Amount: c.detectionOfTaxIssues_Amount || 0,
          detectionOfTaxEvasion_Quantity: c.detectionOfTaxEvasion_Quantity || 0,
          detectionOfTaxEvasion_Amount: c.detectionOfTaxEvasion_Amount || 0,
          companyIdentification_Quantity: c.companyIdentification_Quantity || 0,
          companyIdentification_Amount: c.companyIdentification_Amount || 0,
          valueAddedRecognition_Quantity: c.valueAddedRecognition_Quantity || 0,
          valueAddedRecognition_Amount: c.valueAddedRecognition_Amount || 0,
          referredOrExecuted_Quantity: c.referredOrExecuted_Quantity || 0,
          referredOrExecuted_Amount: c.referredOrExecuted_Amount || 0,
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

      // Update report
      await reportsApi.updateReport(params.id, formData)

      // Upload new photo if provided
      if (photoFile) {
        await reportsApi.uploadPhoto(params.id, photoFile)
      }

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

  const handleCapabilityChange = (index: number, field: string, value: boolean | number) => {
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
                  کد ملی
                </label>
                <input
                  type="text"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleChange}
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

          {/* Employee Photo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              عکس پرسنلی
            </h2>
            <PhotoUpload
              currentPhotoUrl={currentPhotoUrl}
              onPhotoChange={setPhotoFile}
              disabled={saving}
            />
          </div>

          {/* Status Description */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              توضیحات وضعیت
            </h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">توضیحات</label>
              <textarea
                rows={6}
                name="statusDescription"
                value={formData.statusDescription}
                onChange={(e) => setFormData({ ...formData, statusDescription: e.target.value })}
                placeholder="توضیحات مربوط به وضعیت فعلی کارمند را وارد کنید..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
              />
              <p className="text-xs text-gray-500 mt-1">حداکثر 2000 کاراکتر</p>
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
                  name="overtimeHours"
                  value={formData.overtimeHours}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  مرخصی استعلاجی (روز)
                </label>
                <input
                  type="number"
                  name="sickLeaveDays"
                  value={formData.sickLeaveDays}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  مرخصی استحقاقی (روز)
                </label>
                <input
                  type="number"
                  name="paidLeaveDays"
                  value={formData.paidLeaveDays}
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
                <div key={index} className="mb-6">
                  <h3 className="font-bold text-gray-700 mb-3">
                    نقش سیستمی: {capability.systemRole}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-sm font-semibold">نوع توانمندی</th>
                          <th className="border border-gray-300 px-4 py-2 text-sm font-semibold">فعال</th>
                          <th className="border border-gray-300 px-4 py-2 text-sm font-semibold">تعداد</th>
                          <th className="border border-gray-300 px-4 py-2 text-sm font-semibold">مبلغ (ریال)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-sm">تشخیص مشاغل/مالیات</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={capability.detectionOfTaxIssues}
                              onChange={(e) => handleCapabilityChange(index, 'detectionOfTaxIssues', e.target.checked)}
                              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={capability.detectionOfTaxIssues_Quantity}
                              onChange={(e) => handleCapabilityChange(index, 'detectionOfTaxIssues_Quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={capability.detectionOfTaxIssues_Amount}
                              onChange={(e) => handleCapabilityChange(index, 'detectionOfTaxIssues_Amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-sm">تشخیص فرار مالیاتی</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={capability.detectionOfTaxEvasion}
                              onChange={(e) => handleCapabilityChange(index, 'detectionOfTaxEvasion', e.target.checked)}
                              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={capability.detectionOfTaxEvasion_Quantity}
                              onChange={(e) => handleCapabilityChange(index, 'detectionOfTaxEvasion_Quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={capability.detectionOfTaxEvasion_Amount}
                              onChange={(e) => handleCapabilityChange(index, 'detectionOfTaxEvasion_Amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-sm">تشخیص شرکت/مالیات</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={capability.companyIdentification}
                              onChange={(e) => handleCapabilityChange(index, 'companyIdentification', e.target.checked)}
                              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={capability.companyIdentification_Quantity}
                              onChange={(e) => handleCapabilityChange(index, 'companyIdentification_Quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={capability.companyIdentification_Amount}
                              onChange={(e) => handleCapabilityChange(index, 'companyIdentification_Amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-sm">تشخیص ارزش افزوده/مالیات</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={capability.valueAddedRecognition}
                              onChange={(e) => handleCapabilityChange(index, 'valueAddedRecognition', e.target.checked)}
                              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={capability.valueAddedRecognition_Quantity}
                              onChange={(e) => handleCapabilityChange(index, 'valueAddedRecognition_Quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={capability.valueAddedRecognition_Amount}
                              onChange={(e) => handleCapabilityChange(index, 'valueAddedRecognition_Amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="border border-gray-300 px-4 py-2 text-sm">ارجاع یا اجرا شده</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={capability.referredOrExecuted}
                              onChange={(e) => handleCapabilityChange(index, 'referredOrExecuted', e.target.checked)}
                              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              value={capability.referredOrExecuted_Quantity}
                              onChange={(e) => handleCapabilityChange(index, 'referredOrExecuted_Quantity', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={capability.referredOrExecuted_Amount}
                              onChange={(e) => handleCapabilityChange(index, 'referredOrExecuted_Amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
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
