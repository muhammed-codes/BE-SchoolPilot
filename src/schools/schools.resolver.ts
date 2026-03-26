import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { GraphQLUpload, Upload } from 'graphql-upload-ts';
import { SchoolsService } from './schools.service';
import { School } from './entities/school.entity';
import { CreateSchoolInput } from './dto/create-school.input';
import { UpdateSchoolInput } from './dto/update-school.input';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { PaginationArgs, createPaginatedType } from '../common/pagination';

const PaginatedSchool = createPaginatedType(School);

@Resolver(() => School)
export class SchoolsResolver {
  constructor(private readonly schoolsService: SchoolsService) {}

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL)
  mySchool(@CurrentUser() user: { sub: string; schoolId: string }) {
    if (!user.schoolId) {
      throw new ForbiddenException('No school assigned to your account');
    }
    return this.schoolsService.findById(user.schoolId);
  }

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
    @CurrentUser() user: { role: string; schoolId: string },
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
    @Args({ name: 'file', type: () => GraphQLUpload }) file: Upload,
    @CurrentUser() user: { role: string; schoolId: string },
  ) {
    if (user.role === UserRole.SCHOOL_ADMIN && user.schoolId !== schoolId) {
      throw new ForbiddenException(
        'You can only upload logo for your own school',
      );
    }
    return this.schoolsService.uploadLogo(schoolId, file);
  }

  @Mutation(() => School)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  uploadSchoolStamp(
    @Args('schoolId') schoolId: string,
    @Args({ name: 'file', type: () => GraphQLUpload }) file: Upload,
    @CurrentUser() user: { role: string; schoolId: string },
  ) {
    if (user.role === UserRole.SCHOOL_ADMIN && user.schoolId !== schoolId) {
      throw new ForbiddenException(
        'You can only upload stamp for your own school',
      );
    }
    return this.schoolsService.uploadStamp(schoolId, file);
  }

  @Mutation(() => School)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  deactivateSchool(@Args('id') id: string) {
    return this.schoolsService.deactivateSchool(id);
  }

  @Mutation(() => School)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN)
  regenerateQrCode(
    @Args('schoolId') schoolId: string,
    @CurrentUser() user: { schoolId: string },
  ) {
    if (user.schoolId !== schoolId) {
      throw new ForbiddenException(
        'You can only regenerate QR for your own school',
      );
    }
    return this.schoolsService.regenerateQrCode(schoolId);
  }
}
