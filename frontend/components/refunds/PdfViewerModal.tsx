'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Download,
  Printer,
  ExternalLink,
  Maximize2,
  Minimize2,
  FileText,
  Loader2,
  Calendar,
  User,
  HardDrive,
} from 'lucide-react'
import { TaxRefundDocument, TaxRefundDocumentTypeLabels } from '@/types/taxRefund'
import { taxRefundApi } from '@/lib/api/taxRefund'

interface PdfViewerModalProps {
  document: TaxRefundDocument | null
  caseId: string
  isOpen: boolean
  onClose: () => void
}

export function PdfViewerModal({ document, caseId, isOpen, onClose }: PdfViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    let active = true
    let currentBlobUrl: string | null = null

    async function fetchPdf() {
      if (!isOpen || !document) return
      setIsLoading(true)
      setLoadError(null)

      try {
        const blob = await taxRefundApi.getDocumentBlob(caseId, document.id)
        if (!active) return
        currentBlobUrl = URL.createObjectURL(blob)
        setBlobUrl(currentBlobUrl)
        setIsLoading(false)
      } catch (err: any) {
        if (!active) return
        setIsLoading(false)
        console.error('Failed to load PDF document:', err)
        setLoadError(err.message || 'خطا در بارگذاری فایل PDF از سرور')
      }
    }

    fetchPdf()

    return () => {
      active = false
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl)
      }
    }
  }, [isOpen, caseId, document?.id])

  if (!isOpen || !document) return null

  const typeInfo = TaxRefundDocumentTypeLabels[document.documentType] || {
    label: document.documentTypeDescription || 'سند پیوست',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)
      await taxRefundApi.downloadDocument(caseId, document.id, document.originalFileName)
    } catch (err: any) {
      alert('خطا در دانلود فایل: ' + (err.message || 'خطای سرور'))
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus()
        iframeRef.current.contentWindow.print()
      } catch {
        if (blobUrl) window.open(blobUrl, '_blank')
      }
    } else if (blobUrl) {
      window.open(blobUrl, '_blank')
    }
  }

  const handleOpenInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank')
    } else {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const directUrl = taxRefundApi.getDocumentViewUrl(caseId, document.id, token)
      window.open(directUrl, '_blank')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-2 sm:inset-4 w-auto h-auto'
            : 'w-full max-w-5xl h-[90vh] max-h-[850px]'
        }`}
      >
        {/* Header Toolbar */}
        <div className="p-4 sm:px-6 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black truncate text-white">
                  {document.title}
                </h3>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-300 font-medium mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-300" />
                  {document.uploadDateJalali}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-purple-300" />
                  {document.uploadedByUserName}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-purple-300" />
                  {document.fileSizeFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 justify-end">
            <button
              onClick={handlePrint}
              title="چاپ سند"
              className="p-2 sm:px-3 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">چاپ</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading}
              title="دانلود فایل PDF"
              className="p-2 sm:px-3 sm:py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">دانلود</span>
            </button>

            <button
              onClick={handleOpenInNewTab}
              title="باز کردن در تب جدید"
              className="p-2 sm:px-3 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">تب جدید</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'کوچک‌نمایی' : 'تمام‌صفحه'}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="بستن"
              className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description Banner (if exists) */}
        {document.description && (
          <div className="bg-amber-50/80 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center gap-2">
            <span className="font-bold">یادداشت پیوست:</span>
            <span>{document.description}</span>
          </div>
        )}

        {/* Main PDF Viewer Frame */}
        <div className="relative flex-1 bg-gray-100 min-h-0 flex flex-col items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 z-10 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-purple-700" />
              <p className="text-xs font-bold text-gray-700">در حال دریافت و آماده‌سازی فایل PDF...</p>
            </div>
          )}

          {loadError ? (
            <div className="p-8 text-center max-w-md bg-white rounded-2xl shadow-sm border border-rose-200 m-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">عدم امکان پیش‌نمایش مستقیم</h4>
              <p className="text-xs text-gray-500 mb-4">{loadError}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                دانلود فایل PDF جهت مشاهده
              </button>
            </div>
          ) : blobUrl ? (
            <iframe
              ref={iframeRef}
              src={blobUrl}
              className="w-full h-full border-0"
              title={document.title}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
