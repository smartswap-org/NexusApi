// in-memory storage for users and tokens
let users: Map<string, any> = new Map();
let refreshTokens: Map<string, any> = new Map();
let tokenIdCounter = 0;

// reset storage between test suites
export function resetMockDb() {
    users.clear();
    refreshTokens.clear();
    tokenIdCounter = 0;
}

// mock pg pool that handles auth queries
export const mockPool = {
    query: jest.fn(async (sql: string, params?: any[]) => {
        const query = sql.toLowerCase().trim();
        // find user by email
        if (query.includes('from users') && query.includes('where') && query.includes('email')) {
            const email = params?.[0]?.toLowerCase();
            const user = Array.from(users.values()).find(u => u.email === email);
            return { rows: user ? [user] : [] };
        }

        // find user by id
        if (query.includes('from users') && query.includes('where') && query.includes('id =')) {
            const user = users.get(params?.[0]);
            return { rows: user ? [user] : [] };
        }

        // create user
        if (query.includes('insert into users')) {
            const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const user = { id, email: params?.[0], password_hash: params?.[1], status: 'active' };
            users.set(id, user);
            return { rows: [user] };
        }

        // create refresh token
        if (query.includes('insert into refresh_tokens')) {
            const token = {
                id: `token-${++tokenIdCounter}`,
                user_id: params?.[0],
                token_hash: params?.[1],
                device_fingerprint: params?.[2],
                ip_address: params?.[3],
                user_agent: params?.[4],
                expires_at: params?.[5],
                is_revoked: false,
            };
            refreshTokens.set(token.token_hash, token);
            return { rows: [token] };
        }

        // check if user has valid session
        if (query.includes('select 1') && query.includes('refresh_tokens') && query.includes('user_id')) {
            const userId = params?.[0];
            const hasValid = Array.from(refreshTokens.values()).some(
                t => t.user_id === userId && !t.is_revoked && new Date(t.expires_at) > new Date()
            );
            return { rows: hasValid ? [{ '1': 1 }] : [] };
        }

        // validate refresh token
        if (query.includes('select user_id') && query.includes('refresh_tokens') && query.includes('token_hash')) {
            const hash = params?.[0];
            const fp = params?.[1];
            const token = refreshTokens.get(hash);

            if (token && !token.is_revoked && new Date(token.expires_at) > new Date()) {
                if (!fp || token.device_fingerprint === fp) {
                    return { rows: [{ user_id: token.user_id }] };
                }
            }
            return { rows: [] };
        }

        // revoke refresh token
        if (query.includes('update refresh_tokens') && query.includes('is_revoked')) {
            const hash = params?.[0];
            const token = refreshTokens.get(hash);
            if (token) token.is_revoked = true;
            return { rows: [], rowCount: token ? 1 : 0 };
        }

        return { rows: [] };
    }),
};
