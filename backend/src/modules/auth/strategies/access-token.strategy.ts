import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from 'src/config/config.service';
import { UserRole } from '@prisma/client';

interface Cookies {
  [key: string]: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

const cookieExtractor = (config: ConfigService) => {
  return (req: Request): string | null => {
    if (req?.cookies) {
      const cookieName = config.get('AUTH_COOKIE_NAME') || 'access_token';
      const cookies = req.cookies as Cookies;
      return cookies[cookieName] || null;
    }
    return null;
  };
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor(config)]),
      secretOrKey: config.get('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
