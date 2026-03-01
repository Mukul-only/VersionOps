import { JwtService } from '@nestjs/jwt';
import { ConfigService } from 'src/config/config.service';
import { UserRole } from '@prisma/client';

export interface AuthJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export const generateAccessToken = (
  jwtService: JwtService,
  config: ConfigService,
  user: {
    id: string;
    email: string;
    role: UserRole;
  },
): string => {
  const secret = config.get('JWT_ACCESS_SECRET');
  const expiresIn = config.get('JWT_ACCESS_EXPIRES_IN') ?? '1d';

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET not configured');
  }

  const payload: AuthJwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return jwtService.sign(payload, {
    secret,
    expiresIn,
  });
};

export const verifyAccessToken = (
  jwtService: JwtService,
  config: ConfigService,
  token: string,
): AuthJwtPayload => {
  const secret = config.get('JWT_ACCESS_SECRET');

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET not configured');
  }

  return jwtService.verify<AuthJwtPayload>(token, { secret });
};
