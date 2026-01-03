import { AsyncLocalStorage } from 'async_hooks';

// auth info available for the current request
export interface AuthContext {
    isAuthenticated: boolean;
    userId?: string;
    email?: string;
    is_admin?: boolean;
    tokenExp?: number; // token expiration timestamp
}

// allows accessing auth info from anywhere in the request lifecycle
export const authStorage = new AsyncLocalStorage<AuthContext>();

// helper to get current auth context
export function getAuthContext(): AuthContext {
    return authStorage.getStore() || { isAuthenticated: false };
}

// helper to check if current request is authenticated
export function isAuthenticated(): boolean {
    return getAuthContext().isAuthenticated;
}

// helper to get current user id (throws if not authenticated)
export function requireAuth(): { userId: string; email: string; is_admin: boolean } {
    const ctx = getAuthContext();
    if (!ctx.isAuthenticated || !ctx.userId || !ctx.email) {
        throw new Error('Not authenticated');
    }
    return { userId: ctx.userId, email: ctx.email, is_admin: ctx.is_admin || false };
}
