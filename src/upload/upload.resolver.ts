import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadResult } from './dto/upload-result.type';
import { JwtAuthGuard } from '../common/guards';
import { GraphQLUpload, Upload } from 'graphql-upload-ts';

@Resolver()
export class UploadResolver {
  constructor(private readonly uploadService: UploadService) {}

  @Mutation(() => UploadResult)
  @UseGuards(JwtAuthGuard)
  singleUpload(
    @Args({ name: 'file', type: () => GraphQLUpload }) file: Upload,
    @Args('folder') folder: string,
  ) {
    return this.uploadService.uploadFile(file, folder);
  }
}
