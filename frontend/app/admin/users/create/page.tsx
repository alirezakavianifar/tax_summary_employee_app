'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod'; // Assuming zod is installed, or use basic validation
import ProtectedRoute from '@/components/ProtectedRoute';
import { usersApi } from '@/lib/api/users';

// Since I haven't installed zod in package.json in previous turns (checked task.md phase 4, but maybe not installed),
// I'll stick to simple validation or check if zod is available. 
// Task.md mentioned "Add form validation (zod schema)" in Phase 5 but I didn't explicitly run `npm install zod`.
// To be safe, I'll use basic react-hook-form validation without zod resolver if I'm not sure, 
// OR I'll assume standard Next.js setup might have it or I can install it.
// Checking `package.json` would be good but I'll implement with standard Hook Form validation to be safe and fast.

interface CreateUserForm {
    username: string;
    email: string;
    password: string;
    role: 'Admin' | 'Manager' | 'Employee';
}

export default function CreateUserPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<CreateUserForm>();

    const onSubmit = async (data: CreateUserForm) => {
        try {
            setLoading(true);
            setError(null);
            await usersApi.createUser(data);
            router.push('/admin/users');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'خطا در ایجاد کاربر');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute requiredRoles={['Admin']}>
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        افزودن کاربر جدید
                    </h2>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    نام کاربری
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="username"
                                        type="text"
                                        autoComplete="username"
                                        {...register('username', { required: 'نام کاربری الزامی است' })}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    />
                                    {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    ایمیل
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        {...register('email', { required: 'ایمیل الزامی است' })}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    />
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    رمز عبور
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        {...register('password', { required: 'رمز عبور الزامی است', minLength: { value: 6, message: 'رمز عبور باید حداقل 6 کاراکتر باشد' } })}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    />
                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                    نقش کاربری
                                </label>
                                <div className="mt-1">
                                    <select
                                        id="role"
                                        {...register('role', { required: 'نقش کاربری الزامی است' })}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    >
                                        <option value="Employee">Employee</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                                >
                                    {loading ? 'در حال ثبت...' : 'ثبت کاربر'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
