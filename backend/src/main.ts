import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  const allowedOrigins = configService
    .get('ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim());

  // ----------------------
  // Global Prefix
  // ----------------------
  app.setGlobalPrefix('api');

  // ----------------------
  // CORS
  // ----------------------
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // ----------------------
  // Validation
  // ----------------------
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
