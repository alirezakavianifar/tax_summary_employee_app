'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import * as authApi from '@/lib/api/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

export default function ChangePasswordPage() {
    const { user, updateUser, logout } = useAuth();
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const isForcedChange = user?.mustChangePassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!currentPassword) {
            setError('لطفاً رمز عبور فعلی خود را وارد فرمایید.');
            return;
        }

        if (newPassword.length < 6) {
            setError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
            return;
        }

        if (newPassword === currentPassword) {
            setError('رمز عبور جدید نمی‌تواند با رمز عبور فعلی یکسان باشد.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('رمز عبور جدید و تکرار آن یکسان نیستند.');
            return;
        }

        try {
            setIsLoading(true);
            await authApi.changePassword({
                currentPassword,
                newPassword,
            });

            setSuccessMessage('رمز عبور شما با موفقیت تغییر یافت. لطفاً با رمز جدید مجدداً وارد سامانه شوید.');
            
            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // If user state is available, update flag
            if (user) {
                updateUser({ ...user, mustChangePassword: false });
            }

            // Prompt relogin after 2 seconds
            setTimeout(async () => {
                await logout();
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'خطا در تغییر رمز عبور. لطفاً مجدداً تلاش کنید.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50/50 p-4 md:p-8" dir="rtl">
                <div className="max-w-md w-full">
                    {/* Header Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-r from-primary-50/50 via-white to-indigo-50/30">
                            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4 shadow-xs">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                                تغییر رمز عبور
                            </h1>
                            <p className="text-xs text-gray-500 mt-1.5">
                                بروزرسانی اطلاعات امنیتی ورود به سامانه جامع امور مالیاتی
                            </p>
                        </div>

                        {/* Forced Policy Banner */}
                        {isForcedChange && (
                            <div className="m-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-3">
                                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <span className="font-bold block mb-0.5">الزام تغییر رمز عبور اولیه:</span>
                                    حساب کاربری شما اخیراً توسط مدیر سیستم بازنشانی شده است. جهت حفظ حریم خصوصی و امنیت حساب سازمانی، تعیین رمز عبور جدید الزامی است.
                                </div>
                            </div>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
                            </div>
                        )}

                        {/* Success Alert */}
                        {successMessage && (
                            <div className="mx-6 mt-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5">
                                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="leading-relaxed">{successMessage}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                            {/* Current Password */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 text-right">
                                    رمز عبور فعلی
                                </label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    dir="ltr"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-hidden transition"
                                />
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 text-right">
                                    رمز عبور جدید (حداقل ۶ کاراکتر)
                                </label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    dir="ltr"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-hidden transition"
                                />
                            </div>

                            {/* Confirm New Password */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 text-right">
                                    تکرار رمز عبور جدید
                                </label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    dir="ltr"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-hidden transition"
                                />
                            </div>

                            {/* Password Visibility Toggle */}
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={showPasswords}
                                        onChange={(e) => setShowPasswords(e.target.checked)}
                                        className="w-3.5 h-3.5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                    />
                                    <span>نمایش نویسه‌های رمز عبور</span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex items-center justify-between gap-3">
                                {!isForcedChange ? (
                                    <Link
                                        href="/"
                                        className="px-4 py-2.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
                                    >
                                        بازگشت به سامانه
                                    </Link>
                                ) : <div />}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition shadow-xs flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading && (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                    تأیید و ذخیره رمز جدید
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
