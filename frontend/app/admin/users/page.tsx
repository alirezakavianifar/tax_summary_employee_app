'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usersApi } from '@/lib/api/users';
import { User } from '@/types/auth';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Reset Password Modal State
    const [resetModalUser, setResetModalUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await usersApi.getUsers();
            setUsers(data);
        } catch (err: any) {
            setError(err.message || 'خطا در دریافت لیست کاربران');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, username: string) => {
        if (!confirm(`آیا از حذف کاربر «${username}» اطمینان دارید؟`)) return;

        try {
            setActionLoading(true);
            await usersApi.deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
            setActionSuccess(`کاربر «${username}» با موفقیت حذف شد.`);
        } catch (err: any) {
            setActionError(err.response?.data?.error || err.message || 'خطا در حذف کاربر');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnlock = async (user: User) => {
        try {
            setActionLoading(true);
            setActionError(null);
            await usersApi.unlockUser(user.id);
            setActionSuccess(`قفل حساب کاربری «${user.username}» با موفقیت باز شد.`);
            await loadUsers();
        } catch (err: any) {
            setActionError(err.response?.data?.error || err.message || 'خطا در باز کردن قفل حساب');
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenResetModal = (user: User) => {
        setResetModalUser(user);
        setNewPassword('');
        setConfirmPassword('');
        setActionError(null);
    };

    const handleCloseResetModal = () => {
        setResetModalUser(null);
        setNewPassword('');
        setConfirmPassword('');
        setActionError(null);
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetModalUser) return;

        if (!newPassword || newPassword.length < 6) {
            setActionError('رمز عبور باید حداقل ۶ کاراکتر باشد');
            return;
        }

        if (newPassword !== confirmPassword) {
            setActionError('رمز عبور و تکرار آن یکسان نیستند');
            return;
        }

        try {
            setActionLoading(true);
            setActionError(null);
            await usersApi.resetPassword(resetModalUser.id, newPassword);
            setActionSuccess(`رمز عبور کاربر «${resetModalUser.username}» با موفقیت بازنشانی شد.`);
            handleCloseResetModal();
            await loadUsers();
        } catch (err: any) {
            setActionError(err.response?.data?.error || err.message || 'خطا در بازنشانی رمز عبور');
        } finally {
            setActionLoading(false);
        }
    };

    const isAccountLocked = (user: User) => {
        return !!(user.lockoutEnd && new Date(user.lockoutEnd) > new Date());
    };

    if (loading) {
        return (
            <ProtectedRoute requiredRoles={['Admin']}>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requiredRoles={['Admin']}>
            <div className="min-h-screen bg-gray-50 p-6 md:p-8" dir="rtl">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">مدیریت کاربران</h1>
                            <p className="text-sm text-gray-500 mt-1">مدیریت حساب‌های کاربری، سطوح دسترسی و بازنشانی رمز عبور</p>
                        </div>
                        <Link
                            href="/admin/users/create"
                            className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition shadow-sm font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            افزودن کاربر جدید
                        </Link>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                        </div>
                    )}

                    {actionSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-lg mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{actionSuccess}</span>
                            </div>
                            <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700 text-sm">✕</button>
                        </div>
                    )}

                    {actionError && !resetModalUser && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{actionError}</span>
                            </div>
                            <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                        </div>
                    )}

                    {/* Users Table */}
                    <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            نام کاربری
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            ایمیل
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            نقش
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            کارمند مرتبط
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            وضعیت حساب
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            عملیات امنیتی و مدیریتی
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => {
                                        const locked = isAccountLocked(user);
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50/70 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">{user.username}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500" dir="ltr">{user.email || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        user.role === 'Admin' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                        user.role === 'Manager' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                        'bg-blue-100 text-blue-800 border border-blue-200'
                                                    }`}>
                                                        {user.role === 'Admin' ? 'مدیر ارشد (Admin)' :
                                                         user.role === 'Manager' ? 'مدیر (Manager)' :
                                                         'کارمند (Employee)'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                                                            user.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
                                                        }`}>
                                                            {user.isActive ? 'فعال' : 'غیرفعال'}
                                                        </span>
                                                        {locked && (
                                                            <span className="px-2 py-0.5 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                                                <svg className="w-3 h-3 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                </svg>
                                                                قفل موقت
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex items-center justify-center gap-3">
                                                        {/* Reset Password Button */}
                                                        <button
                                                            onClick={() => handleOpenResetModal(user)}
                                                            className="inline-flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-md border border-sky-200 transition"
                                                            title="بازنشانی رمز عبور"
                                                        >
                                                            <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                            </svg>
                                                            بازنشانی رمز
                                                        </button>

                                                        {/* Unlock Button if Locked */}
                                                        {locked && (
                                                            <button
                                                                onClick={() => handleUnlock(user)}
                                                                disabled={actionLoading}
                                                                className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-md border border-amber-200 transition"
                                                                title="رفع قفل حساب کاربری"
                                                            >
                                                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                                </svg>
                                                                رفع قفل
                                                            </button>
                                                        )}

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={() => handleDelete(user.id, user.username)}
                                                            disabled={actionLoading}
                                                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md border border-red-200 transition"
                                                            title="حذف کاربر"
                                                        >
                                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            حذف
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Reset Password Modal */}
                {resetModalUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        بازنشانی رمز عبور
                                    </h3>
                                </div>
                                <button
                                    onClick={handleCloseResetModal}
                                    className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mb-4 bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1">
                                <div><span className="font-semibold text-gray-700">نام کاربری:</span> {resetModalUser.username}</div>
                                <div><span className="font-semibold text-gray-700">نقش کاربری:</span> {resetModalUser.role}</div>
                                {resetModalUser.email && <div><span className="font-semibold text-gray-700">ایمیل:</span> {resetModalUser.email}</div>}
                            </div>

                            {actionError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                                    {actionError}
                                </div>
                            )}

                            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        رمز عبور جدید (حداقل ۶ کاراکتر)
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        dir="ltr"
                                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-hidden transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                        تکرار رمز عبور جدید
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        dir="ltr"
                                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-hidden transition"
                                    />
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={handleCloseResetModal}
                                        disabled={actionLoading}
                                        className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="px-4 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
                                    >
                                        {actionLoading && (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                        ثبت رمز عبور جدید
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
