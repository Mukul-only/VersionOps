import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/access-token.strategy';
import { JwtAuthGuard } from './gaurds/jwt-auth.gaurd';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy, JwtAuthGuard, JwtService, AuthService],
  exports: [JwtAuthGuard, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
