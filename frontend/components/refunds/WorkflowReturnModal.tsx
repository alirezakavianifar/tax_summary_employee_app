'use client'

import React, { useState } from 'react'
import {
  X,
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'
import { RefundCaseStatus } from '@/types/taxRefund'

interface WorkflowReturnModalProps {
  isOpen: boolean
  caseTrackingNumber: string
  currentStatus: RefundCaseStatus
  onClose: () => void
  onConfirm: (targetStatus: RefundCaseStatus, reason: string) => Promise<void>
}

export function WorkflowReturnModal({
  isOpen,
  caseTrackingNumber,
  currentStatus,
  onClose,
  onConfirm,
}: WorkflowReturnModalProps) {
  // Default target status: Audited (2) if higher, otherwise Draft (0)
  const defaultTarget =
    currentStatus === RefundCaseStatus.AdministrationHeadApproved ||
    currentStatus === RefundCaseStatus.GroupHeadApproved
      ? RefundCaseStatus.Audited
      : RefundCaseStatus.Draft

  const [targetStatus, setTargetStatus] = useState<RefundCaseStatus>(defaultTarget)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('ثبت علت و توضیحات عودت پرونده الزامی است')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const formattedReason = `[عودت جهت اصلاح]: ${reason.trim()}`
      await onConfirm(targetStatus, formattedReason)
      onClose()
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت عودت پرونده')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base">
                عودت پرونده جهت اصلاح و بازبینی
              </h3>
              <p className="text-xs text-amber-700 font-mono font-bold mt-0.5">
                شماره پیگیری: {caseTrackingNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Explanation Alert */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>قفل ویرایش برداشته خواهد شد:</strong> با عودت پرونده، وضعیت پرونده به مرحله قبل بازگردانده شده و امکان ویرایش کلیه اقلام (قبوض، استعلامات، ارقام قطعی‌سازی و مبالغ استرداد) در ویرایشگر ۶ مرحله‌ای مجدداً فعال می‌گردد.
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Status Choice */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              سطح عودت پرونده:
            </label>
            <div className="space-y-2">
              {(currentStatus === RefundCaseStatus.AdministrationHeadApproved ||
                currentStatus === RefundCaseStatus.GroupHeadApproved) && (
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    targetStatus === RefundCaseStatus.Audited
                      ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetStatus"
                    checked={targetStatus === RefundCaseStatus.Audited}
                    onChange={() => setTargetStatus(RefundCaseStatus.Audited)}
                    className="mt-1 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      مرحله کارشناسی ارشد (رسیدگی و گزارش توجیهی)
                      <span className="mr-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-normal">
                        پیشنهادی
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      پرونده جهت بازبینی محاسبات و اسناد در اختیار کارشناس ارشد قرار می‌گیرد.
                    </div>
                  </div>
                </label>
              )}

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  targetStatus === RefundCaseStatus.Draft
                    ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="targetStatus"
                  checked={targetStatus === RefundCaseStatus.Draft}
                  onChange={() => setTargetStatus(RefundCaseStatus.Draft)}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    پیش‌نویس اولیه (Draft)
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    پرونده به حالت پیش‌نویس بازگشته و کلیه مشخصات مودی و اسناد قابل ویرایش مجدد است.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              علت عودت و دستور اصلاح <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثلاً: مغایرت در استعلام عدم بدهی، نیاز به اصلاح شماره شبا، کشف بدهی جدید در سامانه سنیم..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              این توضیحات در تاریخچه گردش‌کار و لاگ نظارتی پرونده ثبت خواهد شد.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>در حال ثبت عودت...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تایید عودت و بازگشایی پرونده</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
