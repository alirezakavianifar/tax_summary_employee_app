'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Home, FileText, Users, LogOut, LogIn } from 'lucide-react';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsMenuOpen(false);
    }, [pathname]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-white shadow border-b border-gray-200 no-print">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="text-xl font-bold text-primary-600">
                                سامانه انتصاب
                            </Link>
                        </div>
                        <div className="hidden sm:mr-10 sm:flex sm:space-x-8 sm:space-x-reverse">
                            <Link
                                href="/"
                                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-2 ${isActive('/')
                                    ? 'border-primary-500 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                <Home className="w-5 h-5" />
                                خانه
                            </Link>
                            {isAuthenticated && (
                                <Link
                                    href="/reports"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-2 ${isActive('/reports')
                                        ? 'border-primary-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    <FileText className="w-5 h-5" />
                                    فرم‌ها
                                </Link>
                            )}
                            {isAuthenticated && user?.role === 'Admin' && (
                                <Link
                                    href="/admin/users"
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium gap-2 ${isActive('/admin/users')
                                        ? 'border-primary-500 text-gray-900'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    <Users className="w-5 h-5" />
                                    مدیریت کاربران
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {isAuthenticated ? (
                            <div className="ml-3 relative" ref={menuRef}>
                                <div>
                                    <button
                                        onClick={toggleMenu}
                                        className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 items-center gap-2 px-3 py-1 border border-gray-200 hover:bg-gray-50"
                                        id="user-menu-button"
                                        aria-expanded="false"
                                        aria-haspopup="true"
                                    >
                                        <span className="sr-only">Open user menu</span>
                                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                            {user?.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium text-gray-700">{user?.username}</span>
                                            <span className="text-xs text-gray-500">{user?.role}</span>
                                        </div>
                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                                {isMenuOpen && (
                                    <div
                                        className="origin-top-left absolute left-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                                        role="menu"
                                        aria-orientation="vertical"
                                        aria-labelledby="user-menu-button"
                                    >
                                        {/* Placeholder for Profile Link */}
                                        {/* <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                      پروفایل کاربری
                    </Link> */}
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsMenuOpen(false);
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            role="menuitem"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            خروج
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium px-3 py-2 rounded-md transition-colors"
                                >
                                    <LogIn className="w-5 h-5" />
                                    ورود
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="-mr-2 flex items-center sm:hidden">
                        {/* Mobile menu button */}
                        <button
                            onClick={toggleMobileMenu}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMobileMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state */}
            {isMobileMenuOpen && (
                <div className="sm:hidden" id="mobile-menu">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link
                            href="/"
                            className={`flex items-center gap-2 pl-3 pr-4 py-2 border-r-4 text-base font-medium ${isActive('/')
                                ? 'bg-primary-50 border-primary-500 text-primary-700'
                                : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                                }`}
                        >
                            <Home className="w-5 h-5" />
                            خانه
                        </Link>
                        {isAuthenticated && (
                            <Link
                                href="/reports"
                                className={`flex items-center gap-2 pl-3 pr-4 py-2 border-r-4 text-base font-medium ${isActive('/reports')
                                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                <FileText className="w-5 h-5" />
                                فرم‌ها
                            </Link>
                        )}
                        {isAuthenticated && user?.role === 'Admin' && (
                            <Link
                                href="/admin/users"
                                className={`flex items-center gap-2 pl-3 pr-4 py-2 border-r-4 text-base font-medium ${isActive('/admin/users')
                                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                            >
                                <Users className="w-5 h-5" />
                                مدیریت کاربران
                            </Link>
                        )}
                    </div>
                    {isAuthenticated ? (
                        <div className="pt-4 pb-4 border-t border-gray-200">
                            <div className="flex items-center px-4">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div className="mr-3">
                                    <div className="text-base font-medium text-gray-800">{user?.username}</div>
                                    <div className="text-sm font-medium text-gray-500">{user?.role}</div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                {/* <Link
                  href="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  پروفایل کاربری
                </Link> */}
                                <button
                                    onClick={() => logout()}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-gray-100"
                                >
                                    <LogOut className="w-5 h-5" />
                                    خروج
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-4 pb-4 border-t border-gray-200">
                            <div className="space-y-1">
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    <LogIn className="w-5 h-5" />
                                    ورود
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
