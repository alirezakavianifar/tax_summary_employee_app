'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { refundWorkflowApi } from '@/lib/api/refundWorkflow'
import type { RefundWorkflowStepItem, UpdateWorkflowStepsRequest } from '@/types/refundWorkflow'
import {
  GitFork,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Save,
  ShieldAlert,
  ChevronLeft,
  Lock,
  ArrowDown,
  Info,
  Layers,
  Sparkles,
  Users,
  Check,
  Building,
} from 'lucide-react'

const AVAILABLE_ROLES = [
  { key: 'Expert', label: 'کارشناس ارشد / کارشناس' },
  { key: 'Auditor', label: 'ممیز مالیاتی' },
  { key: 'GroupHead', label: 'رئیس گروه مالیاتی' },
  { key: 'OfficeHead', label: 'رئیس اداره / امور مالیاتی' },
  { key: 'DirectorGeneral', label: 'مدیر کل امور مالیاتی استان' },
  { key: 'Treasury', label: 'ذیحساب و مدیر امور مالی' },
  { key: 'Admin', label: 'مدیر سیستم' },
]

export default function RefundWorkflowSettingsPage() {
  const [steps, setSteps] = useState<RefundWorkflowStepItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const loadSteps = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await refundWorkflowApi.getAllSteps()
      // Ensure sorted by stepOrder
      const sorted = [...data].sort((a, b) => a.stepOrder - b.stepOrder)
      setSteps(sorted)
      setHasUnsavedChanges(false)
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در بارگذاری تنظیمات گردش کار')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSteps()
  }, [])

  // Auto-hide success toast after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleToggleStep = (stage: number) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.stage === stage) {
          if (step.isMandatory) return step
          return { ...step, isEnabled: !step.isEnabled }
        }
        return step
      })
    )
    setHasUnsavedChanges(true)
  }

  const handleToggleRole = (stage: number, roleKey: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.stage === stage) {
          const currentRoles = step.allowedRoles
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean)

          let updatedRoles: string[]
          if (currentRoles.some((r) => r.toLowerCase() === roleKey.toLowerCase())) {
            // Cannot remove Admin
            if (roleKey.toLowerCase() === 'admin') return step
            updatedRoles = currentRoles.filter((r) => r.toLowerCase() !== roleKey.toLowerCase())
          } else {
            updatedRoles = [...currentRoles, roleKey]
          }

          return {
            ...step,
            allowedRoles: updatedRoles.join(','),
            allowedRolesList: updatedRoles,
          }
        }
        return step
      })
    )
    setHasUnsavedChanges(true)
  }

  const handleTextChange = (stage: number, field: 'title' | 'description', val: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.stage === stage) {
          return { ...step, [field]: val }
        }
        return step
      })
    )
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      const payload: UpdateWorkflowStepsRequest = {
        steps: steps.map((s) => ({
          stage: s.stage,
          title: s.title,
          description: s.description,
          stepOrder: s.stepOrder,
          isEnabled: s.isEnabled,
          allowedRoles: s.allowedRoles,
        })),
      }

      const updated = await refundWorkflowApi.updateWorkflowSteps(payload)
      setSteps(updated.sort((a, b) => a.stepOrder - b.stepOrder))
      setHasUnsavedChanges(false)
      setSuccessMessage('تنظیمات گردش کار استرداد با موفقیت ذخیره شد.')
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در ذخیره‌سازی تنظیمات')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('آیا از بازنشانی کلیه مراحل گردش‌کار به تنظیمات استاندارد و ۵ مرحله‌ای قانونی اطمینان دارید؟')) {
      return
    }

    try {
      setResetting(true)
      setError(null)
      const restored = await refundWorkflowApi.resetToDefaults()
      setSteps(restored.sort((a, b) => a.stepOrder - b.stepOrder))
      setHasUnsavedChanges(false)
      setSuccessMessage('مراحل گردش کار با موفقیت به حالت پیش‌فرض قانونی بازنشانی شدند.')
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در بازنشانی تنظیمات')
    } finally {
      setResetting(false)
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Admin']}>
      <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8" dir="rtl">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Breadcrumb & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Link href="/admin/users" className="hover:text-purple-700 transition-colors">
                  پنل مدیریت سیستم
                </Link>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-gray-900 font-bold">پیکربندی سلسله‌مراتب تاییدات استرداد</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2.5">
                <GitFork className="w-7 h-7 text-purple-700" />
                تنظیمات گردش‌کار و حذف مراحل تایید استرداد
              </h1>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                disabled={loading || saving || resetting}
                className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin text-gray-600" /> : <RotateCcw className="w-4 h-4 text-gray-600" />}
                بازنشانی به پیش‌فرض قانونی
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={loading || saving || resetting || !hasUnsavedChanges}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                ذخیره تغییرات گردش‌کار
              </button>
            </div>
          </div>

          {/* Unsaved Changes Banner */}
          {hasUnsavedChanges && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>تغییراتی در مراحل گردش‌کار اعمال شده است. برای اعمال در پرونده‌ها، دکمه ذخیره را بزنید.</span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs font-bold text-amber-800 underline hover:text-amber-950"
              >
                ذخیره اکنون
              </button>
            </div>
          )}

          {/* Toast Messages */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Operational Guidance Card */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 rounded-3xl p-6 text-white shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-purple-200 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>راهنمای عملکرد موتور انعطاف‌پذیر گردش‌کار:</span>
            </div>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              شما می‌توانید مراحلی نظیر <strong>«تایید رئیس گروه مالیاتی»</strong> یا <strong>«موافقت مدیر کل»</strong> را بر اساس رویه‌های اداری فعال یا غیرفعال (حذف) نمایید.
              با غیرفعال‌سازی هر مرحله، پرونده‌های استرداد آن مرحله را رد کرده و به طور خودکار به مرحله فعال بعدی منتقل می‌گردند.
              مراحل کارشناسی ارشد (تنظیم گزارش توجیهی) و پرداخت ذیحسابی به دلیل الزامات قانونی غیرقابل حذف هستند.
            </p>
          </div>

          {/* Interactive Visual Stepper Pipeline */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-700" />
                سلسله‌مراتب تاییدات (خط گردش‌کار تصویری)
              </h2>
              <span className="text-[11px] text-gray-500 font-medium">
                {steps.filter((s) => s.isEnabled).length} مرحله از {steps.length} مرحله فعال است
              </span>
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-500 text-xs">
                <Loader2 className="w-7 h-7 text-purple-700 animate-spin" />
                <span>در حال فراخوانی تنظیمات گردش‌کار...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, idx) => {
                  const isLast = idx === steps.length - 1
                  const rolesList = step.allowedRoles
                    .split(',')
                    .map((r) => r.trim())
                    .filter(Boolean)

                  return (
                    <React.Fragment key={step.id}>
                      {/* Workflow Step Item Card */}
                      <div
                        className={`rounded-2xl border transition-all p-5 ${
                          step.isEnabled
                            ? 'bg-white border-purple-200/80 shadow-xs'
                            : 'bg-gray-50/80 border-dashed border-gray-300 opacity-75'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          {/* Step Index & Details */}
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 transition-colors ${
                                step.isEnabled
                                  ? 'bg-purple-700 text-white shadow-sm shadow-purple-300'
                                  : 'bg-gray-200 text-gray-500'
                              }`}
                            >
                              {idx + 1}
                            </div>

                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-black text-gray-900">{step.title}</span>
                                {step.isMandatory ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                                    <Lock className="w-2.5 h-2.5" />
                                    مرحله الزامی قانونی
                                  </span>
                                ) : step.isEnabled ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    فعال در فرآیند
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 border border-gray-300">
                                    غیرفعال (رد مرحله)
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                            {step.isMandatory ? (
                              <div className="text-[11px] text-gray-400 font-bold flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-xl">
                                <Lock className="w-3.5 h-3.5" />
                                غیرقابل غیرفعال‌سازی
                              </div>
                            ) : (
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={step.isEnabled}
                                  onChange={() => handleToggleStep(step.stage)}
                                  className="sr-only peer"
                                />
                                <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-700"></div>
                                <span className="mr-2 text-xs font-bold text-gray-700">
                                  {step.isEnabled ? 'فعال' : 'رد این مرحله (Skip)'}
                                </span>
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Allowed Roles Picker Section */}
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                            <Users className="w-3.5 h-3.5 text-purple-700" />
                            <span>نقش‌های سازمانی مجاز جهت تایید این مرحله:</span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {AVAILABLE_ROLES.map((r) => {
                              const isSelected = rolesList.some((role) => role.toLowerCase() === r.key.toLowerCase())
                              const isProtectedAdmin = r.key.toLowerCase() === 'admin'

                              return (
                                <button
                                  key={r.key}
                                  type="button"
                                  disabled={!step.isEnabled || isProtectedAdmin}
                                  onClick={() => handleToggleRole(step.stage, r.key)}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                    isSelected
                                      ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs'
                                      : 'bg-gray-100/70 text-gray-500 border border-gray-200 hover:bg-gray-100'
                                  } ${!step.isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-purple-700" />}
                                  <span>{r.label}</span>
                                  <span className="font-mono text-[10px] text-gray-400">({r.key})</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Visual Flow Connector Arrow */}
                      {!isLast && (
                        <div className="flex items-center justify-center py-1">
                          <div className="flex items-center gap-2 text-gray-400">
                            <div className="w-0.5 h-4 bg-purple-200"></div>
                            <ArrowDown className="w-3.5 h-3.5 text-purple-600" />
                            <div className="w-0.5 h-4 bg-purple-200"></div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
