'use client'

import { useState, useRef, type RefObject } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  payrollApi,
  PROCESS_TYPE_LABELS,
  type PayrollProcessResultDto,
  type PayrollDetailRowDto,
  type PayrollGroupedRowDto,
} from '@/lib/api/payroll'
import { Upload, Download, Save, Loader2, FileSpreadsheet } from 'lucide-react'

const PROCESS_TYPES = [
  { value: 'OvertimeWelfareRated', label: 'ادغام و محاسبه اضافه کار و رفاهی' },
  { value: 'OvertimeWelfareMonetary', label: 'اضافه کار و رفاهی مبلغی' },
  { value: 'HalfPercentBonus', label: 'پردازش نیم درصد و تجمیع پاداش' },
]

function FileInput({
  label,
  name,
  fileRef,
}: {
  label: string
  name: string
  fileRef: RefObject<HTMLInputElement | null>
}) {
  const [fileName, setFileName] = useState<string | null>(null)
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div
        className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-500 truncate">
          {fileName ?? 'انتخاب فایل Excel'}
        </span>
        <input
          ref={fileRef as RefObject<HTMLInputElement>}
          type="file"
          name={name}
          accept=".xls,.xlsx"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </div>
    </div>
  )
}

function formatNumber(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('fa-IR')
}

