'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import ProtectedRoute from '@/components/ProtectedRoute';
import { usersApi } from '@/lib/api/users';
import { reportsApi } from '@/lib/api/reports';
import { EmployeeDto } from '@/lib/api/types';
import { UserRole } from '@/types/auth';

interface CreateUserForm {
    username: string;
    password: string;
    role: UserRole;
    employeeId?: string;
}

export default function CreateUserPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<EmployeeDto[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [isCustomPassword, setIsCustomPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateUserForm>({
        defaultValues: {
            role: 'Expert',
            username: '',
            password: '',
            employeeId: '',
        }
    });

    const currentUsername = watch('username');
    const currentPassword = watch('password');

    useEffect(() => {
        const fetchEmployees = async () => {
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

        fetchEmployees();
    }, []);

    const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const empId = e.target.value;
        setValue('employeeId', empId);
        if (empId) {
            const selectedEmp = employees.find(emp => emp.id === empId);
            if (selectedEmp?.nationalId) {
                // Auto-fill username with national ID
                setValue('username', selectedEmp.nationalId);
                // Also default password to national ID if not manually customized
                if (!isCustomPassword) {
                    setValue('password', selectedEmp.nationalId);
                }
            }
        }
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setValue('username', val);
        if (!isCustomPassword) {
            setValue('password', val);
        }
    };

    const handleResetPasswordToNationalId = () => {
        setValue('password', currentUsername);
        setIsCustomPassword(false);
    };

    const onSubmit = async (data: CreateUserForm) => {
        try {
            setLoading(true);
            setError(null);
            const username = data.username.trim();
            const password = (data.password && data.password.trim().length > 0)
                ? data.password.trim()
                : username;

            const payload = {
                ...data,
                username,
                password,
                employeeId: data.employeeId ? data.employeeId : undefined,
            };
            await usersApi.createUser(payload);
            router.push('/admin/users');
        } catch (err: any) {
            const serverError = err.response?.data?.error || err.response?.data?.message;
            if (serverError) {
                setError(serverError);
            } else if (err.response?.data?.errors) {
                const firstKey = Object.keys(err.response.data.errors)[0];
                const msg = err.response.data.errors[firstKey]?.[0];
                setError(msg || 'اطلاعات وارد شده معتبر نیست');
            } else {
                setError(err.message || 'خطا در ایجاد کاربر');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute requiredRoles={['Admin']}>
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="text-center text-2xl font-black text-gray-900">
                        افزودن کاربر جدید
                    </h2>
                    <p className="mt-2 text-center text-xs text-gray-600">
                        تعریف حساب کاربری بر اساس کد ملی ۱۰ رقمی و انتصاب جایگاه سازمانی
                    </p>
                </div>

                <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-2xl sm:px-10">
                        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
                                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Optional Associated Employee Selector */}
                            <div>
                                <label htmlFor="employeeId" className="block text-xs font-bold text-gray-700 mb-1.5">
                                    انتخاب کارمند مرتبط (اختیاری)
                                </label>
                                <select
                                    id="employeeId"
                                    onChange={handleEmployeeChange}
                                    disabled={loadingEmployees}
                                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                >
                                    <option value="">-- بدون انتساب کارمند --</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} (پرسنلی: {emp.personnelNumber}{emp.nationalId ? ` | کد ملی: ${emp.nationalId}` : ''})
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-[11px] text-gray-500">
                                    با انتخاب کارمند، کد ملی وی به صورت خودکار به عنوان نام کاربری درج می‌گردد.
                                </p>
                            </div>

                            {/* Username / National ID */}
                            <div>
                                <label htmlFor="username" className="block text-xs font-bold text-gray-700 mb-1.5">
                                    نام کاربری (کد ملی ۱۰ رقمی) *
                                </label>
                                <div className="relative">
                                    <input
                                        id="username"
                                        type="text"
                                        dir="ltr"
                                        maxLength={10}
                                        placeholder="مثال: 0012345678"
                                        autoComplete="username"
                                        {...register('username', {
                                            required: 'نام کاربری (کد ملی) الزامی است',
                                            pattern: {
                                                value: /^(\d{10}|[a-zA-Z0-9._-]{3,20})$/,
                                                message: 'کد ملی باید ۱۰ رقم عددی باشد'
                                            },
                                            onChange: handleUsernameChange
                                        })}
                                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 tracking-wider font-mono text-left"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
                                )}
                                <p className="mt-1 text-[11px] text-gray-500">
                                    کد ملی ده رقمی کارمند جهت ورود به سامانه استفاده می‌شود.
                                </p>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="password" className="block text-xs font-bold text-gray-700">
                                        رمز عبور (حداقل ۶ کاراکتر)
                                    </label>
                                    {!isCustomPassword && currentUsername ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            پیش‌فرض: کد ملی کاربر
                                        </span>
                                    ) : isCustomPassword ? (
                                        <button
                                            type="button"
                                            onClick={handleResetPasswordToNationalId}
                                            className="text-[11px] font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                        >
                                            تنظیم مجدد بر اساس کد ملی
                                        </button>
                                    ) : null}
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        dir="ltr"
                                        placeholder="همان کد ملی (یا رمز عبور دلخواه)"
                                        autoComplete="new-password"
                                        {...register('password', {
                                            minLength: { value: 6, message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' },
                                            onChange: () => setIsCustomPassword(true)
                                        })}
                                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-left pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                                )}
                                <p className="mt-1 text-[11px] text-gray-500">
                                    به طور پیش‌فرض، کد ملی ۱۰ رقمی به عنوان رمز عبور اولیه کاربر در نظر گرفته می‌شود.
                                </p>
                            </div>

                            {/* Organizational Role */}
                            <div>
                                <label htmlFor="role" className="block text-xs font-bold text-gray-700 mb-1.5">
                                    نقش و جایگاه سازمانی *
                                </label>
                                <select
                                    id="role"
                                    {...register('role', { required: 'نقش کاربری الزامی است' })}
                                    className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="Expert">کارشناس (ممیز مالیاتی)</option>
                                    <option value="GroupHead">رئیس گروه مالیاتی</option>
                                    <option value="OfficeHead">رئیس اداره امور مالیاتی</option>
                                    <option value="ITSpecialist">کارشناس فناوری اطلاعات</option>
                                    <option value="Admin">مدیر ارشد سامانه (Admin)</option>
                                </select>
                                <p className="mt-1 text-[11px] text-gray-500">
                                    سطوح دسترسی به منوها و ماژول‌ها در صفحه «مدیریت منوها» بر اساس این جایگاه کنترل می‌شود.
                                </p>
                            </div>

                            <div className="pt-2 flex items-center justify-between gap-3">
                                <Link
                                    href="/admin/users"
                                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                >
                                    انصراف و بازگشت
                                </Link>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition shadow-xs flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading && (
                                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    )}
                                    <span>ثبت و فعال‌سازی کاربر</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
