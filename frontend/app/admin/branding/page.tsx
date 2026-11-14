'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useBranding } from '@/contexts/BrandingContext'
import Footer from '@/components/layout/Footer'
import type { FooterLinkDto } from '@/types/systemSettings'
import {
  Palette,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Eye,
  ImageIcon,
  Sparkles,
  ArrowRight,
  Shield,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  LayoutTemplate,
  Globe,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react'

export default function BrandingManagementPage() {
  const { branding, resolvedLogoUrl, loading, updateBranding, uploadLogo, resetBranding } = useBranding()

  const [orgName, setOrgName] = useState(branding.organizationName)
  const [sysTitle, setSysTitle] = useState(branding.systemTitle)
  const [reportingTitle, setReportingTitle] = useState(branding.reportingModuleTitle)
  const [reportingSubtitle, setReportingSubtitle] = useState(branding.reportingModuleSubtitle)
  const [footerCopyright, setFooterCopyright] = useState(branding.footerCopyrightText || 'تمامی حقوق محفوظ است.')
  const [footerVersion, setFooterVersion] = useState(branding.footerVersionText || 'v2.0')
  const [footerLinks, setFooterLinks] = useState<FooterLinkDto[]>(branding.footerLinks || [])

  // Modal state for adding / editing a link
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null)
  const [linkModalTitle, setLinkModalTitle] = useState('')
  const [linkModalUrl, setLinkModalUrl] = useState('')
  const [linkModalExternal, setLinkModalExternal] = useState(false)
  const [linkModalVisible, setLinkModalVisible] = useState(true)
  const [linkModalError, setLinkModalError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync state whenever context branding updates
  useEffect(() => {
    setOrgName(branding.organizationName)
    setSysTitle(branding.systemTitle)
    setReportingTitle(branding.reportingModuleTitle)
    setReportingSubtitle(branding.reportingModuleSubtitle)
    setFooterCopyright(branding.footerCopyrightText || 'تمامی حقوق محفوظ است.')
    setFooterVersion(branding.footerVersionText ?? 'v2.0')
    setFooterLinks(branding.footerLinks || [])
  }, [branding])

  const handleOpenAddLinkModal = () => {
    setEditingLinkIndex(null)
    setLinkModalTitle('')
    setLinkModalUrl('')
    setLinkModalExternal(false)
    setLinkModalVisible(true)
    setLinkModalError(null)
    setIsLinkModalOpen(true)
  }

  const handleOpenEditLinkModal = (index: number) => {
    const link = footerLinks[index]
    if (!link) return
    setEditingLinkIndex(index)
    setLinkModalTitle(link.title)
    setLinkModalUrl(link.url)
    setLinkModalExternal(Boolean(link.isExternal))
    setLinkModalVisible(link.isVisible !== false)
    setLinkModalError(null)
    setIsLinkModalOpen(true)
  }

  const handleSaveLinkFromModal = () => {
    const title = linkModalTitle.trim()
    const url = linkModalUrl.trim()
    if (!title) {
      setLinkModalError('عنوان پیوند الزامی است')
      return
    }
    if (!url) {
      setLinkModalError('آدرس اینترنتی پیوند الزامی است')
      return
    }

    if (editingLinkIndex !== null && editingLinkIndex >= 0) {
      setFooterLinks((prev) => {
        const next = [...prev]
        next[editingLinkIndex] = {
          ...next[editingLinkIndex],
          title,
          url,
          isExternal: linkModalExternal,
          isVisible: linkModalVisible,
        }
        return next
      })
    } else {
      const newLink: FooterLinkDto = {
        id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        url,
        isExternal: linkModalExternal,
        isVisible: linkModalVisible,
        order: footerLinks.length + 1,
      }
      setFooterLinks((prev) => [...prev, newLink])
    }
    setIsLinkModalOpen(false)
  }

  const handleDeleteLink = (index: number) => {
    setFooterLinks((prev) => prev.filter((_, i) => i !== index).map((l, i) => ({ ...l, order: i + 1 })))
  }

  const handleToggleLinkVisibility = (index: number) => {
    setFooterLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, isVisible: l.isVisible === false ? true : false } : l))
    )
  }

  const handleMoveLink = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= footerLinks.length) return
    setFooterLinks((prev) => {
      const next = [...prev]
      const temp = next[index]
      next[index] = next[targetIndex]
      next[targetIndex] = temp
      return next.map((l, i) => ({ ...l, order: i + 1 }))
    })
  }

  const handleSaveTextChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim() || !sysTitle.trim()) {
      setStatusMessage({ type: 'error', text: 'نام سازمان و عنوان سامانه نمی‌توانند خالی باشند' })
      return
    }

    try {
      setSaving(true)
      setStatusMessage(null)
      await updateBranding({
        organizationName: orgName.trim(),
        systemTitle: sysTitle.trim(),
        reportingModuleTitle: reportingTitle.trim(),
        reportingModuleSubtitle: reportingSubtitle.trim(),
        footerCopyrightText: footerCopyright.trim(),
        footerVersionText: footerVersion.trim(),
        footerLinksJson: JSON.stringify(footerLinks),
      })
      setStatusMessage({ type: 'success', text: 'تنظیمات برندینگ، هویت و فوتر سازمان با موفقیت ذخیره شد.' })
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'خطا در ذخیره تغییرات برندینگ و فوتر',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'حجم فایل لوگو نباید بیش از ۵ مگابایت باشد.' })
      return
    }

    try {
      setUploading(true)
      setStatusMessage(null)
      await uploadLogo(file)
      setStatusMessage({ type: 'success', text: 'لوگوی سازمان با موفقیت بارگذاری و اعمال شد.' })
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'خطا در بارگذاری لوگوی جدید',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleResetToDefaults = async () => {
    try {
      setResetting(true)
      setStatusMessage(null)
      await resetBranding()
      setShowResetConfirm(false)
      setStatusMessage({ type: 'success', text: 'تنظیمات به مقادیر پیش‌فرض اداره کل امور مالیاتی خوزستان بازنشانی شد.' })
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'خطا در بازنشانی تنظیمات',
      })
    } finally {
      setResetting(false)
    }
  }

  return (
    <ProtectedRoute requiredRoles={['Admin']}>
      <div className="min-h-screen bg-slate-50/60 pb-16" dir="rtl">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100 shadow-xs">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                      تنظیمات هویت بصری و برندینگ سازمان
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Shield className="w-3 h-3" />
                      مدیریت ارشد
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    شخصی‌سازی لوگوی سازمان، نام اداره کل، عنوان سراسری پرتال و سربرگ ماژول گزارش‌ها
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/menu-settings"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
                >
                  مدیریت منوها
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </Link>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={resetting || saving || uploading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors shadow-xs disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  بازنشانی به پیش‌فرض
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 border shadow-xs animate-in fade-in duration-200 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              )}
              <span className="text-xs sm:text-sm font-bold">{statusMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Main Column: Settings Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Form Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  <h2 className="text-base font-bold text-gray-900">مشخصات و عناوین سراسری سامانه</h2>
                </div>

                <form onSubmit={handleSaveTextChanges} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      نام سازمان یا اداره کل <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="مثال: اداره کل امور مالیاتی استان خوزستان"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium"
                      required
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      این نام در نوار بالای سامانه (TopBar)، هدر ماژول‌ها و چاپ گزارش‌ها نمایش داده می‌شود.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      عنوان یا زیرعنوان سراسری سامانه <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sysTitle}
                      onChange={(e) => setSysTitle(e.target.value)}
                      placeholder="مثال: سامانه یکپارچه امور سازمانی و مالیاتی"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium"
                      required
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      عبارت کوچک زیر نام سازمان در نوار بالای سامانه.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      عنوان ماژول آمار و هوش تجاری
                    </label>
                    <input
                      type="text"
                      value={reportingTitle}
                      onChange={(e) => setReportingTitle(e.target.value)}
                      placeholder="مثال: سامانه آمار و هوش تجاری"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      زیرعنوان ماژول آمار و هوش تجاری
                    </label>
                    <input
                      type="text"
                      value={reportingSubtitle}
                      onChange={(e) => setReportingSubtitle(e.target.value)}
                      placeholder="مثال: اداره کل امور مالیاتی استان خوزستان"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  {/* Footer & Links Section */}
                  <div className="pt-4 border-t border-gray-200 space-y-4">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="w-5 h-5 text-indigo-600" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">تنظیمات فوتر و پانویس پرتال</h3>
                        <p className="text-[11px] text-gray-400">سفارشی‌سازی متن کپی‌رایت، نشان نسخه و پیوندهای کاربردی پایین صفحه</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          متن کپی‌رایت و پانویس فوتر
                        </label>
                        <input
                          type="text"
                          value={footerCopyright}
                          onChange={(e) => setFooterCopyright(e.target.value)}
                          placeholder="مثال: تمامی حقوق محفوظ است."
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                          در فوتر پس از نام سازمان نمایش می‌یابد.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          برچسب نسخه سامانه (اختیاری)
                        </label>
                        <input
                          type="text"
                          value={footerVersion}
                          onChange={(e) => setFooterVersion(e.target.value)}
                          placeholder="مثال: v2.0 یا خالی برای عدم نمایش"
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium font-mono text-left"
                          dir="ltr"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                          در صورت خالی بودن، برچسب نسخه در فوتر نمایش داده نمی‌شود.
                        </p>
                      </div>
                    </div>

                    {/* Footer Links Manager */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-gray-600" />
                          <span className="text-xs font-bold text-gray-800">پیوندهای کاربردی فوتر</span>
                          <span className="text-[11px] text-gray-400 font-normal">({footerLinks.length} پیوند)</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleOpenAddLinkModal}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          افزودن پیوند جدید
                        </button>
                      </div>

                      {footerLinks.length === 0 ? (
                        <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs text-gray-500">
                          هیچ پیوندی برای فوتر ثبت نشده است. برای ایجاد دکمه‌های ناوبری روی دکمه افزودن کلیک کنید.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {footerLinks.map((link, idx) => (
                            <div
                              key={link.id || idx}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                link.isVisible !== false
                                  ? 'bg-white border-gray-200 shadow-2xs'
                                  : 'bg-gray-50 border-gray-200/60 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveLink(idx, -1)}
                                    className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-25"
                                    title="انتقال به بالا"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === footerLinks.length - 1}
                                    onClick={() => handleMoveLink(idx, 1)}
                                    className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-25"
                                    title="انتقال به پایین"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-900 truncate">{link.title}</span>
                                    {link.isExternal && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                        خارجی
                                      </span>
                                    )}
                                    {link.isVisible === false && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-500 border border-gray-200 font-medium">
                                        مخفی
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-gray-400 truncate font-mono text-left" dir="ltr">
                                    {link.url}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleLinkVisibility(idx)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                    link.isVisible !== false
                                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                      : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                                  }`}
                                  title={link.isVisible !== false ? 'مخفی کردن پیوند' : 'نمایش دادن پیوند'}
                                >
                                  {link.isVisible !== false ? 'فعال' : 'مخفی'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditLinkModal(idx)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                  title="ویرایش پیوند"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLink(idx)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="حذف پیوند"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving || uploading}
                      className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shadow-primary-600/20 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          در حال ذخیره‌سازی...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          ذخیره تغییرات عناوین و فوتر
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Logo Upload Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-gray-900">نشان و لوگوی سازمان</h2>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 p-2 flex items-center justify-center bg-gray-50 flex-shrink-0 relative overflow-hidden shadow-xs">
                    <img
                      src={resolvedLogoUrl}
                      alt={branding.organizationName}
                      className="w-full h-full object-contain"
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-right">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800">
                      بارگذاری تصویر جدید برای لوگوی سامانه
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      فرمت‌های مجاز: PNG, JPG, SVG, WEBP با پس‌زمینه شفاف (حداکثر ۵ مگابایت).
                    </p>

                    <div className="pt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleFileSelected}
                        className="hidden"
                        id="logo-upload-input"
                      />
                      <label
                        htmlFor="logo-upload-input"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer shadow-xs ${
                          uploading ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            در حال آپلود لوگو...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            انتخاب و آپلود لوگوی جدید
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Previews */}
            <div className="lg:col-span-5 space-y-6">
              {/* TopBar Live Preview */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-gray-800">پیش‌نمایش زنده نوار هدر (TopBar)</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    همانند نوار بالای صفحه
                  </span>
                </div>

                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl overflow-hidden p-1 border border-gray-200 shadow-xs flex items-center justify-center bg-white flex-shrink-0">
                        <img
                          src={resolvedLogoUrl}
                          alt="لوگو"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-900 leading-tight">
                          {orgName || 'نام سازمان'}
                        </span>
                        <span className="text-[10px] text-primary-600 font-bold">
                          {sysTitle || 'عنوان سامانه'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-left hidden sm:block">
                        <div className="text-[11px] font-bold text-gray-800">محمد رضایی</div>
                        <div className="text-[9px] text-gray-400">مدیر ارشد سامانه</div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                        م
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reporting Sub-Nav Live Preview */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-gray-800">پیش‌نمایش سربرگ گزارش‌ها و BI</h3>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md border border-amber-200">
                    هوش تجاری
                  </span>
                </div>

                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold text-slate-900">
                            {reportingTitle || 'سامانه آمار و هوش تجاری'}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {reportingSubtitle || orgName || 'اداره کل امور مالیاتی'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 overflow-x-auto text-[10px]">
                      <span className="px-2 py-1 rounded-lg bg-amber-500 text-white font-bold flex items-center gap-1">
                        <FileSpreadsheet className="w-3 h-3" />
                        گزارش‌های استاندارد
                      </span>
                      <span className="px-2 py-1 rounded-lg text-slate-600 font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        داشبورد مدیریتی
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Live Preview */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-gray-800">پیش‌نمایش زنده فوتر (Footer)</h3>
                  </div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-200">
                    فوتر پرتال
                  </span>
                </div>

                <div className="bg-slate-100/70 p-2.5 rounded-xl border border-slate-200">
                  <Footer
                    className="mt-0 shadow-xs"
                    overrideBranding={{
                      organizationName: orgName,
                      resolvedLogoUrl,
                      footerCopyrightText: footerCopyright,
                      footerVersionText: footerVersion,
                      footerLinks,
                    }}
                  />
                </div>
              </div>

              {/* Help & Information Box */}
              <div className="bg-linear-to-br from-primary-50 to-indigo-50/50 rounded-2xl border border-primary-100 p-5 space-y-2">
                <div className="flex items-center gap-2 text-primary-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  راهنمای راهبری سامانه
                </div>
                <p className="text-[11px] text-primary-800/80 leading-relaxed">
                  تغییرات ذخیره‌شده در این صفحه به صورت آنی در کل سامانه (نوار ابزار بالا، سربرگ گزارش‌ها، صفحات پرتال و پنجره ورود) منعکس شده و کلیه کاربران بدون نیاز به تغییر کد منبع، هویت سازمانی جدید را مشاهده خواهند کرد.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-gray-900">تأیید بازنشانی هویت و برندینگ</h3>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                آیا از بازنشانی کلیه تنظیمات برندینگ (لوگو، نام اداره کل خوزستان، عناوین و فوتر پیش‌فرض سامانه) اطمینان دارید؟
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  disabled={resetting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  disabled={resetting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {resetting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  بله، بازنشانی به پیش‌فرض
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Link Add/Edit Modal */}
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-base text-gray-900">
                    {editingLinkIndex !== null ? 'ویرایش پیوند فوتر' : 'افزودن پیوند جدید به فوتر'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {linkModalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{linkModalError}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    عنوان پیوند <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={linkModalTitle}
                    onChange={(e) => {
                      setLinkModalTitle(e.target.value)
                      if (linkModalError) setLinkModalError(null)
                    }}
                    placeholder="مثال: پرتال سازمان امور مالیاتی"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    آدرس یا مسیر پیوند (URL) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={linkModalUrl}
                    onChange={(e) => {
                      setLinkModalUrl(e.target.value)
                      if (linkModalError) setLinkModalError(null)
                    }}
                    placeholder="مثال: /about یا https://intamedia.ir"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={linkModalExternal}
                      onChange={(e) => setLinkModalExternal(e.target.checked)}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span>باز شدن در تب جدید (لینک خارجی)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={linkModalVisible}
                      onChange={(e) => setLinkModalVisible(e.target.checked)}
                      className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span>نمایش در فوتر (فعال)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveLinkFromModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-xs"
                >
                  ذخیره پیوند
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
