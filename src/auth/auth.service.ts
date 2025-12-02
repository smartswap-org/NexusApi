import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        @Inject('DATABASE_POOL') private pool: Pool,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(pass, user.password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async validateUserById(id: string): Promise<any> {
        const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = result.rows[0];
        if (user) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { username: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: user,
        };
    }

    async register(email: string, pass: string, username?: string) {
        const normalizedEmail = email.toLowerCase().trim();

        const existing = await this.pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
        if (existing.rows.length > 0) {
            throw new UnauthorizedException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(pass, 12);

        const result = await this.pool.query(
            'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
            [normalizedEmail, hashedPassword, username || null]
        );

        return result.rows[0];
    }
}
