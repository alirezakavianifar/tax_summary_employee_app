import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { LoginRequest, LoginResponse, RegisterRequest, ChangePasswordRequest, User } from '@/types/auth';

import { API_URL, BASE_URL } from './config';

import { tokenManager } from './tokenManager';

// Create axios instance with default config
const authApi = axios.create({
    baseURL: `${API_URL}/api/auth`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for cookies
});

// Add request interceptor to include access token
authApi.interceptors.request.use(
    (config) => {
        const token = tokenManager.getAccessToken() || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for error handling
authApi.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Skip if the request is for login or refresh tokens to avoid loops
        if (originalRequest.url?.includes('/login') || originalRequest.url?.includes('/refresh')) {
            return Promise.reject(error);
        }

        // If error is 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshData = await refreshToken();
                const token = tokenManager.getAccessToken() || refreshData.accessToken;
                if (token && originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return authApi(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear session and redirect to login
                tokenManager.clearAccessToken();
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                    Cookies.remove('accessToken', { path: '/' });
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Login with username and password
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await authApi.post<LoginResponse>('/login', credentials);
    if (response.data?.accessToken) {
        tokenManager.setAccessToken(response.data.accessToken);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken'); // Do not persist in localStorage
        }
    }
    return response.data;
}

/**
 * Register a new user (Admin only)
 */
export async function register(data: RegisterRequest): Promise<User> {
    const response = await authApi.post<User>('/register', data);
    return response.data;
}

/**
 * Refresh access token using refresh token cookie
 */
export async function refreshToken(): Promise<LoginResponse> {
    const response = await authApi.post<LoginResponse>('/refresh');
    const { accessToken, user } = response.data;

    if (accessToken) {
        tokenManager.setAccessToken(accessToken);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken'); // Never store raw JWT in localStorage
            // Set cookie for 60 minutes for Next.js middleware SSR routing
            Cookies.set('accessToken', accessToken, {
                expires: 1 / 24,
                secure: window.location.protocol === 'https:',
                sameSite: 'lax',
                path: '/',
            });
        }
    }

    if (user && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
    }

    return response.data;
}

/**
 * Logout and revoke tokens
 */
export async function logout(): Promise<void> {
    tokenManager.clearAccessToken();
    if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        Cookies.remove('accessToken', { path: '/' });
    }
    await authApi.post('/logout');
}

/**
 * Change current user's password
 */
export async function changePassword(data: ChangePasswordRequest): Promise<void> {
    await authApi.post('/change-password', data);
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
    const response = await authApi.get<User>('/me');
    return response.data;
}

export default authApi;
