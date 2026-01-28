import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/auth/auth.service';
import { UserService } from '../../../src/user/user.service';
import { TokenService } from '../../../src/auth/token.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthService', () => {
    let service: AuthService;
    let userService: jest.Mocked<UserService>;
    let tokenService: jest.Mocked<TokenService>;

    const mockUser = { id: 'user-123', email: 'test@test.com', password_hash: 'hash', status: 'active' as const, is_admin: false };
    const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };

    beforeEach(async () => {
        const mockUserService = {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            verifyPassword: jest.fn(),
            recordLoginAttempt: jest.fn(),
            updateLastLogin: jest.fn(),
        };

        const mockTokenService = {
            createTokenPair: jest.fn().mockResolvedValue(mockTokens),
            generateAccessToken: jest.fn().mockResolvedValue('access'),
            validateAndRotateRefreshToken: jest.fn(),
            revokeToken: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UserService, useValue: mockUserService },
                { provide: TokenService, useValue: mockTokenService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userService = module.get(UserService);
        tokenService = module.get(TokenService);
    });

    describe('register', () => {
        it('should register new user and return tokens', async () => {
            userService.findByEmail.mockResolvedValue(null);
            userService.create.mockResolvedValue(mockUser);

            const result = await service.register('test@test.com', 'password', '127.0.0.1', 'Mozilla');

            expect(result.user.email).toBe('test@test.com');
            expect(result.accessToken).toBe('access');
            expect(result.refreshToken).toBe('refresh');
        });

        it('should throw ConflictException for existing email', async () => {
            userService.findByEmail.mockResolvedValue(mockUser);

            await expect(service.register('test@test.com', 'password', '127.0.0.1', 'Mozilla'))
                .rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('should login with valid credentials', async () => {
            userService.findByEmail.mockResolvedValue(mockUser);
            userService.verifyPassword.mockResolvedValue(true);

            const result = await service.login('test@test.com', 'password', '127.0.0.1', 'Mozilla');

            expect(result.user.email).toBe('test@test.com');
            expect(result.accessToken).toBe('access');
        });

        it('should throw UnauthorizedException for non-existent user', async () => {
            userService.findByEmail.mockResolvedValue(null);

            await expect(service.login('noexist@test.com', 'password', '127.0.0.1', 'Mozilla'))
                .rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for wrong password', async () => {
            userService.findByEmail.mockResolvedValue(mockUser);
            userService.verifyPassword.mockResolvedValue(false);

            await expect(service.login('test@test.com', 'wrong', '127.0.0.1', 'Mozilla'))
                .rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for inactive user', async () => {
            userService.findByEmail.mockResolvedValue({ ...mockUser, status: 'suspended' as const });

            await expect(service.login('test@test.com', 'password', '127.0.0.1', 'Mozilla'))
                .rejects.toThrow(UnauthorizedException);
        });
    });

    describe('refresh', () => {
        it('should refresh tokens with valid refresh token', async () => {
            tokenService.validateAndRotateRefreshToken.mockResolvedValue({ userId: 'user-123', newToken: 'new-refresh' });
            userService.findById.mockResolvedValue(mockUser);

            const result = await service.refresh('old-refresh', '127.0.0.1', 'Mozilla');

            expect(result.accessToken).toBe('access');
            expect(result.refreshToken).toBe('new-refresh');
        });

        it('should throw UnauthorizedException for invalid refresh token', async () => {
            tokenService.validateAndRotateRefreshToken.mockResolvedValue(null);

            await expect(service.refresh('invalid', '127.0.0.1', 'Mozilla'))
                .rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for inactive user', async () => {
            tokenService.validateAndRotateRefreshToken.mockResolvedValue({ userId: 'user-123', newToken: 'new' });
            userService.findById.mockResolvedValue({ ...mockUser, status: 'suspended' as const });

            await expect(service.refresh('token', '127.0.0.1', 'Mozilla'))
                .rejects.toThrow(UnauthorizedException);
        });
    });

    describe('logout', () => {
        it('should revoke token', async () => {
            await service.logout('refresh-token');

            expect(tokenService.revokeToken).toHaveBeenCalledWith('refresh-token');
        });
    });
});
