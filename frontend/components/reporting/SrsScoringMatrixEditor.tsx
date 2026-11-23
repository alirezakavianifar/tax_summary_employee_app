'use client'

import React, { useState, useEffect } from 'react'
import {
  SrsRuleSetConfig,
  SaveSrsRuleConfigRequest,
  getSrsCategoriesMeta,
  SRS_INDICATORS_META,
  SrsTaxCategoryKey,
  SrsIndicatorKey,
} from '@/types/srsAuditorMetrics'
import { auditorMetricsApi } from '@/lib/api/auditorMetrics'
import { toPersianDigits } from '@/lib/jalali'
import { ImportantCasesUploadModal } from './ImportantCasesUploadModal'
import {
  Save,
  RotateCcw,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  UploadCloud,
  Eye,
  EyeOff,
} from 'lucide-react'

interface SrsScoringMatrixEditorProps {
  onRulesSaved?: () => void
}

export function SrsScoringMatrixEditor({ onRulesSaved }: SrsScoringMatrixEditorProps) {
  const [config, setConfig] = useState<SrsRuleSetConfig | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [resetting, setResetting] = useState<boolean>(false)
  const [syncing300, setSyncing300] = useState<boolean>(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState<boolean>(false)

  // Editable Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [growthLegal, setGrowthLegal] = useState<number>(700)
  const [growthIndiv, setGrowthIndiv] = useState<number>(500)
  const [adjThreshold, setAdjThreshold] = useState<number>(15)
  const [delayPenalty, setDelayPenalty] = useState<number>(0.25)
  const [top300Count, setTop300Count] = useState<number>(300)
  const [majorCasesLabel, setMajorCasesLabel] = useState<string>('۳۰۰ پرونده مهم')
  const [majorCasesTag, setMajorCasesTag] = useState<string>('300Parvande, 100Parvande')
  const [allowNegativeSpeed, setAllowNegativeSpeed] = useState<boolean>(false)
  const [enableSrsModel, setEnableSrsModel] = useState<boolean>(true)
  const [enableLegacySanimModel, setEnableLegacySanimModel] = useState<boolean>(true)
  const [defaultEvaluationModel, setDefaultEvaluationModel] = useState<'srs' | 'legacy'>('srs')
  const [weights, setWeights] = useState<Record<string, Record<string, number>>>({})
  const [allowedDays, setAllowedDays] = useState<Record<string, { issuanceAllowedDays: number; finalizationAllowedDays: number }>>({})

  const loadRules = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await auditorMetricsApi.getSrsRules()
      setConfig(data)
      setTitle(data.title || '')
      setDescription(data.description || '')
      setGrowthLegal(data.growthThresholdLegalEntity || 700)
      setGrowthIndiv(data.growthThresholdIndividual || 500)
      setAdjThreshold(data.adjustmentThreshold || 15)
      setDelayPenalty(data.dailyDelayPenalty || 0.25)
      setTop300Count(data.top300TaxpayersCount || 300)
      setMajorCasesLabel(data.majorCasesLabel || '۳۰۰ پرونده مهم')
      setMajorCasesTag(data.majorCasesTag || '300Parvande, 100Parvande')
      setAllowNegativeSpeed(data.allowNegativeSpeedScore || false)
      setEnableSrsModel(data.enableSrsModel ?? true)
      setEnableLegacySanimModel(data.enableLegacySanimModel ?? true)
      setDefaultEvaluationModel((data.defaultEvaluationModel as 'srs' | 'legacy') || 'srs')
      setWeights(data.weightsMatrix || {})
      setAllowedDays(data.allowedDays || {})
      setIsDirty(false)
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در بارگذاری پیکربندی بخشنامه ارزیابی عملکرد')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [])

  const handleWeightChange = (indicatorKey: string, categoryKey: string, valStr: string) => {
    const val = parseFloat(valStr)
    setWeights((prev) => ({
      ...prev,
      [indicatorKey]: {
        ...(prev[indicatorKey] || {}),
        [categoryKey]: isNaN(val) ? 0 : val,
      },
    }))
    setIsDirty(true)
  }

  const handleAllowedDaysChange = (
    categoryKey: string,
    field: 'issuanceAllowedDays' | 'finalizationAllowedDays',
    valStr: string
  ) => {
    const val = parseInt(valStr, 10)
    setAllowedDays((prev) => ({
      ...prev,
      [categoryKey]: {
        ...(prev[categoryKey] || { issuanceAllowedDays: 45, finalizationAllowedDays: 45 }),
        [field]: isNaN(val) || val < 1 ? 1 : val,
      },
    }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      if (!enableSrsModel && !enableLegacySanimModel) {
        setError('حداقل یکی از الگوهای ارزیابی عملکرد (بخشنامه مصوب یا سنیم) باید فعال باشد.')
        setSaving(false)
        return
      }

      const payload: SaveSrsRuleConfigRequest = {
        title,
        description,
        growthThresholdLegalEntity: growthLegal,
        growthThresholdIndividual: growthIndiv,
        adjustmentThreshold: adjThreshold,
        dailyDelayPenalty: delayPenalty,
        top300TaxpayersCount: top300Count,
        majorCasesLabel: majorCasesLabel.trim() || '۳۰۰ پرونده مهم',
        majorCasesTag: majorCasesTag.trim() || '300Parvande, 100Parvande',
        allowNegativeSpeedScore: allowNegativeSpeed,
        enableSrsModel,
        enableLegacySanimModel,
        defaultEvaluationModel,
        isActive: true,
        weightsMatrix: weights,
        allowedDays: allowedDays,
      }

      const updated = await auditorMetricsApi.saveSrsRules(payload)
      setConfig(updated)
      setIsDirty(false)
      setSuccessMessage('ماتریس اوزان و قواعد دستورالعمل ارزیابی عملکرد با موفقیت ذخیره و در سامانه اعمال گردید.')
      if (onRulesSaved) onRulesSaved()
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در ذخیره قواعد بخشنامه')
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = async () => {
    if (!window.confirm('آیا از بازنشانی کلیه اوزان و قواعد به مقادیر مصوب پیش‌فرض بخشنامه (SRS v1.0) اطمینان دارید؟')) {
      return
    }

    try {
      setResetting(true)
      setError(null)
      setSuccessMessage(null)
      const restored = await auditorMetricsApi.resetSrsRules()
      setConfig(restored)
      setTitle(restored.title)
      setDescription(restored.description)
      setGrowthLegal(restored.growthThresholdLegalEntity)
      setGrowthIndiv(restored.growthThresholdIndividual)
      setAdjThreshold(restored.adjustmentThreshold)
      setDelayPenalty(restored.dailyDelayPenalty)
      setTop300Count(restored.top300TaxpayersCount)
      setMajorCasesLabel(restored.majorCasesLabel || '۳۰۰ پرونده مهم')
      setMajorCasesTag(restored.majorCasesTag || '300Parvande, 100Parvande')
      setAllowNegativeSpeed(restored.allowNegativeSpeedScore)
      setEnableSrsModel(true)
      setEnableLegacySanimModel(true)
      setDefaultEvaluationModel('srs')
      setWeights(restored.weightsMatrix)
      setAllowedDays(restored.allowedDays)
      setIsDirty(false)
      setSuccessMessage('کلیه مقادیر، اوزان و مهلت‌های مجاز به مفاد مصوب بخشنامه ارزیابی عملکرد بازنشانی شد.')
      if (onRulesSaved) onRulesSaved()
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در بازنشانی تنظیمات پیش‌فرض')
    } finally {
      setResetting(false)
    }
  }

  const handleSync300Cases = async () => {
    try {
      setSyncing300(true)
      setError(null)
      setSuccessMessage(null)
      const res = await auditorMetricsApi.sync300Cases()
      setSuccessMessage(`${res.message} (${toPersianDigits(res.updatedCount)} پرونده به‌روزرسانی شد).`)
      if (onRulesSaved) onRulesSaved()
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'خطا در همگام‌سازی ۳۰۰ پرونده مهم از فایل اکسل')
    } finally {
      setSyncing300(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-600">در حال بارگذاری ماتریس اوزان و قواعد دستورالعمل ارزیابی عملکرد...</p>
      </div>
    )
  }

  const categoriesMeta = getSrsCategoriesMeta(majorCasesLabel)

  return (
    <div className="space-y-6" dir="rtl">
      {/* Alert Banners */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 text-xs">
            بستن
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 text-xs">
            بستن
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
              دستورالعمل مصوب ارزیابی عملکرد (SRS v1.0)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              پرونده‌های کلیدی: {majorCasesLabel}
            </span>
            {isDirty && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                تغییرات ذخیره‌نشده
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900">ماتریس اوزان و قواعد امتیازی ارزیابی عملکرد حسابرسان</h2>
          <p className="text-xs text-slate-500 mt-1">
            تعیین ضرایب امتیازی ۸ شاخص عملکردی در ۷ دسته‌بندی موضوعی پرونده‌های مالیاتی بر اساس ضوابط سازمانی
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            disabled={saving || resetting}
            className="px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100/70 text-purple-800 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="بارگذاری و تنظیم فایل اکسل مودیان یا پرونده‌های مهم"
          >
            <UploadCloud className="w-4 h-4 text-purple-600" />
            بارگذاری پرونده‌های مهم
          </button>

          <button
            onClick={handleSync300Cases}
            disabled={syncing300 || saving || resetting}
            className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            title="همگام‌سازی فهرست پرونده‌های مهم از فایل اکسل سنیم سال ۱۴۰۵"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${syncing300 ? 'animate-spin' : ''}`} />
            {syncing300 ? 'در حال همگام‌سازی...' : 'همگام‌سازی سریع'}
          </button>

          <button
            onClick={handleResetToDefaults}
            disabled={resetting || saving}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            title="بازنشانی به مقادیر پیش‌فرض مصوب"
          >
            <RotateCcw className={`w-4 h-4 text-slate-500 ${resetting ? 'animate-spin' : ''}`} />
            بازنشانی پیش‌فرض
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer ${
              isDirty
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-600/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات قواعد'}
          </button>
        </div>
      </div>

      {/* Main 8x7 Scoring Weight Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">ماتریس اوزان امتیازی (Scoring Weights Matrix)</h3>
          </div>
          <span className="text-xs text-slate-500">
            کلیه خانه‌ها قابل ویرایش می‌باشند و بلافاصله در محاسبه کارنامه‌ها لحاظ خواهند شد.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3.5 px-4 min-w-[240px] text-right sticky right-0 bg-slate-100 z-10 shadow-xs">
                  شاخص ارزیابی عملکرد (Performance Indicator)
                </th>
                {categoriesMeta.map((cat) => (
                  <th key={cat.key} className="py-3 px-3 text-center min-w-[125px]">
                    <div className="font-bold text-slate-900 text-xs">{cat.shortTitle}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5 truncate max-w-[130px]" title={cat.titleFa}>
                      {cat.isLegal ? 'اشخاص حقوقی' : 'حقیقی / سایر'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SRS_INDICATORS_META.map((ind) => {
                const rowWeights = weights[ind.key] || {}
                const isNegative = ind.isNegative

                return (
                  <tr key={ind.key} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Indicator Title & FR Code */}
                    <td className="py-3 px-4 font-medium text-slate-900 sticky right-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-l border-slate-100">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-12 text-center text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                            isNegative
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {ind.frCode}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            {ind.titleFa}
                            {isNegative && (
                              <span className="text-[10px] text-rose-600 font-semibold">(نمره منفی)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5 max-w-sm line-clamp-1" title={ind.descriptionFa}>
                            {ind.descriptionFa}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Weight Inputs for 7 Categories */}
                    {categoriesMeta.map((cat) => {
                      const currentVal = rowWeights[cat.key] !== undefined ? rowWeights[cat.key] : isNegative ? -1 : 1

                      return (
                        <td key={cat.key} className="py-2.5 px-2 text-center">
                          <div className="relative inline-flex items-center justify-center">
                            <input
                              type="number"
                              step="0.5"
                              value={currentVal}
                              onChange={(e) => handleWeightChange(ind.key, cat.key, e.target.value)}
                              className={`w-20 text-center font-bold text-xs py-1.5 px-2 rounded-lg border transition-all ${
                                isNegative
                                  ? 'bg-rose-50/50 border-rose-200 text-rose-700 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                              }`}
                            />
                            <span className="text-[10px] text-slate-400 mr-1 select-none">
                              {isNegative ? 'کسر' : 'امتیاز'}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluation Model Visibility & Default Settings */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                مدیریت نمایش الگوهای ارزیابی عملکرد (SRS و سنیم)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تعیین قابلیت مشاهده الگوها برای کاربران در تب عملکرد حسابرسان و انتخاب الگوی پیش‌فرض بارگذاری صفحه
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>الگوی پیش‌فرض انتخابی:</span>
            <span className="font-bold text-indigo-700">
              {defaultEvaluationModel === 'srs' ? 'دستورالعمل مصوب (SRS)' : 'الگوی سنیم (تراز ۱۰۰)'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SRS Model Toggle Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              enableSrsModel
                ? 'bg-indigo-50/40 border-indigo-200 shadow-2xs'
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    enableSrsModel ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>دستورالعمل مصوب ارزیابی عملکرد (SRS)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                      ماتریس ۸×۷
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    نظام جامع مصوب سازمان امور مالیاتی مبتنی بر ۸ شاخص عملکردی و ۷ منبع پرونده
                  </div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSrsModel}
                  onChange={(e) => {
                    const checked = e.target.checked
                    if (!checked && !enableLegacySanimModel) {
                      alert('حداقل یکی از دو الگوی ارزیابی باید فعال باقی بماند.')
                      return
                    }
                    setEnableSrsModel(checked)
                    if (!checked && defaultEvaluationModel === 'srs') {
                      setDefaultEvaluationModel('legacy')
                    }
                    setIsDirty(true)
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-slate-500">
                وضعیت: {enableSrsModel ? <span className="text-emerald-600 font-bold">فعال و قابل مشاهده</span> : <span className="text-rose-500 font-bold">مخفی‌شده</span>}
              </span>
              {enableSrsModel && (
                <button
                  type="button"
                  onClick={() => {
                    setDefaultEvaluationModel('srs')
                    setIsDirty(true)
                  }}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer transition-all ${
                    defaultEvaluationModel === 'srs'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {defaultEvaluationModel === 'srs' ? 'الگوی پیش‌فرض ✓' : 'انتخاب به عنوان پیش‌فرض'}
                </button>
              )}
            </div>
          </div>

          {/* Legacy Sanim Model Toggle Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              enableLegacySanimModel
                ? 'bg-slate-900/5 border-slate-300 shadow-2xs'
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    enableLegacySanimModel ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>الگوی شاخص‌های ترکیبی سنیم</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                      تراز ۱۰۰
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    الگوی ۶ شاخص کیفی، مالی، سرعت و بهره‌وری سنیم بر مبنای تراز وزنی ۱۰۰
                  </div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLegacySanimModel}
                  onChange={(e) => {
                    const checked = e.target.checked
                    if (!checked && !enableSrsModel) {
                      alert('حداقل یکی از دو الگوی ارزیابی باید فعال باقی بماند.')
                      return
                    }
                    setEnableLegacySanimModel(checked)
                    if (!checked && defaultEvaluationModel === 'legacy') {
                      setDefaultEvaluationModel('srs')
                    }
                    setIsDirty(true)
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-slate-500">
                وضعیت: {enableLegacySanimModel ? <span className="text-emerald-600 font-bold">فعال و قابل مشاهده</span> : <span className="text-rose-500 font-bold">مخفی‌شده</span>}
              </span>
              {enableLegacySanimModel && (
                <button
                  type="button"
                  onClick={() => {
                    setDefaultEvaluationModel('legacy')
                    setIsDirty(true)
                  }}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer transition-all ${
                    defaultEvaluationModel === 'legacy'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {defaultEvaluationModel === 'legacy' ? 'الگوی پیش‌فرض ✓' : 'انتخاب به عنوان پیش‌فرض'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thresholds & Rule Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Growth Threshold Legal */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">آستانه رشد حقوقی</div>
              <div className="text-[10px] text-slate-500">شاخص FR-05 (اشخاص حقوقی)</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              step="50"
              value={growthLegal}
              onChange={(e) => {
                setGrowthLegal(parseFloat(e.target.value) || 0)
                setIsDirty(true)
              }}
              className="w-full text-center font-bold text-sm py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
            />
            <span className="text-xs font-bold text-slate-500 select-none">درصد</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            رشد مالیات تشخیصی بیش از این درصد نسبت به ابرازی مشمول امتیاز کامل می‌شود.
          </p>
        </div>

        {/* Growth Threshold Individual */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">آستانه رشد حقیقی/مشاغل</div>
              <div className="text-[10px] text-slate-500">شاخص FR-05 (اشخاص حقیقی)</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              step="50"
              value={growthIndiv}
              onChange={(e) => {
                setGrowthIndiv(parseFloat(e.target.value) || 0)
                setIsDirty(true)
              }}
              className="w-full text-center font-bold text-sm py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
            />
            <span className="text-xs font-bold text-slate-500 select-none">درصد</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            آستانه رشد تشخیصی نسبت به ابرازی برای مشاغل و انفرادی (پیش‌فرض ۵۰۰٪).
          </p>
        </div>

        {/* Adjustment Penalty Threshold */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">آستانه تعدیل (جریمه)</div>
              <div className="text-[10px] text-slate-500">شاخص FR-06 (کاهش قطعی)</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              step="1"
              value={adjThreshold}
              onChange={(e) => {
                setAdjThreshold(parseFloat(e.target.value) || 0)
                setIsDirty(true)
              }}
              className="w-full text-center font-bold text-sm py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-700"
            />
            <span className="text-xs font-bold text-slate-500 select-none">درصد</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            کاهش مالیات قطعی نسبت به تشخیصی بیش از این درصد مشمول امتیاز منفی می‌گردد.
          </p>
        </div>

        {/* Daily Delay Penalty */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">نرخ جریمه روزانه تاخیر</div>
              <div className="text-[10px] text-slate-500">شاخص‌های FR-07 و FR-08</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              step="0.05"
              value={delayPenalty}
              onChange={(e) => {
                setDelayPenalty(parseFloat(e.target.value) || 0)
                setIsDirty(true)
              }}
              className="w-full text-center font-bold text-sm py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
            />
            <span className="text-xs font-bold text-slate-500 select-none">نمره/روز</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            به ازای هر روز تاخیر مازاد بر مهلت مجاز از نمره سرعت حسابرس کسر می‌گردد (پیش‌فرض ۰.۲۵).
          </p>
        </div>

        {/* Configurable Major Cases Label Card */}
        <div className="bg-white rounded-2xl border border-purple-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">عنوان پرونده‌های کلیدی</div>
              <div className="text-[10px] text-purple-600 font-medium">قابل تنظیم و انعطاف‌پذیر</div>
            </div>
          </div>
          <div className="mt-2">
            <input
              type="text"
              value={majorCasesLabel}
              onChange={(e) => {
                setMajorCasesLabel(e.target.value)
                setIsDirty(true)
              }}
              placeholder="۳۰۰ پرونده مهم"
              className="w-full text-center font-bold text-xs py-1.5 px-2 rounded-lg border border-purple-200 bg-purple-50/40 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-purple-900"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            عنوان نمایشی در سرفصل ستون‌ها، کارنامه‌ها و گزارش‌ها (مثال: ۱۰۰ پرونده، ۳۰۰ پرونده).
          </p>
        </div>
      </div>

      {/* Allowed Processing Days Configuration Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">مهلت‌های مجاز رسیدگی و صدور برگ تشخیص و قطعی (روز)</h3>
          </div>
          <span className="text-xs text-slate-500">مبنای محاسبه: تاریخ مرحله ۲ رسیدگی</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categoriesMeta.map((cat) => {
            const daysObj = allowedDays[cat.key] || { issuanceAllowedDays: 45, finalizationAllowedDays: 45 }

            return (
              <div key={cat.key} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div className="font-bold text-slate-800 text-xs mb-2 truncate" title={cat.titleFa}>
                  {cat.shortTitle}
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">مهلت صدور تشخیص</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="5"
                        max="365"
                        value={daysObj.issuanceAllowedDays}
                        onChange={(e) => handleAllowedDaysChange(cat.key, 'issuanceAllowedDays', e.target.value)}
                        className="w-full text-center font-bold text-xs py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400">روز</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">مهلت قطعیت</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="5"
                        max="365"
                        value={daysObj.finalizationAllowedDays}
                        onChange={(e) => handleAllowedDaysChange(cat.key, 'finalizationAllowedDays', e.target.value)}
                        className="w-full text-center font-bold text-xs py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400">روز</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowNegativeSpeed"
              checked={allowNegativeSpeed}
              onChange={(e) => {
                setAllowNegativeSpeed(e.target.checked)
                setIsDirty(true)
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="allowNegativeSpeed" className="cursor-pointer text-slate-700 font-medium">
              اجازه منفی شدن امتیاز شاخص‌های سرعت در صورت تاخیر بیش از حد (در غیر این‌صورت کف امتیاز صفر است)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span>تعداد پرونده‌های حقوقی مهم (مودیان بزرگ):</span>
            <input
              type="number"
              min="50"
              max="2000"
              value={top300Count}
              onChange={(e) => {
                setTop300Count(parseInt(e.target.value, 10) || 300)
                setIsDirty(true)
              }}
              className="w-16 text-center font-bold text-xs py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
            />
            <span>پرونده</span>
          </div>
        </div>
      </div>

      {/* Important Cases Excel Upload & Inspection Modal */}
      <ImportantCasesUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentLabel={majorCasesLabel}
        currentTag={majorCasesTag}
        onSuccess={(res) => {
          setMajorCasesLabel(res.majorCasesLabel)
          setMajorCasesTag(res.majorCasesTag)
          loadRules()
          if (onRulesSaved) onRulesSaved()
        }}
      />
    </div>
  )
}

