/**
 * Utility to provide the Backend API URL dynamically based on the current hostname.
 * This ensures the frontend correctly communicates with the backend when accessed
 * from different IP addresses or hostnames.
 */
export const getApiUrl = () => {
    // If an environment variable is explicitly set, use it.
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // If we are in the browser, use the current window location's hostname.
    if (typeof window !== 'undefined') {
        return `http://${window.location.hostname}:5005`;
    }

    // Fallback for Server-Side Rendering (SSR).
    return 'http://localhost:5005';
};

export const API_URL = getApiUrl();
export const BASE_URL = API_URL.replace('/api', '');
