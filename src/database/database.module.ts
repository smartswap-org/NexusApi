import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

@Global()
@Module({
    providers: [
        {
            provide: 'DATABASE_POOL',
            useFactory: () => {
                const user = process.env.POSTGRES_USER;
                const password = process.env.POSTGRES_PASSWORD;
                const host = process.env.POSTGRES_HOST;
                const port = process.env.POSTGRES_PORT;
                const database = process.env.POSTGRES_DB;
                if (!user) throw new Error('POSTGRES_USER must be set in .env');
                if (!password) throw new Error('POSTGRES_PASSWORD must be set in .env');
                if (!host) throw new Error('POSTGRES_HOST must be set in .env');
                if (!port) throw new Error('POSTGRES_PORT must be set in .env');
                if (!database) throw new Error('POSTGRES_DB must be set in .env');
                return new Pool({
                    user,
                    password,
                    host,
                    port: parseInt(port, 10),
                    database,
                });
            },
        },
    ],
    exports: ['DATABASE_POOL'],
})
export class DatabaseModule { }
