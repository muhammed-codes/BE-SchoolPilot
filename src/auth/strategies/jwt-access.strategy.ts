import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  schoolId: string;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate = async (payload: JwtPayload) => {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedException();
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };
  };
}
