# Tests
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

| Suite | Path | Test Case | Description |
|-------|------|-----------|-------------|
| **Auth Context** | `auth/auth.context.spec.ts` | `getAuthContext` | Should return unauthenticated context when not in storage |
| **Auth Context** | `auth/auth.context.spec.ts` | `getAuthContext` | Should return stored context when in storage |
| **Auth Context** | `auth/auth.context.spec.ts` | `isAuthenticated` | Should return false when not authenticated |
| **Auth Context** | `auth/auth.context.spec.ts` | `isAuthenticated` | Should return true when authenticated |
| **Auth Context** | `auth/auth.context.spec.ts` | `requireAuth` | Should throw when not authenticated |
| **Auth Context** | `auth/auth.context.spec.ts` | `requireAuth` | Should return user info when authenticated |
| **Auth Service** | `auth/auth.service.spec.ts` | `register` | Should register new user and return tokens |
| **Auth Service** | `auth/auth.service.spec.ts` | `register` | Should throw ConflictException for existing email |
| **Auth Service** | `auth/auth.service.spec.ts` | `login` | Should login with valid credentials |
| **Auth Service** | `auth/auth.service.spec.ts` | `login` | Should throw UnauthorizedException for non-existent user |
| **Auth Service** | `auth/auth.service.spec.ts` | `login` | Should throw UnauthorizedException for wrong password |
| **Auth Service** | `auth/auth.service.spec.ts` | `login` | Should throw UnauthorizedException for inactive user |
| **Auth Service** | `auth/auth.service.spec.ts` | `refresh` | Should refresh tokens with valid refresh token |
| **Auth Service** | `auth/auth.service.spec.ts` | `refresh` | Should throw UnauthorizedException for invalid refresh token |
| **Auth Service** | `auth/auth.service.spec.ts` | `refresh` | Should throw UnauthorizedException for inactive user |
| **Auth Service** | `auth/auth.service.spec.ts` | `logout` | Should revoke token |
| **Token Service** | `auth/token.service.spec.ts` | `generateAccessToken` | Should generate a jwt token |
| **Token Service** | `auth/token.service.spec.ts` | `createTokenPair` | Should create both access and refresh tokens |
| **Token Service** | `auth/token.service.spec.ts` | `verifyAccessToken` | Should return payload for valid token |
| **Token Service** | `auth/token.service.spec.ts` | `verifyAccessToken` | Should return null for invalid token |
| **Token Service** | `auth/token.service.spec.ts` | `hasValidSession` | Should return true when valid session exists |
| **Token Service** | `auth/token.service.spec.ts` | `hasValidSession` | Should return false when no valid session |
| **Token Service** | `auth/token.service.spec.ts` | `revokeToken` | Should update token to revoked |
| **Token Service** | `auth/token.service.spec.ts` | `validateAndRotateRefreshToken` | Should return null for invalid token |
| **Token Service** | `auth/token.service.spec.ts` | `validateAndRotateRefreshToken` | Should rotate valid token and return new one |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `POST /auth/register` | Should register a new user and set cookies |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `POST /auth/register` | Should reject duplicate email with 409 |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `POST /auth/register` | Should reject weak password with 400 |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `POST /auth/register` | Should reject invalid email with 400 |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `POST /auth/login` | Should login with valid credentials |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `POST /auth/login` | Should reject invalid password with 401 |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `POST /auth/login` | Should reject non-existent user with 401 |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `GET /auth/session` | Should return authenticated=true with valid token |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `GET /auth/session` | Should return authenticated=false without token |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `GET /auth/session` | Should return authenticated=false with invalid token |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `POST /auth/refresh` | Should issue new tokens with valid refresh token |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `POST /auth/refresh` | Should return error without refresh token |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `POST /auth/logout` | Should clear cookies on logout |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `POST /auth/logout` | Should invalidate session after logout |
| **Auth E2E** | `auth/auth.e2e.spec.ts` | `GET /health` | Should return ok status |
