import { Controller, Post, Body, HttpException, HttpStatus, InternalServerErrorException } from "@nestjs/common";
import { ClickhouseService } from "./clickhouse.service";
import type { QueryRequest } from "./clickhouse.types"
import { BadRequestException } from "@nestjs/common";

@Controller("clickhouse")
export class ClickhouseController {
    constructor(private readonly clickhouseService: ClickhouseService) { }

    @Post("query")
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
