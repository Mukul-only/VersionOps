import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggerService } from './logger/logger.service';
import helmet from 'helmet';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  const port = configService.get('PORT');
  const allowedOrigins = configService
    .get('ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim());

  app.setGlobalPrefix('api');
  // --- Enable API Versioning ---
  app.enableVersioning({
    type: VersioningType.URI, // /v1/...
  });

  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  app.use(helmet());

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);

  console.log(
    `Server running on http://localhost:${port} [${configService.get('NODE_ENV')}]`,
  );
}

void bootstrap();
