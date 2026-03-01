import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggerService } from './logger/logger.service';

import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  const port = configService.get('PORT');
  const nodeEnv = configService.get('NODE_ENV');

  /* =========================================================
     Body Size Limits
  ========================================================= */
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  /* =========================================================
     Global Prefix & Versioning
  ========================================================= */
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI, // /api/v1/...
  });

  /* =========================================================
     Security Middlewares
  ========================================================= */
  app.use(helmet());

  // REQUIRED for cookie-based JWT auth
  app.use(cookieParser());

  /* =========================================================
     CORS (Cookie-Safe Setup)
  ========================================================= */
  const allowedOrigins =
    configService
      .get('ALLOWED_ORIGINS')
      ?.split(',')
      .map((origin) => origin.trim()) ?? [];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked for origin: ${String(origin)}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // REQUIRED for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  /* =========================================================
     Global Pipes / Filters / Interceptors
  ========================================================= */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter(logger));

  /* =========================================================
     Swagger Setup
  ========================================================= */
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Leaderboard API')
      .setDescription('API documentation for Leaderboard System')
      .setVersion('1.0')
      // For cookie-based auth, this enables the lock icon
      .addCookieAuth('AUTH_COOKIE_NAME')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.info(`Swagger running on http://localhost:${port}/api/docs`);
  }

  /* =========================================================
     Start Server
  ========================================================= */
  await app.listen(port);

  logger.info(`Server running on http://localhost:${port} [${nodeEnv}]`);
}

void bootstrap();
