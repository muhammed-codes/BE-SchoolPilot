import { Resolver, Query, Mutation, Args, ObjectType, Field, Int } from '@nestjs/graphql';
import {
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { SchoolsService } from './schools.service';
import { School } from './entities/school.entity';
import { User } from '../users/entities/user.entity';
import { CreateSchoolInput } from './dto/create-school.input';
import { UpdateSchoolInput } from './dto/update-school.input';
import { RegisterSchoolInput } from './dto/register-school.input';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { PaginationArgs, createPaginatedType } from '../common/pagination';
import { AuthResponse } from '../auth/dto/auth-response.type';

const PaginatedSchool = createPaginatedType(School);

@ObjectType()
export class PlatformStats {
  @Field(() => Int)
  totalSchools: number;

  @Field(() => Int)
  activeSchools: number;

  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalStudents: number;
}

@Resolver(() => School)
export class SchoolsResolver {
  constructor(
    private readonly schoolsService: SchoolsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Generate JWT tokens for a user — mirrors AuthService.generateTokens */
  private generateTokens = (user: User) => {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };
    const accessToken = this.jwtService.sign(
      payload as Record<string, unknown>,
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES') as never,
      },
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id } as Record<string, unknown>,
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES') as never,
      },
    );
    return bcrypt.hash(refreshToken, 12).then((hashedRefresh) =>
      this.schoolsService
        .saveUserRefreshToken(user.id, hashedRefresh)
        .then(() => ({ accessToken, refreshToken })),
    );
  };

  // ─── Public Mutations (No Auth) ─────────────────────────────────────────────

  /**
   * Public school self-registration.
   * Creates the school + first SCHOOL_ADMIN, then returns tokens for immediate login.
   */
  @Mutation(() => AuthResponse)
  registerSchool(@Args('input') input: RegisterSchoolInput) {
    return this.schoolsService.registerSchool(input).then(({ user }) =>
      this.generateTokens(user).then(({ accessToken, refreshToken }) => ({
        accessToken,
        refreshToken,
        user,
      })),
    );
  }

  // ─── Authenticated Queries ──────────────────────────────────────────────────

  @Query(() => PaginatedSchool)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  schools(@Args() pagination: PaginationArgs) {
    return this.schoolsService.findAll(pagination);
  }

  @Query(() => School)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  school(@Args('id') id: string) {
    return this.schoolsService.findById(id);
  }

  @Query(() => School)
  @UseGuards(JwtAuthGuard)
  mySchool(@CurrentUser() user: { sub: string; schoolId: string }) {
    if (!user.schoolId) {
      throw new NotFoundException('No school assigned to your account');
    }
    return this.schoolsService.findById(user.schoolId);
  }

  @Query(() => PlatformStats)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  platformStats() {
    return this.schoolsService.getPlatformStats();
  }

  // ─── Authenticated Mutations ────────────────────────────────────────────────

  @Mutation(() => School)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  createSchool(@Args('input') input: CreateSchoolInput) {
    return this.schoolsService.createSchool(input);
  }

  @Mutation(() => School)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  updateSchool(
    @Args('id') id: string,
    @Args('input') input: UpdateSchoolInput,
    @CurrentUser() user: { role: UserRole; schoolId: string },
  ) {
    if (user.role === UserRole.SCHOOL_ADMIN && user.schoolId !== id) {
      throw new ForbiddenException('You can only update your own school');
    }
    return this.schoolsService.updateSchool(id, input);
  }

  @Mutation(() => School)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  uploadSchoolLogo(
    @Args('schoolId') schoolId: string,
    @Args('imageUrl') imageUrl: string,
    @CurrentUser() user: { role: UserRole; schoolId: string },
  ) {
    if (user.role === UserRole.SCHOOL_ADMIN && user.schoolId !== schoolId) {
      throw new ForbiddenException(
        'You can only upload logo for your own school',
      );
    }
    return this.schoolsService.uploadLogo(schoolId, imageUrl);
  }

  @Mutation(() => School)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  uploadSchoolStamp(
    @Args('schoolId') schoolId: string,
    @Args('imageUrl') imageUrl: string,
    @CurrentUser() user: { role: UserRole; schoolId: string },
  ) {
    if (user.role === UserRole.SCHOOL_ADMIN && user.schoolId !== schoolId) {
      throw new ForbiddenException(
        'You can only upload stamp for your own school',
      );
    }
    return this.schoolsService.uploadStamp(schoolId, imageUrl);
  }

  @Mutation(() => School)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  deactivateSchool(@Args('id') id: string) {
    return this.schoolsService.deactivateSchool(id);
  }

  @Mutation(() => School)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  activateSchool(@Args('id') id: string) {
    return this.schoolsService.activateSchool(id);
  }

  @Mutation(() => School)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  regenerateQrCode(
    @Args('schoolId') schoolId: string,
    @CurrentUser() user: { schoolId: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && user.schoolId !== schoolId) {
      throw new ForbiddenException(
        'You can only regenerate QR for your own school',
      );
    }
    return this.schoolsService.regenerateQrCode(schoolId);
  }
}
