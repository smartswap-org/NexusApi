import { Controller, Get, Query, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { getAuthContext } from '../auth/auth.context';
import type { UserPublic, LoginAttempt, RateLimit } from './user.types';
import { CriticalAccessInterceptor, LogAccess } from '../security/access.interceptor';

@Controller('user')
@UseInterceptors(CriticalAccessInterceptor)
export class UserController {
    constructor(private readonly users: UserService) { }

    @Get('info')
    @LogAccess()
    async getUserInfo(): Promise<UserPublic> {
        const ctx = getAuthContext();
        if (!ctx.isAuthenticated || !ctx.userId) {
            throw new UnauthorizedException('Not authenticated');
        }

        const user = await this.users.findById(ctx.userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            is_admin: user.is_admin,
            status: user.status,
            last_login: user.last_login?.toISOString() || null,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString(),
        };
    }

    @Get('login-attempts')
    @LogAccess()
    async getLoginAttempts(@Query('limit') limit?: string): Promise<LoginAttempt[]> {
        const ctx = getAuthContext();
        if (!ctx.isAuthenticated || !ctx.email) {
            throw new UnauthorizedException('Not authenticated');
        }

        const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;
        return this.users.getLoginAttempts(ctx.email, parsedLimit);
    }

    @Get('rate-limits')
    @LogAccess()
    async getRateLimits(): Promise<RateLimit[]> {
        const ctx = getAuthContext();
        if (!ctx.isAuthenticated || !ctx.email) {
            throw new UnauthorizedException('Not authenticated');
        }

        return this.users.getRateLimits(ctx.email);
    }
}
