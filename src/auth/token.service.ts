import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { TokenPayload } from './auth.types';

@Injectable()
export class TokenService {
    private readonly expiryDays: number;

    constructor(
        @Inject('DATABASE_POOL') private readonly db: Pool, // database pool (postgres)
        private readonly jwt: JwtService, // jwt service
        config: ConfigService // config service
    ) {
        this.expiryDays = parseInt(config.get('NEXUS_REFRESH_TOKEN_EXPIRY_DAYS') || '7', 10);
    }

    // combines ip + user agent into a hash to identify device
    private fingerprint(ip: string, ua: string) {
        return createHash('sha256').update(`${ip}:${ua}`).digest('hex').substring(0, 32);
    }

    // never store raw tokens, only hashes
    private hash(token: string) {
        return createHash('sha256').update(token).digest('hex');
    }

    // creates rs256 signed jwt
    async generateAccessToken(userId: string, email: string) {
        return this.jwt.sign({ sub: userId, email, type: 'access' } as TokenPayload);
    }

    // create both tokens at once
    async createTokenPair(userId: string, email: string, ip: string, ua: string) {
        return {
            accessToken: await this.generateAccessToken(userId, email),
            refreshToken: await this.createRefreshToken(userId, ip, ua),
        };
    }

    // creates a random token and stores its hash in db
    private async createRefreshToken(userId: string, ip: string, ua: string) {
        const raw = `${uuidv4()}.${randomBytes(32).toString('hex')}`;
        const expires = new Date();
        expires.setDate(expires.getDate() + this.expiryDays);

        await this.db.query(
            'INSERT INTO refresh_tokens (user_id, token_hash, device_fingerprint, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, this.hash(raw), this.fingerprint(ip, ua), ip, ua, expires]
        );

        return raw;
    }

    // validates token and rotates it (old becomes invalid, new is created)
    async validateAndRotateRefreshToken(raw: string, ip: string, ua: string): Promise<{ userId: string; newToken: string } | null> {
        const hash = this.hash(raw);
        const fp = this.fingerprint(ip, ua);

        // validate: must match hash + fingerprint + not revoked + not expired
        const { rows } = await this.db.query(
            'SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND device_fingerprint = $2 AND is_revoked = FALSE AND expires_at > NOW()',
            [hash, fp]
        );
        if (!rows[0]) return null;

        // revoke old, create new (rotation)
        await this.db.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1', [hash]);
        return { userId: rows[0].user_id, newToken: await this.createRefreshToken(rows[0].user_id, ip, ua) };
    }

    // mark token as revoked (used on logout)
    async revokeToken(raw: string) {
        await this.db.query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_hash = $1', [this.hash(raw)]);
    }

    // checks if user has any valid refresh token (used by middleware)
    async hasValidSession(userId: string) {
        const { rows } = await this.db.query(
            'SELECT 1 FROM refresh_tokens WHERE user_id = $1 AND is_revoked = FALSE AND expires_at > NOW() LIMIT 1',
            [userId]
        );
        return rows.length > 0;
    }

    // verify jwt signature and return payload (null if invalid/expired)
    verifyAccessToken(token: string): TokenPayload | null {
        try {
            return this.jwt.verify<TokenPayload>(token);
        } catch {
            return null;
        }
    }
}
