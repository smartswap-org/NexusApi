import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as argon2 from 'argon2';
import type { User } from './user.types';

@Injectable()
export class UserService {
    constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) { }

    async findByEmail(email: string): Promise<User | null> {
        const { rows } = await this.pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        return rows[0] || null;
    }

    async findById(id: string): Promise<User | null> {
        const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return rows[0] || null;
    }

    async create(email: string, password: string): Promise<User> {
        // argon2id = best password hashing algorithm (memory-hard, gpu-resistant)
        const hash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
        const { rows } = await this.pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *', [email.toLowerCase(), hash]);
        return rows[0];
    }

    async verifyPassword(user: User, password: string): Promise<boolean> {
        return argon2.verify(user.password_hash, password);
    }

    async updatePassword(userId: string, newPassword: string): Promise<void> {
        const hash = await argon2.hash(newPassword, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
        await this.pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    }

    async getLoginAttempts(email: string, limit: number = 20): Promise<any[]> {
        const { rows } = await this.pool.query(
            `SELECT id, email, ip_address, device_fingerprint, success, failure_reason, created_at 
             FROM login_attempts 
             WHERE email = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [email.toLowerCase(), limit]
        );
        return rows;
    }

    async getRateLimits(identifier: string): Promise<any[]> {
        const { rows } = await this.pool.query(
            `SELECT id, identifier, identifier_type, request_count, window_start, blocked_until 
             FROM rate_limits 
             WHERE identifier = $1 
             ORDER BY window_start DESC`,
            [identifier]
        );
        return rows;
    }

    async updateLastLogin(userId: string): Promise<void> {
        await this.pool.query(
            'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1',
            [userId]
        );
    }

    async recordLoginAttempt(
        email: string,
        ip: string,
        fingerprint: string | null,
        success: boolean,
        failureReason?: string
    ): Promise<void> {
        await this.pool.query(
            `INSERT INTO login_attempts (email, ip_address, device_fingerprint, success, failure_reason) 
             VALUES ($1, $2, $3, $4, $5)`,
            [email.toLowerCase(), ip, fingerprint, success, failureReason || null]
        );
    }

    async setBinanceToken(userId: string, token: string | null): Promise<void> {
        const hashed =
            token === null
                ? null
                : await argon2.hash(token, {
                      type: argon2.argon2id,
                      memoryCost: 65536,
                      timeCost: 3,
                      parallelism: 4,
                  });

        await this.pool.query(
            'UPDATE users SET binance_api_token = $1, updated_at = NOW() WHERE id = $2',
            [hashed, userId]
        );
    }
}
