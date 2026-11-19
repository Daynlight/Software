import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HandshakeCookieService } from './handshake-cookie.service';
import { SessionGuard } from './session.guard';
import { SessionService } from './session.service';
import { UsosOAuthClient } from './usos-oauth.client';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('sessionSecret'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    HandshakeCookieService,
    SessionGuard,
    SessionService,
    UsosOAuthClient,
  ],
})
export class AuthModule {}
