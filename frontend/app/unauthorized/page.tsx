'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function UnauthorizedPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 text-center px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-200/80 shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            عدم دسترسی به بخش درخواستی
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            دسترسی به این سامانه، ماژول یا صفحه بر اساس نقش کاربری شما محدود شده است یا توسط مدیر ارشد سیستم غیرفعال گردیده است.
          </p>
        </div>

        {user && (
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/60 text-xs text-right space-y-1">
            <div className="flex justify-between items-center text-gray-600">
              <span>کاربر:</span>
              <span className="font-bold text-gray-900">{user.username}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>نقش فعال:</span>
              <span className="font-bold text-primary-600">{user.role}</span>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary-500/20"
          >
            <Home className="w-4 h-4" />
            <span>صفحه اصلی پرتال</span>
          </Link>

          <button
            onClick={() => logout()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب</span>
          </button>
        </div>
      </div>
    </div>
  )
}
