'use client'

import React from 'react'
import Link from 'next/link'
import {
  ExternalLink,
  HelpCircle,
  Globe,
  Building2,
  Link as LinkIcon,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import { useBranding } from '@/contexts/BrandingContext'
import type { FooterLinkDto } from '@/types/systemSettings'

interface FooterProps {
  className?: string
  overrideBranding?: {
    organizationName?: string
    resolvedLogoUrl?: string
    footerCopyrightText?: string
    footerVersionText?: string
    footerBadgeText?: string
    footerLinks?: FooterLinkDto[]
  }
}

function getLinkPillStyle(url: string, title: string, isExternal: boolean) {
  const lowerUrl = url.toLowerCase()
  const lowerTitle = title.toLowerCase()

  // 1. National Tax Portal (my.tax.gov.ir) -> Emerald Theme
  if (lowerUrl.includes('my.tax.gov.ir') || lowerTitle.includes('درگاه ملی') || lowerTitle.includes('ملی خدمات')) {
    return {
      container:
        'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border-emerald-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-xs',
      icon: <Globe className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />,
    }
  }

  // 2. Organization Portal (intamedia.ir) -> Primary Blue Theme
  if (lowerUrl.includes('intamedia.ir') || lowerTitle.includes('سازمان امور مالیاتی') || lowerTitle.includes('پرتال سازمان')) {
    return {
      container:
        'bg-primary-50/90 hover:bg-primary-100 text-primary-800 border-primary-200/80 hover:border-primary-300 shadow-2xs hover:shadow-xs',
      icon: <Building2 className="w-3.5 h-3.5 text-primary-600 flex-shrink-0" />,
    }
  }

  // 3. Help & About (/about) -> Slate Theme
  if (lowerUrl.includes('about') || lowerTitle.includes('راهنما') || lowerTitle.includes('آموزش')) {
    return {
      container:
        'bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs',
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />,
    }
  }

  // 4. Default Link
  return {
    container:
      'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs',
    icon: isExternal ? (
      <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
    ) : (
      <LinkIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
    ),
  }
}

export default function Footer({ className = '', overrideBranding }: FooterProps) {
  const { branding, resolvedLogoUrl } = useBranding()

  const orgName = overrideBranding?.organizationName ?? branding.organizationName
  const logoUrl = overrideBranding?.resolvedLogoUrl ?? resolvedLogoUrl
  const copyrightText = overrideBranding?.footerCopyrightText ?? branding.footerCopyrightText ?? 'تمامی حقوق محفوظ است.'
  const versionText = overrideBranding?.footerVersionText ?? branding.footerVersionText
  const badgeText =
    overrideBranding?.footerBadgeText !== undefined
      ? overrideBranding.footerBadgeText
      : (branding.footerBadgeText ?? 'سامانه رسمی')
  const rawLinks = overrideBranding?.footerLinks ?? branding.footerLinks ?? []

  const visibleLinks = [...rawLinks]
    .filter((link) => link.isVisible !== false && Boolean(link.title?.trim()) && Boolean(link.url?.trim()))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <footer
      className={`mt-12 sm:mt-14 relative rounded-2xl bg-gradient-to-b from-white via-white to-slate-50/90 border border-slate-200/90 shadow-sm p-5 sm:p-6 overflow-hidden backdrop-blur-sm transition-all ${className}`}
      dir="rtl"
    >
      {/* Decorative Top Accent Gradient */}
      <div
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary-500/70 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Row: Identity on Right, Links on Left */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
        {/* Organization Identity & Seal */}
        <div className="flex items-center gap-3.5 text-center sm:text-right w-full lg:w-auto justify-center sm:justify-start">
          <div className="w-11 h-11 rounded-xl bg-white p-1.5 ring-1 ring-slate-200/90 shadow-xs flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform">
            <img
              src={logoUrl}
              alt={`لوگوی ${orgName}`}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {orgName}
              </h3>
              {badgeText && badgeText.trim() !== '' && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-200/60 shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-primary-600" />
                  {badgeText.trim()}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              درگاه یکپارچه خدمات الکترونیک و امور سازمانی
              {copyrightText && (
                <span className="text-slate-600 font-medium"> — {copyrightText}</span>
              )}
            </p>
          </div>
        </div>

        {/* Dynamic Navigation & External Utility Links */}
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 w-full lg:w-auto">
          {visibleLinks.map((link) => {
            const isHttp = link.url.startsWith('http://') || link.url.startsWith('https://')
            const isExternal = link.isExternal || isHttp
            const style = getLinkPillStyle(link.url, link.title, isExternal)

            if (isExternal) {
              return (
                <a
                  key={link.id || `${link.title}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all text-xs font-bold ${style.container}`}
                >
                  {style.icon}
                  <span>{link.title}</span>
                  <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-current" />
                </a>
              )
            }

            return (
              <Link
                key={link.id || `${link.title}-${link.url}`}
                href={link.url}
                className={`group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all text-xs font-bold ${style.container}`}
              >
                {style.icon}
                <span>{link.title}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom Status & Security Strip */}
      <div className="mt-5 pt-3.5 border-t border-slate-100/90 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2.5">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-slate-500">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50/60 px-2.5 py-0.5 rounded-md border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            سامانه یکپارچه فعال و برخط
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <Lock className="w-3 h-3 text-slate-400" />
            ارتباط امن شبکه دولت (TLS 1.3)
          </span>
        </div>

        {versionText && versionText.trim() !== '' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">نسخه انتشار:</span>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80 font-bold shadow-2xs" dir="ltr">
              {versionText.trim()}
            </span>
          </div>
        )}
      </div>
    </footer>
  )
}
