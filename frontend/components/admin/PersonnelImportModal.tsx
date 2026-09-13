'use client';

import React, { useState, useRef } from 'react';
import {
    UploadCloud,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Users,
    Building2,
    ShieldCheck,
    Layers,
    Loader2,
    X,
    Key,
    RefreshCw,
    UserCheck,
    UserPlus
} from 'lucide-react';
import { usersApi, PersonnelImportPreview, PersonnelImportResult } from '@/lib/api/users';

interface PersonnelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PersonnelImportModal({ isOpen, onClose, onSuccess }: PersonnelImportModalProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');

    // Files
    const [baseFile, setBaseFile] = useState<File | null>(null);
    const [officeFile, setOfficeFile] = useState<File | null>(null);

    // Password Strategy
    const [passwordOption, setPasswordOption] = useState<'nationalId' | 'custom'>('nationalId');
    const [customPassword, setCustomPassword] = useState('Tax@1403');

    // States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<PersonnelImportPreview | null>(null);
    const [resultData, setResultData] = useState<PersonnelImportResult | null>(null);

    const baseInputRef = useRef<HTMLInputElement>(null);
    const officeInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleReset = () => {
        setStep('upload');
        setBaseFile(null);
        setOfficeFile(null);
        setPreviewData(null);
        setResultData(null);
        setError(null);
        setLoading(false);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handlePreview = async () => {
        if (!baseFile) {
            setError('لطفاً فایل پایه رفاهی پرسنل را انتخاب کنید.');
            return;
        }
        if (!officeFile) {
            setError('لطفاً فایل تخصیص اداره پرسنل را انتخاب کنید.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await usersApi.previewPersonnelImport(baseFile, officeFile);
            setPreviewData(data);
            setStep('preview');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'خطا در بارگذاری و اعتبارسنجی فایل‌های اکسل');
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!baseFile || !officeFile) return;

        try {
            setLoading(true);
            setError(null);
            const defaultPwd = passwordOption === 'custom' ? customPassword.trim() : undefined;
            const res = await usersApi.executePersonnelImport(baseFile, officeFile, defaultPwd);
            setResultData(res);
            setStep('result');
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'خطا در ثبت نهایی اطلاعات در پایگاه داده');
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'Admin':
                return { label: 'مدیر ارشد', class: 'bg-red-100 text-red-800 border-red-200' };
            case 'OfficeHead':
                return { label: 'رئیس اداره', class: 'bg-purple-100 text-purple-800 border-purple-200' };
            case 'GroupHead':
                return { label: 'رئیس گروه مالیاتی', class: 'bg-amber-100 text-amber-800 border-amber-200' };
            case 'Expert':
                return { label: 'کارشناس (ممیز)', class: 'bg-blue-100 text-blue-800 border-blue-200' };
            case 'ITSpecialist':
                return { label: 'کارشناس فناوری', class: 'bg-teal-100 text-teal-800 border-teal-200' };
            default:
                return { label: 'کارمند', class: 'bg-gray-100 text-gray-800 border-gray-200' };
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4" dir="rtl">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-300">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">همگام‌سازی و بارگذاری پرسنل و کاربران از اکسل</h2>
                            <p className="text-xs text-slate-300 mt-0.5">
                                تولید خودکار حساب کاربری، تطبیق ادارات و انتصاب نقش‌های سازمانی بر اساس احکام و رفاهی
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Stepper Indicator */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs font-medium text-slate-600">
                    <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-indigo-600 font-bold' : ''}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'upload' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>۱</span>
                        انتخاب فایل‌های اکسل
                    </div>
                    <div className="w-12 h-px bg-slate-300"></div>
                    <div className={`flex items-center gap-2 ${step === 'preview' ? 'text-indigo-600 font-bold' : ''}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'preview' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>۲</span>
                        پیش‌نمایش و اعتبارسنجی
                    </div>
                    <div className="w-12 h-px bg-slate-300"></div>
                    <div className={`flex items-center gap-2 ${step === 'result' ? 'text-emerald-600 font-bold' : ''}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'result' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>۳</span>
                        نتیجه نهایی
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div className="flex-1">{error}</div>
                    </div>
                )}

                {/* Modal Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Base Welfare File Dropzone */}
                                <div
                                    onClick={() => baseInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                                        baseFile ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        ref={baseInputRef}
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) setBaseFile(e.target.files[0]);
                                        }}
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                    />
                                    <div className={`p-3 rounded-full mb-3 ${baseFile ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        <FileSpreadsheet className="w-7 h-7" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">فایل اول: پایه رفاهی پرسنل</h4>
                                    <p className="text-xs text-slate-500 mb-3 max-w-[240px]">
                                        شامل شماره کارمند، نام کامل، کد ملی، نوع استخدام و پست سازمانی
                                    </p>
                                    {baseFile ? (
                                        <div className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            {baseFile.name}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-indigo-600 font-semibold hover:underline">
                                            انتخاب فایل (XLSX یا XLS)
                                        </span>
                                    )}
                                </div>

                                {/* Office Assignment File Dropzone */}
                                <div
                                    onClick={() => officeInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                                        officeFile ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        ref={officeInputRef}
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) setOfficeFile(e.target.files[0]);
                                        }}
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                    />
                                    <div className={`p-3 rounded-full mb-3 ${officeFile ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        <Building2 className="w-7 h-7" />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">فایل دوم: تخصیص اداره</h4>
                                    <p className="text-xs text-slate-500 mb-3 max-w-[240px]">
                                        شامل ستون شماره کارمند و نام/کد اداره یا واحد محل خدمت
                                    </p>
                                    {officeFile ? (
                                        <div className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            {officeFile.name}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-indigo-600 font-semibold hover:underline">
                                            انتخاب فایل (XLSX یا XLS)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Password Settings */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 font-bold text-slate-800 text-sm mb-3">
                                    <Key className="w-4 h-4 text-indigo-600" />
                                    <span>تنظیمات رمز عبور موقت برای کاربران جدید</span>
                                </div>
                                <div className="space-y-2.5 text-xs text-slate-700">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="passwordOption"
                                            value="nationalId"
                                            checked={passwordOption === 'nationalId'}
                                            onChange={() => setPasswordOption('nationalId')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>
                                            <strong>کد ملی هر کارمند</strong> به عنوان رمز عبور اولیه قرار گیرد (پیش‌فرض پیشنهادی).
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="passwordOption"
                                            value="custom"
                                            checked={passwordOption === 'custom'}
                                            onChange={() => setPasswordOption('custom')}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>استفاده از رمز عبور یکسان اولیه برای همه:</span>
                                    </label>
                                    {passwordOption === 'custom' && (
                                        <div className="mr-6 mt-2">
                                            <input
                                                type="text"
                                                value={customPassword}
                                                onChange={(e) => setCustomPassword(e.target.value)}
                                                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                                placeholder="مثلاً: Tax@1403"
                                            />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200">
                                    * کلیه کاربران جدید با الزام تغییر رمز در اولین ورود (<code className="bg-slate-200 px-1 py-0.5 rounded">MustChangePassword = true</code>) ثبت خواهند شد.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: PREVIEW */}
                    {step === 'preview' && previewData && (
                        <div className="space-y-6">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-center">
                                    <div className="text-xs text-indigo-700 font-medium">کل رکوردهای پایه</div>
                                    <div className="text-2xl font-bold text-indigo-900 mt-1">
                                        {previewData.totalBaseRecords.toLocaleString('fa-IR')}
                                    </div>
                                    <div className="text-[11px] text-indigo-600 mt-0.5">پرسنل شناسایی شده</div>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center">
                                    <div className="text-xs text-emerald-700 font-medium">تطبیق با اداره</div>
                                    <div className="text-2xl font-bold text-emerald-900 mt-1">
                                        {previewData.matchedRecords.toLocaleString('fa-IR')}
                                    </div>
                                    <div className="text-[11px] text-emerald-600 mt-0.5">
                                        {Math.round((previewData.matchedRecords / (previewData.totalBaseRecords || 1)) * 100)}٪ انطباق کامل
                                    </div>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-center">
                                    <div className="text-xs text-amber-700 font-medium">کاربران جدید</div>
                                    <div className="text-2xl font-bold text-amber-900 mt-1">
                                        {previewData.newUsersCount.toLocaleString('fa-IR')}
                                    </div>
                                    <div className="text-[11px] text-amber-600 mt-0.5">
                                        {previewData.updatedUsersCount > 0 ? `${previewData.updatedUsersCount} بروزرسانی` : 'بدون تداخل'}
                                    </div>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 text-center">
                                    <div className="text-xs text-purple-700 font-medium">ادارات تطبیقی</div>
                                    <div className="text-2xl font-bold text-purple-900 mt-1">
                                        {previewData.existingOfficesCount + previewData.newOfficesCount}
                                    </div>
                                    <div className="text-[11px] text-purple-600 mt-0.5">
                                        {previewData.newOfficesCount > 0 ? `${previewData.newOfficesCount} اداره جدید` : 'موجود در سیستم'}
                                    </div>
                                </div>
                            </div>

                            {/* Inferred Roles Breakdown */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                    توزیع نقش‌های سازمانی تشخیص داده شده از روی پست:
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(previewData.roleBreakdown).map(([role, count]) => {
                                        const badge = getRoleBadge(role);
                                        return (
                                            <span
                                                key={role}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${badge.class}`}
                                            >
                                                <span>{badge.label}:</span>
                                                <span className="font-bold font-mono">{count.toLocaleString('fa-IR')} نفر</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Warnings */}
                            {previewData.warnings.length > 0 && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                                    {previewData.warnings.map((w, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                            <span>{w}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Sample Preview Table */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                                    <span>پیش‌نمایش نمایه چند رکورد اول ({previewData.samplePreview.length} رکورد):</span>
                                    <span className="text-[11px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">نام کاربری = کد ملی (۱۰ رقمی)</span>
                                </h4>
                                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm max-h-60">
                                    <table className="min-w-full divide-y divide-slate-200 text-xs text-right">
                                        <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2.5">نام کاربری (کد ملی)</th>
                                                <th className="px-3 py-2.5">شماره کارمند</th>
                                                <th className="px-3 py-2.5">نام و نام خانوادگی</th>
                                                <th className="px-3 py-2.5">پست سازمانی</th>
                                                <th className="px-3 py-2.5">نقش سیستمی</th>
                                                <th className="px-3 py-2.5">اداره تخصیصی</th>
                                                <th className="px-3 py-2.5 text-center">وضعیت حساب</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {previewData.samplePreview.map((item, idx) => {
                                                const badge = getRoleBadge(item.assignedRole);
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50">
                                                        <td className="px-3 py-2 font-mono font-bold text-indigo-900">{item.nationalId}</td>
                                                        <td className="px-3 py-2 font-mono font-semibold text-slate-700">{item.personnelNumber}</td>
                                                        <td className="px-3 py-2 font-medium text-slate-800">{item.fullName}</td>
                                                        <td className="px-3 py-2 text-slate-600">{item.position || '-'}</td>
                                                        <td className="px-3 py-2">
                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.class}`}>
                                                                {badge.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-700 font-medium">{item.officeName}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            {item.isExistingUser ? (
                                                                <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                                    بروزرسانی
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                    کاربر جدید
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: RESULT */}
                    {step === 'result' && resultData && (
                        <div className="space-y-6 text-center py-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-in zoom-in-75">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">همگام‌سازی با موفقیت تکمیل شد!</h3>
                                <p className="text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                                    {resultData.message}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-center">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <div className="text-xs text-slate-500">کاربران ایجاد شده</div>
                                    <div className="text-xl font-bold text-emerald-600 mt-1">
                                        {resultData.usersCreated.toLocaleString('fa-IR')}
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <div className="text-xs text-slate-500">کارمندان ثبت شده</div>
                                    <div className="text-xl font-bold text-slate-800 mt-1">
                                        {resultData.employeesCreated.toLocaleString('fa-IR')}
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <div className="text-xs text-slate-500">اتصال به اداره</div>
                                    <div className="text-xl font-bold text-indigo-600 mt-1">
                                        {resultData.userOfficesLinked.toLocaleString('fa-IR')}
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <div className="text-xs text-slate-500">ادارات ایجاد شده</div>
                                    <div className="text-xl font-bold text-purple-600 mt-1">
                                        {resultData.officesCreated.toLocaleString('fa-IR')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                    {step === 'upload' && (
                        <>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                disabled={!baseFile || !officeFile || loading}
                                onClick={handlePreview}
                                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        در حال اعتبارسنجی فایل‌ها...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        بررسی و پیش‌نمایش اطلاعات
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === 'preview' && (
                        <>
                            <button
                                type="button"
                                onClick={() => setStep('upload')}
                                disabled={loading}
                                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition"
                            >
                                بازگشت و تغییر فایل‌ها
                            </button>
                            <button
                                type="button"
                                disabled={loading}
                                onClick={handleExecute}
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        در حال ثبت اطلاعات و ایجاد حساب‌ها...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        تایید و اعمال نهایی در سامانه
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === 'result' && (
                        <div className="w-full flex justify-end">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
                            >
                                بستن و مشاهده لیست کاربران
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
