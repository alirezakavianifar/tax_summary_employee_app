'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: Array<'Admin' | 'Manager' | 'Employee'>;
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
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

    return <>{children}</>;
}
