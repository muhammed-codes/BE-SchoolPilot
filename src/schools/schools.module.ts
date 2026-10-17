import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { School } from './entities/school.entity';
import { SchoolsService } from './schools.service';
import { SchoolsResolver } from './schools.resolver';
import { PlatformAnalyticsService } from './platform-analytics.service';
import { SchoolCatalogService } from './school-catalog.service';
import { UploadModule } from '../upload/upload.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([School, User]),
    UploadModule,
    JwtModule.register({}),
  ],
  providers: [
    SchoolsService,
    PlatformAnalyticsService,
    SchoolCatalogService,
    SchoolsResolver,
  ],
  exports: [SchoolsService],
})
export class SchoolsModule {}
