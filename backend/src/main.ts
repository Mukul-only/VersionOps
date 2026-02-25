import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggerService } from './logger/logger.service';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  const port = configService.get('PORT');
  const nodeEnv = configService.get('NODE_ENV');

  const allowedOrigins =
    configService
      .get('ALLOWED_ORIGINS')
      ?.split(',')
      .map((origin) => origin.trim()) ?? [];

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

  /**
   * ---------------------------
   * Swagger Setup
   * ---------------------------
   */
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Your Project API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.info(`Swagger running on http://localhost:${port}/api/docs`);
  }

  await app.listen(port);

  logger.info(`Server running on http://localhost:${port} [${nodeEnv}]`);
}

void bootstrap();
