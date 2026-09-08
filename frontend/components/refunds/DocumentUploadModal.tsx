'use client'

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react'
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Link as LinkIcon,
} from 'lucide-react'
import {
  TaxRefundDocumentType,
  TaxRefundDocumentTypeLabels,
  TaxRefundReceipt,
  TaxRefundLetter,
  TaxRefundLetterTypeLabels,
} from '@/types/taxRefund'
import { taxRefundApi } from '@/lib/api/taxRefund'

interface DocumentUploadModalProps {
  caseId: string
  receipts: TaxRefundReceipt[]
  letters: TaxRefundLetter[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export function DocumentUploadModal({
  caseId,
  receipts,
  letters,
  isOpen,
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState<TaxRefundDocumentType>(
    TaxRefundDocumentType.ReceiptProof
  )
  const [relatedReceiptId, setRelatedReceiptId] = useState<string>('')
  const [relatedLetterId, setRelatedLetterId] = useState<string>('')
  const [description, setDescription] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFile(e.target.files[0])
    }
  }

  const processSelectedFile = (selectedFile: File) => {
    setError(null)
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
    if (ext !== '.pdf') {
      setError('صرفاً فایل‌های با فرمت PDF مجاز به بارگذاری می‌باشند.')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('حجم فایل انتخابی بیش از سقف مجاز ۲۵ مگابایت است.')
      return
    }

    setFile(selectedFile)
    if (!title.trim()) {
      const autoTitle = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      setTitle(autoTitle)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('لطفاً یک فایل PDF انتخاب نمایید.')
      return
    }

    if (!title.trim()) {
      setError('عنوان سند نمی‌تواند خالی باشد.')
      return
    }

    try {
      setUploading(true)
      setError(null)
      await taxRefundApi.uploadDocument(caseId, file, {
        title: title.trim(),
        documentType,
        description: description.trim() || undefined,
        relatedReceiptId: relatedReceiptId || undefined,
        relatedLetterId: relatedLetterId || undefined,
      })

      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری مدرک پیوست')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setTitle('')
    setDescription('')
    setRelatedReceiptId('')
    setRelatedLetterId('')
    setError(null)
    onClose()
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">بارگذاری سند پیوست جدید (PDF)</h3>
              <p className="text-[11px] text-gray-300">پیوست مدارک و مستندات رسمی به پرونده استرداد</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Box */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              فایل سند PDF <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-purple-600 bg-purple-50/50 scale-[0.99]'
                    : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50/30'
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-gray-800 mb-1">
                  فایل PDF را اینجا بکشید و رها کنید یا کلیک کنید
                </div>
                <div className="text-[11px] text-gray-400">
                  صرفاً فایل‌های PDF تا سقف ۲۵ مگابایت مجاز می‌باشند
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 font-black text-xs">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{file.name}</p>
                    <p className="text-[11px] text-gray-500">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                  title="حذف و انتخاب مجدد"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Title & Document Type Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                عنوان سند <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: فیش واریزی قبض شماره ۱"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                نوع و طبقه‌بندی سند <span className="text-red-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(Number(e.target.value) as TaxRefundDocumentType)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white font-medium"
              >
                {Object.entries(TaxRefundDocumentTypeLabels).map(([typeKey, info]) => (
                  <option key={typeKey} value={typeKey}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Links: Related Receipt or Letter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ارتباط با قبض جدول (الف) (اختیاری):
              </label>
              <select
                value={relatedReceiptId}
                onChange={(e) => setRelatedReceiptId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 bg-white"
              >
                <option value="">-- بدون ارتباط مستقیم --</option>
                {receipts.map((r) => (
                  <option key={r.id} value={r.id}>
                    قبض {r.receiptNumber} ({new Intl.NumberFormat('fa-IR').format(r.amountRials)} ریال)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ارتباط با استعلام / نامه (اختیاری):
              </label>
              <select
                value={relatedLetterId}
                onChange={(e) => setRelatedLetterId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 bg-white"
              >
                <option value="">-- بدون ارتباط مستقیم --</option>
                {letters.map((l) => (
                  <option key={l.id} value={l.id}>
                    {TaxRefundLetterTypeLabels[l.letterType] || 'نامه'} (ش {l.letterNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              توضیحات و یادداشت تکمیلی (اختیاری):
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="توضیحات اضافی، شماره دبیرخانه یا نکات حسابرس..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-700/20 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ذخیره و بارگذاری...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>بارگذاری و پیوست مدرک</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
