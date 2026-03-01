import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Joi from 'joi';

export interface AppConfig {
  DATABASE_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;

  FRONTEND_URL: string;
  ALLOWED_ORIGINS: string;

  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  SUPER_ADMIN_NAME: string;

  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
}

@Injectable()
export class ConfigService {
  private readonly config: AppConfig;

  constructor() {
    let envFile = `.env.${process.env.NODE_ENV || 'development'}`;
    if (!fs.existsSync(envFile)) {
      envFile = '.env';
    }

    dotenv.config({ path: envFile });

    const schema = Joi.object<AppConfig>({
      DATABASE_URL: Joi.string().required(),

      NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),

      PORT: Joi.number().default(3333),

      FRONTEND_URL: Joi.string().required(),
      ALLOWED_ORIGINS: Joi.string().required(),

      SUPER_ADMIN_EMAIL: Joi.string().email().required(),
      SUPER_ADMIN_NAME: Joi.string().required(),
      SUPER_ADMIN_PASSWORD: Joi.string().min(8).required(),

      JWT_SECRET: Joi.string().required(),
      JWT_EXPIRES_IN: Joi.string().required(),

      LOG_LEVEL: Joi.string()
        .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace')
        .default('debug'),
    }).unknown(true);

    const validationResult = schema.validate(process.env, {
      abortEarly: false,
    });

    if (validationResult.error) {
      throw new Error(
        `Config validation error: ${validationResult.error.message}`,
      );
    }

    this.config = validationResult.value;
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }
}
