'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'
import type { MenuSettingItem } from '@/types/menuSettings'

interface DeleteMenuItemModalProps {
  target: MenuSettingItem | null
  childCount: number
  submitting: boolean
  onCancel: () => void
  onConfirm: () => Promise<void> | void
}

/**
 * Portal-rendered confirmation dialog for deleting a custom menu module or submenu item.
 */
export default function DeleteMenuItemModal({
  target,
  childCount,
  submitting,
  onCancel,
  onConfirm,
}: DeleteMenuItemModalProps) {
  useEffect(() => {
    if (!target) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [target, submitting, onCancel])

  if (!target) return null

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="حذف گزینه منوی سفارشی"
    >
      <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-rose-600">
          <div className="p-2.5 bg-rose-50 rounded-xl">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">حذف گزینه منوی سفارشی</h3>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          آیا از حذف گزینه منوی <span className="font-bold text-gray-900">«{target.title}»</span> اطمینان دارید؟ این عملیات قابل بازگشت نیست.
        </p>

        {childCount > 0 && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs leading-relaxed">
            هشدار: این بخش دارای {childCount} زیرمنو است. با حذف این گزینه، تمامی زیرمنوهای سفارشی آن نیز به صورت خودکار حذف خواهند شد.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow flex items-center gap-1.5 disabled:opacity-50"
          >
            {submitting ? 'در حال حذف...' : 'بله، حذف شود'}
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return modalContent
  return createPortal(modalContent, document.body)
}
