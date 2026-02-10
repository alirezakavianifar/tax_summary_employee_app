'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import * as authApi from '@/lib/api/auth';
import { AuthContextType, User, LoginRequest } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = async () => {
            try {
                const storedToken = localStorage.getItem('accessToken');
                const storedUser = localStorage.getItem('user');

                if (storedToken && storedUser) {
                    // Verify token is still valid by fetching current user BEFORE setting state
                    try {
                        const currentUser = await authApi.getCurrentUser();
                        // Only set state if token is valid
                        setAccessToken(storedToken);
                        setUser(currentUser);
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    } catch (error) {
                        // Token is invalid or expired, try to refresh
                        try {
                            await refreshToken();
                        } catch (refreshError) {
                            // Refresh failed, clear auth state
                            console.log('Token validation failed, clearing auth state');
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('user');
                            Cookies.remove('accessToken');
                            setAccessToken(null);
                            setUser(null);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
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

            // Store token and user
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('user', JSON.stringify(response.user));

            // Set cookie for middleware (expires in 60 minutes)
            Cookies.set('accessToken', response.accessToken, { expires: 1 / 24, secure: process.env.NODE_ENV === 'production' });

            setAccessToken(response.accessToken);
            setUser(response.user);

            // Redirect to dashboard
            router.push('/reports');
        } catch (error: any) {
            console.error('Login failed:', error);
            throw new Error(error.response?.data?.error || 'ورود ناموفق بود');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const logout = useCallback(async () => {
        // Clear local state FIRST to prevent UI from showing stale data
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        Cookies.remove('accessToken'); // Clear cookie

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

            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('user', JSON.stringify(response.user));
            Cookies.set('accessToken', response.accessToken, { expires: 1 / 24, secure: process.env.NODE_ENV === 'production' });

            setAccessToken(response.accessToken);
            setUser(response.user);
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
