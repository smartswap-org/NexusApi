import { Module, Global } from '@nestjs/common';
import { CriticalAccessInterceptor } from './access.interceptor';
import { ClickhouseModule } from '../clickhouse/clickhouse.module';

@Global()
@Module({
    imports: [ClickhouseModule],
    providers: [CriticalAccessInterceptor],
    exports: [CriticalAccessInterceptor],
})
export class SecurityModule { }
