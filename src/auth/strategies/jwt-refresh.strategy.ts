import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

const extractFromBody = (req: Request): string | null => {
  return req?.body?.refreshToken || null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: extractFromBody,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true as const,
    });
  }

  validate = (req: Request, payload: { sub: string }) => ({
    sub: payload.sub,
    refreshToken: req.body.refreshToken,
  });
}
