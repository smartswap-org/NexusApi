import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus, UnauthorizedException, UseInterceptors } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { getAuthContext } from './auth.context';
import { CriticalAccessInterceptor, LogAccess } from '../security/access.interceptor';

@Controller('auth')
@UseInterceptors(CriticalAccessInterceptor)
export class AuthController {
    private readonly cookieOpts: { httpOnly: boolean; secure: boolean; sameSite: 'lax'; path: string };

    constructor(private readonly auth: AuthService, config: ConfigService) {
        this.cookieOpts = { httpOnly: true, secure: config.get('ENV') === 'prod', sameSite: 'lax', path: '/' };
    }

    private setTokens(res: Response, access: string, refresh: string) {
        res.cookie('access_token', access, { ...this.cookieOpts, maxAge: 10 * 60 * 1000 }); // max age of a access token : 10 mins 
        res.cookie('refresh_token', refresh, { ...this.cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 }); // max age of a refresh token : 1 week 
    }

    private clearTokens(res: Response) {
        res.clearCookie('access_token', this.cookieOpts); // clear access token cookie
        res.clearCookie('refresh_token', this.cookieOpts); // clear refresh token cookie
    }

    private clientInfo(req: Request) {
        return {
            ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown', // get ip from request headers or socket remote address or unknown
            ua: req.headers['user-agent'] || 'unknown', // get user agent from request headers or unknown
            // example : Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
        };
    }

    @Post('register')
    @LogAccess()
    async register(@Body() { email, password }: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const { ip, ua } = this.clientInfo(req); // get ip and user agent from request
        const result = await this.auth.register(email, password, ip, ua); // register user and return access token and refresh token
        this.setTokens(res, result.accessToken, result.refreshToken); // set access token and refresh token in response cookies
        return { user: result.user }; // return user data
    }

    @Post('login')
    @LogAccess()
    @HttpCode(HttpStatus.OK)
    async login(@Body() { email, password }: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const { ip, ua } = this.clientInfo(req); // get ip and user agent from request
        const result = await this.auth.login(email, password, ip, ua); // login user and return access token and refresh token
        this.setTokens(res, result.accessToken, result.refreshToken); // set access token and refresh token in response cookies
        return { user: result.user }; // return user data
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const token = req.cookies?.refresh_token; // get refresh token from request cookies
        if (!token) { this.clearTokens(res); return { error: 'No token' }; } // if no token, clear tokens and return error

        try {
            const { ip, ua } = this.clientInfo(req); // get ip and user agent from request
            const result = await this.auth.refresh(token, ip, ua); // refresh token and return access token and refresh token
            this.setTokens(res, result.accessToken, result.refreshToken); // set access token and refresh token in response cookies
            return { success: true }; // return success
        } catch {
            this.clearTokens(res); // clear tokens
            throw new UnauthorizedException('Invalid token'); // throw unauthorized exception
        }
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const token = req.cookies?.refresh_token; // get refresh token from request cookies
        if (token) await this.auth.logout(token); // logout user if token exists
        this.clearTokens(res); // clear tokens
        return { success: true }; // return success
    }

    @Get('session')
    @LogAccess()
    getSession() {
        const ctx = getAuthContext(); // get auth context from async local storage
        return ctx.isAuthenticated
            ? { authenticated: true, user: { id: ctx.userId, email: ctx.email, is_admin: ctx.is_admin } }
            : { authenticated: false };
        // return authenticated status and user data if authenticated, otherwise return false
    }

    @Post('change-password')
    @LogAccess()
    @HttpCode(HttpStatus.OK)
    async changePassword(@Body() { currentPassword, newPassword }: ChangePasswordDto) {
        const ctx = getAuthContext();
        if (!ctx.isAuthenticated || !ctx.userId) {
            throw new UnauthorizedException('Not authenticated');
        }
        return this.auth.changePassword(ctx.userId, currentPassword, newPassword);
    }
}
