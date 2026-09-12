import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { MenuSettingsProvider } from '@/contexts/MenuSettingsContext'
import Navbar from '@/components/layout/Navbar'

const vazirmatn = localFont({
  src: [
    {
      path: '../public/fonts/Vazirmatn-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Vazirmatn-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-vazirmatn',
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
  title: 'اداره کل امور مالیاتی استان خوزستان | سامانه جامع اداری و پرسنلی',
  description: 'سامانه جامع مدیریت ارزیابی شایستگی انتصابات و محاسبات رفاهی و اضافه کار اداره کل امور مالیاتی استان خوزستان',
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
          <MenuSettingsProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-grow">
                {children}
              </main>
            </div>
          </MenuSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
