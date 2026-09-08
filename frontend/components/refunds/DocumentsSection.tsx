'use client'

import React, { useState } from 'react'
import {
  FileText,
  UploadCloud,
  Eye,
  Download,
  Trash2,
  Search,
  Filter,
  Calendar,
  User,
  HardDrive,
  Link as LinkIcon,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import {
  TaxRefundCase,
  TaxRefundDocument,
  TaxRefundDocumentType,
  TaxRefundDocumentTypeLabels,
} from '@/types/taxRefund'
import { taxRefundApi } from '@/lib/api/taxRefund'
import { PdfViewerModal } from './PdfViewerModal'
import { DocumentUploadModal } from './DocumentUploadModal'

interface DocumentsSectionProps {
  refundCase: TaxRefundCase
  onRefresh: () => Promise<void>
}

export function DocumentsSection({ refundCase, onRefresh }: DocumentsSectionProps) {
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocForView, setSelectedDocForView] = useState<TaxRefundDocument | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<TaxRefundDocument | null>(null)

  const documents = refundCase.documents || []

  // Filter documents by category and search query
  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      activeCategory === 'all' || doc.documentType === activeCategory

    const matchesSearch =
      !searchQuery.trim() ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const handleDelete = async () => {
    if (!confirmDeleteDoc) return

    try {
      setDeletingId(confirmDeleteDoc.id)
      await taxRefundApi.deleteDocument(refundCase.id, confirmDeleteDoc.id)
      setConfirmDeleteDoc(null)
      await onRefresh()
    } catch (err: any) {
      alert('خطا در حذف مدرک: ' + (err.message || 'خطای ناشناخته'))
    } finally {
      setDeletingId(null)
    }
  }

  // Count documents per category
  const getCategoryCount = (type: TaxRefundDocumentType) => {
    return documents.filter((d) => d.documentType === type).length
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6" dir="rtl">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-gray-900">
                اسناد و مدارک پیوست پرونده (PDF)
              </h3>
              <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                {documents.length} مدرک
              </span>
            </div>
            <p className="text-xs text-gray-500">
              مدارک رسمی ضمیمه شامل قبوض واریزی، استعلامات عدم بدهی، تقاضای مودی و برگ‌های تشخیص
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-purple-700/20 flex items-center justify-center gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          <span>بارگذاری مدرک جدید (PDF)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            همه مدارک ({documents.length})
          </button>

          {Object.entries(TaxRefundDocumentTypeLabels).map(([typeKey, info]) => {
            const typeNum = Number(typeKey)
            const count = getCategoryCount(typeNum)
            if (count === 0 && activeCategory !== typeNum) return null

            return (
              <button
                key={typeKey}
                onClick={() => setActiveCategory(typeNum)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  activeCategory === typeNum
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {info.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان یا فایل..."
            className="w-full pl-3 pr-9 py-1.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-gray-50/60"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold text-gray-700">
            {searchQuery || activeCategory !== 'all'
              ? 'مدرکی با این فیلتر یا جستجو یافت نشد.'
              : 'هنوز سندی برای این پرونده بارگذاری نشده است.'}
          </div>
          <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
            می‌توانید فیش‌های واریزی بانکی، پاسخ استعلامات یا تقاضای استرداد مودی را در قالب فایل PDF بارگذاری نمایید.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-xs font-bold transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            بارگذاری اولین مدرک
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const typeInfo = TaxRefundDocumentTypeLabels[doc.documentType] || {
              label: doc.documentTypeDescription || 'سند پیوست',
              color: 'bg-gray-100 text-gray-800 border-gray-200',
            }

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Card Top: Icon, Type Badge, and Quick Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setSelectedDocForView(doc)}
                        title="مشاهده مستقیم"
                        className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => taxRefundApi.downloadDocument(refundCase.id, doc.id, doc.originalFileName)}
                        title="دانلود فایل"
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteDoc(doc)}
                        title="حذف مدرک"
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Title & File Name */}
                  <div>
                    <h4
                      onClick={() => setSelectedDocForView(doc)}
                      className="text-xs font-bold text-gray-900 hover:text-purple-700 cursor-pointer line-clamp-1"
                      title={doc.title}
                    >
                      {doc.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5 font-mono">
                      {doc.originalFileName}
                    </p>
                  </div>

                  {/* Description if present */}
                  {doc.description && (
                    <p className="text-[11px] text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded-xl">
                      {doc.description}
                    </p>
                  )}
                </div>

                {/* Card Footer: Metadata and View Button */}
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{doc.uploadDateJalali}</span>
                    <span>•</span>
                    <span>{doc.fileSizeFormatted}</span>
                  </div>

                  <button
                    onClick={() => setSelectedDocForView(doc)}
                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    مشاهده
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* PDF In-App Viewer Modal */}
      <PdfViewerModal
        document={selectedDocForView}
        caseId={refundCase.id}
        isOpen={!!selectedDocForView}
        onClose={() => setSelectedDocForView(null)}
      />

      {/* PDF Upload Modal */}
      <DocumentUploadModal
        caseId={refundCase.id}
        receipts={refundCase.receipts || []}
        letters={refundCase.letters || []}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={async () => {
          await onRefresh()
        }}
      />

      {/* Delete Confirmation Dialog */}
      {confirmDeleteDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
          dir="rtl"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-gray-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-gray-900">حذف سند پیوست</h4>
              <p className="text-xs text-gray-500">
                آیا از حذف سند «<strong>{confirmDeleteDoc.title}</strong>» اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteDoc(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleDelete}
                disabled={deletingId === confirmDeleteDoc.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                {deletingId === confirmDeleteDoc.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>حذف قطعی سند</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
