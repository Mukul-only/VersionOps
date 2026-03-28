import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './gaurds/jwt-auth.gaurd';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { getAccessCookieOptions } from 'src/common/utils/auth/cookie.util';
import { ConfigService } from 'src/config/config.service';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /* =========================================================
     REGISTER
  ========================================================= */

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description:
      'Registration successful. Returns user and sets HttpOnly cookie.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.register(dto);

    res.cookie(
      this.configService.get('AUTH_COOKIE_NAME'),
      accessToken,
      getAccessCookieOptions(this.configService),
    );

    return user;
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns user and sets HttpOnly cookie.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, user } = await this.authService.login(dto);

    res.cookie(
      this.configService.get('AUTH_COOKIE_NAME'),
      accessToken,
      getAccessCookieOptions(this.configService),
    );

    return user;
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful. Auth cookie cleared.',
  })
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  /* =========================================================
     ME
  ========================================================= */

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get currently logged-in user' })
  @ApiCookieAuth()
  @ApiResponse({
    status: 200,
    description: 'Current user returned successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (invalid or missing token)',
  })
  async getMe(@CurrentUser('id') id: string): Promise<AuthResponseDto> {
    return this.authService.getMe(id);
  }
}
