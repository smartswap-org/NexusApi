import { Module, MiddlewareConsumer, NestModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

// auth components
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { TokenService } from '../../src/auth/token.service';
import { AuthMiddleware } from '../../src/auth/auth.middleware';

// clickhouse (mocked)
import { ClickhouseService } from '../../src/clickhouse/clickhouse.service';

// user components
import { UserService } from '../../src/user/user.service';

// health components
import { HealthController } from '../../src/health/health.controller';
import { HealthService } from '../../src/health/health.service';

// mock utilities
import { mockPool, resetMockDb } from '../mockDb/pool';
import { TEST_PRIVATE_KEY, TEST_PUBLIC_KEY } from '../mockDb/keys';

// shared providers module - ensures singletons across app
@Global()
@Module({
    imports: [
        JwtModule.register({
            privateKey: TEST_PRIVATE_KEY,
            publicKey: TEST_PUBLIC_KEY,
            signOptions: { algorithm: 'RS256', expiresIn: '10m' },
            verifyOptions: { algorithms: ['RS256'] },
        }),
    ],
    providers: [
        { provide: 'DATABASE_POOL', useValue: mockPool },
        // CriticalAccessInterceptor depends on ClickhouseService; mock it for tests.
        {
            provide: ClickhouseService,
            useValue: {
                insert: async () => undefined,
                query: async () => [],
            },
        },
        ConfigService,
    ],
    exports: ['DATABASE_POOL', JwtModule, ConfigService, ClickhouseService],
})
class SharedTestModule { }

@Module({
    imports: [
        SharedTestModule,
        ConfigModule.forRoot({
            isGlobal: true,
            load: [() => ({
                ENV: 'dev',
                ACCESS_TOKEN_EXPIRY: '10m',
                REFRESH_TOKEN_EXPIRY_DAYS: '7',
            })],
        }),
    ],
    controllers: [AuthController, HealthController],
    providers: [
        AuthService,
        TokenService,
        UserService,
        HealthService,
        AuthMiddleware,
    ],
})
export class TestAppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes('*');
    }
}

export { resetMockDb };
