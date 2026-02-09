import axios, { AxiosError } from 'axios';
import { LoginRequest, LoginResponse, RegisterRequest, ChangePasswordRequest, User } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
        const token = localStorage.getItem('accessToken');
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
                await refreshToken();
                const token = localStorage.getItem('accessToken');
                if (token && originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return authApi(originalRequest);
            } catch (refreshError) {
                // Refresh failed, redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
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
    return response.data;
}

/**
 * Logout and revoke tokens
 */
export async function logout(): Promise<void> {
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
