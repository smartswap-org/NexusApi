import { Controller, Post, Body, UnauthorizedException, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('login')
    async login(@Body() body: any) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException();
        }
        return this.authService.login(user);
    }

    @Public()
    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body.email, body.password, body.username);
    }

    @Get('profile')
    getProfile(@Req() req) {
        return req.user;
    }
}
