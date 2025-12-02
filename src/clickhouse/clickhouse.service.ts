import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, ClickHouseClient } from "@clickhouse/client";

@Injectable()
export class ClickhouseService implements OnModuleInit {
  private client: ClickHouseClient;
  private readonly logger = new Logger(ClickhouseService.name);

  constructor(private configService: ConfigService) { }

  async onModuleInit() {
    const host = this.configService.get<string>("CLICKHOUSE_HOST");
    const port = this.configService.get<number>("CLICKHOUSE_PORT");
    const username = this.configService.get<string>("CLICKHOUSE_USER");
    const password = this.configService.get<string>("CLICKHOUSE_PASSWORD");

    this.client = createClient({
      url: `http://${host}:${port}`,
      username,
      password,
    });

    this.logger.log(`ClickHouse client initialized for ${host}:${port}`);
  }

  getClient(): ClickHouseClient {
    return this.client;
  }

  async query<T = any>(query: string, params?: Record<string, any>): Promise<T[]> {
    try {
      const resultSet = await this.client.query({
        query,
        query_params: params,
        format: "JSONEachRow",
      });

      const data = await resultSet.json<T>();
      return data;
    } catch (error) {
      this.logger.error(`Query failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async insert(table: string, values: any[]): Promise<void> {
    try {
      await this.client.insert({
        table,
        values,
        format: "JSONEachRow",
      });
      this.logger.log(`Inserted ${values.length} rows into ${table}`);
    } catch (error) {
      this.logger.error(`Insert failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
