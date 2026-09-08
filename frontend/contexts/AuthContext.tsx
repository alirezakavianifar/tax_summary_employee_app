'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import * as authApi from '@/lib/api/auth';
import { tokenManager } from '@/lib/api/tokenManager';
import { AuthContextType, User, LoginRequest } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Initialize auth state using HttpOnly refresh cookie and tokenManager
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Ensure legacy tokens are removed from localStorage
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                }

                // Attempt silent refresh via HttpOnly cookie
                try {
                    const response = await authApi.refreshToken();
                    tokenManager.setAccessToken(response.accessToken);
                    setAccessToken(response.accessToken);
                    setUser(response.user);
                } catch (refreshErr) {
                    // No active session or refresh expired
                    tokenManager.clearAccessToken();
                    setAccessToken(null);
                    setUser(null);
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('user');
                    }
                    Cookies.remove('accessToken', { path: '/' });
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                Cookies.remove('accessToken', { path: '/' });
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // Automatic token refresh - refresh 5 minutes before expiration
    useEffect(() => {
        if (!accessToken || !user) return;

        // Access token expires in 60 minutes, refresh after 55 minutes
        const REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutes in milliseconds

        const refreshTimer = setInterval(async () => {
            try {
                console.log('Auto-refreshing token...');
                await refreshToken();
            } catch (error) {
                console.error('Auto token refresh failed:', error);
                // If auto-refresh fails, user will be logged out on next API call
            }
        }, REFRESH_INTERVAL);

        return () => clearInterval(refreshTimer);
    }, [accessToken, user]);

    const login = useCallback(async (credentials: LoginRequest) => {
        try {
            setIsLoading(true);
            const response = await authApi.login(credentials);

            // Set in-memory token
            tokenManager.setAccessToken(response.accessToken);
            setAccessToken(response.accessToken);
            setUser(response.user);

            // Remove any localStorage access tokens
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.setItem('user', JSON.stringify(response.user));
            }

            // Set cookie for Next.js middleware SSR protection
            Cookies.set('accessToken', response.accessToken, {
                expires: 1 / 24,
                secure: window.location.protocol === 'https:',
                sameSite: 'lax',
                path: '/'
            });

            // Redirect to change-password if required by policy, otherwise to dashboard/home
            if (response.user.mustChangePassword) {
                router.push('/change-password');
            } else {
                router.push('/');
            }
        } catch (error: any) {
            console.error('Login failed:', error);
            throw new Error(error.response?.data?.error || 'ورود ناموفق بود');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const logout = useCallback(async () => {
        // Clear local memory state immediately
        tokenManager.clearAccessToken();
        setAccessToken(null);
        setUser(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
        }
        Cookies.remove('accessToken', { path: '/' });

        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            router.push('/login');
        }
    }, [router]);

    const refreshToken = useCallback(async () => {
        try {
            const response = await authApi.refreshToken();
            tokenManager.setAccessToken(response.accessToken);
            setAccessToken(response.accessToken);
            setUser(response.user);
            if (typeof window !== 'undefined') {
                localStorage.removeItem('accessToken');
                localStorage.setItem('user', JSON.stringify(response.user));
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
        }
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, []);

    const value: AuthContextType = {
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        login,
        logout,
        refreshToken,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
