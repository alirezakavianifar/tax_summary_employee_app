// Authentication types
export interface User {
    id: string;
    username: string;
    email: string;
    role: 'Admin' | 'Manager' | 'Employee';
    isActive: boolean;
    employeeId?: string;
    employee?: any; // Can be typed more specifically if needed
    createdAt: string;
}

export interface LoginRequest {
    username: string;
    password: string;
    rememberMe?: boolean;
}

export interface LoginResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: User;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    role: 'Admin' | 'Manager' | 'Employee';
    employeeId?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    updateUser: (user: User) => void;
}
