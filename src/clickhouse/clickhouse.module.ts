import { Module } from "@nestjs/common";
import { ClickhouseService } from "./clickhouse.service";
import { ClickhouseController } from "./clickhouse.controller";

@Module({
    controllers: [ClickhouseController],
    providers: [ClickhouseService],
    exports: [ClickhouseService],
})
export class ClickhouseModule { }
