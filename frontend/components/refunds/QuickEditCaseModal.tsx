'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  X,
  Edit3,
  Loader2,
  AlertCircle,
  Save,
  Building,
  CreditCard,
  FileText,
  Calendar,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react'
import { taxRefundApi } from '@/lib/api/taxRefund'
import {
  TaxRefundCaseSummary,
  TaxSourceType,
  TaxSourceLabels,
  RefundCaseStatus,
} from '@/types/taxRefund'

interface QuickEditCaseModalProps {
  caseItem: TaxRefundCaseSummary | null
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export function QuickEditCaseModal({
  caseItem,
  isOpen,
  onClose,
  onSaved,
}: QuickEditCaseModalProps) {
  const [formData, setFormData] = useState({
    taxpayerName: '',
    economicCode: '',
    nationalId: '',
    taxYear: 1402,
    taxSource: TaxSourceType.CorporateIncome,
    taxUnitCode: '',
    province: 'خوزستان',
    city: 'اهواز',
    address: '',
    bankName: '',
    shebaNumber: '',
    docketNumber: '',
    refundReason: '',
  })

  const [loadingDetails, setLoadingDetails] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Pre-fill initial summary fields and fetch full case details
  useEffect(() => {
    if (!caseItem || !isOpen) return

    setFormData({
      taxpayerName: caseItem.taxpayerName || '',
      economicCode: caseItem.economicCode || '',
      nationalId: '',
      taxYear: caseItem.taxYear || 1402,
      taxSource: caseItem.taxSource || TaxSourceType.CorporateIncome,
      taxUnitCode: '',
      province: 'خوزستان',
      city: caseItem.city || 'اهواز',
      address: '',
      bankName: '',
      shebaNumber: '',
      docketNumber: caseItem.docketNumber || '',
      refundReason: '',
    })

    setError(null)
    setSuccess(false)

    // Fetch full case to populate banking, national ID, etc.
    let isMounted = true
    const fetchFullDetails = async () => {
      try {
        setLoadingDetails(true)
        const fullCase = await taxRefundApi.getCaseById(caseItem.id)
        if (isMounted && fullCase) {
          setFormData({
            taxpayerName: fullCase.taxpayerName || caseItem.taxpayerName || '',
            economicCode: fullCase.economicCode || caseItem.economicCode || '',
            nationalId: fullCase.nationalId || '',
            taxYear: fullCase.taxYear || caseItem.taxYear || 1402,
            taxSource: fullCase.taxSource || caseItem.taxSource || TaxSourceType.CorporateIncome,
            taxUnitCode: fullCase.taxUnitCode || '',
            province: fullCase.province || 'خوزستان',
            city: fullCase.city || caseItem.city || 'اهواز',
            address: fullCase.address || '',
            bankName: fullCase.bankName || '',
            shebaNumber: fullCase.shebaNumber || '',
            docketNumber: fullCase.docketNumber || caseItem.docketNumber || '',
            refundReason: fullCase.refundReason || '',
          })
        }
      } catch (err) {
        console.warn('Failed to load full case details in quick edit:', err)
      } finally {
        if (isMounted) setLoadingDetails(false)
      }
    }

    fetchFullDetails()

    return () => {
      isMounted = false
    }
  }, [caseItem, isOpen])

  if (!isOpen || !caseItem) return null

  const isLocked =
    caseItem.status === RefundCaseStatus.AdministrationHeadApproved ||
    caseItem.status === RefundCaseStatus.TreasuryDisbursed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked) return

    if (!formData.taxpayerName.trim()) {
      setError('نام و عنوان مودی الزامی است')
      return
    }

