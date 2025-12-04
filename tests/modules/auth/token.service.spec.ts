import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from '../../../src/auth/token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('TokenService', () => {
    let service: TokenService;

    const mockPool = {
        query: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mock.jwt.token'),
        verify: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn().mockReturnValue('7'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TokenService,
                { provide: 'DATABASE_POOL', useValue: mockPool },
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<TokenService>(TokenService);
        jest.clearAllMocks();
    });

    describe('generateAccessToken', () => {
        it('should generate a jwt token', async () => {
            const token = await service.generateAccessToken('user-123', 'test@test.com');

            expect(token).toBe('mock.jwt.token');
            expect(mockJwtService.sign).toHaveBeenCalledWith({
                sub: 'user-123',
                email: 'test@test.com',
                type: 'access',
            });
        });
    });

    describe('createTokenPair', () => {
        it('should create both access and refresh tokens', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            const result = await service.createTokenPair('user-123', 'test@test.com', '127.0.0.1', 'Mozilla/5.0');

            expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
            expect(result).toHaveProperty('refreshToken');
            expect(result.refreshToken).toContain('.'); // uuid.random format
            expect(mockPool.query).toHaveBeenCalled();
        });
    });

    describe('verifyAccessToken', () => {
        it('should return payload for valid token', () => {
            const mockPayload = { sub: '123', email: 'test@test.com', type: 'access' };
            mockJwtService.verify.mockReturnValue(mockPayload);

            const result = service.verifyAccessToken('valid.token');

            expect(result).toEqual(mockPayload);
        });

        it('should return null for invalid token', () => {
            mockJwtService.verify.mockImplementation(() => { throw new Error('Invalid'); });

            const result = service.verifyAccessToken('invalid.token');

            expect(result).toBeNull();
        });
    });

    describe('hasValidSession', () => {
        it('should return true when valid session exists', async () => {
            mockPool.query.mockResolvedValue({ rows: [{ '1': 1 }] });

            const result = await service.hasValidSession('user-123');

            expect(result).toBe(true);
        });

        it('should return false when no valid session', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            const result = await service.hasValidSession('user-123');

            expect(result).toBe(false);
        });
    });

    describe('revokeToken', () => {
        it('should update token to revoked', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            await service.revokeToken('some-token');

            expect(mockPool.query).toHaveBeenCalled();
            expect(mockPool.query.mock.calls[0][0]).toContain('is_revoked = TRUE');
        });
    });

    describe('validateAndRotateRefreshToken', () => {
        it('should return null for invalid token', async () => {
            mockPool.query.mockResolvedValue({ rows: [] });

            const result = await service.validateAndRotateRefreshToken('invalid', '127.0.0.1', 'Mozilla');

            expect(result).toBeNull();
        });

        it('should rotate valid token and return new one', async () => {
            mockPool.query
                .mockResolvedValueOnce({ rows: [{ user_id: 'user-123' }] }) // validate
                .mockResolvedValueOnce({ rows: [] }) // revoke
                .mockResolvedValueOnce({ rows: [] }); // insert new

            const result = await service.validateAndRotateRefreshToken('valid-token', '127.0.0.1', 'Mozilla');

            expect(result).toHaveProperty('userId', 'user-123');
            expect(result).toHaveProperty('newToken');
            expect(mockPool.query).toHaveBeenCalledTimes(3);
        });
    });
});
