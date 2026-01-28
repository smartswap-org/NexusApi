export interface User {
    id: string;
    email: string;
    password_hash: string;
    is_admin: boolean;
    status: 'active' | 'suspended' | 'deleted';
    last_login: Date | null;
    created_at: Date;
    updated_at: Date;
    binance_api_token: string | null;
}

export interface UserPublic {
    id: string;
    email: string;
    is_admin: boolean;
    status: 'active' | 'suspended' | 'deleted';
    last_login: string | null;
    created_at: string;
    updated_at: string;
    has_binance_token: boolean;
}

export interface LoginAttempt {
    id: string;
    email: string;
    ip_address: string;
    device_fingerprint: string | null;
    success: boolean;
    failure_reason: string | null;
    created_at: string;
}

export interface RateLimit {
    id: string;
    identifier: string;
    identifier_type: string;
    request_count: number;
    window_start: string;
    blocked_until: string | null;
}
