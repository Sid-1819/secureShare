import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Request } from 'express';
import type { Counter } from 'prom-client';
import { RedisService } from './redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly redis: RedisService,
    @InjectMetric('rate_limit_checks_total')
    private readonly rateLimitChecksTotal: Counter,
    @InjectMetric('rate_limit_rejected_total')
    private readonly rateLimitRejectedTotal: Counter,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      request.ip ??
      request.socket?.remoteAddress ??
      'unknown';

    this.rateLimitChecksTotal.inc();
    const allowed = await this.redis.checkRateLimit(ip);
    if (!allowed) {
      this.rateLimitRejectedTotal.inc();
      throw new HttpException(
        { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: 'Too many requests' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
