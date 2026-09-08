'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuSettings } from '@/contexts/MenuSettingsContext';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: UserRole[];
    requiredModule?: string;
}

export default function ProtectedRoute({ children, requiredRoles, requiredModule }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const { isModuleVisible, loading: settingsLoading } = useMenuSettings();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (!isLoading && isAuthenticated && requiredRoles && user) {
            const hasRequiredRole = requiredRoles.includes(user.role);
            if (!hasRequiredRole) {
                router.push('/unauthorized');
            }
        }
    }, [isAuthenticated, isLoading, user, requiredRoles, router]);

    useEffect(() => {
        if (!isLoading && !settingsLoading && isAuthenticated && requiredModule) {
            const hasModuleAccess = isModuleVisible(requiredModule);
            if (!hasModuleAccess) {
                router.push('/unauthorized');
            }
        }
    }, [isAuthenticated, isLoading, settingsLoading, requiredModule, isModuleVisible, router]);

    if (isLoading || (requiredModule && settingsLoading)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-xs text-gray-500 font-medium">در حال بررسی دسترسی...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect to login
    }

    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
        return null; // Will redirect to unauthorized
    }

    if (requiredModule && !isModuleVisible(requiredModule)) {
        return null; // Will redirect to unauthorized
    }

    return <>{children}</>;
}
