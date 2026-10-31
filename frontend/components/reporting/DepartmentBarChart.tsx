'use client'

import React from 'react'
import { TopDepartmentBudget } from '@/types/reporting'
import { AlertTriangle, Users, CheckCircle2 } from 'lucide-react'

interface DepartmentBarChartProps {
  departments: TopDepartmentBudget[]
  maxItems?: number
}

export function DepartmentBarChart({ departments, maxItems = 7 }: DepartmentBarChartProps) {
  if (!departments || departments.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
        اطلاعات مصرف بودجه ادارات یافت نشد
      </div>
    )
  }

  const items = departments.slice(0, maxItems)

  return (
    <div className="flex flex-col gap-3.5">
      {items.map((dept, idx) => {
        const percent = dept.allocatedBudget > 0 ? (dept.consumedAmount / dept.allocatedBudget) * 100 : 0
        const isOverBudget = dept.variance < 0 || percent > 100
        const isWarning = percent >= 85 && percent <= 100

        let barColor = 'bg-gradient-to-l from-emerald-500 to-teal-400'
        let textColor = 'text-emerald-700'
        if (isOverBudget) {
          barColor = 'bg-gradient-to-l from-rose-500 to-red-400'
          textColor = 'text-rose-700'
        } else if (isWarning) {
          barColor = 'bg-gradient-to-l from-amber-500 to-orange-400'
          textColor = 'text-amber-700'
        }

        return (
          <div key={idx} className="flex flex-col gap-1.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{dept.departmentName}</span>
                {dept.hasViolation && (
                  <span className="flex items-center gap-1 text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-200">
                    <AlertTriangle className="w-3 h-3" />
                    تخطی سقف ۱۲۰ساعت
                  </span>
                )}
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {dept.employeeCount.toLocaleString('fa-IR')} نفر
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-slate-500">
                  مصرف: <b className="text-slate-800">{dept.consumedAmount.toLocaleString('fa-IR')}</b>
                </span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-500">
                  بودجه: <b>{dept.allocatedBudget.toLocaleString('fa-IR')}</b>
                </span>
                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${textColor} bg-slate-100`}>
                  {percent.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Meter Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>

            {/* Bottom Sub-stats */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>
                میانگین اضافه کار سرانه:{' '}
                <b className="text-slate-600">{dept.averageOvertimePerCapita.toFixed(1)} ساعت</b>
              </span>
              <span>
                مانده اعتبار:{' '}
                <b className={dept.variance >= 0 ? 'text-emerald-600' : 'text-rose-600 font-bold'}>
                  {dept.variance.toLocaleString('fa-IR')} ریال
                </b>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
