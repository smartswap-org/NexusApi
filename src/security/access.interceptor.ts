import { Injectable, NestInterceptor, ExecutionContext, CallHandler, SetMetadata } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ClickhouseService } from '../clickhouse/clickhouse.service';
import { getAuthContext } from '../auth/auth.context';

export const LOG_ACCESS_KEY = 'log_access';
export const LogAccess = () => SetMetadata(LOG_ACCESS_KEY, true);

interface CriticalAccessLog {
    endpoint: string;
    method: string;
    requester_id: string;
    target_user_id: string | null;
    ip_address: string;
    user_agent: string;
    status_code: number;
    response_time_ms: number;
}

@Injectable()
export class CriticalAccessInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly clickhouse: ClickhouseService,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const shouldLog = this.reflector.get<boolean>(LOG_ACCESS_KEY, context.getHandler());

        if (!shouldLog) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();

        const ctx = getAuthContext();
        const requesterId = ctx.userId || 'anonymous';

        // extract target user id from params, query, or body
        const targetUserId = request.params?.userId
            || request.query?.userId
            || request.body?.userId
            || request.body?.email
            || null;

        const ip = (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
            || request.socket?.remoteAddress
            || 'unknown';
        const userAgent = request.headers['user-agent'] || 'unknown';
        const endpoint = request.route?.path || request.url;
        const method = request.method;

        return next.handle().pipe(
            tap({
                next: () => {
                    this.logAccess({
                        endpoint,
                        method,
                        requester_id: requesterId,
                        target_user_id: targetUserId,
                        ip_address: ip,
                        user_agent: userAgent,
                        status_code: response.statusCode,
                        response_time_ms: Date.now() - startTime,
                    });
                },
                error: (error) => {
                    this.logAccess({
                        endpoint,
                        method,
                        requester_id: requesterId,
                        target_user_id: targetUserId,
                        ip_address: ip,
                        user_agent: userAgent,
                        status_code: error.status || 500,
                        response_time_ms: Date.now() - startTime,
                    });
                },
            }),
        );
    }

    private async logAccess(log: CriticalAccessLog): Promise<void> {
        try {
            await this.clickhouse.insert('critical_data_access', [log]);
        } catch (error) {
            // don't throw - logging failure shouldn't break the request
            console.error('Failed to log critical access:', error.message);
        }
    }
}
