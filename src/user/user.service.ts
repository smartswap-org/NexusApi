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
}
