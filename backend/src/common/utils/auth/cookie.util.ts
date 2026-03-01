import { Response } from 'express';
import { ConfigService } from 'src/config/config.service';

type SameSite = 'strict' | 'lax' | 'none';

interface BaseCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: SameSite;
  path: string;
  maxAge?: number;
}

const getBaseOptions = (config: ConfigService): BaseCookieOptions => {
  return {
    httpOnly: true,
    secure: config.get('AUTH_COOKIE_SECURE'),
    sameSite: config.get('AUTH_COOKIE_SAMESITE').toLowerCase() as SameSite,
    path: config.get('AUTH_COOKIE_PATH'),
  };
};

export const getAccessCookieOptions = (config: ConfigService) => {
  const base = getBaseOptions(config);
  const expires = config.get('JWT_ACCESS_EXPIRES_IN');

  return {
    ...base,
    maxAge: parseExpiresToMs(expires),
  };
};

export const clearAuthCookie = (res: Response, config: ConfigService) => {
  const base = getBaseOptions(config);
  res.clearCookie(config.get('AUTH_COOKIE_NAME'), base);
};

const parseExpiresToMs = (val: string): number => {
  if (!val) return 0;

  const num = parseInt(val, 10);
  if (isNaN(num)) return 0;

  if (val.endsWith('d')) return num * 24 * 60 * 60 * 1000;
  if (val.endsWith('h')) return num * 60 * 60 * 1000;
  if (val.endsWith('m')) return num * 60 * 1000;
  if (val.endsWith('s')) return num * 1000;

  return 0;
};