    if (!formData.economicCode.trim()) {
      setError('کد اقتصادی مودی الزامی است')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await taxRefundApi.updateCase(caseItem.id, {
        taxpayerName: formData.taxpayerName.trim(),
        economicCode: formData.economicCode.trim(),
        nationalId: formData.nationalId.trim() || undefined,
        taxYear: Number(formData.taxYear),
        taxSource: Number(formData.taxSource) as TaxSourceType,
        taxUnitCode: formData.taxUnitCode.trim(),
        province: formData.province.trim(),
        city: formData.city.trim(),
        address: formData.address.trim() || undefined,
        bankName: formData.bankName.trim(),
        shebaNumber: formData.shebaNumber.trim().toUpperCase(),
        docketNumber: formData.docketNumber.trim(),
        refundReason: formData.refundReason.trim() || undefined,
      })

      setSuccess(true)
      setTimeout(() => {
        onSaved()
      }, 500)
    } catch (err: any) {
      setError(err.message || 'خطا در ذخیره‌سازی اطلاعات پرونده')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 text-white rounded-xl shadow-sm">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base">
                ویرایش مشخصات پرونده استرداد
              </h3>
              <p className="text-xs text-purple-700 font-mono font-bold mt-0.5">
                شماره پیگیری: {caseItem.caseTrackingNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {isLocked && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  این پرونده قفل است ({caseItem.status === RefundCaseStatus.AdministrationHeadApproved ? 'تایید نهایی رئیس امور' : 'پرداخت در ذیحسابی'}).
                </span>
              </div>
              {caseItem.status === RefundCaseStatus.AdministrationHeadApproved && (
                <div className="text-[11px] text-amber-700 font-normal pr-6">
                  جهت بازگشایی و ویرایش مجدد، می‌توانید از صفحه جزئیات پرونده اقدام به «عودت پرونده جهت اصلاح» نمایید.
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>مشخصات پرونده با موفقیت ذخیره شد.</span>
            </div>
          )}

          {loadingDetails && (
            <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50/50 p-2 rounded-lg border border-purple-100">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>در حال بارگذاری تکمیلی مشخصات پرونده...</span>
            </div>
          )}

          {/* Taxpayer Information Group */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5 pb-1 border-b border-gray-100">
              <Building className="w-3.5 h-3.5 text-purple-600" />
              مشخصات هویتی مودی و پرونده
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  نام مودی <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={formData.taxpayerName}
                  onChange={(e) => setFormData({ ...formData, taxpayerName: e.target.value })}
                  placeholder="شرکت یا شخص حقیقی..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  کد اقتصادی <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={formData.economicCode}
                  onChange={(e) => setFormData({ ...formData, economicCode: e.target.value })}
                  placeholder="مثال: 1234567890"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  شناسه ملی / کد ملی
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                  placeholder="۱۰ یا ۱۱ رقم..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  شماره پرونده
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={formData.docketNumber}
                  onChange={(e) => setFormData({ ...formData, docketNumber: e.target.value })}
                  placeholder="مثال: 87"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Tax Scope Group */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5 pb-1 border-b border-gray-100">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              دامنه مالیاتی و حوزه رسیدگی
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  سال مالیاتی <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  disabled={isLocked}
                  value={formData.taxYear}
                  onChange={(e) => setFormData({ ...formData, taxYear: Number(e.target.value) })}
                  min={1390}
                  max={1410}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  منبع مالیات <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={isLocked}
                  value={formData.taxSource}
                  onChange={(e) => setFormData({ ...formData, taxSource: Number(e.target.value) as TaxSourceType })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60"
                >
                  {Object.entries(TaxSourceLabels).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  واحد مالیاتی
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={formData.taxUnitCode}
                  onChange={(e) => setFormData({ ...formData, taxUnitCode: e.target.value })}
                  placeholder="مثال: 160300"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  شهرستان
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="مثال: اهواز"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Banking Details Group */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5 pb-1 border-b border-gray-100">
              <CreditCard className="w-3.5 h-3.5 text-purple-600" />
              اطلاعات بانکی جهت استرداد وجه
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  نام بانک
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="مثال: بانک ملی ایران"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  شماره شبا
                </label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={formData.shebaNumber}
                  onChange={(e) => setFormData({ ...formData, shebaNumber: e.target.value })}
                  placeholder="IR..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-60 text-left"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {caseItem && !isLocked ? (
            <Link
              href={`/refunds/${caseItem.id}/edit`}
              onClick={onClose}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 transition-colors group"
            >
              <span>نیاز به ویرایش قبوض، استعلامات یا قطعی‌سازی دارید؟ ورود به ویرایشگر ۶ مرحله‌ای</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              انصراف
            </button>

          {!isLocked && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>ذخیره تغییرات</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)
}
