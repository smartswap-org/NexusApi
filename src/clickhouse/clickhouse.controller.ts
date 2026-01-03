import { Controller, Post, Body, HttpException, HttpStatus, InternalServerErrorException, UseInterceptors } from "@nestjs/common";
import { ClickhouseService } from "./clickhouse.service";
import type { QueryRequest } from "./clickhouse.types"
import { BadRequestException } from "@nestjs/common";
import { CriticalAccessInterceptor, LogAccess } from '../security/access.interceptor';

@Controller("clickhouse")
@UseInterceptors(CriticalAccessInterceptor)
export class ClickhouseController {
    constructor(private readonly clickhouseService: ClickhouseService) { }

    @Post("query")
    @LogAccess()
    async executeQuery(@Body() queryRequest: QueryRequest) {
        try {
            const { query, params } = queryRequest;

            if (!query) {
                throw new BadRequestException()
            }

            const result = await this.clickhouseService.query(query, params);

            return {
                success: true,
                data: result,
                rowCount: result.length,
            };
        } catch (error) {
            throw new InternalServerErrorException(
                {
                    success: false,
                    message: error.message,
                    error: error.stack,
                }
            );
        }
    }
}
