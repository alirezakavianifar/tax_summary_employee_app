'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import {
  payrollCyclesApi,
  DEPT_STATUS_LABELS,
  type PayrollDepartmentEntrySummaryDto,
  type PayrollCycleSummaryDto,
} from '@/lib/api/payrollCycles'
import {
  Building2,
  Calendar,
  Users,
  AlertCircle,
  Loader2,
  ChevronLeft,
  DollarSign,
  ArrowLeft,
} from 'lucide-react'

function formatNumber(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('fa-IR')
}

export default function MyDepartmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [entries, setEntries] = useState<PayrollDepartmentEntrySummaryDto[]>([])
  const [allCycles, setAllCycles] = useState<PayrollCycleSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [myEntries, cycles] = await Promise.all([
          payrollCyclesApi.getMyDepartmentEntries(),
          payrollCyclesApi.getCycles(),
        ])

        setEntries(myEntries)
        setAllCycles(cycles)

        // If user has exactly one active department entry, redirect directly to workspace
        if (myEntries.length === 1) {
          router.replace(`/payroll/department/${myEntries[0].id}`)
        }
      } catch (err: any) {
        setError(err?.response?.data?.error || err.message || 'خطا در دریافت اطلاعات کارپوشه اداره')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-7 h-7 text-primary-600" />
              کارپوشه و کاربرگ‌های اختصاصی اداره
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              مشاهده دوره‌های فعال، تکمیل ساعات اضافه کار و درصد رفاهی کارکنان اداره
            </p>
          </div>

          <Link
            href="/payroll/cycles"
            className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium"
          >
            مشاهده تمام دوره‌های سازمان <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((dept) => {
              const statusInfo = DEPT_STATUS_LABELS[dept.status] || {
                label: dept.status,
                color: 'bg-gray-100 text-gray-700 border-gray-200',
                dot: 'bg-gray-400',
              }
              const cycle = allCycles.find((c) => c.id === dept.payrollCycleId)
              const cycleDeadline = cycle?.deadline

              return (
                <div
                  key={dept.id}
                  onClick={() => router.push(`/payroll/department/${dept.id}`)}
                  className="bg-white rounded-xl border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 hover:text-primary-600 transition-colors">
                          {dept.departmentName}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3 text-xs border border-gray-100 my-4">
                      <div>
                        <span className="text-gray-400 block">تعداد کارکنان:</span>
                        <span className="font-semibold text-gray-800">{formatNumber(dept.employeeCount)} نفر</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">سرانه مصوب:</span>
                        <span className="font-semibold text-gray-800">
                          {dept.baseOvertimeCap ? formatNumber(dept.baseOvertimeCap) : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 border-t border-gray-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">مجموع اضافه کار:</span>
                        <span className="font-bold text-primary-700">{formatNumber(dept.totalOvertimeAmount)} ریال</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">مجموع رفاهی:</span>
                        <span className="font-bold text-emerald-700">{formatNumber(dept.totalWelfareAmount)} ریال</span>
                      </div>
                      {cycleDeadline && (
                        <div className="flex justify-between text-amber-600 font-medium pt-1 border-t border-dashed border-gray-100">
                          <span>مهلت ارسال اداره:</span>
                          <span>{new Date(cycleDeadline).toLocaleDateString('fa-IR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-4 flex items-center justify-between text-xs text-primary-600 font-bold">
                    <span>ورود به کاربرگ و تکمیل اطلاعات</span>
                    <ChevronLeft className="w-4 h-4" />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              هیچ کاربرگ اختصاصی ثبت‌شده‌ای به نام واحد سازمانی شما یافت نشد
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
              شما می‌توانید از طریق فهرست دوره‌های سازمان، کاربرگ مربوط به اداره خود را انتخاب نموده و وارد آن شوید.
            </p>

            <Link
              href="/payroll/cycles"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              مشاهده دوره‌های محاسبه فعال
            </Link>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
