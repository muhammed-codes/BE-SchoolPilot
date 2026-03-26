import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { IdCardsService } from './id-cards.service';
import { IdCardsResolver } from './id-cards.resolver';
import { SchoolsModule } from '../schools/schools.module';
import { PdfModule } from '../pdf/pdf.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, User]),
    SchoolsModule,
    PdfModule,
    UploadModule,
  ],
  providers: [IdCardsService, IdCardsResolver],
  exports: [IdCardsService],
})
export class IdCardsModule {}
