'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { systemSettingsApi } from '@/lib/api/systemSettings'
import { getApiUrl } from '@/lib/api/config'
import type { SystemSettingsDto, UpdateSystemSettingsPayload } from '@/types/systemSettings'

interface BrandingContextType {
  branding: SystemSettingsDto
  loading: boolean
  error: string | null
  resolvedLogoUrl: string
  refreshBranding: () => Promise<void>
  updateBranding: (payload: UpdateSystemSettingsPayload) => Promise<void>
  uploadLogo: (file: File) => Promise<void>
  resetBranding: () => Promise<void>
}

const DEFAULT_BRANDING: SystemSettingsDto = {
  id: '',
  settingKey: 'Branding',
  organizationName: 'اداره کل امور مالیاتی استان خوزستان',
  systemTitle: 'سامانه یکپارچه امور سازمانی و مالیاتی',
  logoPath: '/images/Intamedia_Logo.png',
  reportingModuleTitle: 'سامانه آمار و هوش تجاری',
  reportingModuleSubtitle: 'اداره کل امور مالیاتی استان خوزستان',
  updatedAt: new Date().toISOString(),
  updatedBy: null,
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

export function resolveLogoUrl(logoPath?: string | null): string {
  if (!logoPath) return '/images/Intamedia_Logo.png'
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) return logoPath
  if (logoPath.startsWith('/uploads/')) {
    const apiBase = getApiUrl()
    return `${apiBase}${logoPath}`
  }
  return logoPath
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<SystemSettingsDto>(DEFAULT_BRANDING)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshBranding = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await systemSettingsApi.getBrandingSettings()
      if (data) {
        setBranding(data)
      }
    } catch (err: any) {
      console.warn('Could not fetch dynamic branding from API, falling back to default:', err?.message)
      // Keep DEFAULT_BRANDING
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshBranding()
  }, [refreshBranding])

  const updateBranding = useCallback(async (payload: UpdateSystemSettingsPayload) => {
    try {
      setLoading(true)
      setError(null)
      const updated = await systemSettingsApi.updateBrandingSettings(payload)
      setBranding(updated)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'خطا در ذخیره تغییرات برندینگ'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadLogo = useCallback(async (file: File) => {
    try {
      setLoading(true)
      setError(null)
      const updated = await systemSettingsApi.uploadLogo(file)
      setBranding(updated)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'خطا در بارگذاری لوگو'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const resetBranding = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const updated = await systemSettingsApi.resetBrandingSettings()
      setBranding(updated)
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'خطا در بازنشانی تنظیمات برندینگ'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const resolvedLogoUrl = resolveLogoUrl(branding.logoPath)

  return (
    <BrandingContext.Provider
      value={{
        branding,
        loading,
        error,
        resolvedLogoUrl,
        refreshBranding,
        updateBranding,
        uploadLogo,
        resetBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding(): BrandingContextType {
  const context = useContext(BrandingContext)
  if (!context) {
    return {
      branding: DEFAULT_BRANDING,
      loading: false,
      error: null,
      resolvedLogoUrl: '/images/Intamedia_Logo.png',
      refreshBranding: async () => {},
      updateBranding: async () => {},
      uploadLogo: async () => {},
      resetBranding: async () => {},
    }
  }
  return context
}

