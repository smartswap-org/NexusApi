// returned after login/register
export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; is_admin: boolean };
}


export interface TokenPayload {
    sub: string;
    email: string;
    is_admin: boolean;
    type: 'access';
    iat?: number; // issued at timestamp
    exp?: number; // expiration timestamp
}
