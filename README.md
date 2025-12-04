# Nexus API

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![ClickHouse](https://img.shields.io/badge/clickhouse-%23FFCC00.svg?style=for-the-badge&logo=clickhouse&logoColor=black)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

Nexus API is the backend service for the Scope application, built with NestJS.

## Environment Setup

**Important:** The `.env` file is located in the root `Scope` repository (the parent directory of this project), not inside `NexusApi`. The application is configured to look for environment variables there.

## Getting Started

### 1. Install Dependencies

```bash
npm ci
```

### 2. Build the Application

```bash
npm run build
```

### 3. Run the Application

**Development Mode:**
```bash
npm run start:dev
```

**Production Mode:**
```bash
npm run start:prod
```

### 4. Run Tests

We have a comprehensive test suite covering unit and E2E scenarios.

```bash
npm test
```

For a detailed breakdown of all tests, see [tests/modules/README.md](tests/modules/README.md).
