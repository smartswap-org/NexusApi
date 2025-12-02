import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { ClickhouseModule } from "./clickhouse/clickhouse.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    ClickhouseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
