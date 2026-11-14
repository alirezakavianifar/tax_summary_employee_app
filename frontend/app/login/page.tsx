'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

function LoginForm() {
    const searchParams = useSearchParams();
    const rawCallbackUrl = searchParams.get('callbackUrl') || '/';
    const callbackUrl = rawCallbackUrl.startsWith('/') && !rawCallbackUrl.startsWith('/login')
        ? rawCallbackUrl
        : '/';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
    const { branding, resolvedLogoUrl } = useBranding();
    const router = useRouter();

    // If already authenticated or silently refreshed, navigate to target route immediately
    useEffect(() => {
        if (!authLoading && isAuthenticated && user) {
            router.replace(callbackUrl);
        }
    }, [authLoading, isAuthenticated, user, callbackUrl, router]);

    const toAsciiDigits = (str: string) => {
        return str
            .replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1728))
            .replace(/[٠-٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 1584))
            .trim();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login({
                username: toAsciiDigits(username),
                password: toAsciiDigits(password),
                rememberMe
            }, callbackUrl);
            // Redirect is handled by AuthContext
        } catch (err: any) {
            setError(err.message || 'خطا در ورود. لطفاً مجدداً تلاش کنید');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 rounded-2xl p-2 border border-gray-200 shadow-sm flex items-center justify-center bg-white mb-3">
                            <img
                                src={resolvedLogoUrl}
                                alt={branding.organizationName}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <p className="text-xs font-bold text-primary-700 mb-1">
                            {branding.organizationName}
                        </p>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">
                            {branding.systemTitle}
                        </h1>
                        <p className="text-gray-500 text-sm">ورود به سیستم</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                نام کاربری (کد ملی)
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-right"
                                placeholder="کد ملی ۱۰ رقمی (یا نام کاربری)"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 text-right">
                                رمز عبور
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-right"
                                    placeholder="رمز عبور خود را وارد کنید"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 transition-colors rounded-md hover:bg-gray-100"
                                    title={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                                    aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                                    tabIndex={-1}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center justify-end">
                            <label className="flex items-center cursor-pointer">
                                <span className="text-sm text-gray-700 ml-2">مرا به خاطر بسپار</span>
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    disabled={isLoading}
                                />
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    در حال ورود...
                                </>
                            ) : (
                                'ورود'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}

