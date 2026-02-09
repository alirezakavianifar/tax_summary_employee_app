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
                    setAccessToken(storedToken);
                    setUser(JSON.parse(storedUser));

                    // Verify token is still valid by fetching current user
                    try {
                        const currentUser = await authApi.getCurrentUser();
                        setUser(currentUser);
                        localStorage.setItem('user', JSON.stringify(currentUser));
                    } catch (error) {
                        // Token might be expired, try to refresh
                        try {
                            await refreshToken();
                        } catch (refreshError) {
                            // Refresh failed, clear auth state
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('user');
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

    const login = useCallback(async (credentials: LoginRequest) => {
        try {
            setIsLoading(true);
            const response = await authApi.login(credentials);

            // Store token and user
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('user', JSON.stringify(response.user));

            // Set cookie for middleware
            Cookies.set('accessToken', response.accessToken, { expires: 1 / 96, secure: process.env.NODE_ENV === 'production' });

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
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Clear local state regardless of API call success
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            Cookies.remove('accessToken'); // Clear cookie
            setAccessToken(null);
            setUser(null);
            router.push('/login');
        }
    }, [router]);

    const refreshToken = useCallback(async () => {
        try {
            const response = await authApi.refreshToken();

            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('user', JSON.stringify(response.user));
            Cookies.set('accessToken', response.accessToken, { expires: 1 / 96, secure: process.env.NODE_ENV === 'production' });

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
