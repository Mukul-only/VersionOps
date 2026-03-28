import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

import {
  verifyPassword,
  hashPassword,
} from 'src/common/utils/auth/password.util';
import { generateAccessToken } from 'src/common/utils/auth/jwt.util';
import { clearAuthCookie } from 'src/common/utils/auth/cookie.util';

import { ConfigService } from 'src/config/config.service';
import { LoggerService } from 'src/logger/logger.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly entity = 'Auth';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /* REGISTER */
  /* -------------------------------------------------------------------------- */

  async register(dto: RegisterDto): Promise<{
    accessToken: string;
    user: AuthResponseDto;
  }> {
    try {
      this.logger.info('User registration attempt', {
        email: dto.email,
      });

      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });

      if (existingUser) {
        this.logger.warn('Registration failed: email already exists', {
          email: dto.email,
        });
        throw new ConflictException('Email already registered');
      }

      // Hash password
      const hashedPassword = await hashPassword(dto.password);

      // Create user with PARTICIPANT role by default
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          role: UserRole.PARTICIPANT,
        },
      });

      // Link to participant if exists
      await this.prisma.participant.updateMany({
        where: {
          email: user.email,
          userId: null,
        },
        data: {
          userId: user.id,
        },
      });

      // Generate access token
      const accessToken = generateAccessToken(
        this.jwtService,
        this.configService,
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      );

      this.logger.info('User registration successful', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error: unknown) {
      if (!(error instanceof ConflictException)) {
        this.logger.error('Unexpected error during registration', {
          email: dto.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /* LOGIN */
  /* -------------------------------------------------------------------------- */

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    user: AuthResponseDto;
  }> {
    try {
      this.logger.info('User login attempt', {
        email: dto.email,
      });

      const user = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });

      if (!user) {
        this.logger.warn('Login failed: email not found', {
          email: dto.email,
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await verifyPassword(dto.password, user.password);

      if (!isPasswordValid) {
        this.logger.warn('Login failed: incorrect password', {
          email: dto.email,
          userId: user.id,
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.role === UserRole.PARTICIPANT) {
        await this.prisma.participant.updateMany({
          where: {
            email: user.email,
            userId: null,
          },
          data: {
            userId: user.id,
          },
        });
      }

      const accessToken = generateAccessToken(
        this.jwtService,
        this.configService,
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      );

      this.logger.info('User login successful', {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error: unknown) {
      if (!(error instanceof UnauthorizedException)) {
        this.logger.error('Unexpected error during login', {
          email: dto.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      throw error;
    }
  }

  /* -------------------------------------------------------------------------- */
  /* LOGOUT */
  /* -------------------------------------------------------------------------- */

  logout(res: Response): { message: string } {
    try {
      this.logger.info('User logout initiated');

      clearAuthCookie(res, this.configService);

      this.logger.info('User logout successful');

      return { message: 'Logged out successfully' };
    } catch (error: unknown) {
      this.logger.error('Logout failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new UnauthorizedException('Logout failed');
    }
  }

  /* -------------------------------------------------------------------------- */
  /* GET ME */
  /* -------------------------------------------------------------------------- */

  async getMe(userId: string): Promise<AuthResponseDto> {
    try {
      this.logger.debug('Fetching authenticated user', { userId });

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn('getMe failed: invalid user', {
          userId,
        });
        throw new UnauthorizedException('Unauthorized');
      }

      this.logger.debug('Authenticated user fetched successfully', {
        userId: user.id,
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    } catch (error: unknown) {
      if (!(error instanceof UnauthorizedException)) {
        this.logger.error('Error fetching authenticated user', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      throw error;
    }
  }
}
