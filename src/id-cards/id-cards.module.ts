import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { School } from '../schools/entities/school.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { IdCardTemplate } from './entities/id-card-template.entity';
import { SchoolIdCardSettings } from './entities/school-id-card-settings.entity';
import { IdCardsService } from './id-cards.service';
import { IdCardsResolver } from './id-cards.resolver';
import { SchoolsModule } from '../schools/schools.module';
import { PdfModule } from '../pdf/pdf.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IdCardTemplate,
      SchoolIdCardSettings,
      User,
      Student,
      School,
      ClassEntity,
    ]),
    SchoolsModule,
    PdfModule,
    UploadModule,
  ],
  providers: [IdCardsService, IdCardsResolver],
  exports: [IdCardsService],
})
export class IdCardsModule {}
