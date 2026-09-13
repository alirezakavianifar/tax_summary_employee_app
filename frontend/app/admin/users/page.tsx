'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usersApi } from '@/lib/api/users';
import { reportsApi } from '@/lib/api/reports';
import { officesApi } from '@/lib/api/offices';
import { EmployeeDto, OfficeDto } from '@/lib/api/types';
import { User, UserRole } from '@/types/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Building2, Search, CheckSquare, Square, X, FileSpreadsheet, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, Loader2, RotateCcw } from 'lucide-react';
import PersonnelImportModal from '@/components/admin/PersonnelImportModal';

const getPaginationItems = (currentPage: number, total: number) => {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const items: (number | string)[] = [1];
    if (currentPage > 3) {
        items.push('ellipsis-start');
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(total - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
        items.push(i);
    }
    if (currentPage < total - 2) {
        items.push('ellipsis-end');
    }
    items.push(total);
    return items;
};

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
    const [tableLoading, setTableLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);

    // Search and Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Edit User Modal State
    const [editModalUser, setEditModalUser] = useState<User | null>(null);
    const [editUsername, setEditUsername] = useState('');
    const [editRole, setEditRole] = useState<UserRole>('Expert');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editEmployeeId, setEditEmployeeId] = useState('');
    const [employees, setEmployees] = useState<EmployeeDto[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [offices, setOffices] = useState<OfficeDto[]>([]);
    const [loadingOffices, setLoadingOffices] = useState(false);
    const [editSelectedOfficeIds, setEditSelectedOfficeIds] = useState<string[]>([]);
    const [editOfficeSearch, setEditOfficeSearch] = useState('');

    const filteredEditOffices = offices.filter(
        o =>
            o.code.toLowerCase().includes(editOfficeSearch.toLowerCase()) ||
            o.name.toLowerCase().includes(editOfficeSearch.toLowerCase())
    );

    // Reset Password Modal State
    const [resetModalUser, setResetModalUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Delete User Modal State
    const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);

    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

    // Debounce search input to avoid overwhelming the server and UI
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm !== debouncedSearch) {
                setDebouncedSearch(searchTerm);
                setPage(1);
            }
        }, 350);
        return () => clearTimeout(handler);
    }, [searchTerm, debouncedSearch]);

    // Fetch users whenever page, pageSize, search, or role changes
    useEffect(() => {
        loadUsers(page, pageSize, debouncedSearch, selectedRole);
    }, [page, pageSize, debouncedSearch, selectedRole]);

    useEffect(() => {
        loadEmployees();
        loadOffices();
    }, []);

    const loadOffices = async () => {
        try {
            setLoadingOffices(true);
            const data = await officesApi.getAll();
            setOffices(data || []);
        } catch (err) {
            console.error('Failed to load offices', err);
        } finally {
            setLoadingOffices(false);
        }
    };

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

    const loadUsers = async (
        currentPage = page,
        currentPageSize = pageSize,
        currentSearch = debouncedSearch,
        currentRole = selectedRole
    ) => {
        try {
            setTableLoading(true);
            const data = await usersApi.getUsersPaged({
                search: currentSearch.trim() || undefined,
                role: currentRole || undefined,
                page: currentPage,
                pageSize: currentPageSize,
            });
            setUsers(data.items || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 1);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'خطا در دریافت لیست کاربران');
        } finally {
            setLoading(false);
            setTableLoading(false);
        }
    };

    const handleOpenEditModal = (user: User) => {
        setEditModalUser(user);
        setEditUsername(user.username);
        setEditRole(user.role as UserRole);
        setEditIsActive(user.isActive);
        setEditEmployeeId(user.employeeId || '');
        setEditSelectedOfficeIds(user.assignedOffices?.map(o => o.id) || []);
        setEditOfficeSearch('');
        setActionError(null);
    };

    const handleCloseEditModal = () => {
        setEditModalUser(null);
        setEditSelectedOfficeIds([]);
        setEditOfficeSearch('');
        setActionError(null);
    };

    const toggleEditOffice = (officeId: string) => {
        setEditSelectedOfficeIds(prev =>
            prev.includes(officeId) ? prev.filter(id => id !== officeId) : [...prev, officeId]
        );
    };

    const handleSelectAllEditOffices = () => {
        setEditSelectedOfficeIds(offices.map(o => o.id));
    };

    const handleClearAllEditOffices = () => {
        setEditSelectedOfficeIds([]);
    };

    const handleEditEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const empId = e.target.value;
        setEditEmployeeId(empId);
        if (empId) {
            const selectedEmp = employees.find(emp => emp.id === empId);
            if (selectedEmp?.nationalId) {
                setEditUsername(selectedEmp.nationalId);
            }
            if (selectedEmp?.serviceUnit && offices.length > 0) {
                const normUnit = selectedEmp.serviceUnit.trim().toLowerCase();
                const matched = offices.find(
                    o => o.code.toLowerCase() === normUnit || o.name.toLowerCase().includes(normUnit)
                );
                if (matched && !editSelectedOfficeIds.includes(matched.id)) {
                    setEditSelectedOfficeIds(prev => [...prev, matched.id]);
                }
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
                officeIds: editRole === 'Admin' ? [] : editSelectedOfficeIds,
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
            setActionSuccess(`کاربر «${deleteModalUser.username}» با موفقیت حذف شد.`);
            handleCloseDeleteModal();
            await loadUsers();
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
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowImportModal(true)}
                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg transition shadow-sm font-medium text-sm"
                            >
                                <FileSpreadsheet className="w-5 h-5" />
                                همگام‌سازی از اکسل
                            </button>
                            <Link
                                href="/admin/users/create"
                                className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition shadow-sm font-medium text-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                افزودن کاربر جدید
                            </Link>
                        </div>
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

                    {/* Search & Filter Bar */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                            {/* Search Input */}
                            <div className="relative flex-1 max-w-md">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                    {tableLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="جستجو با کد ملی، شماره کارمند، نام، سمت یا نام اداره..."
                                    className="w-full pr-9 pl-8 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-gray-50/50 focus:bg-white"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 hover:text-gray-600 text-xs"
                                        title="پاک کردن جستجو"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Role Filter */}
                            <div className="w-full sm:w-48">
                                <select
                                    value={selectedRole}
                                    onChange={(e) => {
                                        setSelectedRole(e.target.value);
                                        setPage(1);
                                    }}
                                    aria-label="فیلتر بر اساس نقش"
                                    className="w-full py-2 px-3 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white text-gray-700"
                                >
                                    <option value="">همه نقش‌ها</option>
                                    <option value="Admin">مدیر ارشد (Admin)</option>
                                    <option value="OfficeHead">رئیس اداره</option>
                                    <option value="GroupHead">رئیس گروه مالیاتی</option>
                                    <option value="Expert">کارشناس (ممیز)</option>
                                    <option value="ITSpecialist">کارشناس فناوری</option>
                                    <option value="Employee">کارمند (Employee)</option>
                                </select>
                            </div>

                            {(searchTerm || selectedRole) && (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedRole('');
                                        setPage(1);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2.5 py-1.5 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition"
                                    title="پاک‌سازی فیلترها"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>حذف فیلترها</span>
                                </button>
                            )}
                        </div>

                        {/* Count & PageSize Selector */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-gray-500 font-medium">
                            <div className="flex items-center gap-1.5">
                                <span>تعداد در صفحه:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    aria-label="تعداد نمایش در هر صفحه"
                                    className="py-1 px-2 border border-gray-200 rounded-md text-xs font-mono font-bold bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                >
                                    <option value={10}>۱۰</option>
                                    <option value={25}>۲۵</option>
                                    <option value={50}>۵۰</option>
                                    <option value={100}>۱۰۰</option>
                                </select>
                            </div>
                            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                            <div>
                                مجموع: <span className="font-bold text-gray-900 font-mono">{totalCount.toLocaleString('fa-IR')}</span> کاربر
                            </div>
                        </div>
                    </div>

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
                                            شماره کارمند
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            نقش
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            کارمند مرتبط
                                        </th>
                                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            ادارات مجاز
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
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Search className="w-8 h-8 text-gray-300" />
                                                    <span className="text-sm font-medium">هیچ کاربری با این مشخصات یافت نشد.</span>
                                                    {(searchTerm || selectedRole) && (
                                                        <button
                                                            onClick={() => {
                                                                setSearchTerm('');
                                                                setSelectedRole('');
                                                                setPage(1);
                                                            }}
                                                            className="mt-1 text-xs text-primary-600 hover:text-primary-800 underline"
                                                        >
                                                            پاک‌سازی فیلترها و مشاهده همه کاربران
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => {
                                            const locked = isAccountLocked(user);
                                            return (
                                                <tr key={user.id} className="hover:bg-gray-50/70 transition">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-semibold font-mono text-gray-900">{user.username}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {user.employee?.personnelNumber ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                                                {user.employee.personnelNumber}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
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
                                                    <td className="px-6 py-4">
                                                        {user.role === 'Admin' ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                                همه ادارات (سازمانی)
                                                            </span>
                                                        ) : user.assignedOffices && user.assignedOffices.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                {user.assignedOffices.map((off) => (
                                                                    <span
                                                                        key={off.id}
                                                                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-primary-50 text-primary-700 border border-primary-200"
                                                                        title={off.name}
                                                                    >
                                                                        {off.code}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">فاقد اداره</span>
                                                        )}
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
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls Bar */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
                                <div className="flex items-center gap-1.5">
                                    <span>نمایش</span>
                                    <span className="font-bold text-gray-900 font-mono">
                                        {((page - 1) * pageSize + 1).toLocaleString('fa-IR')}
                                    </span>
                                    <span>تا</span>
                                    <span className="font-bold text-gray-900 font-mono">
                                        {Math.min(page * pageSize, totalCount).toLocaleString('fa-IR')}
                                    </span>
                                    <span>از</span>
                                    <span className="font-bold text-gray-900 font-mono">
                                        {totalCount.toLocaleString('fa-IR')}
                                    </span>
                                    <span>کاربر</span>
                                    {tableLoading && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600 mr-2" />
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {/* First Page */}
                                    <button
                                        onClick={() => setPage(1)}
                                        disabled={page <= 1 || tableLoading}
                                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        title="صفحه نخست"
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </button>

                                    {/* Previous Page */}
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page <= 1 || tableLoading}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition font-medium"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                        <span>صفحه قبل</span>
                                    </button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-1 mx-1">
                                        {getPaginationItems(page, totalPages).map((item, idx) => {
                                            if (typeof item === 'string') {
                                                return (
                                                    <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 font-mono">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            const isCurrent = item === page;
                                            return (
                                                <button
                                                    key={item}
                                                    onClick={() => setPage(item)}
                                                    disabled={tableLoading}
                                                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition font-mono ${
                                                        isCurrent
                                                            ? 'bg-primary-600 text-white shadow-xs'
                                                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {item.toLocaleString('fa-IR')}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Next Page */}
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page >= totalPages || tableLoading}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition font-medium"
                                    >
                                        <span>صفحه بعد</span>
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {/* Last Page */}
                                    <button
                                        onClick={() => setPage(totalPages)}
                                        disabled={page >= totalPages || tableLoading}
                                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        title="صفحه آخر"
                                    >
                                        <ChevronsLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
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
                        <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
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

                                {/* Office Assignment Section */}
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-primary-600" />
                                            <h3 className="text-xs font-bold text-gray-800">
                                                تخصیص ادارات مجاز (Offices)
                                            </h3>
                                            <span className="text-[11px] font-semibold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                                                {editRole === 'Admin' ? 'دسترسی سراسری' : `${editSelectedOfficeIds.length} اداره انتخاب شده`}
                                            </span>
                                        </div>
                                        {editRole !== 'Admin' && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAllEditOffices}
                                                    className="text-primary-600 hover:text-primary-800 hover:underline font-medium"
                                                >
                                                    انتخاب همه
                                                </button>
                                                <span className="text-gray-300">|</span>
                                                <button
                                                    type="button"
                                                    onClick={handleClearAllEditOffices}
                                                    className="text-gray-500 hover:text-red-600 hover:underline font-medium"
                                                >
                                                    پاک کردن همه
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {editRole === 'Admin' ? (
                                        <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                                            کاربران با نقش «مدیر ارشد سامانه (Admin)» به صورت خودکار به تمامی کاربرگ‌ها و ادارات استان دسترسی کامل دارند.
                                        </p>
                                    ) : (
                                        <>
                                            <p className="text-[11px] text-gray-500 mb-3">
                                                کاربر فقط مجاز به مشاهده، ثبت و ویرایش کاربرگ‌ها و اطلاعات ادارات انتخاب شده خواهد بود.
                                            </p>

                                            {/* Search Filter */}
                                            <div className="relative mb-3">
                                                <input
                                                    type="text"
                                                    value={editOfficeSearch}
                                                    onChange={e => setEditOfficeSearch(e.target.value)}
                                                    placeholder="جستجوی کد یا نام اداره (مثال: 1601)..."
                                                    className="w-full pr-9 pl-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                                />
                                                <Search className="w-4 h-4 text-gray-400 absolute right-2.5 top-2" />
                                            </div>

                                            {/* Selected Badges */}
                                            {editSelectedOfficeIds.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-3 max-h-24 overflow-y-auto p-1.5 bg-white rounded-lg border border-gray-200">
                                                    {editSelectedOfficeIds.map(id => {
                                                        const off = offices.find(o => o.id === id);
                                                        if (!off) return null;
                                                        return (
                                                            <span
                                                                key={id}
                                                                className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary-50 text-primary-800 px-2 py-0.5 rounded border border-primary-200"
                                                            >
                                                                {off.code} - {off.name}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleEditOffice(id)}
                                                                    className="hover:text-red-600"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Offices List */}
                                            {loadingOffices ? (
                                                <div className="text-center py-4 text-xs text-gray-400">در حال دریافت لیست ادارات...</div>
                                            ) : filteredEditOffices.length === 0 ? (
                                                <div className="text-center py-4 text-xs text-gray-400">اداره‌ای با این مشخصات یافت نشد.</div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                                    {filteredEditOffices.map(office => {
                                                        const isSelected = editSelectedOfficeIds.includes(office.id);
                                                        return (
                                                            <div
                                                                key={office.id}
                                                                onClick={() => toggleEditOffice(office.id)}
                                                                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition text-xs select-none ${
                                                                    isSelected
                                                                        ? 'bg-primary-50 border-primary-400 text-primary-900 font-semibold shadow-xs'
                                                                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {isSelected ? (
                                                                        <CheckSquare className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                                                    ) : (
                                                                        <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                    )}
                                                                    <span className="font-mono font-bold text-gray-800">
                                                                        {office.code}
                                                                    </span>
                                                                    <span className="truncate max-w-[120px]">
                                                                        {office.name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}
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
                {/* Personnel Excel Import Modal */}
                <PersonnelImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => {
                        loadUsers();
                        loadEmployees();
                        loadOffices();
                    }}
                />
            </div>
        </ProtectedRoute>
    );
}
