import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Resolver()
export class AuthResolver {
  @Query(() => String)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { sub: string; email: string; role: string }) {
    return `Authenticated as ${user.email}`;
  }
}
