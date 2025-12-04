import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { AuthMiddleware } from './auth.middleware';

@Module({
    imports: [
        UserModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => {
                const privateKey = config.get<string>('NEXUS_JWT_PRIVATE_KEY');
                const publicKey = config.get<string>('NEXUS_JWT_PUBLIC_KEY');

                if (!privateKey || !publicKey) {
                    throw new Error('NEXUS_JWT_PRIVATE_KEY and NEXUS_JWT_PUBLIC_KEY must be set in environment');
                }

                return {
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                    publicKey: publicKey.replace(/\\n/g, '\n'),
                    signOptions: {
                        algorithm: 'RS256' as const,
                        expiresIn: config.get('NEXUS_ACCESS_TOKEN_EXPIRY') as any,
                    },
                    verifyOptions: { algorithms: ['RS256'] as const },
                };
            },
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, TokenService],
    exports: [AuthService, TokenService],
})
export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes('*');
    }
}
