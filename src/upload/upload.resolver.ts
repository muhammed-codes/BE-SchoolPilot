import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadResult } from './dto/upload-result.type';
import { JwtAuthGuard, PermissionGuard, RolesGuard } from '../common/guards';
import { CurrentUser, RequirePermission } from '../common/decorators';
import { AppResource } from '../access/enums/resource.enum';
import { PermissionAction } from '../access/enums/permission-action.enum';
import { GraphQLUpload, Upload } from 'graphql-upload-ts';

@Resolver()
export class UploadResolver {
  constructor(private readonly uploadService: UploadService) {}

  @Mutation(() => UploadResult)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @RequirePermission(AppResource.STUDENTS, PermissionAction.CREATE)
  singleUpload(
    @Args({ name: 'file', type: () => GraphQLUpload }) file: Upload,
    @Args('folder') folder: string,
    @CurrentUser() user: { schoolId?: string },
  ) {
    if (!user.schoolId) throw new Error('A school scope is required');
    return this.uploadService.uploadFile(file, folder, user.schoolId);
  }
}
