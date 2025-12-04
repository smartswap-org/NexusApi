// returned after login/register
export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string };
}


export interface TokenPayload { 
    sub: string; 
    email: string; 
    type: 'access'; 
    iat?: number; // issued at timestamp
    exp?: number; // expiration timestamp
}
