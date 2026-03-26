import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './entities/school.entity';
import { SchoolsService } from './schools.service';
import { SchoolsResolver } from './schools.resolver';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([School]), UploadModule],
  providers: [SchoolsService, SchoolsResolver],
  exports: [SchoolsService],
})
export class SchoolsModule {}
