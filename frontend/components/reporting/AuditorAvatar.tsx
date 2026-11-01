'use client'

import React, { useState } from 'react'
import { User, ZoomIn, X, Award, ShieldCheck, Sparkles } from 'lucide-react'
import { BASE_URL } from '@/lib/api/config'
import { toPersianDigits } from '@/lib/jalali'

interface AuditorAvatarProps {
  auditorName: string
  nationalId?: string
  photoUrl?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  rank?: number
  tier?: string
  showLightbox?: boolean
  className?: string
}

export function AuditorAvatar({
  auditorName,
  nationalId,
  photoUrl,
  size = 'md',
  rank,
  tier,
  showLightbox = false,
  className = '',
}: AuditorAvatarProps) {
  const [hasError, setHasError] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  // Resolve image source URL
  const resolvedPhotoSrc = React.useMemo(() => {
    if (photoUrl) {
      return photoUrl.startsWith('http') ? photoUrl : `${BASE_URL}${photoUrl}`
    }
    if (nationalId && nationalId.trim().length >= 8) {
      return `${BASE_URL}/uploads/employee-photos/${nationalId.trim()}.jpg`
    }
    return null
  }, [photoUrl, nationalId])

  // Generate Persian initials for fallback
  const initials = React.useMemo(() => {
    if (!auditorName) return ''
    const clean = auditorName.trim()
    // If it's a numeric system code (e.g. "13"), fallback to icon
    if (/^\d+$/.test(clean)) return null

    const parts = clean.split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)} ${parts[parts.length - 1].charAt(0)}`
    }
    return clean.slice(0, 2)
  }, [auditorName])

  // Size specifications
  const sizeClasses = {
    xs: 'w-6 h-6 min-w-[24px] min-h-[24px] max-w-[24px] max-h-[24px] text-[9px]',
    sm: 'w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] text-[11px]',
    md: 'w-[44px] h-[44px] min-w-[44px] min-h-[44px] max-w-[44px] max-h-[44px] text-xs',
    lg: 'w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] text-sm',
    xl: 'w-20 h-20 min-w-[80px] min-h-[80px] max-w-[80px] max-h-[80px] text-base',
    '2xl': 'w-24 h-24 min-w-[96px] min-h-[96px] max-w-[96px] max-h-[96px] text-xl',
  }[size]

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
  }[size]

  // Tier color styling
  const tierRingClass = React.useMemo(() => {
    switch (tier?.toUpperCase()) {
      case 'A':
        return 'ring-2 ring-amber-400 shadow-amber-500/20'
      case 'B':
        return 'ring-2 ring-emerald-400 shadow-emerald-500/20'
      case 'C':
        return 'ring-2 ring-sky-400 shadow-sky-500/20'
      case 'D':
        return 'ring-1 ring-slate-300'
      default:
        return 'ring-1 ring-slate-200'
    }
  }, [tier])

  // Rank medal styling
  const rankBadge = React.useMemo(() => {
    if (!rank || rank > 3) return null
    if (rank === 1) {
      return (
        <span
          className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-900 flex items-center justify-center font-bold text-[10px] shadow-sm ring-2 ring-white"
          title="رتبه ۱ استانی"
        >
          🥇
        </span>
      )
    }
    if (rank === 2) {
      return (
        <span
          className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-900 flex items-center justify-center font-bold text-[10px] shadow-sm ring-2 ring-white"
          title="رتبه ۲ استانی"
        >
          🥈
        </span>
      )
    }
    if (rank === 3) {
      return (
        <span
          className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-white flex items-center justify-center font-bold text-[10px] shadow-sm ring-2 ring-white"
          title="رتبه ۳ استانی"
        >
          🥉
        </span>
      )
    }
    return null
  }, [rank])

  const handleClick = (e: React.MouseEvent) => {
    if (showLightbox && resolvedPhotoSrc && !hasError) {
      e.stopPropagation()
      setIsLightboxOpen(true)
    }
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={`relative inline-flex shrink-0 rounded-2xl select-none ${
          showLightbox && resolvedPhotoSrc && !hasError ? 'cursor-zoom-in' : ''
        } ${className}`}
      >
        <div
          className={`${sizeClasses} rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold shadow-xs transition-transform duration-200 ${tierRingClass}`}
        >
          {resolvedPhotoSrc && !hasError ? (
            <img
              src={resolvedPhotoSrc}
              alt={auditorName}
              loading="lazy"
              onError={() => setHasError(true)}
              className="w-full h-full object-cover object-top"
            />
          ) : initials ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/90 to-amber-700 text-white font-extrabold tracking-wider shadow-inner">
              <span>{initials}</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500">
              <User className={iconSizes} />
            </div>
          )}
        </div>

        {/* Rank Medal Overlay */}
        {rankBadge}
      </div>

      {/* Lightbox Zoom Modal */}
      {isLightboxOpen && resolvedPhotoSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
          dir="rtl"
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-sm w-full border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Close */}
            <div className="absolute top-3 left-3 z-10">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white transition-colors cursor-pointer"
                title="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Canvas */}
            <div className="w-full aspect-square bg-slate-100 overflow-hidden relative">
              <img
                src={resolvedPhotoSrc}
                alt={auditorName}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent pointer-events-none" />
              <div className="absolute bottom-3 right-4 text-white">
                <div className="font-extrabold text-base drop-shadow-md">{auditorName}</div>
                {nationalId && (
                  <div className="text-xs text-slate-300 font-mono drop-shadow-sm mt-0.5">
                    کد ملی: {toPersianDigits(nationalId)}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                تصویر احراز هویت پرسنلی حسابرس
              </span>
              {rank && (
                <span className="font-bold text-amber-700 font-mono">
                  رتبه {toPersianDigits(rank)} استانی
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
