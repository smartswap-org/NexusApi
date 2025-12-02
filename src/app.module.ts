import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
