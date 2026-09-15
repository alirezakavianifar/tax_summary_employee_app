'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { rolesApi, RoleDto, CreateRoleRequest, UpdateRoleRequest } from '@/lib/api/roles';
import { 
    Shield, 
    ShieldCheck, 
    ShieldAlert, 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    Users, 
    Lock, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Loader2, 
    RotateCcw,
    ArrowUpDown,
    Check,
    X,
    Info
} from 'lucide-react';

export default function RolesManagementPage() {
    const [roles, setRoles] = useState<RoleDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createTitle, setCreateTitle] = useState('');
    const [createDescription, setCreateDescription] = useState('');
    const [createDisplayOrder, setCreateDisplayOrder] = useState<number>(10);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // Edit Modal State
    const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [editDisplayOrder, setEditDisplayOrder] = useState<number>(10);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Delete Modal State
    const [deletingRole, setDeletingRole] = useState<RoleDto | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const loadRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await rolesApi.getManagementRoles();
            setRoles(data || []);
        } catch (err: any) {
            setError(err?.response?.data?.error || err.message || 'خطا در بارگذاری فهرست نقش‌ها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoles();
    }, []);

    // Filter roles based on search
    const filteredRoles = useMemo(() => {
        if (!searchTerm.trim()) return roles;
        const q = searchTerm.trim().toLowerCase();
        return roles.filter(
            r =>
                r.name.toLowerCase().includes(q) ||
                r.title.toLowerCase().includes(q) ||
                (r.description && r.description.toLowerCase().includes(q))
        );
    }, [roles, searchTerm]);

    // Role statistics
    const stats = useMemo(() => {
        const total = roles.length;
        const system = roles.filter(r => r.isSystemRole).length;
        const custom = roles.filter(r => !r.isSystemRole).length;
        const active = roles.filter(r => r.isActive).length;
        const totalUsers = roles.reduce((acc, r) => acc + (r.userCount || 0), 0);
        return { total, system, custom, active, totalUsers };
    }, [roles]);

    // Handle Create Role
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);

        const trimmedName = createName.trim();
        const trimmedTitle = createTitle.trim();

        if (!trimmedName || !trimmedTitle) {
            setCreateError('شناسه انگلیسی و عنوان فارسی نقش الزامی است.');
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
            setCreateError('شناسه انگلیسی نقش فقط می‌تواند شامل حروف انگلیسی، اعداد و زیرخط باشد.');
            return;
        }

        try {
            setCreateSubmitting(true);
            const payload: CreateRoleRequest = {
                name: trimmedName,
                title: trimmedTitle,
                description: createDescription.trim() || undefined,
                displayOrder: createDisplayOrder
            };

            await rolesApi.createRole(payload);
            setSuccessMessage(`نقش سازمانی «${trimmedTitle}» با موفقیت ایجاد شد.`);
            setShowCreateModal(false);
            setCreateName('');
            setCreateTitle('');
            setCreateDescription('');
            setCreateDisplayOrder(10);
            await loadRoles();
        } catch (err: any) {
            setCreateError(err?.response?.data?.error || err.message || 'خطا در ثبت نقش جدید');
        } finally {
            setCreateSubmitting(false);
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (role: RoleDto) => {
        setEditingRole(role);
        setEditTitle(role.title);
        setEditDescription(role.description || '');
        setEditIsActive(role.isActive);
        setEditDisplayOrder(role.displayOrder);
        setEditError(null);
    };

    // Handle Edit Role
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) return;

        setEditError(null);
        const trimmedTitle = editTitle.trim();
        if (!trimmedTitle) {
            setEditError('عنوان فارسی نقش نمی‌تواند خالی باشد.');
            return;
        }

        try {
            setEditSubmitting(true);
            const payload: UpdateRoleRequest = {
                title: trimmedTitle,
                description: editDescription.trim() || undefined,
                isActive: editIsActive,
                displayOrder: editDisplayOrder
            };

            await rolesApi.updateRole(editingRole.id, payload);
            setSuccessMessage(`اطلاعات نقش «${trimmedTitle}» با موفقیت بروزرسانی شد.`);
            setEditingRole(null);
            await loadRoles();
        } catch (err: any) {
            setEditError(err?.response?.data?.error || err.message || 'خطا در بروزرسانی نقش');
        } finally {
            setEditSubmitting(false);
        }
    };

    // Handle Delete Role
    const handleDeleteSubmit = async () => {
        if (!deletingRole) return;

        setDeleteError(null);
        try {
            setDeleteSubmitting(true);
            await rolesApi.deleteRole(deletingRole.id);
            setSuccessMessage(`نقش «${deletingRole.title}» با موفقیت حذف شد.`);
            setDeletingRole(null);
            await loadRoles();
        } catch (err: any) {
            setDeleteError(err?.response?.data?.error || err.message || 'خطا در حذف نقش');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    return (
        <ProtectedRoute requiredRoles={['Admin']}>
            <div className="min-h-screen bg-gray-50/60 p-4 sm:p-6 lg:p-8" dir="rtl">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <div className="p-2.5 bg-primary-50 text-primary-600 rounded-xl">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                                        مدیریت نقش‌ها و اختیارات سازمانی
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                        تعریف، پیکربندی و کنترل نقش‌های کاربری، مدیران کل، ذیحسابی و پرسنل
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Link
                                href="/admin/users"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition w-full sm:w-auto"
                            >
                                <Users className="w-4 h-4 text-gray-500" />
                                <span>مدیریت کاربران</span>
                            </Link>

                            <button
                                type="button"
                                onClick={() => {
                                    setCreateName('');
                                    setCreateTitle('');
                                    setCreateDescription('');
                                    setCreateDisplayOrder((roles.length + 1) * 10);
                                    setCreateError(null);
                                    setShowCreateModal(true);
                                }}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs transition w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4" />
                                <span>تعریف نقش جدید</span>
                            </button>
                        </div>
                    </div>

                    {/* Notification Messages */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-xs animate-in fade-in">
                            <div className="flex items-center gap-2.5">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold p-1">
                                ✕
                            </button>
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-xs animate-in fade-in">
                            <div className="flex items-center gap-2.5">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold p-1">
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Stat Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block font-medium">مجموع نقش‌ها</span>
                                <span className="text-lg font-black text-gray-900 font-mono">{stats.total}</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl flex-shrink-0">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block font-medium">نقش‌های سیستمی</span>
                                <span className="text-lg font-black text-purple-700 font-mono">{stats.system}</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block font-medium">نقش‌های سفارشی</span>
                                <span className="text-lg font-black text-amber-700 font-mono">{stats.custom}</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block font-medium">کاربران دارای نقش</span>
                                <span className="text-lg font-black text-emerald-700 font-mono">{stats.totalUsers}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                        {/* Search and Action Toolbar */}
                        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="جستجوی عنوان، کد انگلیسی یا شرح نقش..."
                                    className="w-full pr-9 pl-8 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50/50 focus:bg-white transition"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 hover:text-gray-600 text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={loadRoles}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl transition"
                                    title="بارگذاری مجدد"
                                >
                                    <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                    <span>بروزرسانی جدول</span>
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        {loading ? (
                            <div className="py-16 text-center">
                                <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
                                <span className="text-xs text-gray-500 font-medium">در حال فراخوانی فهرست نقش‌های سامانه...</span>
                            </div>
                        ) : filteredRoles.length === 0 ? (
                            <div className="py-16 text-center text-gray-400">
                                <Shield className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs font-medium text-gray-500">نقشی با این مشخصات یافت نشد.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead className="bg-gray-50/80 text-gray-600 border-b border-gray-200 font-semibold select-none">
                                        <tr>
                                            <th className="py-3 px-4 w-12 text-center">ترتیب</th>
                                            <th className="py-3 px-4">عنوان نقش سازمانی</th>
                                            <th className="py-3 px-4">شناسه سیستمی (Code)</th>
                                            <th className="py-3 px-4">نوع نقش</th>
                                            <th className="py-3 px-4 text-center">کاربران منتسب</th>
                                            <th className="py-3 px-4">وضعیت</th>
                                            <th className="py-3 px-4">توضیحات و دامنه اختیارات</th>
                                            <th className="py-3 px-4 text-center w-28">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredRoles.map(role => (
                                            <tr key={role.id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="py-3.5 px-4 text-center font-mono text-gray-400">
                                                    {role.displayOrder}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-2 font-bold text-gray-900">
                                                        <span>{role.title}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-mono text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                                                        {role.name}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {role.isSystemRole ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                                            <Lock className="w-3 h-3 text-purple-600" />
                                                            نقش سیستمی
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <Shield className="w-3 h-3 text-amber-600" />
                                                            سفارشی
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <Link
                                                        href={`/admin/users?role=${role.name}`}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                                                        title="مشاهده کاربران این نقش"
                                                    >
                                                        <Users className="w-3 h-3" />
                                                        <span>{role.userCount}</span>
                                                    </Link>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {role.isActive ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                            فعال
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                                                            <X className="w-3.5 h-3.5 text-gray-400" />
                                                            غیرفعال
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate" title={role.description || ''}>
                                                    {role.description || '—'}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(role)}
                                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                            title="ویرایش نقش"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>

                                                        {role.isSystemRole ? (
                                                            <span
                                                                className="p-1.5 text-gray-300 cursor-not-allowed"
                                                                title="نقش‌های سیستمی قابل حذف نیستند"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </span>
                                                        ) : role.userCount > 0 ? (
                                                            <span
                                                                className="p-1.5 text-gray-300 cursor-not-allowed"
                                                                title="این نقش به کاربرانی منتسب است و نمی‌توان آن را حذف کرد"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setDeletingRole(role);
                                                                    setDeleteError(null);
                                                                }}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                                title="حذف نقش سفارشی"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Create Role Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">تعریف نقش سازمانی جدید</h3>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            {createError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{createError}</span>
                                </div>
                            )}

                            <form onSubmit={handleCreateSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        شناسه انگلیسی نقش (Unique Role Code) *
                                    </label>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        required
                                        value={createName}
                                        onChange={e => setCreateName(e.target.value)}
                                        placeholder="مثال: Auditor یا LegalExpert"
                                        className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 font-mono text-left"
                                    />
                                    <p className="mt-1 text-[11px] text-gray-500">
                                        این کد انگلیسی برای دسترسی‌ها در سیستم به کار می‌رود و پس از ثبت غیرقابل تغییر است.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        عنوان فارسی نقش سازمانی *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createTitle}
                                        onChange={e => setCreateTitle(e.target.value)}
                                        placeholder="مثال: حسابرس ارشد / کارشناس حقوقی"
                                        className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        توضیحات و حدود اختیارات
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={createDescription}
                                        onChange={e => setCreateDescription(e.target.value)}
                                        placeholder="شرح مسئولیت‌ها، اختیارات استرداد یا دسترسی‌های منو..."
                                        className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        ترتیب نمایش در لیست‌ها
                                    </label>
                                    <input
                                        type="number"
                                        value={createDisplayOrder}
                                        onChange={e => setCreateDisplayOrder(Number(e.target.value))}
                                        className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 font-mono"
                                    />
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={createSubmitting}
                                        className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createSubmitting}
                                        className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {createSubmitting && (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        )}
                                        <span>ثبت نقش جدید</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Role Modal */}
                {editingRole && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Edit2 className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">
                                        ویرایش نقش: {editingRole.title}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setEditingRole(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            {editError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{editError}</span>
                                </div>
                            )}

                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        شناسه انگلیسی (غیرقابل تغییر)
                                    </label>
                                    <input
                                        type="text"
                                        disabled
                                        value={editingRole.name}
                                        className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl bg-gray-100 text-gray-500 font-mono text-left cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        عنوان فارسی نقش *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        توضیحات و حدود اختیارات
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={editDescription}
                                        onChange={e => setEditDescription(e.target.value)}
                                        className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        ترتیب نمایش در منوها و لیست‌ها
                                    </label>
                                    <input
                                        type="number"
                                        value={editDisplayOrder}
                                        onChange={e => setEditDisplayOrder(Number(e.target.value))}
                                        className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 font-mono"
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="editIsActive"
                                        checked={editIsActive}
                                        onChange={e => setEditIsActive(e.target.checked)}
                                        className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                    />
                                    <label htmlFor="editIsActive" className="text-xs font-bold text-gray-700 cursor-pointer">
                                        نقش فعال است (قابل انتخاب در فرم‌های تخصیص کاربر)
                                    </label>
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setEditingRole(null)}
                                        disabled={editSubmitting}
                                        className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={editSubmitting}
                                        className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {editSubmitting && (
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        )}
                                        <span>ذخیره تغییرات</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deletingRole && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">
                                        تأیید حذف نقش سازمانی
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        آیا از حذف این نقش اطمینان دارید؟ این عملیات قابل برگشت نیست.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1 mb-4 border border-gray-100">
                                <div><span className="font-semibold text-gray-600">عنوان نقش:</span> {deletingRole.title}</div>
                                <div><span className="font-semibold text-gray-600">کد سیستمی:</span> <span className="font-mono">{deletingRole.name}</span></div>
                            </div>

                            {deleteError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{deleteError}</span>
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setDeletingRole(null)}
                                    disabled={deleteSubmitting}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteSubmit}
                                    disabled={deleteSubmitting}
                                    className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {deleteSubmitting && (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <span>حذف نقش</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
