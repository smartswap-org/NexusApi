import { Module, Global } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ClickhouseModule } from '../clickhouse/clickhouse.module';

@Global()
@Module({
    imports: [ClickhouseModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule { }

