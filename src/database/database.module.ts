import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

@Global()
@Module({
    providers: [
        {
            provide: 'DATABASE_POOL',
            useFactory: () => {
                return new Pool({
                    user: process.env.POSTGRES_USER,
                    password: process.env.POSTGRES_PASSWORD,
                    host: process.env.POSTGRES_HOST,
                    port: parseInt(process.env.POSTGRES_PORT!),
                    database: process.env.POSTGRES_DB,
                });
            },
        },
    ],
    exports: ['DATABASE_POOL'],
})
export class DatabaseModule { }
