'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { reportingApi } from '@/lib/api/reporting'
import { SavedReportPreset } from '@/types/reporting'
import {
  BookmarkCheck,
  Play,
  Trash2,
  Share2,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  PlusCircle,
} from 'lucide-react'

export default function SavedReportsPage() {
  const [presets, setPresets] = useState<SavedReportPreset[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadPresets = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await reportingApi.getSavedPresets()
      setPresets(data)
    } catch (err: any) {
      console.error('Failed to load presets:', err)
      setError(err?.response?.data?.error || 'خطا در بارگذاری الگوهای ذخیره‌شده')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPresets()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`آیا از حذف الگوی «${name}» اطمینان دارید؟`)) return

    try {
      await reportingApi.deletePreset(id)
      setPresets((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      alert(err?.response?.data?.error || 'خطا در حذف الگو')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-amber-600" />
            الگوها و گزارش‌های از پیش ذخیره‌شده (Presets)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            پیش‌تنظیم‌های فیلتر و ستون‌بندی‌های پرکاربرد جهت اجرای سریع و اشتراک در اداره
          </p>
        </div>

        <Link
          href="/reporting/standard"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>ایجاد الگوی جدید از گزارش‌ها</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Presets Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-xs font-bold text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping mr-2" />
          در حال بارگذاری الگوها...
        </div>
      ) : presets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs space-y-3">
          <BookmarkCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="font-bold text-slate-700 text-sm">هیچ الگوی ذخیره‌شده‌ای یافت نشد</div>
          <p className="text-slate-400 max-w-md mx-auto">
            هنگام مشاهده گزارش‌های استاندارد، با کلیک بر روی دکمه «ذخیره الگو» می‌توانید فیلترها و تنظیمات جاری خود را جهت دسترسی‌های بعدی در این صفحه ذخیره نمایید.
          </p>
          <Link
            href="/reporting/standard"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
          >
            مشاهده کاتالوگ گزارش‌ها
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="group bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {preset.reportCode}
                  </span>

                  {preset.isSharedWithOffice && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                      <Share2 className="w-3 h-3" />
                      اشتراک با همکاران اداره
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-sm text-slate-800 mb-2 leading-snug group-hover:text-amber-700 transition-colors">
                  {preset.presetName}
                </h3>

                <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>تاریخ ثبت: {new Date(preset.createdAt).toLocaleDateString('fa-IR')}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                <button
                  type="button"
                  onClick={() => handleDelete(preset.id, preset.presetName)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="حذف الگو"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link
                  href={`/reporting/standard/${preset.reportCode}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all shadow-xs"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>اجرای الگو</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
