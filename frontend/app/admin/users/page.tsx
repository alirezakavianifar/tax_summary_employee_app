'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usersApi } from '@/lib/api/users';
import { reportsApi } from '@/lib/api/reports';
import { EmployeeDto } from '@/lib/api/types';
import { User, UserRole } from '@/types/auth';
import ProtectedRoute from '@/components/ProtectedRoute';

const getRoleBadge = (role: string) => {
    switch (role) {
        case 'Admin':
            return {
                label: 'مدیر ارشد (Admin)',
                className: 'bg-red-100 text-red-800 border border-red-200'
            };
        case 'OfficeHead':
            return {
                label: 'رئیس اداره',
                className: 'bg-purple-100 text-purple-800 border border-purple-200'
            };
        case 'GroupHead':
            return {
                label: 'رئیس گروه مالیاتی',
                className: 'bg-amber-100 text-amber-800 border border-amber-200'
            };
        case 'Expert':
            return {
                label: 'کارشناس (ممیز)',
                className: 'bg-blue-100 text-blue-800 border border-blue-200'
            };
        case 'ITSpecialist':
            return {
                label: 'کارشناس فناوری',
                className: 'bg-teal-100 text-teal-800 border border-teal-200'
            };
        case 'Manager':
            return {
                label: 'مدیر (Manager)',
                className: 'bg-amber-100 text-amber-800 border border-amber-200'
            };
        default:
            return {
                label: 'کارمند (Employee)',
                className: 'bg-gray-100 text-gray-800 border border-gray-200'
            };
    }
};

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit User Modal State
    const [editModalUser, setEditModalUser] = useState<User | null>(null);
    const [editUsername, setEditUsername] = useState('');
    const [editRole, setEditRole] = useState<UserRole>('Expert');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editEmployeeId, setEditEmployeeId] = useState('');
    const [employees, setEmployees] = useState<EmployeeDto[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    // Reset Password Modal State
    const [resetModalUser, setResetModalUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Delete User Modal State
    const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);

    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const data = await reportsApi.getAllEmployees();
            setEmployees(data || []);
        } catch (err) {
            console.error('Failed to load employees', err);
        } finally {
            setLoadingEmployees(false);
        }
    };

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

    const handleOpenEditModal = (user: User) => {
        setEditModalUser(user);
        setEditUsername(user.username);
        setEditRole(user.role as UserRole);
        setEditIsActive(user.isActive);
        setEditEmployeeId(user.employeeId || '');
        setActionError(null);
    };

    const handleCloseEditModal = () => {
        setEditModalUser(null);
        setActionError(null);
    };

    const handleEditEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const empId = e.target.value;
        setEditEmployeeId(empId);
        if (empId) {
            const selectedEmp = employees.find(emp => emp.id === empId);
            if (selectedEmp?.nationalId) {
                setEditUsername(selectedEmp.nationalId);
            }
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModalUser) return;

        if (!editUsername.trim()) {
            setActionError('نام کاربری (کد ملی) الزامی است');
            return;
        }

        try {
            setActionLoading(true);
            setActionError(null);
            await usersApi.updateUser(editModalUser.id, {
                username: editUsername.trim(),
                role: editRole,
                isActive: editIsActive,
                employeeId: editEmployeeId || undefined,
            });
            setActionSuccess(`مشخصات کاربر «${editUsername.trim()}» با موفقیت بروزرسانی شد.`);
            handleCloseEditModal();
            await loadUsers();
        } catch (err: any) {
            setActionError(err.response?.data?.error || err.message || 'خطا در بروزرسانی مشخصات کاربر');
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenDeleteModal = (user: User) => {
        setDeleteModalUser(user);
        setActionError(null);
    };

    const handleCloseDeleteModal = () => {
        setDeleteModalUser(null);
        setActionError(null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteModalUser) return;

        try {
            setActionLoading(true);
            setActionError(null);
            await usersApi.deleteUser(deleteModalUser.id);
            setUsers(users.filter(u => u.id !== deleteModalUser.id));
            setActionSuccess(`کاربر «${deleteModalUser.username}» با موفقیت حذف شد.`);
            handleCloseDeleteModal();
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
                                            نام کاربری (کد ملی)
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
                                                    {(() => {
                                                        const badge = getRoleBadge(user.role);
                                                        return (
                                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badge.className}`}>
                                                                {badge.label}
                                                            </span>
                                                        );
                                                    })()}
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
                                                    <div className="flex items-center justify-center gap-2.5">
                                                        {/* Edit User Button */}
                                                        <button
                                                            onClick={() => handleOpenEditModal(user)}
                                                            disabled={actionLoading}
                                                            className="inline-flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md border border-indigo-200 transition"
                                                            title="ویرایش مشخصات، نقش و انتصاب کارمند"
                                                        >
                                                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            ویرایش
                                                        </button>

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
                                                            onClick={() => handleOpenDeleteModal(user)}
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
                                <div><span className="font-semibold text-gray-700">نقش کاربری:</span> {getRoleBadge(resetModalUser.role).label}</div>
                            </div>

                            {actionError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                                    {actionError}
                                </div>
                            )}

                            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-semibold text-gray-700">
                                            رمز عبور جدید (حداقل ۶ کاراکتر)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewPassword(resetModalUser.username);
                                                setConfirmPassword(resetModalUser.username);
                                            }}
                                            className="text-[11px] font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                        >
                                            تنظیم بر روی کد ملی ({resetModalUser.username})
                                        </button>
                                    </div>
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

                {/* Edit User Modal */}
                {editModalUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        ویرایش مشخصات و دسترسی کاربر
                                    </h3>
                                </div>
                                <button
                                    onClick={handleCloseEditModal}
                                    className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            {actionError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{actionError}</span>
                                </div>
                            )}

                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                {/* Username (National ID) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                        نام کاربری (کد ملی ۱۰ رقمی) *
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={editUsername}
                                        maxLength={10}
                                        onChange={(e) => setEditUsername(e.target.value)}
                                        placeholder="0012345678"
                                        required
                                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-hidden transition font-mono"
                                    />
                                    <p className="mt-1 text-[11px] text-gray-500">
                                        کد ملی پرسنل به عنوان شناسه ورود به سامانه تعیین می‌گردد.
                                    </p>
                                </div>

                                {/* Organizational Role */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                        نقش و جایگاه سازمانی *
                                    </label>
                                    <select
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                                        className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="Expert">کارشناس (ممیز مالیاتی)</option>
                                        <option value="GroupHead">رئیس گروه مالیاتی</option>
                                        <option value="OfficeHead">رئیس اداره امور مالیاتی</option>
                                        <option value="ITSpecialist">کارشناس فناوری اطلاعات</option>
                                        <option value="Admin">مدیر ارشد سامانه (Admin)</option>
                                    </select>
                                    <p className="mt-1 text-[11px] text-gray-500">
                                        دسترسی این کاربر در منوهای سامانه بر اساس این نقش اعمال خواهد شد.
                                    </p>
                                </div>

                                {/* Associated Employee */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                                        انتساب به کارمند سازمانی (اختیاری)
                                    </label>
                                    <select
                                        value={editEmployeeId}
                                        onChange={handleEditEmployeeChange}
                                        disabled={loadingEmployees}
                                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">-- بدون انتساب کارمند --</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.firstName} {emp.lastName} (پرسنلی: {emp.personnelNumber}{emp.nationalId ? ` | کد ملی: ${emp.nationalId}` : ''})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-[11px] text-gray-500">
                                        با انتخاب کارمند، کاربر به پرونده پرسنلی و سوابق وی متصل می‌گردد.
                                    </p>
                                </div>

                                {/* Account Status Checkbox */}
                                <div className="pt-1">
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editIsActive}
                                            onChange={(e) => setEditIsActive(e.target.checked)}
                                            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                        />
                                        <span className="text-xs font-bold text-gray-800">
                                            حساب کاربری فعال است
                                        </span>
                                    </label>
                                    <p className="text-[11px] text-gray-500 mr-6">
                                        در صورت غیرفعال بودن، کاربر امکان ورود به سیستم را نخواهد داشت.
                                    </p>
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-2.5">
                                    <button
                                        type="button"
                                        onClick={handleCloseEditModal}
                                        disabled={actionLoading}
                                        className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs flex items-center gap-1.5"
                                    >
                                        {actionLoading && (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        )}
                                        ذخیره تغییرات کاربر
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteModalUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                            {/* Modal Header Icon */}
                            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-inner">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>

                            <h3 className="text-center text-lg font-black text-gray-900 mb-1">
                                حذف حساب کاربری
                            </h3>
                            <p className="text-center text-xs text-gray-500 mb-5">
                                آیا از حذف این حساب کاربری از سامانه اطمینان دارید؟
                            </p>

                            {/* User Summary Card */}
                            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 mb-4 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 font-medium">نام کاربری (کد ملی):</span>
                                    <span className="font-bold text-gray-900 font-mono text-sm">{deleteModalUser.username}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500 font-medium">نقش سازمانی:</span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getRoleBadge(deleteModalUser.role).className}`}>
                                        {getRoleBadge(deleteModalUser.role).label}
                                    </span>
                                </div>
                                {deleteModalUser.employee && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500 font-medium">کارمند متصل:</span>
                                        <span className="font-semibold text-gray-800">
                                            {deleteModalUser.employee.firstName} {deleteModalUser.employee.lastName}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Warning Message */}
                            <div className="bg-red-50/80 border border-red-200/80 rounded-xl p-3 mb-5 flex items-start gap-2.5 text-right">
                                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-[11px] text-red-700 leading-relaxed">
                                    <strong>توجه:</strong> این عملیات غیرقابل بازگشت است. با حذف کاربر، دسترسی وی به سامانه مسدود و تمام نشست‌های فعال وی باطل خواهند شد.
                                </p>
                            </div>

                            {actionError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                                    {actionError}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseDeleteModal}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={actionLoading}
                                    className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-xs flex items-center gap-2 disabled:opacity-50"
                                >
                                    {actionLoading && (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <span>تایید و حذف کاربر</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
