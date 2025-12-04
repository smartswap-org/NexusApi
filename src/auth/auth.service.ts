import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { TokenService } from './token.service';
import type { AuthResult } from './auth.types';

@Injectable()
export class AuthService {
    constructor(
        private readonly users: UserService,
        private readonly tokens: TokenService
    ) { }

    async register(email: string, password: string, ip: string, userAgent: string): Promise<AuthResult> {
        if (await this.users.findByEmail(email)) {
            throw new ConflictException('Email already registered');
        } // if we find a user with the same email, we throw a conflict exception

        const user = await this.users.create(email, password); // create a new user
        const { accessToken, refreshToken } = await this.tokens.createTokenPair(user.id, user.email, ip, userAgent);

        return { accessToken, refreshToken, user: { id: user.id, email: user.email } }; // return the access token and refresh token and the user data
    }

    async login(email: string, password: string, ip: string, userAgent: string): Promise<AuthResult> {
        const user = await this.users.findByEmail(email); // find the user by email

        // generic error to prevent user enumeration
        if (!user || user.status !== 'active' || !(await this.users.verifyPassword(user, password))) {
            throw new UnauthorizedException('Invalid credentials'); // if the user is not found or the status is not active or the password is incorrect, we throw an unauthorized exception
        }

        const { accessToken, refreshToken } = await this.tokens.createTokenPair(user.id, user.email, ip, userAgent); // create a new token pair (means access token and refresh token)
        return { accessToken, refreshToken, user: { id: user.id, email: user.email } }; // return the access token and refresh token and the user data
    }

    async refresh(refreshToken: string, ip: string, userAgent: string): Promise<{ accessToken: string; refreshToken: string }> {
        const result = await this.tokens.validateAndRotateRefreshToken(refreshToken, ip, userAgent); // validate the refresh token and rotate it
        if (!result) throw new UnauthorizedException('Invalid refresh token'); // if the refresh token is invalid, we throw an unauthorized exception

        const user = await this.users.findById(result.userId); // find the user by id
        if (!user || user.status !== 'active') throw new UnauthorizedException('User not active'); // if the user is not found or the status is not active, we throw an unauthorized exception

        const accessToken = await this.tokens.generateAccessToken(user.id, user.email); // generate a new access token
        return { accessToken, refreshToken: result.newToken }; // return the access token and the new refresh token
    }

    async logout(refreshToken: string): Promise<void> {
        await this.tokens.revokeToken(refreshToken); // revoke the refresh token
    }
}
