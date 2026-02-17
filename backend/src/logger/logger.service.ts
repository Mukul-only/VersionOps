import { Injectable } from '@nestjs/common';
import pino, { Logger as PinoLogger } from 'pino';
import { ConfigService } from '../config/config.service';

@Injectable()
export class LoggerService {
  private readonly logger: PinoLogger;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    const nodeEnv = this.configService.get('NODE_ENV');
    const logLevel = this.configService.get('LOG_LEVEL');

    this.isProduction = nodeEnv === 'production';

    this.logger = pino({
      level: logLevel,
      timestamp: pino.stdTimeFunctions.isoTime,
      transport: !this.isProduction
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
              levelFirst: true,
            },
          }
        : undefined,
    });
  }

  info(message: string, meta?: unknown) {
    this.logger.info(meta ?? {}, message);
  }

  warn(message: string, meta?: unknown) {
    this.logger.warn(meta ?? {}, message);
  }

  debug(message: string, meta?: unknown) {
    this.logger.debug(meta ?? {}, message);
  }

  error(message: string, meta?: unknown) {
    this.logger.error(meta ?? {}, message);
  }
}
