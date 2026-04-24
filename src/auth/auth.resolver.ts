import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './dto/auth-response.type';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  // @Roles(UserRole.SUPER_ADMIN)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => AuthResponse)
  login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

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

  @Mutation(() => Boolean)
  forgotPassword(@Args('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Mutation(() => Boolean)
  resetPassword(
    @Args('token') token: string,
    @Args('newPassword') newPassword: string,
  ) {
    return this.authService.resetPassword(token, newPassword);
  }

  private extractSubFromRefreshToken = (token: string): string => {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString(),
    );
    return payload.sub;
  };
}