function DetailTable({ rows, processType }: { rows: PayrollDetailRowDto[]; processType: string }) {
  const isBonus = processType === 'HalfPercentBonus'
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-primary-50">
            <th className="border border-gray-200 px-3 py-2 text-right">شماره کارمند</th>
            <th className="border border-gray-200 px-3 py-2 text-right">نام کارمند</th>
            <th className="border border-gray-200 px-3 py-2 text-right">اداره</th>
            {!isBonus && <th className="border border-gray-200 px-3 py-2 text-right">نرخ اضافه کار</th>}
            {!isBonus && <th className="border border-gray-200 px-3 py-2 text-right">نرخ رفاهی</th>}
            {!isBonus && <th className="border border-gray-200 px-3 py-2 text-right">سرانه اضافه کار</th>}
            {!isBonus && <th className="border border-gray-200 px-3 py-2 text-right">سرانه رفاهی</th>}
            {processType === 'OvertimeWelfareRated' && (
              <>
                <th className="border border-gray-200 px-3 py-2 text-right">مبلغ اضافه کار</th>
                <th className="border border-gray-200 px-3 py-2 text-right">مبلغ رفاهی</th>
              </>
            )}
            {isBonus && <th className="border border-gray-200 px-3 py-2 text-right">سرانه پاداش</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-200 px-3 py-1.5">{row.personnelNumber}</td>
              <td className="border border-gray-200 px-3 py-1.5">{row.employeeName}</td>
              <td className="border border-gray-200 px-3 py-1.5">{row.department}</td>
              {!isBonus && <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.overtimeRate)}</td>}
              {!isBonus && <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.welfareRate)}</td>}
              {!isBonus && <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.baseOvertimeAmount)}</td>}
              {!isBonus && <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.baseWelfareAmount)}</td>}
              {processType === 'OvertimeWelfareRated' && (
                <>
                  <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.calculatedOvertimeAmount)}</td>
                  <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.calculatedWelfareAmount)}</td>
                </>
              )}
              {isBonus && <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.baseBonusAmount)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GroupedTable({ rows, processType }: { rows: PayrollGroupedRowDto[]; processType: string }) {
  const isBonus = processType === 'HalfPercentBonus'
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-primary-50">
            <th className="border border-gray-200 px-3 py-2 text-right">اداره</th>
            <th className="border border-gray-200 px-3 py-2 text-right">تعداد</th>
            {!isBonus && <th className="border border-gray-200 px-3 py-2 text-right">سرانه اضافه کار</th>}
            {!isBonus && <th className="border border-gray-200 px-3 py-2 text-right">جمع سرانه اضافه کار</th>}
            {!isBonus && <th className="border border-gray-200 px-3 py-2 text-right">سرانه رفاهی</th>}
            {!isBonus && <th className="border border-gray-200 px-3 py-2 text-right">جمع سرانه رفاهی</th>}
            {processType === 'OvertimeWelfareRated' && (
              <>
                <th className="border border-gray-200 px-3 py-2 text-right">جمع مبلغ اضافه کار</th>
                <th className="border border-gray-200 px-3 py-2 text-right">جمع مبلغ رفاهی</th>
              </>
            )}
            {isBonus && <th className="border border-gray-200 px-3 py-2 text-right">سرانه پاداش اختصاصی</th>}
            {isBonus && <th className="border border-gray-200 px-3 py-2 text-right">جمع سرانه پاداش</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-200 px-3 py-1.5">{row.department}</td>
              <td className="border border-gray-200 px-3 py-1.5 text-left">{row.employeeCount}</td>
              {!isBonus && <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.baseOvertimePerPerson)}</td>}
              {!isBonus && <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.baseOvertimeSum)}</td>}
              {!isBonus && <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.baseWelfarePerPerson)}</td>}
              {!isBonus && <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.baseWelfareSum)}</td>}
              {processType === 'OvertimeWelfareRated' && (
                <>
                  <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.totalOvertimeAmount)}</td>
                  <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.totalWelfareAmount)}</td>
                </>
              )}
              {isBonus && <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.bonusPerPerson)}</td>}
              {isBonus && <td className="border border-gray-200 px-3 py-1.5 text-left">{formatNumber(row.totalBonusSum)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PayrollPage() {
  const [processType, setProcessType] = useState<string>('OvertimeWelfareRated')
  const [processing, setProcessing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<PayrollProcessResultDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveLabel, setSaveLabel] = useState('')
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const ezafeRef = useRef<HTMLInputElement>(null)
  const refahiRef = useRef<HTMLInputElement>(null)
  const nimRef = useRef<HTMLInputElement>(null)
  const coefficientsRef = useRef<HTMLInputElement>(null)
  const deptMappingRef = useRef<HTMLInputElement>(null)

  const isBonus = processType === 'HalfPercentBonus'

  const handleProcess = async () => {
    setError(null)
    setResult(null)
    setSaveSuccess(null)

    const formData = new FormData()
    formData.append('processType', processType)

    if (isBonus) {
      if (!nimRef.current?.files?.[0] || !coefficientsRef.current?.files?.[0] || !deptMappingRef.current?.files?.[0]) {
        setError('لطفاً فایل‌های nim، coefficients و deptMapping را انتخاب کنید')
        return
      }
      formData.append('nim', nimRef.current.files[0])
      formData.append('coefficients', coefficientsRef.current.files[0])
      formData.append('deptMapping', deptMappingRef.current.files[0])
    } else {
      if (!ezafeRef.current?.files?.[0] || !refahiRef.current?.files?.[0] ||
          !coefficientsRef.current?.files?.[0] || !deptMappingRef.current?.files?.[0]) {
        setError('لطفاً همه فایل‌ها را انتخاب کنید')
        return
      }
      formData.append('ezafe', ezafeRef.current.files[0])
      formData.append('refahi', refahiRef.current.files[0])
      formData.append('coefficients', coefficientsRef.current.files[0])
      formData.append('deptMapping', deptMappingRef.current.files[0])
    }

    setProcessing(true)
    try {
      const data = await payrollApi.processPayroll(formData)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در پردازش فایل‌ها')
    } finally {
      setProcessing(false)
    }
  }

  const handleExport = async () => {
    if (!result) return
    setExporting(true)
    try {
      const blob = await payrollApi.exportPayroll(result)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payroll_${result.processType}_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در دانلود فایل Excel')
    } finally {
      setExporting(false)
    }
  }

  const handleSave = async () => {
    if (!result || !saveLabel.trim()) return
    setSaving(true)
    setError(null)
    try {
      const summary = await payrollApi.saveRun({
        processType: result.processType,
        runLabel: saveLabel.trim(),
        result,
      })
      setSaveSuccess(`اجرا با موفقیت ذخیره شد (${summary.id})`)
      setSaveLabel('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ذخیره اجرا')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <div dir="rtl" className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <FileSpreadsheet className="w-7 h-7 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">محاسبات حقوقی</h1>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">تنظیمات پردازش</h2>

            {/* Process type selector */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع فرآیند
              </label>
              <select
                value={processType}
                onChange={(e) => { setProcessType(e.target.value); setResult(null); setError(null) }}
                className="w-full sm:w-96 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PROCESS_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>

            {/* File inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {isBonus ? (
                <>
                  <FileInput label="فایل نیم درصد (nim)" name="nim" fileRef={nimRef} />
                  <FileInput label="فایل ضرایب مدیر (coefficients)" name="coefficients" fileRef={coefficientsRef} />
                  <FileInput label="فایل نفر-اداره (deptMapping)" name="deptMapping" fileRef={deptMappingRef} />
                </>
              ) : (
                <>
                  <FileInput label="فایل اضافه کار (ezafe)" name="ezafe" fileRef={ezafeRef} />
                  <FileInput label="فایل رفاهی (refahi)" name="refahi" fileRef={refahiRef} />
                  <FileInput label="فایل ضرایب مدیر (coefficients)" name="coefficients" fileRef={coefficientsRef} />
                  <FileInput label="فایل نفر-اداره (deptMapping)" name="deptMapping" fileRef={deptMappingRef} />
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={processing}
              className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              پردازش
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Action buttons */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  دانلود اکسل
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={saveLabel}
                    onChange={(e) => setSaveLabel(e.target.value)}
                    placeholder="برچسب برای ذخیره..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving || !saveLabel.trim()}
                    className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    ذخیره
                  </button>
                </div>

                {saveSuccess && (
                  <span className="text-green-600 text-sm">{saveSuccess}</span>
                )}
              </div>

              {/* Detail table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  جدول جزئیات ({result.detailRows.length} ردیف)
                </h2>
                <DetailTable rows={result.detailRows} processType={result.processType} />
              </div>

              {/* Grouped table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">جدول گروه‌بندی‌شده</h2>
                <GroupedTable rows={result.groupedRows} processType={result.processType} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
