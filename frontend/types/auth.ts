// Authentication types
export type UserRole = 'Admin' | 'DirectorGeneral' | 'Treasury' | 'OfficeHead' | 'GroupHead' | 'Expert' | 'ITSpecialist' | 'Manager' | 'Employee' | 'Auditor' | (string & {});

export const ROLE_NAMES_FA: Record<string, string> = {
    Admin: 'مدیر ارشد',
    DirectorGeneral: 'مدیر کل امور مالیاتی',
    Treasury: 'ذیحساب',
    OfficeHead: 'رئیس اداره',
    GroupHead: 'رئیس گروه مالیاتی',
    Expert: 'کارشناس (ممیز)',
    ITSpecialist: 'کارشناس فناوری',
    Manager: 'مدیر',
    Employee: 'کارمند',
    Auditor: 'حسابرس',
};

export function formatRoleTitle(title?: string | null): string {
    if (!title) return '';
    return title.replace(/\s*\([A-Za-z\s_-]+\)/g, '').trim();
}

export function getRolePersianName(role?: string | null): string {
    if (!role) return '';
    const name = ROLE_NAMES_FA[role] || role;
    return formatRoleTitle(name);
}

export interface User {
    id: string;
    username: string;
    email?: string | null;
    role: UserRole;
    isActive: boolean;
    employeeId?: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    employee?: {
        id?: string;
        personnelNumber?: string;
        firstName?: string;
        lastName?: string;
        education?: string;
        serviceUnit?: string;
        nationalId?: string;
        currentPosition?: string;
        appointmentPosition?: string;
        [key: string]: any;
    } | null;
    assignedOffices?: { id: string; code: string; name: string }[];
    lockoutEnd?: string | null;
    failedLoginAttempts?: number;
    mustChangePassword?: boolean;
    createdAt: string;
}

/**
 * Returns user's full name (first name + last name) if available, or empty string.
 */
export function getUserFullName(user?: User | null): string {
    if (!user) return '';
    const first = (user.firstName || user.employee?.firstName || '').trim();
    const last = (user.lastName || user.employee?.lastName || '').trim();
    if (first || last) {
        return `${first} ${last}`.trim();
    }
    if (user.fullName && user.fullName.trim()) {
        return user.fullName.trim();
    }
    return '';
}

/**
 * Returns user's full name if available, otherwise falls back to username.
 */
export function getUserDisplayName(user?: User | null): string {
    if (!user) return '';
    const fullName = getUserFullName(user);
    if (fullName) return fullName;
    return user.username || '';
}

/**
 * Returns the first letter of user's first name or display name for the avatar badge.
 */
export function getUserAvatarLetter(user?: User | null): string {
    if (!user) return '';
    const first = (user.firstName || user.employee?.firstName || '').trim();
    if (first) {
        return first.charAt(0);
    }
    const fullName = (user.fullName || '').trim();
    if (fullName) {
        return fullName.charAt(0);
    }
    return user.username?.charAt(0).toUpperCase() || '';
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
    email?: string;
    password: string;
    role: UserRole;
    employeeId?: string;
    officeIds?: string[];
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
