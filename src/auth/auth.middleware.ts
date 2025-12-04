import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { authStorage, AuthContext } from './auth.context';
import { TokenService } from './token.service';

// runs on every request, extracts auth info and stores in async local storage
@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private readonly tokens: TokenService) { }

    async use(req: Request, _res: Response, next: NextFunction) {
        const token = req.cookies?.access_token;
        let ctx: AuthContext = { isAuthenticated: false }; // by default, the user is not authenticated

        if (token) {
            const payload = this.tokens.verifyAccessToken(token); // verify access token and return payload
            if (payload && await this.tokens.hasValidSession(payload.sub)) { // if payload is valid and user has a valid session
                ctx = { isAuthenticated: true, userId: payload.sub, email: payload.email, tokenExp: payload.exp }; // set auth context
            }
        }

        authStorage.run(ctx, () => next());
    }
}
