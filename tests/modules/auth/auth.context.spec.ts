import { authStorage, getAuthContext, isAuthenticated, requireAuth, AuthContext } from '../../../src/auth/auth.context';

describe('AuthContext', () => {
    describe('getAuthContext', () => {
        it('should return unauthenticated context when not in storage', () => {
            const ctx = getAuthContext();
            expect(ctx.isAuthenticated).toBe(false);
        });

        it('should return stored context when in storage', () => {
            const mockCtx: AuthContext = { isAuthenticated: true, userId: '123', email: 'test@test.com' };

            authStorage.run(mockCtx, () => {
                const ctx = getAuthContext();
                expect(ctx.isAuthenticated).toBe(true);
                expect(ctx.userId).toBe('123');
                expect(ctx.email).toBe('test@test.com');
            });
        });
    });

    describe('isAuthenticated', () => {
        it('should return false when not authenticated', () => {
            expect(isAuthenticated()).toBe(false);
        });

        it('should return true when authenticated', () => {
            const mockCtx: AuthContext = { isAuthenticated: true, userId: '123', email: 'test@test.com' };

            authStorage.run(mockCtx, () => {
                expect(isAuthenticated()).toBe(true);
            });
        });
    });

    describe('requireAuth', () => {
        it('should throw when not authenticated', () => {
            expect(() => requireAuth()).toThrow('Not authenticated');
        });

        it('should return user info when authenticated', () => {
            const mockCtx: AuthContext = { isAuthenticated: true, userId: '123', email: 'test@test.com' };

            authStorage.run(mockCtx, () => {
                const result = requireAuth();
                expect(result.userId).toBe('123');
                expect(result.email).toBe('test@test.com');
            });
        });
    });
});
