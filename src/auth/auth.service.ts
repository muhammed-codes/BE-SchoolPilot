import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokens = (payload: JwtPayload): TokenPair => {
    const accessToken = this.jwtService.sign(
      { ...payload } as Record<string, unknown>,
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET')!,
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES')! as any,
      },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload } as Record<string, unknown>,
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES',
        )! as any,
      },
    );

    return { accessToken, refreshToken };
  };

  verifyRefreshToken = (token: string): JwtPayload => {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
    });
  };
}
