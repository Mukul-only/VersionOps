import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '../config/config.service';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    const connectionString: string = configService.get('DATABASE_URL');

    const pool: Pool = new Pool({
      connectionString,
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log:
        configService.get('NODE_ENV') === 'development'
          ? ['query', 'warn', 'error']
          : ['warn', 'error'],
    });

    process.setMaxListeners(30);
  }

  async onModuleInit(): Promise<void> {
    this.logger.info('Initializing Prisma Service...');
    try {
      await this.$connect();
      this.logger.info('[success] Prisma connected');
    } catch (err) {
      this.logger.error('[fail] Prisma connection failed', err);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.warn('Shutting down Prisma Service...');
    try {
      await this.$disconnect();
      this.logger.warn('[success] Prisma disconnected');
    } catch (err) {
      this.logger.error('[fail] Prisma disconnect failed', err);
    }
  }
}
