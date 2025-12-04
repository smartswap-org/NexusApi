import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ClickhouseModule } from './clickhouse/clickhouse.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UserModule,
    HealthModule,
    ClickhouseModule,
    AuthModule,
  ],
})
export class AppModule { }
