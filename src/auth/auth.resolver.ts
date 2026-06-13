import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './dto/auth-response.type';
import { GqlThrottlerGuard, JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@UseGuards(GqlThrottlerGuard)
@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @Mutation(() => AuthResponse)
  register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @Mutation(() => AuthResponse)
  login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Throttle({ default: { ttl: 900000, limit: 10 } })
  @Mutation(() => AuthResponse)
  refreshTokens(@Args('refreshToken') refreshToken: string) {
    return this.authService
      .refreshTokens(
        this.extractSubFromRefreshToken(refreshToken),
        refreshToken,
      )
      .catch(() => {
        throw new ForbiddenException('Invalid refresh token');
      });
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: { sub: string }) {
    return this.authService.logout(user.sub);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  updateExpoPushToken(
    @CurrentUser() user: { sub: string },
    @Args('token') token: string,
  ) {
    return this.authService.updateExpoPushToken(user.sub, token);
  }

  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Mutation(() => Boolean)
  forgotPassword(@Args('input') input: ForgotPasswordInput) {
    return this.authService.forgotPassword(input.email);
  }

  @Throttle({ default: { ttl: 900000, limit: 5 } })
  @Mutation(() => Boolean)
  resetPassword(@Args('input') input: ResetPasswordInput) {
    return this.authService.resetPassword(input.token, input.newPassword);
  }

  @Throttle({ default: { ttl: 900000, limit: 10 } })
  @Mutation(() => Boolean)
  verifyEmail(@Args('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Mutation(() => Boolean)
  resendVerificationEmail(@Args('email') email: string) {
    return this.authService.resendVerificationEmail(email);
  }

  private extractSubFromRefreshToken = (token: string): string => {
    const payload = this.jwtService.decode(token);

    if (!payload?.sub) {
      throw new ForbiddenException('Invalid refresh token');
    }

    return payload.sub;
  };
}
