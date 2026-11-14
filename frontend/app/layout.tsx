import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { BrandingProvider } from '@/contexts/BrandingContext'
import { MenuSettingsProvider } from '@/contexts/MenuSettingsContext'
import AppShell from '@/components/layout/AppShell'

const vazirmatn = localFont({
  src: [
    {
      path: '../public/fonts/Vazirmatn-FD-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-FD-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-FD-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-vazirmatn',
  display: 'swap',
})

const bNazanin = localFont({
  src: [
    {
      path: '../public/fonts/BNazanin.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/BNazanin.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/BNazanin.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/BNazanin.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-nazanin',
  display: 'block',
})

const bTitr = localFont({
  src: [
    {
      path: '../public/fonts/BTitrBold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/BTitrBold.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/BTitrBold.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-titr',
  display: 'block',
})

const bMitra = localFont({
  src: [
    {
      path: '../public/fonts/BMitra.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/BMitra.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-mitra',
  display: 'block',
})

export const metadata: Metadata = {
  title: 'اداره کل امور مالیاتی استان خوزستان | سامانه یکپارچه امور سازمانی و مالیاتی',
  description: 'سامانه یکپارچه ارزیابی شایستگی انتصابات، محاسبات حقوق و اضافه کار، و استرداد مالیات اداره کل امور مالیاتی استان خوزستان',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.variable} ${bNazanin.variable} ${bTitr.variable} ${bMitra.variable} font-vazirmatn antialiased bg-gray-50`}>
        <AuthProvider>
          <BrandingProvider>
            <MenuSettingsProvider>
              <AppShell>
                {children}
              </AppShell>
            </MenuSettingsProvider>
          </BrandingProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
