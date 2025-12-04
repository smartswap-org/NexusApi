import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { TestAppModule, resetMockDb } from '../test-app.module';

function getCookies(res: request.Response): string[] {
    return res.headers['set-cookie'] || [];
}

function extractToken(cookies: string[], name: string): string {
    const cookie = cookies.find(c => c.startsWith(`${name}=`));
    return cookie?.split(';')[0].split('=')[1] || '';
}

describe('Auth E2E', () => {
    let app: INestApplication;
    const testEmail = 'test@example.com';
    const testPassword = 'SecurePass123!';
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        app.use(cookieParser());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /auth/register', () => {
        beforeEach(() => resetMockDb());

        it('should register a new user and set cookies', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: testEmail, password: testPassword })
                .expect(201);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user).toHaveProperty('email', testEmail);

            const cookies = getCookies(response);
            expect(cookies.some(c => c.startsWith('access_token='))).toBe(true);
            expect(cookies.some(c => c.startsWith('refresh_token='))).toBe(true);
            expect(cookies.some(c => c.includes('HttpOnly'))).toBe(true);
        });

        it('should reject duplicate email with 409', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: testEmail, password: testPassword });

            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: testEmail, password: testPassword })
                .expect(409);
        });

        it('should reject weak password with 400', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: 'weak@example.com', password: 'weak' })
                .expect(400);
        });

        it('should reject invalid email with 400', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: 'not-an-email', password: testPassword })
                .expect(400);
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            resetMockDb();
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: testEmail, password: testPassword });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: testEmail, password: testPassword })
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(testEmail);

            const cookies = getCookies(response);
            accessToken = extractToken(cookies, 'access_token');
            refreshToken = extractToken(cookies, 'refresh_token');
            expect(accessToken).toBeTruthy();
            expect(refreshToken).toBeTruthy();
        });

        it('should reject invalid password with 401', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: testEmail, password: 'wrongpassword' })
                .expect(401);
        });

        it('should reject non-existent user with 401', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'noexist@example.com', password: testPassword })
                .expect(401);
        });
    });

    describe('GET /auth/session', () => {
        it('should return authenticated=true with valid token', async () => {
            resetMockDb();

            const regResponse = await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: testEmail, password: testPassword });

            const cookies = getCookies(regResponse);
            const at = extractToken(cookies, 'access_token');
            const rt = extractToken(cookies, 'refresh_token');

            const response = await request(app.getHttpServer())
                .get('/auth/session')
                .set('Cookie', [`access_token=${at}`, `refresh_token=${rt}`])
                .expect(200);

            expect(response.body).toHaveProperty('authenticated', true);
            expect(response.body.user.email).toBe(testEmail);
        });

        it('should return authenticated=false without token', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/session')
                .expect(200);

            expect(response.body).toHaveProperty('authenticated', false);
        });

        it('should return authenticated=false with invalid token', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/session')
                .set('Cookie', ['access_token=invalid.jwt.token'])
                .expect(200);

            expect(response.body).toHaveProperty('authenticated', false);
        });
    });

    describe('POST /auth/refresh', () => {
        beforeEach(async () => {
            resetMockDb();
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: testEmail, password: testPassword });

            const cookies = getCookies(response);
            accessToken = extractToken(cookies, 'access_token');
            refreshToken = extractToken(cookies, 'refresh_token');
        });

        it('should issue new tokens with valid refresh token', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .set('Cookie', [`access_token=${accessToken}`, `refresh_token=${refreshToken}`])
                .expect(200);

            expect(response.body).toHaveProperty('success', true);

            const cookies = getCookies(response);
            const newAccess = extractToken(cookies, 'access_token');
            const newRefresh = extractToken(cookies, 'refresh_token');
            expect(newAccess).toBeTruthy();
            expect(newRefresh).toBeTruthy();
            expect(newRefresh).not.toBe(refreshToken); // rotation
        });

        it('should return error without refresh token', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .expect(200);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /auth/logout', () => {
        beforeEach(async () => {
            resetMockDb();
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: testEmail, password: testPassword });

            const cookies = getCookies(response);
            accessToken = extractToken(cookies, 'access_token');
            refreshToken = extractToken(cookies, 'refresh_token');
        });

        it('should clear cookies on logout', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Cookie', [`access_token=${accessToken}`, `refresh_token=${refreshToken}`])
                .expect(200);

            expect(response.body).toHaveProperty('success', true);

            const cookies = getCookies(response);
            expect(cookies.some(c => c.includes('access_token=;'))).toBe(true);
        });

        it('should invalidate session after logout', async () => {
            await request(app.getHttpServer())
                .post('/auth/logout')
                .set('Cookie', [`access_token=${accessToken}`, `refresh_token=${refreshToken}`]);

            const sessionRes = await request(app.getHttpServer())
                .get('/auth/session')
                .set('Cookie', [`access_token=${accessToken}`])
                .expect(200);

            expect(sessionRes.body).toHaveProperty('authenticated', false);
        });
    });

    describe('GET /health', () => {
        it('should return ok status', async () => {
            const response = await request(app.getHttpServer())
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'ok');
        });
    });
});
