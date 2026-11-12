'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Save, Shield, CheckCircle2, AlertTriangle, Users } from 'lucide-react'
import type {
  MenuSettingItem,
  CreateMenuSettingPayload,
  UpdateMenuSettingMetadataPayload,
} from '@/types/menuSettings'
import { MENU_ICON_OPTIONS } from '@/lib/icons/menuIcons'
import {
  ALL_GENERAL_ROLES,
  ORGANIZATIONAL_ROLES,
  getPresetRoles,
  toggleRoleSelection,
  sanitizeRolesSelection,
  type RolePreset,
} from '@/lib/constants/menuRoles'

interface MenuItemFormModalProps {
  isOpen: boolean
  editingItem: MenuSettingItem | null
  initialParentKey?: string | null
  rootModules: MenuSettingItem[]
  hasChildren?: boolean
  submitting: boolean
  onClose: () => void
  onSubmitCreate: (payload: CreateMenuSettingPayload) => Promise<void>
  onSubmitUpdate: (menuKey: string, payload: UpdateMenuSettingMetadataPayload) => Promise<void>
}

export default function MenuItemFormModal({
  isOpen,
  editingItem,
  initialParentKey = null,
  rootModules,
  hasChildren = false,
  submitting,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
}: MenuItemFormModalProps) {
  const isEditing = Boolean(editingItem)

  const [itemType, setItemType] = useState<'root' | 'child'>('root')
  const [parentKey, setParentKey] = useState<string>('')
  const [title, setTitle] = useState('')
  const [route, setRoute] = useState('/')
  const [menuKey, setMenuKey] = useState('')
  const [description, setDescription] = useState('')
  const [iconName, setIconName] = useState('Link2')
  const [displayOrder, setDisplayOrder] = useState<number>(10)
  const [isVisible, setIsVisible] = useState(true)
  const [allowedRoles, setAllowedRoles] = useState<string[]>([...ALL_GENERAL_ROLES])
  const [formError, setFormError] = useState<string | null>(null)

  const availableParents = rootModules.filter(
    (m) => m.menuKey !== editingItem?.menuKey && m.menuKey !== 'nav_home'
  )

  useEffect(() => {
    if (!isOpen) return

    setFormError(null)
    if (editingItem) {
      const isChild = Boolean(editingItem.parentKey)
      setItemType(isChild ? 'child' : 'root')
      setParentKey(editingItem.parentKey || availableParents[0]?.menuKey || '')
      setTitle(editingItem.title)
      setRoute(editingItem.route)
      setMenuKey(editingItem.menuKey)
      setDescription(editingItem.description || '')
      setIconName(editingItem.iconName || (isChild ? 'Link2' : 'Folder'))
      setDisplayOrder(editingItem.displayOrder)
      setIsVisible(editingItem.isVisible)
      setAllowedRoles(
        sanitizeRolesSelection(
          editingItem.allowedRoles?.length
            ? editingItem.allowedRoles
            : editingItem.adminOnly
            ? ['Admin']
            : ALL_GENERAL_ROLES
        )
      )
    } else {
      const isChild = Boolean(initialParentKey)
      setItemType(isChild ? 'child' : 'root')
      setParentKey(initialParentKey || availableParents[0]?.menuKey || '')
      setTitle('')
      setRoute('')
      setMenuKey('')
      setDescription('')
      setIconName(isChild ? 'Link2' : 'LayoutGrid')
      setDisplayOrder(rootModules.length + 1)
      setIsVisible(true)
      setAllowedRoles([...ALL_GENERAL_ROLES])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingItem, initialParentKey])

  if (!isOpen) return null

  const applyPreset = (preset: RolePreset) => {
    setAllowedRoles(getPresetRoles(preset))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const trimmedTitle = title.trim()
    const trimmedRoute = route.trim()
    const trimmedKey = menuKey.trim().toLowerCase()

    if (!trimmedTitle) {
      setFormError('عنوان نمایشی منو الزامی است.')
      return
    }

    const isInternal = trimmedRoute.startsWith('/') && !trimmedRoute.startsWith('//')
    const isExternal = /^https?:\/\/.+/i.test(trimmedRoute)
    if (!isInternal && !isExternal) {
      setFormError("مسیر باید با '/' شروع شود (مسیر داخلی) یا یک آدرس معتبر http/https باشد.")
      return
    }

    if (!isEditing && trimmedKey && !/^[a-z0-9_-]{2,100}$/.test(trimmedKey)) {
      setFormError('شناسه یکتا باید فقط شامل حروف کوچک انگلیسی، اعداد، خط تیره یا زیرخط باشد (حداقل ۲ کاراکتر).')
      return
    }

    if (itemType === 'child' && !parentKey) {
      setFormError('انتخاب سامانه والد برای زیرمنو الزامی است.')
      return
    }

    const sanitizedRoles = sanitizeRolesSelection(allowedRoles)
    const adminOnly = !sanitizedRoles.some((r) => r.toLowerCase() !== 'admin')

    try {
      if (isEditing && editingItem) {
        await onSubmitUpdate(editingItem.menuKey, {
          parentKey: itemType === 'child' ? parentKey : null,
          title: trimmedTitle,
          route: trimmedRoute,
          iconName,
          description: description.trim() || null,
          isVisible,
          adminOnly,
          allowedRoles: sanitizedRoles,
          displayOrder: Number.isFinite(displayOrder) ? displayOrder : 1,
        })
      } else {
        await onSubmitCreate({
          menuKey: trimmedKey || undefined,
          parentKey: itemType === 'child' ? parentKey : null,
          title: trimmedTitle,
          route: trimmedRoute,
          iconName,
          description: description.trim() || null,
          isVisible,
          adminOnly,
          allowedRoles: sanitizedRoles,
          displayOrder: Number.isFinite(displayOrder) ? displayOrder : undefined,
        })
      }
      onClose()
    } catch (err: any) {
      setFormError(
        err?.response?.data?.error || err?.message || 'خطا در ثبت اطلاعات گزینه منو'
      )
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'ویرایش گزینه سفارشی منو' : 'افزودن گزینه جدید به منو'}
    >
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-gray-900">
                {isEditing ? 'ویرایش گزینه سفارشی منو' : 'افزودن گزینه جدید به منو'}
              </h2>
              <p className="text-[11px] text-gray-500">
                تعریف لینک داخلی سامانه یا پیوند خارجی با کنترل سطح دسترسی نقش‌ها
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Level selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-800">جایگاه در ساختار منو</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setItemType('root')}
                className={`p-3 rounded-xl border text-right transition-all ${
                  itemType === 'root'
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/15'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="text-xs font-bold block">گزینه اصلی (سطح اول)</span>
                <span className="text-[11px] text-gray-500 block mt-0.5">
                  لینک مستقل در منوی کناری یا سرگروه ماژول جدید
                </span>
              </button>

              <button
                type="button"
                disabled={hasChildren || availableParents.length === 0}
                onClick={() => setItemType('child')}
                className={`p-3 rounded-xl border text-right transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  itemType === 'child'
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/15'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="text-xs font-bold block">زیرمنو (داخل یک سامانه)</span>
                <span className="text-[11px] text-gray-500 block mt-0.5">
                  {hasChildren
                    ? 'این ماژول دارای زیرمنو است و نمی‌تواند زیرمنو شود'
                    : 'افزودن به زیرمجموعه یکی از سامانه‌های موجود'}
                </span>
              </button>
            </div>
          </div>

          {itemType === 'child' && (
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                سامانه / ماژول والد *
              </label>
              <select
                value={parentKey}
                onChange={(e) => setParentKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {availableParents.map((parent) => (
                  <option key={parent.menuKey} value={parent.menuKey}>
                    {parent.title} ({parent.menuKey})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title & Route */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                عنوان نمایشی در منو *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: درگاه قوانین مالیاتی"
                maxLength={150}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                مسیر صفحه یا لینک مقصد *
              </label>
              <input
                type="text"
                dir="ltr"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="/about یا https://intamedia.ir"
                maxLength={250}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left"
              />
            </div>
          </div>

          {/* Description, MenuKey, DisplayOrder */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                توضیح کوتاه (اختیاری)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="نمایش در راهنما و پنجره بازشو"
                maxLength={500}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                شناسه یکتا {isEditing ? '' : '(اختیاری)'}
              </label>
              <input
                type="text"
                dir="ltr"
                disabled={isEditing}
                value={menuKey}
                onChange={(e) => setMenuKey(e.target.value)}
                placeholder="تولید خودکار (custom_...)"
                maxLength={100}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 disabled:bg-gray-100 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                ترتیب
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-center"
              />
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              آیکون نمایشی
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200 max-h-40 overflow-y-auto">
              {MENU_ICON_OPTIONS.map((opt) => {
                const IconComp = opt.icon
                const selected = iconName.toLowerCase() === opt.name.toLowerCase()
                return (
                  <button
                    key={opt.name}
                    type="button"
                    title={opt.label}
                    onClick={() => setIconName(opt.name)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                      selected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Visibility & Roles */}
          <div className="space-y-3 pt-1 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">وضعیت نمایش و نقش‌های مجاز</span>
              <button
                type="button"
                onClick={() => setIsVisible((v) => !v)}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  isVisible
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isVisible ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}
                />
                {isVisible ? 'فعال و قابل نمایش' : 'مخفی (غیرفعال)'}
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-gray-500 ml-1">انتخاب سریع:</span>
              {(
                [
                  ['all', 'همه نقش‌ها'],
                  ['managers', 'مدیران'],
                  ['experts', 'کارشناسان'],
                  ['admin', 'فقط مدیر ارشد'],
                ] as [RolePreset, string][]
              ).map(([preset, label]) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-xl border border-gray-200 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                <Shield className="w-3 h-3 text-purple-600" />
                مدیر ارشد
              </span>
              {ORGANIZATIONAL_ROLES.map((roleDef) => {
                const active = allowedRoles.some(
                  (r) => r.toLowerCase() === roleDef.key.toLowerCase()
                )
                return (
                  <button
                    key={roleDef.key}
                    type="button"
                    onClick={() => setAllowedRoles((prev) => toggleRoleSelection(prev, roleDef.key))}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      active
                        ? roleDef.activeClass
                        : 'bg-white text-gray-400 border-gray-200 line-through opacity-75 hover:opacity-100'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    {roleDef.label}
                    {active && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isEditing ? (
                <Save className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isEditing ? 'ذخیره تغییرات گزینه' : 'ایجاد گزینه منو'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

